package k8s

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	policyv1 "k8s.io/api/policy/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/kubernetes"

	networkingv1 "k8s.io/api/networking/v1"
)

const legacyIngressClassAnnotation = "kubernetes.io/ingress.class"
const watchReconnectDelay = 5 * time.Second
const tunnelAnnotation = "cloudflare.io/tunnel"
const tunnelTokenEnvVar = "TUNNEL_TOKEN"
const tunnelTokenSecretKey = "tunnelToken"
const pingGroupRangeName = "net.ipv4.ping_group_range"
const pingGroupRangeValue = "0 2147483647"

// IngressEntry pairs a hostname with the tunnel name from its annotation.
type IngressEntry struct {
	Hostname   string
	TunnelName string // value of the cloudflare.io/tunnel annotation
}

// CloudflaredDeploymentSpec describes the cloudflared Deployment to create.
type CloudflaredDeploymentSpec struct {
	Namespace             string
	Name                  string
	Replicas              int32
	Image                 string
	CredentialsSecretName string // Secret that holds TUNNEL_TOKEN under key tunnelToken
}

// Service lists and watches Kubernetes Ingress resources, and manages
// cloudflared Secrets, Deployments, and PodDisruptionBudgets.
type Service interface {
	List(ctx context.Context) ([]IngressEntry, error)
	Watch(ctx context.Context, onChange func()) error

	GetSecret(ctx context.Context, namespace, name string) (data map[string][]byte, found bool, err error)
	CreateSecret(ctx context.Context, namespace, name string, data map[string][]byte) error
	DeleteSecret(ctx context.Context, namespace, name string) error

	DeploymentExists(ctx context.Context, namespace, name string) (bool, error)
	CreateDeployment(ctx context.Context, spec CloudflaredDeploymentSpec) error
	DeleteDeployment(ctx context.Context, namespace, name string) error

	PDBExists(ctx context.Context, namespace, name string) (bool, error)
	CreatePDB(ctx context.Context, namespace, name, deploymentName string) error
	DeletePDB(ctx context.Context, namespace, name string) error
}

type service struct {
	client           kubernetes.Interface
	ingressClassName string
}

// NewService constructs a Service backed by the given Kubernetes client.
// If ingressClassName is empty, all Ingress resources are matched.
func NewService(client kubernetes.Interface, ingressClassName string) Service {
	return &service{client: client, ingressClassName: ingressClassName}
}

// List returns all IngressEntry values from matching Ingress resources that
// carry the cloudflare.io/tunnel annotation. Ingresses without the annotation
// are silently skipped. Empty hostnames are skipped.
func (s *service) List(ctx context.Context) ([]IngressEntry, error) {
	list, err := s.client.NetworkingV1().Ingresses("").List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("list ingresses: %w", err)
	}

	var entries []IngressEntry
	for _, ingress := range list.Items {
		if !s.matchesClass(&ingress) {
			continue
		}
		tunnelName := ingress.Annotations[tunnelAnnotation]
		if tunnelName == "" {
			continue
		}
		for _, rule := range ingress.Spec.Rules {
			if rule.Host != "" {
				entries = append(entries, IngressEntry{
					Hostname:   rule.Host,
					TunnelName: tunnelName,
				})
			}
		}
	}
	return entries, nil
}

// Watch calls onChange on any Ingress add/modify/delete event. It reconnects
// automatically on errors and only returns when ctx is cancelled.
func (s *service) Watch(ctx context.Context, onChange func()) error {
	for {
		if err := s.runWatch(ctx, onChange); err != nil {
			if ctx.Err() != nil {
				return ctx.Err()
			}
			slog.Warn("ingress watch error, reconnecting", "delay", watchReconnectDelay, "error", err)
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(watchReconnectDelay):
		}
	}
}

func (s *service) runWatch(ctx context.Context, onChange func()) error {
	watcher, err := s.client.NetworkingV1().Ingresses("").Watch(ctx, metav1.ListOptions{})
	if err != nil {
		return fmt.Errorf("start watch: %w", err)
	}
	defer watcher.Stop()

	slog.Info("watching ingress resources")
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case event, ok := <-watcher.ResultChan():
			if !ok {
				return nil // channel closed — reconnect
			}
			switch event.Type {
			case watch.Added, watch.Modified, watch.Deleted:
				ingress, ok := event.Object.(*networkingv1.Ingress)
				if ok && s.matchesClass(ingress) {
					onChange()
				}
			case watch.Error:
				return fmt.Errorf("watch error event")
			}
		}
	}
}

func (s *service) matchesClass(ingress *networkingv1.Ingress) bool {
	if s.ingressClassName == "" {
		return true
	}
	if ingress.Spec.IngressClassName != nil && *ingress.Spec.IngressClassName == s.ingressClassName {
		return true
	}
	return ingress.Annotations[legacyIngressClassAnnotation] == s.ingressClassName
}

// GetSecret returns the Secret data for the given namespace/name, or found=false if absent.
func (s *service) GetSecret(ctx context.Context, namespace, name string) (map[string][]byte, bool, error) {
	secret, err := s.client.CoreV1().Secrets(namespace).Get(ctx, name, metav1.GetOptions{})
	if k8serrors.IsNotFound(err) {
		return nil, false, nil
	}
	if err != nil {
		return nil, false, fmt.Errorf("get secret %s/%s: %w", namespace, name, err)
	}
	return secret.Data, true, nil
}

