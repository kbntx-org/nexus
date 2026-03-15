package cloudflare_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/kbntx-org/nexus/platform/cloudflare-ingress-controller/internal/cloudflare"
)

const testAccountID = "test-account-id"
const testTunnelID = "test-tunnel-id"
const testAPIToken = "test-token"

// jsonResponse writes a JSON body with the correct Content-Type header.
func jsonResponse(w http.ResponseWriter, body any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(body)
}

// cfEnvelope wraps a Cloudflare API result in the standard response envelope.
func cfEnvelope(result any) map[string]any {
	return map[string]any{
		"success":  true,
		"errors":   []any{},
		"messages": []any{},
		"result":   result,
	}
}

// cfListEnvelope wraps a list result with pagination metadata indicating no further pages.
func cfListEnvelope(result any) map[string]any {
	return map[string]any{
		"success":  true,
		"errors":   []any{},
		"messages": []any{},
		"result":   result,
		"result_info": map[string]any{
			"page": 1, "per_page": 20, "count": 0, "total_count": 0,
		},
	}
}

func newTestService(t *testing.T, handler http.Handler) cloudflare.Service {
	t.Helper()
	srv := httptest.NewServer(handler)
	t.Cleanup(srv.Close)
	return cloudflare.NewServiceWithBaseURL(testAccountID, testAPIToken, srv.URL)
}

func TestLookupZoneName_success(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/zones/"+testTunnelID, func(w http.ResponseWriter, r *http.Request) {
		jsonResponse(w, cfEnvelope(map[string]any{
			"id":   testTunnelID,
			"name": "example.com",
		}))
	})

	svc := newTestService(t, mux)
	name, err := svc.LookupZoneName(context.Background(), testTunnelID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if name != "example.com" {
		t.Errorf("expected example.com, got %q", name)
	}
}

func TestLookupZoneName_apiError(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/zones/"+testTunnelID, func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]any{"errors": []any{}})
	})

	svc := newTestService(t, mux)
	_, err := svc.LookupZoneName(context.Background(), testTunnelID)
	if err == nil {
		t.Fatal("expected error for failed API response, got nil")
	}
}

func TestListTunnels_success(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Get("page") == "2" {
			jsonResponse(w, cfListEnvelope([]any{}))
			return
		}
		jsonResponse(w, cfListEnvelope([]any{
			map[string]any{"id": "id-1", "name": "k8s-foo"},
			map[string]any{"id": "id-2", "name": "k8s-bar"},
		}))
	})

	svc := newTestService(t, handler)
	tunnels, err := svc.ListTunnels(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(tunnels) != 2 {
		t.Fatalf("expected 2 tunnels, got %d", len(tunnels))
	}
	if tunnels[0].ID != "id-1" || tunnels[0].Name != "k8s-foo" {
		t.Errorf("unexpected first tunnel: %+v", tunnels[0])
	}
}

func TestListTunnels_apiError(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]any{"errors": []any{map[string]any{"code": 1003, "message": "Invalid token"}}})
	})

	svc := newTestService(t, handler)
	_, err := svc.ListTunnels(context.Background())
	if err == nil {
		t.Fatal("expected error for failed API response, got nil")
	}
}

func TestCreateTunnel_success(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/accounts/"+testAccountID+"/cfd_tunnel", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		jsonResponse(w, cfEnvelope(map[string]any{
			"id":   testTunnelID,
			"name": "k8s-foo",
		}))
	})
	mux.HandleFunc("/accounts/"+testAccountID+"/cfd_tunnel/"+testTunnelID+"/token", func(w http.ResponseWriter, r *http.Request) {
		jsonResponse(w, cfEnvelope("my-tunnel-token"))
	})

	svc := newTestService(t, mux)
	info, err := svc.CreateTunnel(context.Background(), "k8s-foo")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if info.ID != testTunnelID {
		t.Errorf("expected tunnel ID %q, got %q", testTunnelID, info.ID)
	}
	if info.Token != "my-tunnel-token" {
		t.Errorf("expected token %q, got %q", "my-tunnel-token", info.Token)
	}
}

func TestCreateTunnel_apiError(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/accounts/"+testAccountID+"/cfd_tunnel", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]any{"errors": []any{}})
	})

	svc := newTestService(t, mux)
	_, err := svc.CreateTunnel(context.Background(), "k8s-foo")
	if err == nil {
		t.Fatal("expected error for failed API response, got nil")
	}
}

