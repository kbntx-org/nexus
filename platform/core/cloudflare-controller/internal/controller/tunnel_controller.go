package controller

import (
	"context"
	"fmt"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	policyv1 "k8s.io/api/policy/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/util/intstr"
	"k8s.io/client-go/tools/record"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"

	extdnsv1alpha1 "github.com/kbntx-org/nexus/platform/core/cloudflare-controller/api/externaldns/v1alpha1"
	cloudflarev1alpha1 "github.com/kbntx-org/nexus/platform/core/cloudflare-controller/api/v1alpha1"
	"github.com/kbntx-org/nexus/platform/core/cloudflare-controller/internal/cloudflare"
)

const (
	tunnelFinalizer                = "cloudflare.kbntx.com/tunnel"
	tunnelTokenSecretKey           = "tunnelToken"
	defaultCloudflaredImage        = "cloudflare/cloudflared:2026.7.3"
	defaultTunnelReplicas    int32 = 2
	catchAllRule                   = "http_status:404"
	cfargotunnelDomainSuffix       = ".cfargotunnel.com"
	dnsEndpointRecordType          = "CNAME"
	defaultPDBMinAvailable   int32 = 1
)

type TunnelReconciler struct {
	client.Client
	Scheme             *runtime.Scheme
	CloudflareClient   *cloudflare.Client
	Recorder           record.EventRecorder
	ExternalDNSEnabled bool
	ExternalDNSPrefix  string
}

