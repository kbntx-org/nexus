package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/leaderelection"
	"k8s.io/client-go/tools/leaderelection/resourcelock"

	"github.com/kbntx-org/nexus/platform/cloudflare-ingress-controller/internal/cloudflare"
	"github.com/kbntx-org/nexus/platform/cloudflare-ingress-controller/internal/controller"
	k8ssvc "github.com/kbntx-org/nexus/platform/cloudflare-ingress-controller/internal/k8s"
)

func main() {
	targetServiceURL := mustGetenv("TARGET_SERVICE_URL")
	cloudflareAPIToken := mustGetenv("CF_API_TOKEN")
	cloudflareAccountID := mustGetenv("CF_ACCOUNT_ID")
	cloudflareTunnelID := mustGetenv("CF_TUNNEL_ID")
	_ = mustGetenv("CF_ZONE_ID") // reserved for future DNS operations
	podName := mustGetenv("POD_NAME")
	podNamespace := mustGetenv("POD_NAMESPACE")

	ingressClassName := os.Getenv("INGRESS_CLASS_NAME")
	reconcileInterval := 30 * time.Second
	if intervalStr := os.Getenv("RECONCILE_INTERVAL_MS"); intervalStr != "" {
		if milliseconds, err := strconv.Atoi(intervalStr); err == nil {
			reconcileInterval = time.Duration(milliseconds) * time.Millisecond
		}
	}

	slog.Info("starting cloudflare-ingress-controller",
		"pod", podName,
		"ingressClassName", ingressClassName,
		"reconcileInterval", reconcileInterval,
	)

	kubeConfig, err := rest.InClusterConfig()
	if err != nil {
		slog.Error("failed to get in-cluster config", "error", err)
		os.Exit(1)
	}
	kubeClient, err := kubernetes.NewForConfig(kubeConfig)
	if err != nil {
		slog.Error("failed to create kubernetes client", "error", err)
		os.Exit(1)
	}

	cloudflareService := cloudflare.NewService(cloudflareAccountID, cloudflareTunnelID, cloudflareAPIToken)
	kubernetesService := k8ssvc.NewService(kubeClient, ingressClassName)

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGTERM, syscall.SIGINT)
	defer cancel()

	resourceLock, err := resourcelock.New(
		resourcelock.LeasesResourceLock,
		podNamespace,
		"cloudflare-ingress-controller-leader",
		kubeClient.CoreV1(),
		kubeClient.CoordinationV1(),
		resourcelock.ResourceLockConfig{Identity: podName},
	)
	if err != nil {
		slog.Error("failed to create resource lock", "error", err)
		os.Exit(1)
	}

	slog.Info("waiting for leadership", "pod", podName)
	leaderelection.RunOrDie(ctx, leaderelection.LeaderElectionConfig{
		Lock:            resourceLock,
		LeaseDuration:   15 * time.Second,
		RenewDeadline:   10 * time.Second,
		RetryPeriod:     2 * time.Second,
		ReleaseOnCancel: true,
		Callbacks: leaderelection.LeaderCallbacks{
			OnStartedLeading: func(ctx context.Context) {
				runLeader(ctx, kubernetesService, cloudflareService, targetServiceURL, reconcileInterval, podName)
			},
			OnStoppedLeading: func() {
				slog.Info("lost leadership, shutting down", "pod", podName)
			},
			OnNewLeader: func(identity string) {
				if identity != podName {
					slog.Info("current leader", "identity", identity)
				}
			},
		},
	})
}

func runLeader(ctx context.Context, kubernetesService k8ssvc.Service, cloudflareService cloudflare.Service, targetServiceURL string, reconcileInterval time.Duration, podName string) {
	slog.Info("became leader, starting reconciliation loop", "pod", podName)

	trigger := make(chan struct{}, 1)
	enqueue := func() {
		select {
		case trigger <- struct{}{}:
		default:
		}
	}

	go func() {
		if err := kubernetesService.Watch(ctx, enqueue); err != nil && ctx.Err() == nil {
			slog.Error("ingress watch failed", "error", err)
		}
	}()

	enqueue() // trigger initial reconcile

	ticker := time.NewTicker(reconcileInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			slog.Info("context cancelled, stopping reconciliation loop")
			return
		case <-ticker.C:
			enqueue()
		case <-trigger:
			if err := controller.Reconcile(ctx, kubernetesService, cloudflareService, targetServiceURL); err != nil {
				slog.Error("reconciliation failed", "error", err)
			}
		}
	}
}

func mustGetenv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		slog.Error("required environment variable not set", "key", key)
		os.Exit(1)
	}
	return v
}