func TestDeleteTunnel_success(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/accounts/"+testAccountID+"/cfd_tunnel/"+testTunnelID, func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodDelete {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		jsonResponse(w, cfEnvelope(map[string]any{"id": testTunnelID}))
	})

	svc := newTestService(t, mux)
	if err := svc.DeleteTunnel(context.Background(), testTunnelID); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestDeleteTunnel_apiError(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/accounts/"+testAccountID+"/cfd_tunnel/"+testTunnelID, func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]any{"errors": []any{}})
	})

	svc := newTestService(t, mux)
	err := svc.DeleteTunnel(context.Background(), testTunnelID)
	if err == nil {
		t.Fatal("expected error for failed API response, got nil")
	}
}

func TestGetConfig_filtersHostnames(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/accounts/"+testAccountID+"/cfd_tunnel/"+testTunnelID+"/configurations", func(w http.ResponseWriter, r *http.Request) {
		jsonResponse(w, cfEnvelope(map[string]any{
			"account_id": testAccountID,
			"tunnel_id":  testTunnelID,
			"config": map[string]any{
				"ingress": []any{
					map[string]any{"hostname": "app.example.com", "service": "http://traefik"},
					map[string]any{"hostname": "api.example.com", "service": "http://traefik"},
					map[string]any{"hostname": "", "service": "http_status:404"},
				},
			},
		}))
	})

	svc := newTestService(t, mux)
	rules, err := svc.GetConfig(context.Background(), testTunnelID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(rules) != 2 {
		t.Fatalf("expected 2 rules (catch-all excluded), got %d", len(rules))
	}
}

func TestGetConfig_apiError(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/accounts/"+testAccountID+"/cfd_tunnel/"+testTunnelID+"/configurations", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]any{"errors": []any{}})
	})

	svc := newTestService(t, mux)
	_, err := svc.GetConfig(context.Background(), testTunnelID)
	if err == nil {
		t.Fatal("expected error for failed API response, got nil")
	}
}

func TestPutConfig_appendsCatchAll(t *testing.T) {
	var capturedBody map[string]any

	mux := http.NewServeMux()
	mux.HandleFunc("/accounts/"+testAccountID+"/cfd_tunnel/"+testTunnelID+"/configurations", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPut {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		json.NewDecoder(r.Body).Decode(&capturedBody)
		jsonResponse(w, cfEnvelope(map[string]any{}))
	})

	svc := newTestService(t, mux)
	rules := []cloudflare.IngressRule{
		{Hostname: "app.example.com", Service: "http://traefik"},
	}
	if err := svc.PutConfig(context.Background(), testTunnelID, rules); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	config, _ := capturedBody["config"].(map[string]any)
	ingress, _ := config["ingress"].([]any)
	if len(ingress) != 2 {
		t.Fatalf("expected 2 rules (1 real + catch-all), got %d", len(ingress))
	}
	last, _ := ingress[len(ingress)-1].(map[string]any)
	if last["service"] != "http_status:404" {
		t.Errorf("last rule should be catch-all, got %v", last)
	}
}

func TestPutConfig_apiError(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/accounts/"+testAccountID+"/cfd_tunnel/"+testTunnelID+"/configurations", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]any{"errors": []any{}})
	})

	svc := newTestService(t, mux)
	err := svc.PutConfig(context.Background(), testTunnelID, nil)
	if err == nil {
		t.Fatal("expected error for failed API response, got nil")
	}
}

// TestAuthorizationHeader ensures the Bearer token is forwarded correctly.
func TestAuthorizationHeader(t *testing.T) {
	var receivedAuth string
	mux := http.NewServeMux()
	mux.HandleFunc("/accounts/"+testAccountID+"/cfd_tunnel/"+testTunnelID+"/configurations", func(w http.ResponseWriter, r *http.Request) {
		receivedAuth = r.Header.Get("Authorization")
		jsonResponse(w, cfEnvelope(map[string]any{
			"config": map[string]any{"ingress": []any{}},
		}))
	})

	svc := newTestService(t, mux)
	svc.GetConfig(context.Background(), testTunnelID) //nolint:errcheck

	if !strings.HasPrefix(receivedAuth, "Bearer ") {
		t.Errorf("expected Authorization: Bearer ..., got %q", receivedAuth)
	}
}
