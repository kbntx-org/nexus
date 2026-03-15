package controller_test

import (
	"context"
	"testing"

	"github.com/kbntx-org/nexus/platform/cloudflare-ingress-controller/internal/cloudflare"
	"github.com/kbntx-org/nexus/platform/cloudflare-ingress-controller/internal/controller"
	"github.com/kbntx-org/nexus/platform/cloudflare-ingress-controller/internal/k8s"
)

const testNamespace = "default"
const testPrefix = "k8s"
const testTargetURL = "http://traefik"
const testImage = "cloudflare/cloudflared:latest"

func testConfig() controller.ReconcileConfig {
	return controller.ReconcileConfig{
		TargetServiceURL:    testTargetURL,
		TunnelNamePrefix:    testPrefix,
		ControllerNamespace: testNamespace,
		CloudflaredImage:    testImage,
		CloudflaredReplicas: 2,
	}
}

// ── Fakes ─────────────────────────────────────────────────────────────────────

type fakeK8s struct {
	entries     []k8s.IngressEntry
	secrets     map[string]map[string][]byte // namespace/name → data
	deployments map[string]bool              // namespace/name
	pdbs        map[string]bool              // namespace/name
}

func newFakeK8s(entries ...k8s.IngressEntry) *fakeK8s {
	return &fakeK8s{
		entries:     entries,
		secrets:     map[string]map[string][]byte{},
		deployments: map[string]bool{},
		pdbs:        map[string]bool{},
	}
}

func (f *fakeK8s) key(namespace, name string) string { return namespace + "/" + name }

func (f *fakeK8s) List(_ context.Context) ([]k8s.IngressEntry, error) { return f.entries, nil }
func (f *fakeK8s) Watch(_ context.Context, _ func()) error             { return nil }

func (f *fakeK8s) GetSecret(_ context.Context, namespace, name string) (map[string][]byte, bool, error) {
	data, found := f.secrets[f.key(namespace, name)]
	return data, found, nil
}
func (f *fakeK8s) CreateSecret(_ context.Context, namespace, name string, data map[string][]byte) error {
	f.secrets[f.key(namespace, name)] = data
	return nil
}
func (f *fakeK8s) DeleteSecret(_ context.Context, namespace, name string) error {
	delete(f.secrets, f.key(namespace, name))
	return nil
}

func (f *fakeK8s) DeploymentExists(_ context.Context, namespace, name string) (bool, error) {
	return f.deployments[f.key(namespace, name)], nil
}
func (f *fakeK8s) CreateDeployment(_ context.Context, spec k8s.CloudflaredDeploymentSpec) error {
	f.deployments[f.key(spec.Namespace, spec.Name)] = true
	return nil
}
func (f *fakeK8s) DeleteDeployment(_ context.Context, namespace, name string) error {
	delete(f.deployments, f.key(namespace, name))
	return nil
}

func (f *fakeK8s) PDBExists(_ context.Context, namespace, name string) (bool, error) {
	return f.pdbs[f.key(namespace, name)], nil
}
func (f *fakeK8s) CreatePDB(_ context.Context, namespace, name, _ string) error {
	f.pdbs[f.key(namespace, name)] = true
	return nil
}
func (f *fakeK8s) DeletePDB(_ context.Context, namespace, name string) error {
	delete(f.pdbs, f.key(namespace, name))
	return nil
}

type fakeCloudflare struct {
	tunnels    []cloudflare.TunnelSummary
	configs    map[string][]cloudflare.IngressRule // tunnelID → rules
	putCalls   map[string][]cloudflare.IngressRule // tunnelID → last put
	created    []string                            // full tunnel names created
	deleted    []string                            // tunnel IDs deleted
	nextTunnelID string
}

func newFakeCloudflare() *fakeCloudflare {
	return &fakeCloudflare{
		configs:      map[string][]cloudflare.IngressRule{},
		putCalls:     map[string][]cloudflare.IngressRule{},
		nextTunnelID: "tunnel-id-1",
	}
}

