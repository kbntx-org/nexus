package k8s_test

import (
	"context"
	"sort"
	"testing"

	networkingv1 "k8s.io/api/networking/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes/fake"

	k8ssvc "github.com/kbntx-org/nexus/platform/cloudflare-ingress-controller/internal/k8s"
)

const testNamespace = "default"
const testTunnelAnnotation = "cloudflare.io/tunnel"

func ptr(s string) *string { return &s }

func makeIngress(name, namespace string, className *string, annotations map[string]string, hosts ...string) networkingv1.Ingress {
	var rules []networkingv1.IngressRule
	for _, host := range hosts {
		rules = append(rules, networkingv1.IngressRule{Host: host})
	}
	return networkingv1.Ingress{
		ObjectMeta: metav1.ObjectMeta{
			Name:        name,
			Namespace:   namespace,
			Annotations: annotations,
		},
		Spec: networkingv1.IngressSpec{
			IngressClassName: className,
			Rules:            rules,
		},
	}
}

// ── List tests ────────────────────────────────────────────────────────────────

func TestList_allIngresses(t *testing.T) {
	ing1 := makeIngress("ing1", "default", nil, map[string]string{testTunnelAnnotation: "foo"}, "app1.example.com")
	ing2 := makeIngress("ing2", "staging", nil, map[string]string{testTunnelAnnotation: "foo"}, "app2.example.com")

	client := fake.NewClientset(&ing1, &ing2)
	svc := k8ssvc.NewService(client, "")

	entries, err := svc.List(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(entries) != 2 {
		t.Fatalf("expected 2 entries, got %d: %v", len(entries), entries)
	}
}

func TestList_skipsIngressWithoutAnnotation(t *testing.T) {
	withAnnotation := makeIngress("with", "default", nil, map[string]string{testTunnelAnnotation: "foo"}, "app1.example.com")
	withoutAnnotation := makeIngress("without", "default", nil, nil, "app2.example.com")

	client := fake.NewClientset(&withAnnotation, &withoutAnnotation)
	svc := k8ssvc.NewService(client, "")

	entries, err := svc.List(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(entries) != 1 {
		t.Fatalf("expected 1 entry (annotation-less ingress skipped), got %d", len(entries))
	}
	if entries[0].Hostname != "app1.example.com" {
		t.Errorf("expected app1.example.com, got %q", entries[0].Hostname)
	}
}

func TestList_filterBySpecClassName(t *testing.T) {
	match := makeIngress("match", "default", ptr("traefik"), map[string]string{testTunnelAnnotation: "foo"}, "match.example.com")
	noMatch := makeIngress("no-match", "default", ptr("nginx"), map[string]string{testTunnelAnnotation: "foo"}, "no-match.example.com")

	client := fake.NewClientset(&match, &noMatch)
	svc := k8ssvc.NewService(client, "traefik")

	entries, err := svc.List(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(entries) != 1 || entries[0].Hostname != "match.example.com" {
		t.Errorf("expected [match.example.com], got %v", entries)
	}
}

func TestList_filterByAnnotationClass(t *testing.T) {
	match := makeIngress("match", "default", nil,
		map[string]string{"kubernetes.io/ingress.class": "traefik", testTunnelAnnotation: "foo"},
		"match.example.com",
	)
	noMatch := makeIngress("no-match", "default", nil, map[string]string{testTunnelAnnotation: "foo"}, "no-match.example.com")

	client := fake.NewClientset(&match, &noMatch)
	svc := k8ssvc.NewService(client, "traefik")

	entries, err := svc.List(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(entries) != 1 || entries[0].Hostname != "match.example.com" {
		t.Errorf("expected [match.example.com], got %v", entries)
	}
}

func TestList_skipsEmptyHosts(t *testing.T) {
	ing := makeIngress("ing", "default", nil, map[string]string{testTunnelAnnotation: "foo"}, "", "valid.example.com")

	client := fake.NewClientset(&ing)
	svc := k8ssvc.NewService(client, "")

	entries, err := svc.List(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(entries) != 1 || entries[0].Hostname != "valid.example.com" {
		t.Errorf("expected [valid.example.com], got %v", entries)
	}
}

func TestList_multipleHostsPerIngress(t *testing.T) {
	ing := makeIngress("ing", "default", nil, map[string]string{testTunnelAnnotation: "foo"},
		"a.example.com", "b.example.com", "c.example.com")

	client := fake.NewClientset(&ing)
	svc := k8ssvc.NewService(client, "")

	entries, err := svc.List(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	sort.Slice(entries, func(i, j int) bool { return entries[i].Hostname < entries[j].Hostname })
	want := []string{"a.example.com", "b.example.com", "c.example.com"}
	for idx, host := range want {
		if entries[idx].Hostname != host {
			t.Errorf("entries[%d].Hostname = %q, want %q", idx, entries[idx].Hostname, host)
		}
		if entries[idx].TunnelName != "foo" {
			t.Errorf("entries[%d].TunnelName = %q, want %q", idx, entries[idx].TunnelName, "foo")
		}
	}
}

func TestList_tunnelNameFromAnnotation(t *testing.T) {
	ing1 := makeIngress("ing1", "default", nil, map[string]string{testTunnelAnnotation: "foo"}, "a.example.com")
	ing2 := makeIngress("ing2", "default", nil, map[string]string{testTunnelAnnotation: "bar"}, "b.example.com")

	client := fake.NewClientset(&ing1, &ing2)
	svc := k8ssvc.NewService(client, "")

	entries, err := svc.List(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	sort.Slice(entries, func(i, j int) bool { return entries[i].Hostname < entries[j].Hostname })
	if entries[0].TunnelName != "foo" {
		t.Errorf("expected tunnel name foo, got %q", entries[0].TunnelName)
	}
	if entries[1].TunnelName != "bar" {
		t.Errorf("expected tunnel name bar, got %q", entries[1].TunnelName)
	}
}

// ── Secret tests ──────────────────────────────────────────────────────────────

func TestGetSecret_notFound(t *testing.T) {
	client := fake.NewClientset()
	svc := k8ssvc.NewService(client, "")

	_, found, err := svc.GetSecret(context.Background(), testNamespace, "missing")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if found {
		t.Error("expected found=false for missing secret")
	}
}

func TestCreateSecret_andGetSecret(t *testing.T) {
	client := fake.NewClientset()
	svc := k8ssvc.NewService(client, "")

	data := map[string][]byte{"tunnelToken": []byte("my-token"), "tunnelID": []byte("my-id")}
	if err := svc.CreateSecret(context.Background(), testNamespace, "my-secret", data); err != nil {
		t.Fatalf("create secret: %v", err)
	}

	got, found, err := svc.GetSecret(context.Background(), testNamespace, "my-secret")
	if err != nil {
		t.Fatalf("get secret: %v", err)
	}
	if !found {
		t.Fatal("expected found=true after create")
	}
	if string(got["tunnelToken"]) != "my-token" {
		t.Errorf("expected tunnelToken=my-token, got %q", got["tunnelToken"])
	}
}

func TestDeleteSecret(t *testing.T) {
	client := fake.NewClientset()
	svc := k8ssvc.NewService(client, "")

	if err := svc.CreateSecret(context.Background(), testNamespace, "del-secret", map[string][]byte{}); err != nil {
		t.Fatalf("create secret: %v", err)
	}
	if err := svc.DeleteSecret(context.Background(), testNamespace, "del-secret"); err != nil {
		t.Fatalf("delete secret: %v", err)
	}
	_, found, err := svc.GetSecret(context.Background(), testNamespace, "del-secret")
	if err != nil || found {
		t.Errorf("expected secret to be gone after delete, found=%v err=%v", found, err)
	}
}

// ── Deployment tests ──────────────────────────────────────────────────────────

func TestDeploymentExists_false(t *testing.T) {
	client := fake.NewClientset()
	svc := k8ssvc.NewService(client, "")

	exists, err := svc.DeploymentExists(context.Background(), testNamespace, "missing")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if exists {
		t.Error("expected exists=false for missing deployment")
	}
}

func TestCreateDeployment_setsTunnelTokenFromSecret(t *testing.T) {
	client := fake.NewClientset()
	svc := k8ssvc.NewService(client, "")

	spec := k8ssvc.CloudflaredDeploymentSpec{
		Namespace:             testNamespace,
		Name:                  "cloudflared-foo",
		Replicas:              2,
		Image:                 "cloudflare/cloudflared:latest",
		CredentialsSecretName: "cloudflared-credentials-foo",
	}
	if err := svc.CreateDeployment(context.Background(), spec); err != nil {
		t.Fatalf("create deployment: %v", err)
	}

	exists, err := svc.DeploymentExists(context.Background(), testNamespace, "cloudflared-foo")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !exists {
		t.Error("expected deployment to exist after create")
	}

	// Verify TUNNEL_TOKEN env var is configured from the secret
	deployment, err := client.AppsV1().Deployments(testNamespace).Get(context.Background(), "cloudflared-foo", metav1.GetOptions{})
	if err != nil {
		t.Fatalf("get deployment: %v", err)
	}
	containers := deployment.Spec.Template.Spec.Containers
	if len(containers) == 0 {
		t.Fatal("expected at least one container")
	}
	var found bool
	for _, env := range containers[0].Env {
		if env.Name == "TUNNEL_TOKEN" && env.ValueFrom != nil &&
			env.ValueFrom.SecretKeyRef != nil &&
			env.ValueFrom.SecretKeyRef.Name == "cloudflared-credentials-foo" &&
			env.ValueFrom.SecretKeyRef.Key == "tunnelToken" {
			found = true
		}
	}
	if !found {
		t.Error("expected TUNNEL_TOKEN env var with secretKeyRef pointing to credentials secret")
	}
}

func TestDeleteDeployment(t *testing.T) {
	client := fake.NewClientset()
	svc := k8ssvc.NewService(client, "")

	spec := k8ssvc.CloudflaredDeploymentSpec{
		Namespace: testNamespace, Name: "cloudflared-del", Replicas: 1,
		Image: "cloudflare/cloudflared:latest", CredentialsSecretName: "creds",
	}
	if err := svc.CreateDeployment(context.Background(), spec); err != nil {
		t.Fatalf("create deployment: %v", err)
	}
	if err := svc.DeleteDeployment(context.Background(), testNamespace, "cloudflared-del"); err != nil {
		t.Fatalf("delete deployment: %v", err)
	}
	exists, err := svc.DeploymentExists(context.Background(), testNamespace, "cloudflared-del")
	if err != nil || exists {
		t.Errorf("expected deployment to be gone after delete, exists=%v err=%v", exists, err)
	}
}

// ── PDB tests ─────────────────────────────────────────────────────────────────

func TestPDBExists_false(t *testing.T) {
	client := fake.NewClientset()
	svc := k8ssvc.NewService(client, "")

	exists, err := svc.PDBExists(context.Background(), testNamespace, "missing")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if exists {
		t.Error("expected exists=false for missing pdb")
	}
}

func TestCreatePDB_minAvailableOne(t *testing.T) {
	client := fake.NewClientset()
	svc := k8ssvc.NewService(client, "")

	if err := svc.CreatePDB(context.Background(), testNamespace, "cloudflared-foo", "cloudflared-foo"); err != nil {
		t.Fatalf("create pdb: %v", err)
	}

	exists, err := svc.PDBExists(context.Background(), testNamespace, "cloudflared-foo")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !exists {
		t.Error("expected pdb to exist after create")
	}

	pdb, err := client.PolicyV1().PodDisruptionBudgets(testNamespace).Get(context.Background(), "cloudflared-foo", metav1.GetOptions{})
	if err != nil {
		t.Fatalf("get pdb: %v", err)
	}
	if pdb.Spec.MinAvailable == nil || pdb.Spec.MinAvailable.IntValue() != 1 {
		t.Errorf("expected minAvailable=1, got %v", pdb.Spec.MinAvailable)
	}
}

func TestDeletePDB(t *testing.T) {
	client := fake.NewClientset()
	svc := k8ssvc.NewService(client, "")

	if err := svc.CreatePDB(context.Background(), testNamespace, "cloudflared-del", "cloudflared-del"); err != nil {
		t.Fatalf("create pdb: %v", err)
	}
	if err := svc.DeletePDB(context.Background(), testNamespace, "cloudflared-del"); err != nil {
		t.Fatalf("delete pdb: %v", err)
	}
	exists, err := svc.PDBExists(context.Background(), testNamespace, "cloudflared-del")
	if err != nil || exists {
		t.Errorf("expected pdb to be gone after delete, exists=%v err=%v", exists, err)
	}
}
