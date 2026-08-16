package controller

import (
	"context"
	"fmt"
	"time"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/tools/record"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"

	cloudflarev1alpha1 "github.com/kbntx-org/nexus/platform/core/cloudflare-controller/api/v1alpha1"
	"github.com/kbntx-org/nexus/platform/core/cloudflare-controller/internal/cloudflare"
)

const (
	accessApplicationFinalizer = "cloudflare.kbntx.com/access-application"
	accessApplicationType      = "self_hosted"
	defaultSessionDuration     = "24h"
	policyNotReadyRequeueDelay = 10 * time.Second
)

type AccessApplicationReconciler struct {
	client.Client
	Scheme           *runtime.Scheme
	CloudflareClient *cloudflare.Client
	Recorder         record.EventRecorder
}

// +kubebuilder:rbac:groups=cloudflare.kbntx.com,resources=accessapplications,verbs=get;list;watch;update;patch
// +kubebuilder:rbac:groups=cloudflare.kbntx.com,resources=accessapplications/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=cloudflare.kbntx.com,resources=accessapplications/finalizers,verbs=update
// +kubebuilder:rbac:groups=cloudflare.kbntx.com,resources=accesspolicies,verbs=get;list;watch
// +kubebuilder:rbac:groups="",resources=events,verbs=create;patch

func (r *AccessApplicationReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	logger := ctrl.LoggerFrom(ctx)

	var application cloudflarev1alpha1.AccessApplication
	if err := r.Get(ctx, req.NamespacedName, &application); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	if !application.DeletionTimestamp.IsZero() {
		return r.reconcileDelete(ctx, &application)
	}

	if !controllerutil.ContainsFinalizer(&application, accessApplicationFinalizer) {
		controllerutil.AddFinalizer(&application, accessApplicationFinalizer)
		if err := r.Update(ctx, &application); err != nil {
			return ctrl.Result{}, fmt.Errorf("add finalizer: %w", err)
		}
	}

	policyIDs, err := r.resolvePolicyIDs(ctx, &application)
	if err != nil {
		application.Status.Ready = false
		application.Status.Message = err.Error()
		application.Status.ObservedGeneration = application.Generation
		if statusErr := r.Status().Update(ctx, &application); statusErr != nil {
			logger.Error(statusErr, "failed to update AccessApplication status")
		}
		r.Recorder.Event(&application, corev1.EventTypeWarning, eventReasonReconcileFailed, err.Error())
		return ctrl.Result{RequeueAfter: policyNotReadyRequeueDelay}, nil
	}

	payload := toApplicationPayload(&application, policyIDs)

	if application.Status.ApplicationID == "" {
		var id string
		id, err = r.CloudflareClient.CreateApplication(ctx, payload)
		if err == nil {
			application.Status.ApplicationID = id
		}
	} else {
		err = r.CloudflareClient.UpdateApplication(ctx, application.Status.ApplicationID, payload)
	}

	application.Status.ObservedGeneration = application.Generation
	application.Status.Ready = err == nil
	if err != nil {
		application.Status.Message = err.Error()
	} else {
		application.Status.Message = ""
	}
	if statusErr := r.Status().Update(ctx, &application); statusErr != nil {
		logger.Error(statusErr, "failed to update AccessApplication status")
	}
	if err != nil {
		err = fmt.Errorf("reconcile Cloudflare access application: %w", err)
		r.Recorder.Event(&application, corev1.EventTypeWarning, eventReasonReconcileFailed, err.Error())
		return ctrl.Result{}, err
	}

	return ctrl.Result{}, nil
}

func (r *AccessApplicationReconciler) resolvePolicyIDs(ctx context.Context, application *cloudflarev1alpha1.AccessApplication) ([]string, error) {
	policyIDs := make([]string, 0, len(application.Spec.PolicyRefs))
	for _, policyName := range application.Spec.PolicyRefs {
		var policy cloudflarev1alpha1.AccessPolicy
		key := types.NamespacedName{Namespace: application.Namespace, Name: policyName}
		if err := r.Get(ctx, key, &policy); err != nil {
			return nil, fmt.Errorf("get referenced AccessPolicy %q: %w", policyName, err)
		}
		if policy.Status.PolicyID == "" {
			return nil, fmt.Errorf("referenced AccessPolicy %q is not ready yet", policyName)
		}
		policyIDs = append(policyIDs, policy.Status.PolicyID)
	}
	return policyIDs, nil
}

func (r *AccessApplicationReconciler) reconcileDelete(ctx context.Context, application *cloudflarev1alpha1.AccessApplication) (ctrl.Result, error) {
	if controllerutil.ContainsFinalizer(application, accessApplicationFinalizer) {
		if application.Status.ApplicationID != "" {
			if err := r.CloudflareClient.DeleteApplication(ctx, application.Status.ApplicationID); err != nil {
				return ctrl.Result{}, fmt.Errorf("delete Cloudflare access application: %w", err)
			}
		}
		controllerutil.RemoveFinalizer(application, accessApplicationFinalizer)
		if err := r.Update(ctx, application); err != nil {
			return ctrl.Result{}, fmt.Errorf("remove finalizer: %w", err)
		}
	}
	return ctrl.Result{}, nil
}

func toApplicationPayload(application *cloudflarev1alpha1.AccessApplication, policyIDs []string) cloudflare.ApplicationPayload {
	name := application.Spec.Name
	if name == "" {
		name = application.Name
	}
	sessionDuration := application.Spec.SessionDuration
	if sessionDuration == "" {
		sessionDuration = defaultSessionDuration
	}
	return cloudflare.ApplicationPayload{
		Name:            name,
		Domain:          application.Spec.Domain,
		Type:            accessApplicationType,
		SessionDuration: sessionDuration,
		Policies:        policyIDs,
	}
}

func (r *AccessApplicationReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&cloudflarev1alpha1.AccessApplication{}).
		Complete(r)
}
