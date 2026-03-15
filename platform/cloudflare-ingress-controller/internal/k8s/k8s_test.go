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

func ptr(s string) *string { return &s }

func makeIngress(name, namespace string, className *string, annotations map[string]string, hosts ...string) networkingv1.Ingress {
	var rules []networkingv1.IngressRule
	for _, h := range hosts {
		rules = append(rules, networkingv1.IngressRule{Host: h})
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

func TestList_allIngresses(t *testing.T) {
	ing1 := makeIngress("ing1", "default", nil, nil, "app1.example.com")
	ing2 := makeIngress("ing2", "staging", nil, nil, "app2.example.com")

	client := fake.NewClientset(&ing1, &ing2)
	svc := k8ssvc.NewService(client, "")

	hosts, err := svc.List(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(hosts) != 2 {
		t.Fatalf("expected 2 hosts, got %d: %v", len(hosts), hosts)
	}
}

func TestList_filterBySpecClassName(t *testing.T) {
	match := makeIngress("match", "default", ptr("traefik"), nil, "match.example.com")
	noMatch := makeIngress("no-match", "default", ptr("nginx"), nil, "no-match.example.com")

	client := fake.NewClientset(&match, &noMatch)
	svc := k8ssvc.NewService(client, "traefik")

	hosts, err := svc.List(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(hosts) != 1 || hosts[0] != "match.example.com" {
		t.Errorf("expected [match.example.com], got %v", hosts)
	}
}

func TestList_filterByAnnotation(t *testing.T) {
	match := makeIngress("match", "default", nil,
		map[string]string{"kubernetes.io/ingress.class": "traefik"},
		"match.example.com",
	)
	noMatch := makeIngress("no-match", "default", nil, nil, "no-match.example.com")

	client := fake.NewClientset(&match, &noMatch)
	svc := k8ssvc.NewService(client, "traefik")

	hosts, err := svc.List(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(hosts) != 1 || hosts[0] != "match.example.com" {
		t.Errorf("expected [match.example.com], got %v", hosts)
	}
}

func TestList_deduplicatesHostnames(t *testing.T) {
	ing1 := makeIngress("ing1", "default", nil, nil, "shared.example.com")
	ing2 := makeIngress("ing2", "staging", nil, nil, "shared.example.com")

	client := fake.NewClientset(&ing1, &ing2)
	svc := k8ssvc.NewService(client, "")

	hosts, err := svc.List(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(hosts) != 1 {
		t.Errorf("expected 1 deduplicated host, got %d: %v", len(hosts), hosts)
	}
}

func TestList_skipsEmptyHosts(t *testing.T) {
	ing := makeIngress("ing", "default", nil, nil, "", "valid.example.com")

	client := fake.NewClientset(&ing)
	svc := k8ssvc.NewService(client, "")

	hosts, err := svc.List(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(hosts) != 1 || hosts[0] != "valid.example.com" {
		t.Errorf("expected [valid.example.com], got %v", hosts)
	}
}

func TestList_multipleHostsPerIngress(t *testing.T) {
	ing := makeIngress("ing", "default", nil, nil, "a.example.com", "b.example.com", "c.example.com")

	client := fake.NewClientset(&ing)
	svc := k8ssvc.NewService(client, "")

	hosts, err := svc.List(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	sort.Strings(hosts)
	want := []string{"a.example.com", "b.example.com", "c.example.com"}
	for i, h := range want {
		if hosts[i] != h {
			t.Errorf("hosts[%d] = %q, want %q", i, hosts[i], h)
		}
	}
}