func (f *fakeCloudflare) LookupZoneName(_ context.Context, _ string) (string, error) {
	return "example.com", nil
}
func (f *fakeCloudflare) ListTunnels(_ context.Context) ([]cloudflare.TunnelSummary, error) {
	return f.tunnels, nil
}
func (f *fakeCloudflare) CreateTunnel(_ context.Context, name string) (cloudflare.TunnelInfo, error) {
	f.created = append(f.created, name)
	info := cloudflare.TunnelInfo{ID: f.nextTunnelID, Token: "test-token"}
	f.tunnels = append(f.tunnels, cloudflare.TunnelSummary{ID: f.nextTunnelID, Name: name})
	f.configs[f.nextTunnelID] = nil
	f.nextTunnelID = f.nextTunnelID + "-x"
	return info, nil
}
func (f *fakeCloudflare) DeleteTunnel(_ context.Context, tunnelID string) error {
	f.deleted = append(f.deleted, tunnelID)
	var remaining []cloudflare.TunnelSummary
	for _, tunnel := range f.tunnels {
		if tunnel.ID != tunnelID {
			remaining = append(remaining, tunnel)
		}
	}
	f.tunnels = remaining
	return nil
}
func (f *fakeCloudflare) GetConfig(_ context.Context, tunnelID string) ([]cloudflare.IngressRule, error) {
	return f.configs[tunnelID], nil
}
func (f *fakeCloudflare) PutConfig(_ context.Context, tunnelID string, rules []cloudflare.IngressRule) error {
	f.putCalls[tunnelID] = rules
	f.configs[tunnelID] = rules
	return nil
}

// ── Tests ─────────────────────────────────────────────────────────────────────

func TestReconcile_firstIngressCreatesTunnelAndDeployment(t *testing.T) {
	kubernetesService := newFakeK8s(k8s.IngressEntry{Hostname: "app.example.com", TunnelName: "kenny"})
	cloudflareService := newFakeCloudflare()

	if err := controller.Reconcile(context.Background(), kubernetesService, cloudflareService, testConfig()); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(cloudflareService.created) != 1 || cloudflareService.created[0] != "k8s-kenny" {
		t.Errorf("expected tunnel k8s-kenny created, got %v", cloudflareService.created)
	}
	if !kubernetesService.deployments[testNamespace+"/cloudflared-kenny"] {
		t.Error("expected cloudflared-kenny deployment to exist")
	}
	if !kubernetesService.pdbs[testNamespace+"/cloudflared-kenny"] {
		t.Error("expected cloudflared-kenny pdb to exist")
	}
}

func TestReconcile_twoTunnelsTwoDeployments(t *testing.T) {
	kubernetesService := newFakeK8s(
		k8s.IngressEntry{Hostname: "a.example.com", TunnelName: "foo"},
		k8s.IngressEntry{Hostname: "b.example.com", TunnelName: "bar"},
	)
	cloudflareService := newFakeCloudflare()
	cloudflareService.nextTunnelID = "tid-1"

	if err := controller.Reconcile(context.Background(), kubernetesService, cloudflareService, testConfig()); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(cloudflareService.created) != 2 {
		t.Errorf("expected 2 tunnels created, got %v", cloudflareService.created)
	}
	if !kubernetesService.deployments[testNamespace+"/cloudflared-foo"] {
		t.Error("expected cloudflared-foo deployment")
	}
	if !kubernetesService.deployments[testNamespace+"/cloudflared-bar"] {
		t.Error("expected cloudflared-bar deployment")
	}
}

func TestReconcile_secondIngressSameTunnelUpdatesPutConfig(t *testing.T) {
	kubernetesService := newFakeK8s(
		k8s.IngressEntry{Hostname: "a.example.com", TunnelName: "kenny"},
		k8s.IngressEntry{Hostname: "b.example.com", TunnelName: "kenny"},
	)
	cloudflareService := newFakeCloudflare()

	if err := controller.Reconcile(context.Background(), kubernetesService, cloudflareService, testConfig()); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(cloudflareService.created) != 1 {
		t.Errorf("expected 1 tunnel created, got %v", cloudflareService.created)
	}
	// The put call should have 2 hostnames
	tunnelID := cloudflareService.tunnels[0].ID
	if len(cloudflareService.putCalls[tunnelID]) != 2 {
		t.Errorf("expected 2 rules in put call, got %d", len(cloudflareService.putCalls[tunnelID]))
	}
}