// CreateSecret creates an Opaque Secret with the given data.
func (s *service) CreateSecret(ctx context.Context, namespace, name string, data map[string][]byte) error {
	secret := &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
		},
		Type: corev1.SecretTypeOpaque,
		Data: data,
	}
	if _, err := s.client.CoreV1().Secrets(namespace).Create(ctx, secret, metav1.CreateOptions{}); err != nil {
		return fmt.Errorf("create secret %s/%s: %w", namespace, name, err)
	}
	return nil
}

// DeleteSecret deletes the Secret with the given namespace/name.
func (s *service) DeleteSecret(ctx context.Context, namespace, name string) error {
	if err := s.client.CoreV1().Secrets(namespace).Delete(ctx, name, metav1.DeleteOptions{}); err != nil && !k8serrors.IsNotFound(err) {
		return fmt.Errorf("delete secret %s/%s: %w", namespace, name, err)
	}
	return nil
}

// DeploymentExists reports whether a Deployment with the given namespace/name exists.
func (s *service) DeploymentExists(ctx context.Context, namespace, name string) (bool, error) {
	_, err := s.client.AppsV1().Deployments(namespace).Get(ctx, name, metav1.GetOptions{})
	if k8serrors.IsNotFound(err) {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("get deployment %s/%s: %w", namespace, name, err)
	}
	return true, nil
}

// CreateDeployment creates a cloudflared Deployment from the given spec.
// The Deployment reads TUNNEL_TOKEN from the credentials Secret.
func (s *service) CreateDeployment(ctx context.Context, spec CloudflaredDeploymentSpec) error {
	replicas := spec.Replicas
	deployment := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      spec.Name,
			Namespace: spec.Namespace,
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: &replicas,
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{"app": spec.Name},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{"app": spec.Name},
				},
				Spec: corev1.PodSpec{
					SecurityContext: &corev1.PodSecurityContext{
						Sysctls: []corev1.Sysctl{
							{Name: pingGroupRangeName, Value: pingGroupRangeValue},
						},
					},
					Containers: []corev1.Container{
						{
							Name:    "cloudflared",
							Image:   spec.Image,
							Command: []string{"cloudflared", "tunnel", "--no-autoupdate", "run"},
							Env: []corev1.EnvVar{
								{
									Name: tunnelTokenEnvVar,
									ValueFrom: &corev1.EnvVarSource{
										SecretKeyRef: &corev1.SecretKeySelector{
											LocalObjectReference: corev1.LocalObjectReference{
												Name: spec.CredentialsSecretName,
											},
											Key: tunnelTokenSecretKey,
										},
									},
								},
							},
							Resources: corev1.ResourceRequirements{
								Requests: corev1.ResourceList{
									corev1.ResourceCPU:    resource.MustParse("10m"),
									corev1.ResourceMemory: resource.MustParse("64Mi"),
								},
							},
						},
					},
				},
			},
		},
	}
	if _, err := s.client.AppsV1().Deployments(spec.Namespace).Create(ctx, deployment, metav1.CreateOptions{}); err != nil {
		return fmt.Errorf("create deployment %s/%s: %w", spec.Namespace, spec.Name, err)
	}
	return nil
}

// DeleteDeployment deletes the Deployment with the given namespace/name.
func (s *service) DeleteDeployment(ctx context.Context, namespace, name string) error {
	if err := s.client.AppsV1().Deployments(namespace).Delete(ctx, name, metav1.DeleteOptions{}); err != nil && !k8serrors.IsNotFound(err) {
		return fmt.Errorf("delete deployment %s/%s: %w", namespace, name, err)
	}
	return nil
}

// PDBExists reports whether a PodDisruptionBudget with the given namespace/name exists.
func (s *service) PDBExists(ctx context.Context, namespace, name string) (bool, error) {
	_, err := s.client.PolicyV1().PodDisruptionBudgets(namespace).Get(ctx, name, metav1.GetOptions{})
	if k8serrors.IsNotFound(err) {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("get pdb %s/%s: %w", namespace, name, err)
	}
	return true, nil
}

// CreatePDB creates a PodDisruptionBudget with minAvailable=1 for the given Deployment.
func (s *service) CreatePDB(ctx context.Context, namespace, name, deploymentName string) error {
	minAvailable := intstr.FromInt32(1)
	pdb := &policyv1.PodDisruptionBudget{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
		},
		Spec: policyv1.PodDisruptionBudgetSpec{
			MinAvailable: &minAvailable,
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{"app": deploymentName},
			},
		},
	}
	if _, err := s.client.PolicyV1().PodDisruptionBudgets(namespace).Create(ctx, pdb, metav1.CreateOptions{}); err != nil {
		return fmt.Errorf("create pdb %s/%s: %w", namespace, name, err)
	}
	return nil
}

// DeletePDB deletes the PodDisruptionBudget with the given namespace/name.
func (s *service) DeletePDB(ctx context.Context, namespace, name string) error {
	if err := s.client.PolicyV1().PodDisruptionBudgets(namespace).Delete(ctx, name, metav1.DeleteOptions{}); err != nil && !k8serrors.IsNotFound(err) {
		return fmt.Errorf("delete pdb %s/%s: %w", namespace, name, err)
	}
	return nil
}
