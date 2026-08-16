package controller

import (
	"context"
	"fmt"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"

	cloudflarev1alpha1 "github.com/kbntx-org/nexus/platform/core/cloudflare-controller/api/v1alpha1"
	"github.com/kbntx-org/nexus/platform/core/cloudflare-controller/internal/cloudflare"
)

const (
	tunnelFinalizer               = "cloudflare.kbntx.com/tunnel"
	tunnelTokenSecretKey          = "tunnelToken"
	defaultCloudflaredImage       = "cloudflare/cloudflared:2026.7.3"
	defaultTunnelReplicas   int32 = 2
)

type TunnelReconciler struct {
	client.Client
	Scheme           *runtime.Scheme
	CloudflareClient *cloudflare.Client
}

// +kubebuilder:rbac:groups=cloudflare.kbntx.com,resources=tunnels,verbs=get;list;watch;update;patch
// +kubebuilder:rbac:groups=cloudflare.kbntx.com,resources=tunnels/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=cloudflare.kbntx.com,resources=tunnels/finalizers,verbs=update
// +kubebuilder:rbac:groups="",resources=secrets,verbs=get;list;watch;create;update;patch
// +kubebuilder:rbac:groups=apps,resources=deployments,verbs=get;list;watch;create;update;patch

func (r *TunnelReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	logger := ctrl.LoggerFrom(ctx)

	var tunnel cloudflarev1alpha1.Tunnel
	if err := r.Get(ctx, req.NamespacedName, &tunnel); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	if !tunnel.DeletionTimestamp.IsZero() {
		return r.reconcileDelete(ctx, &tunnel)
	}

	if !controllerutil.ContainsFinalizer(&tunnel, tunnelFinalizer) {
		controllerutil.AddFinalizer(&tunnel, tunnelFinalizer)
		if err := r.Update(ctx, &tunnel); err != nil {
			return ctrl.Result{}, fmt.Errorf("add finalizer: %w", err)
		}
	}

	if err := r.reconcileTunnel(ctx, &tunnel); err != nil {
		return r.failStatus(ctx, &tunnel, fmt.Errorf("reconcile Cloudflare tunnel: %w", err))
	}

	token, err := r.CloudflareClient.TunnelToken(ctx, tunnel.Status.TunnelID)
	if err != nil {
		return r.failStatus(ctx, &tunnel, fmt.Errorf("fetch tunnel token: %w", err))
	}

	secretName, err := r.reconcileSecret(ctx, &tunnel, token)
	if err != nil {
		return r.failStatus(ctx, &tunnel, fmt.Errorf("reconcile tunnel secret: %w", err))
	}

	if err := r.reconcileDeployment(ctx, &tunnel, secretName); err != nil {
		return r.failStatus(ctx, &tunnel, fmt.Errorf("reconcile tunnel deployment: %w", err))
	}

	tunnel.Status.Ready = true
	tunnel.Status.Message = ""
	tunnel.Status.ObservedGeneration = tunnel.Generation
	if err := r.Status().Update(ctx, &tunnel); err != nil {
		return ctrl.Result{}, fmt.Errorf("update Tunnel status: %w", err)
	}

	logger.V(1).Info("reconciled tunnel", "tunnelID", tunnel.Status.TunnelID)
	return ctrl.Result{}, nil
}

func (r *TunnelReconciler) failStatus(ctx context.Context, tunnel *cloudflarev1alpha1.Tunnel, reconcileErr error) (ctrl.Result, error) {
	tunnel.Status.Ready = false
	tunnel.Status.Message = reconcileErr.Error()
	tunnel.Status.ObservedGeneration = tunnel.Generation
	if statusErr := r.Status().Update(ctx, tunnel); statusErr != nil {
		ctrl.LoggerFrom(ctx).Error(statusErr, "failed to update Tunnel status")
	}
	return ctrl.Result{}, reconcileErr
}

func (r *TunnelReconciler) reconcileTunnel(ctx context.Context, tunnel *cloudflarev1alpha1.Tunnel) error {
	if tunnel.Status.TunnelID == "" {
		name := tunnel.Spec.Name
		if name == "" {
			name = tunnel.Name
		}
		id, err := r.CloudflareClient.CreateTunnel(ctx, name)
		if err != nil {
			return fmt.Errorf("create tunnel: %w", err)
		}
		tunnel.Status.TunnelID = id
	}
	return r.reconcileRoutes(ctx, tunnel)
}

func (r *TunnelReconciler) reconcileRoutes(ctx context.Context, tunnel *cloudflarev1alpha1.Tunnel) error {
	existingRoutes, err := r.CloudflareClient.ListRoutes(ctx, tunnel.Status.TunnelID)
	if err != nil {
		return fmt.Errorf("list routes: %w", err)
	}

	desired := make(map[string]bool, len(tunnel.Spec.Routes))
	for _, network := range tunnel.Spec.Routes {
		desired[network] = true
	}

	existingByNetwork := make(map[string]string, len(existingRoutes))
	for _, route := range existingRoutes {
		existingByNetwork[route.Network] = route.ID
	}

	for network := range desired {
		if _, ok := existingByNetwork[network]; !ok {
			if err := r.CloudflareClient.CreateRoute(ctx, tunnel.Status.TunnelID, network); err != nil {
				return fmt.Errorf("create route %q: %w", network, err)
			}
		}
	}

	for network, routeID := range existingByNetwork {
		if !desired[network] {
			if err := r.CloudflareClient.DeleteRoute(ctx, routeID); err != nil {
				return fmt.Errorf("delete route %q: %w", network, err)
			}
		}
	}

	return nil
}