func TestReconcile_hostnameCollisionLoggedAndSkipped(t *testing.T) {
	// Two different tunnels claim the same hostname
	kubernetesService := newFakeK8s(
		k8s.IngressEntry{Hostname: "shared.example.com", TunnelName: "foo"},
		k8s.IngressEntry{Hostname: "shared.example.com", TunnelName: "bar"},
	)
	cloudflareService := newFakeCloudflare()

	if err := controller.Reconcile(context.Background(), kubernetesService, cloudflareService, testConfig()); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Tunnels are still created but with no hostnames (collision removed shared.example.com)
	for _, tunnelID := range []string{"tunnel-id-1", "tunnel-id-1-x"} {
		rules := cloudflareService.putCalls[tunnelID]
		for _, rule := range rules {
			if rule.Hostname == "shared.example.com" {
				t.Error("conflicting hostname should have been removed from all tunnel configs")
			}
		}
	}
}

func TestReconcile_orphanTunnelDeleted(t *testing.T) {
	// An existing CF tunnel exists but no Ingress references it
	kubernetesService := newFakeK8s() // no ingresses
	cloudflareService := newFakeCloudflare()
	cloudflareService.tunnels = []cloudflare.TunnelSummary{
		{ID: "orphan-id", Name: "k8s-stale"},
	}
	cloudflareService.configs["orphan-id"] = nil

	if err := controller.Reconcile(context.Background(), kubernetesService, cloudflareService, testConfig()); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(cloudflareService.deleted) != 1 || cloudflareService.deleted[0] != "orphan-id" {
		t.Errorf("expected orphan-id to be deleted, got %v", cloudflareService.deleted)
	}
}

func TestReconcile_ingressWithoutAnnotationSkipped(t *testing.T) {
	kubernetesService := newFakeK8s() // List returns empty (no annotation)
	cloudflareService := newFakeCloudflare()

	if err := controller.Reconcile(context.Background(), kubernetesService, cloudflareService, testConfig()); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(cloudflareService.created) != 0 {
		t.Errorf("expected no tunnels created, got %v", cloudflareService.created)
	}
}

func TestReconcile_staleTunnelCleansUpK8sResources(t *testing.T) {
	// CF tunnel was deleted externally but the k8s Secret and Deployment are still around.
	// The controller should clean them up so the next reconcile creates a fresh tunnel.
	secretName := "cloudflared-credentials-kenny"
	deploymentName := "cloudflared-kenny"

	kubernetesService := newFakeK8s(k8s.IngressEntry{Hostname: "app.example.com", TunnelName: "kenny"})
	// Pre-populate stale k8s resources (tunnel missing from CF).
	kubernetesService.secrets[testNamespace+"/"+secretName] = map[string][]byte{
		"tunnelID":    []byte("stale-tunnel-id"),
		"tunnelToken": []byte("stale-token"),
	}
	kubernetesService.deployments[testNamespace+"/"+deploymentName] = true
	kubernetesService.pdbs[testNamespace+"/"+deploymentName] = true

	// CF has NO tunnels — simulates external deletion.
	cloudflareService := newFakeCloudflare()

	if err := controller.Reconcile(context.Background(), kubernetesService, cloudflareService, testConfig()); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Stale resources must be gone.
	if _, exists := kubernetesService.secrets[testNamespace+"/"+secretName]; exists {
		t.Error("expected stale secret to be deleted")
	}
	if kubernetesService.deployments[testNamespace+"/"+deploymentName] {
		t.Error("expected stale deployment to be deleted")
	}
	if kubernetesService.pdbs[testNamespace+"/"+deploymentName] {
		t.Error("expected stale pdb to be deleted")
	}
	// No new CF tunnel should have been created this cycle.
	if len(cloudflareService.created) != 0 {
		t.Errorf("expected no tunnel created this cycle, got %v", cloudflareService.created)
	}
}

