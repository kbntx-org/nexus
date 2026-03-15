package controller_test

import (
	"context"
	"testing"

	"github.com/kbntx-org/nexus/platform/cloudflare-ingress-controller/internal/cloudflare"
	"github.com/kbntx-org/nexus/platform/cloudflare-ingress-controller/internal/controller"
)

// fakeK8s implements k8s.Service for tests.
type fakeK8s struct {
	hostnames []string
}

func (f *fakeK8s) List(_ context.Context) ([]string, error) { return f.hostnames, nil }
func (f *fakeK8s) Watch(_ context.Context, _ func()) error  { return nil }

// fakeCloudflare implements cloudflare.Service for tests.
type fakeCloudflare struct {
	rules    []cloudflare.IngressRule
	putCalls [][]cloudflare.IngressRule
}

func (f *fakeCloudflare) GetConfig(_ context.Context) ([]cloudflare.IngressRule, error) {
	return f.rules, nil
}
func (f *fakeCloudflare) PutConfig(_ context.Context, rules []cloudflare.IngressRule) error {
	f.putCalls = append(f.putCalls, rules)
	return nil
}

func TestReconcile_upToDate(t *testing.T) {
	kubernetesService := &fakeK8s{hostnames: []string{"app.example.com"}}
	cloudflareService := &fakeCloudflare{
		rules: []cloudflare.IngressRule{{Hostname: "app.example.com", Service: "http://traefik"}},
	}

	if err := controller.Reconcile(context.Background(), kubernetesService, cloudflareService, "http://traefik"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(cloudflareService.putCalls) != 0 {
		t.Error("expected no PUT when config is already up to date")
	}
}

func TestReconcile_addsNewHostname(t *testing.T) {
	kubernetesService := &fakeK8s{hostnames: []string{"app.example.com", "new.example.com"}}
	cloudflareService := &fakeCloudflare{
		rules: []cloudflare.IngressRule{{Hostname: "app.example.com", Service: "http://traefik"}},
	}

	if err := controller.Reconcile(context.Background(), kubernetesService, cloudflareService, "http://traefik"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(cloudflareService.putCalls) != 1 {
		t.Fatalf("expected 1 PUT, got %d", len(cloudflareService.putCalls))
	}
	if len(cloudflareService.putCalls[0]) != 2 {
		t.Errorf("expected 2 rules, got %d", len(cloudflareService.putCalls[0]))
	}
}

func TestReconcile_removesStaleHostname(t *testing.T) {
	kubernetesService := &fakeK8s{hostnames: []string{"app.example.com"}}
	cloudflareService := &fakeCloudflare{
		rules: []cloudflare.IngressRule{
			{Hostname: "app.example.com", Service: "http://traefik"},
			{Hostname: "old.example.com", Service: "http://traefik"},
		},
	}

	if err := controller.Reconcile(context.Background(), kubernetesService, cloudflareService, "http://traefik"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(cloudflareService.putCalls) != 1 {
		t.Fatalf("expected 1 PUT, got %d", len(cloudflareService.putCalls))
	}
	if len(cloudflareService.putCalls[0]) != 1 {
		t.Errorf("expected 1 rule after removal, got %d", len(cloudflareService.putCalls[0]))
	}
}

func TestReconcile_emptyCluster(t *testing.T) {
	kubernetesService := &fakeK8s{hostnames: []string{}}
	cloudflareService := &fakeCloudflare{
		rules: []cloudflare.IngressRule{{Hostname: "stale.example.com", Service: "http://traefik"}},
	}

	if err := controller.Reconcile(context.Background(), kubernetesService, cloudflareService, "http://traefik"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(cloudflareService.putCalls) != 1 || len(cloudflareService.putCalls[0]) != 0 {
		t.Errorf("expected PUT with 0 rules, got %v", cloudflareService.putCalls)
	}
}

func TestReconcile_mixedAddAndRemove(t *testing.T) {
	kubernetesService := &fakeK8s{hostnames: []string{"new.example.com"}}
	cloudflareService := &fakeCloudflare{
		rules: []cloudflare.IngressRule{{Hostname: "old.example.com", Service: "http://traefik"}},
	}

	if err := controller.Reconcile(context.Background(), kubernetesService, cloudflareService, "http://traefik"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(cloudflareService.putCalls) != 1 {
		t.Fatalf("expected 1 PUT, got %d", len(cloudflareService.putCalls))
	}
	if len(cloudflareService.putCalls[0]) != 1 || cloudflareService.putCalls[0][0].Hostname != "new.example.com" {
		t.Errorf("unexpected rules: %v", cloudflareService.putCalls[0])
	}
}