func (r *TunnelReconciler) reconcileDelete(ctx context.Context, tunnel *cloudflarev1alpha1.Tunnel) (ctrl.Result, error) {
	if controllerutil.ContainsFinalizer(tunnel, tunnelFinalizer) {
		if tunnel.Status.TunnelID != "" {
			if err := r.CloudflareClient.DeleteTunnel(ctx, tunnel.Status.TunnelID); err != nil {
				return ctrl.Result{}, fmt.Errorf("delete Cloudflare tunnel: %w", err)
			}
		}
		controllerutil.RemoveFinalizer(tunnel, tunnelFinalizer)
		if err := r.Update(ctx, tunnel); err != nil {
			return ctrl.Result{}, fmt.Errorf("remove finalizer: %w", err)
		}
	}
	return ctrl.Result{}, nil
}

func (r *TunnelReconciler) reconcileSecret(ctx context.Context, tunnel *cloudflarev1alpha1.Tunnel, token string) (string, error) {
	secret := &corev1.Secret{ObjectMeta: metav1.ObjectMeta{
		Name:      tunnel.Name + "-tunnel-token",
		Namespace: tunnel.Namespace,
	}}

	_, err := controllerutil.CreateOrUpdate(ctx, r.Client, secret, func() error {
		if secret.Data == nil {
			secret.Data = map[string][]byte{}
		}
		secret.Data[tunnelTokenSecretKey] = []byte(token)
		secret.Type = corev1.SecretTypeOpaque
		return controllerutil.SetControllerReference(tunnel, secret, r.Scheme)
	})
	if err != nil {
		return "", err
	}
	return secret.Name, nil
}

// reconcileDeployment intentionally does not use controllerutil.CreateOrUpdate's whole-object
// comparison: the API server injects its own defaults (imagePullPolicy, terminationGracePeriod,
// etc.) into whatever we create, so a fetched Deployment never matches a freshly built literal
// and every reconcile would look like a diff, triggering an Update loop via the Owns() watch.
// Comparing only the fields we actually manage avoids that.
func (r *TunnelReconciler) reconcileDeployment(ctx context.Context, tunnel *cloudflarev1alpha1.Tunnel, secretName string) error {
	image := tunnel.Spec.Image
	if image == "" {
		image = defaultCloudflaredImage
	}
	replicas := tunnel.Spec.Replicas
	if replicas == 0 {
		replicas = defaultTunnelReplicas
	}

	name := tunnel.Name + "-tunnel"
	labels := map[string]string{"app": name}
	containers := []corev1.Container{{
		Name:    "cloudflared",
		Image:   image,
		Command: []string{"cloudflared", "tunnel", "--no-autoupdate", "run"},
		Env: []corev1.EnvVar{{
			Name: "TUNNEL_TOKEN",
			ValueFrom: &corev1.EnvVarSource{
				SecretKeyRef: &corev1.SecretKeySelector{
					LocalObjectReference: corev1.LocalObjectReference{Name: secretName},
					Key:                  tunnelTokenSecretKey,
				},
			},
		}},
	}}

	var existing appsv1.Deployment
	err := r.Get(ctx, client.ObjectKey{Name: name, Namespace: tunnel.Namespace}, &existing)
	if apierrors.IsNotFound(err) {
		desired := &appsv1.Deployment{
			ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: tunnel.Namespace},
			Spec: appsv1.DeploymentSpec{
				Replicas: &replicas,
				Selector: &metav1.LabelSelector{MatchLabels: labels},
				Template: corev1.PodTemplateSpec{
					ObjectMeta: metav1.ObjectMeta{Labels: labels},
					Spec:       corev1.PodSpec{Containers: containers},
				},
			},
		}
		if err := controllerutil.SetControllerReference(tunnel, desired, r.Scheme); err != nil {
			return fmt.Errorf("set owner reference: %w", err)
		}
		return r.Create(ctx, desired)
	}
	if err != nil {
		return fmt.Errorf("get deployment: %w", err)
	}

	if *existing.Spec.Replicas == replicas &&
		len(existing.Spec.Template.Spec.Containers) == 1 &&
		existing.Spec.Template.Spec.Containers[0].Image == image {
		return nil
	}

	existing.Spec.Replicas = &replicas
	existing.Spec.Template.Spec.Containers = containers
	return r.Update(ctx, &existing)
}

func (r *TunnelReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&cloudflarev1alpha1.Tunnel{}).
		Owns(&corev1.Secret{}).
		Owns(&appsv1.Deployment{}).
		Complete(r)
}