func TestReconcile_allIngressesGoneTeardown(t *testing.T) {
	// Tunnels exist in CF but all Ingresses are gone
	kubernetesService := newFakeK8s()
	cloudflareService := newFakeCloudflare()
	cloudflareService.tunnels = []cloudflare.TunnelSummary{
		{ID: "tid-foo", Name: "k8s-foo"},
		{ID: "tid-bar", Name: "k8s-bar"},
	}
	cloudflareService.configs["tid-foo"] = nil
	cloudflareService.configs["tid-bar"] = nil

	if err := controller.Reconcile(context.Background(), kubernetesService, cloudflareService, testConfig()); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(cloudflareService.deleted) != 2 {
		t.Errorf("expected 2 tunnels deleted, got %v", cloudflareService.deleted)
	}
}

// ── Pure helper tests ─────────────────────────────────────────────────────────

func TestGroupByTunnel(t *testing.T) {
	entries := []k8s.IngressEntry{
		{Hostname: "a.example.com", TunnelName: "foo"},
		{Hostname: "b.example.com", TunnelName: "foo"},
		{Hostname: "c.example.com", TunnelName: "bar"},
	}
	groups := controller.GroupByTunnel(entries)
	if len(groups["foo"]) != 2 {
		t.Errorf("expected 2 hostnames for foo, got %d", len(groups["foo"]))
	}
	if len(groups["bar"]) != 1 {
		t.Errorf("expected 1 hostname for bar, got %d", len(groups["bar"]))
	}
}

func TestDetectCollisions(t *testing.T) {
	groups := map[string][]string{
		"foo": {"shared.example.com", "unique-foo.example.com"},
		"bar": {"shared.example.com", "unique-bar.example.com"},
	}
	clean, conflicts := controller.DetectCollisions(groups)
	if _, conflict := conflicts["shared.example.com"]; !conflict {
		t.Error("expected shared.example.com to be flagged as conflict")
	}
	for _, hostnames := range clean {
		for _, hostname := range hostnames {
			if hostname == "shared.example.com" {
				t.Error("conflicting hostname should not appear in clean groups")
			}
		}
	}
}

func TestTunnelFullName(t *testing.T) {
	if got := controller.TunnelFullName("k8s", "kenny"); got != "k8s-kenny" {
		t.Errorf("expected k8s-kenny, got %q", got)
	}
}

func TestStripPrefix(t *testing.T) {
	shortName, ok := controller.StripPrefix("k8s", "k8s-kenny")
	if !ok || shortName != "kenny" {
		t.Errorf("expected (kenny, true), got (%q, %v)", shortName, ok)
	}
	_, ok = controller.StripPrefix("k8s", "other-kenny")
	if ok {
		t.Error("expected false for non-matching prefix")
	}
}

func TestHostnameInZone(t *testing.T) {
	cases := []struct {
		hostname   string
		zone       string
		wantInZone bool
	}{
		{"app.example.com", "example.com", true},
		{"api.example.com", "example.com", true},
		{"example.com", "example.com", true},          // apex domain itself
		{"notexample.com", "example.com", false},      // different TLD-like suffix
		{"evil-example.com", "example.com", false},    // suffix match must be dot-separated
		{"app.other.com", "example.com", false},
		{"app.example.com", "", true},                 // empty zone = no filter
	}
	for _, tc := range cases {
		got := controller.HostnameInZone(tc.hostname, tc.zone)
		if got != tc.wantInZone {
			t.Errorf("HostnameInZone(%q, %q) = %v, want %v", tc.hostname, tc.zone, got, tc.wantInZone)
		}
	}
}

func TestReconcile_hostnameOutsideZoneSkipped(t *testing.T) {
	config := testConfig()
	config.ZoneDomain = "example.com"

	kubernetesService := newFakeK8s(
		k8s.IngressEntry{Hostname: "app.example.com", TunnelName: "kenny"},   // in zone
		k8s.IngressEntry{Hostname: "app.other.com", TunnelName: "kenny"},     // out of zone
	)
	cloudflareService := newFakeCloudflare()

	if err := controller.Reconcile(context.Background(), kubernetesService, cloudflareService, config); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Only the in-zone hostname should be routed
	tunnelID := cloudflareService.tunnels[0].ID
	rules := cloudflareService.putCalls[tunnelID]
	if len(rules) != 1 {
		t.Fatalf("expected 1 rule (out-of-zone hostname excluded), got %d: %v", len(rules), rules)
	}
	if rules[0].Hostname != "app.example.com" {
		t.Errorf("expected app.example.com, got %q", rules[0].Hostname)
	}
}
