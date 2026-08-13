package controller

import (
	"context"
	"fmt"

	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"

	cloudflarev1alpha1 "github.com/kbntx-org/nexus/platform/core/cloudflare-controller/api/v1alpha1"
	"github.com/kbntx-org/nexus/platform/core/cloudflare-controller/internal/cloudflare"
)

const accessPolicyFinalizer = "cloudflare.kbntx.com/access-policy"

type AccessPolicyReconciler struct {
	client.Client
	Scheme           *runtime.Scheme
	CloudflareClient *cloudflare.Client
}

// +kubebuilder:rbac:groups=cloudflare.kbntx.com,resources=accesspolicies,verbs=get;list;watch;update;patch
// +kubebuilder:rbac:groups=cloudflare.kbntx.com,resources=accesspolicies/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=cloudflare.kbntx.com,resources=accesspolicies/finalizers,verbs=update

func (r *AccessPolicyReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	logger := ctrl.LoggerFrom(ctx)

	var policy cloudflarev1alpha1.AccessPolicy
	if err := r.Get(ctx, req.NamespacedName, &policy); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	if !policy.DeletionTimestamp.IsZero() {
		return r.reconcileDelete(ctx, &policy)
	}

	if !controllerutil.ContainsFinalizer(&policy, accessPolicyFinalizer) {
		controllerutil.AddFinalizer(&policy, accessPolicyFinalizer)
		if err := r.Update(ctx, &policy); err != nil {
			return ctrl.Result{}, fmt.Errorf("add finalizer: %w", err)
		}
	}

	payload := toPolicyPayload(&policy)

	var err error
	if policy.Status.PolicyID == "" {
		var id string
		id, err = r.CloudflareClient.CreatePolicy(ctx, payload)
		if err == nil {
			policy.Status.PolicyID = id
		}
	} else {
		err = r.CloudflareClient.UpdatePolicy(ctx, policy.Status.PolicyID, payload)
	}

	policy.Status.ObservedGeneration = policy.Generation
	policy.Status.Ready = err == nil
	if err != nil {
		policy.Status.Message = err.Error()
	} else {
		policy.Status.Message = ""
	}
	if statusErr := r.Status().Update(ctx, &policy); statusErr != nil {
		logger.Error(statusErr, "failed to update AccessPolicy status")
	}
	if err != nil {
		return ctrl.Result{}, fmt.Errorf("reconcile Cloudflare access policy: %w", err)
	}

	return ctrl.Result{}, nil
}

func (r *AccessPolicyReconciler) reconcileDelete(ctx context.Context, policy *cloudflarev1alpha1.AccessPolicy) (ctrl.Result, error) {
	if controllerutil.ContainsFinalizer(policy, accessPolicyFinalizer) {
		if policy.Status.PolicyID != "" {
			if err := r.CloudflareClient.DeletePolicy(ctx, policy.Status.PolicyID); err != nil {
				return ctrl.Result{}, fmt.Errorf("delete Cloudflare access policy: %w", err)
			}
		}
		controllerutil.RemoveFinalizer(policy, accessPolicyFinalizer)
		if err := r.Update(ctx, policy); err != nil {
			return ctrl.Result{}, fmt.Errorf("remove finalizer: %w", err)
		}
	}
	return ctrl.Result{}, nil
}

func toPolicyPayload(policy *cloudflarev1alpha1.AccessPolicy) cloudflare.PolicyPayload {
	name := policy.Spec.Name
	if name == "" {
		name = policy.Name
	}
	return cloudflare.PolicyPayload{
		Name:     name,
		Decision: policy.Spec.Decision,
		Include:  toRules(policy.Spec.Include),
		Exclude:  toRules(policy.Spec.Exclude),
		Require:  toRules(policy.Spec.Require),
	}
}

// toRules expands each AccessRuleSet into the individual selector objects Cloudflare expects.
func toRules(sets []cloudflarev1alpha1.AccessRuleSet) []cloudflare.Rule {
	var rules []cloudflare.Rule
	for _, set := range sets {
		if set.Everyone {
			rules = append(rules, cloudflare.Rule{"everyone": map[string]any{}})
		}
		for _, email := range set.Emails {
			rules = append(rules, cloudflare.Rule{"email": map[string]any{"email": email}})
		}
		for _, domain := range set.EmailDomains {
			rules = append(rules, cloudflare.Rule{"email_domain": map[string]any{"domain": domain}})
		}
		for _, ipRange := range set.IPRanges {
			rules = append(rules, cloudflare.Rule{"ip": map[string]any{"ip": ipRange}})
		}
	}
	return rules
}

func (r *AccessPolicyReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&cloudflarev1alpha1.AccessPolicy{}).
		Complete(r)
}