// +kubebuilder:rbac:groups=cloudflare.kbntx.com,resources=tunnels,verbs=get;list;watch;update;patch
// +kubebuilder:rbac:groups=cloudflare.kbntx.com,resources=tunnels/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=cloudflare.kbntx.com,resources=tunnels/finalizers,verbs=update
// +kubebuilder:rbac:groups="",resources=secrets,verbs=get;list;watch;create;update;patch
// +kubebuilder:rbac:groups="",resources=events,verbs=create;patch
// +kubebuilder:rbac:groups=apps,resources=deployments,verbs=get;list;watch;create;update;patch
// +kubebuilder:rbac:groups=policy,resources=poddisruptionbudgets,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=externaldns.k8s.io,resources=dnsendpoints,verbs=get;list;watch;create;update;patch;delete

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

	if err := r.reconcileDNSEndpoint(ctx, &tunnel); err != nil {
		return r.failStatus(ctx, &tunnel, fmt.Errorf("reconcile tunnel DNSEndpoint: %w", err))
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

	if err := r.reconcilePodDisruptionBudget(ctx, &tunnel); err != nil {
		return r.failStatus(ctx, &tunnel, fmt.Errorf("reconcile tunnel pod disruption budget: %w", err))
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
	r.Recorder.Event(tunnel, corev1.EventTypeWarning, eventReasonReconcileFailed, reconcileErr.Error())
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
	if err := r.reconcileRoutes(ctx, tunnel); err != nil {
		return err
	}
	return r.reconcileIngress(ctx, tunnel)
}

// Skips tunnels with no Spec.Ingress instead of clearing their remote config, so routes-only
// tunnels aren't forced to also declare ingress.
func (r *TunnelReconciler) reconcileIngress(ctx context.Context, tunnel *cloudflarev1alpha1.Tunnel) error {
	if len(tunnel.Spec.Ingress) == 0 {
		return nil
	}

	rules := make([]cloudflare.IngressRule, 0, len(tunnel.Spec.Ingress)+1)
	for _, rule := range tunnel.Spec.Ingress {
		rules = append(rules, cloudflare.IngressRule{
			Hostname:      rule.Hostname,
			Service:       rule.Service,
			OriginRequest: toOriginRequest(rule.OriginRequest),
		})
	}
	// Cloudflare requires the ingress list to end with a hostname-less catch-all rule.
	if last := rules[len(rules)-1]; last.Hostname != "" {
		rules = append(rules, cloudflare.IngressRule{Service: catchAllRule})
	}

	return r.CloudflareClient.PutTunnelConfiguration(ctx, tunnel.Status.TunnelID, rules)
}

func toOriginRequest(config *cloudflarev1alpha1.OriginRequestConfig) *cloudflare.OriginRequest {
	if config == nil {
		return nil
	}
	return &cloudflare.OriginRequest{
		MatchSNIToHost: config.MatchSNIToHost,
	}
}

// Declares hostnames via external-dns's DNSEndpoint CRD instead of writing Cloudflare DNS
// records directly, so external-dns stays the zone's sole writer.
func (r *TunnelReconciler) reconcileDNSEndpoint(ctx context.Context, tunnel *cloudflarev1alpha1.Tunnel) error {
	if !r.ExternalDNSEnabled {
		return nil
	}

	hostnames := make([]string, 0, len(tunnel.Spec.Ingress))
	for _, rule := range tunnel.Spec.Ingress {
		if rule.Hostname != "" {
			hostnames = append(hostnames, rule.Hostname)
		}
	}

	dnsEndpoint := &extdnsv1alpha1.DNSEndpoint{ObjectMeta: metav1.ObjectMeta{
		Name:      tunnel.Name + "-tunnel-dns",
		Namespace: tunnel.Namespace,
	}}

	if len(hostnames) == 0 {
		return client.IgnoreNotFound(r.Delete(ctx, dnsEndpoint))
	}

	target := tunnel.Status.TunnelID + cfargotunnelDomainSuffix
	endpoints := make([]extdnsv1alpha1.Endpoint, len(hostnames))
	for i, hostname := range hostnames {
		endpoints[i] = extdnsv1alpha1.Endpoint{
			DNSName:    hostname,
			Targets:    []string{target},
			RecordType: dnsEndpointRecordType,
			ProviderSpecific: extdnsv1alpha1.ProviderSpecific{
				{Name: fmt.Sprintf("%scloudflare-proxied", r.ExternalDNSPrefix), Value: "true"},
			},
		}
	}

	_, err := controllerutil.CreateOrUpdate(ctx, r.Client, dnsEndpoint, func() error {
		dnsEndpoint.Spec.Endpoints = endpoints
		return controllerutil.SetControllerReference(tunnel, dnsEndpoint, r.Scheme)
	})
	return err
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

// Avoids controllerutil.CreateOrUpdate's whole-object comparison: API server defaults
// (imagePullPolicy, etc.) would make a fetched Deployment never match a freshly built literal,
// triggering an update loop via the Owns() watch.
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

func (r *TunnelReconciler) reconcilePodDisruptionBudget(ctx context.Context, tunnel *cloudflarev1alpha1.Tunnel) error {
	name := tunnel.Name + "-tunnel"
	pdb := &policyv1.PodDisruptionBudget{ObjectMeta: metav1.ObjectMeta{
		Name:      name + "-pdb",
		Namespace: tunnel.Namespace,
	}}

	if tunnel.Spec.PodDisruptionBudget == nil {
		return client.IgnoreNotFound(r.Delete(ctx, pdb))
	}

	minAvailable := tunnel.Spec.PodDisruptionBudget.MinAvailable
	if minAvailable == 0 {
		minAvailable = defaultPDBMinAvailable
	}
	minAvailableIntStr := intstr.FromInt32(minAvailable)

	_, err := controllerutil.CreateOrUpdate(ctx, r.Client, pdb, func() error {
		pdb.Spec.MinAvailable = &minAvailableIntStr
		pdb.Spec.Selector = &metav1.LabelSelector{MatchLabels: map[string]string{"app": name}}
		return controllerutil.SetControllerReference(tunnel, pdb, r.Scheme)
	})
	return err
}

func (r *TunnelReconciler) SetupWithManager(mgr ctrl.Manager) error {
	builder := ctrl.NewControllerManagedBy(mgr).
		For(&cloudflarev1alpha1.Tunnel{}).
		Owns(&corev1.Secret{}).
		Owns(&appsv1.Deployment{}).
		Owns(&policyv1.PodDisruptionBudget{})
	// Owns() resolves the GVK at startup, which would crash if the CRD isn't installed.
	if r.ExternalDNSEnabled {
		builder = builder.Owns(&extdnsv1alpha1.DNSEndpoint{})
	}
	return builder.Complete(r)
}
