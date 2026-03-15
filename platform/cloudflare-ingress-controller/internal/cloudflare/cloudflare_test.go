package cloudflare_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/kbntx-org/nexus/platform/cloudflare-ingress-controller/internal/cloudflare"
)

func newTestService(t *testing.T, handler http.Handler) (cloudflare.Service, *httptest.Server) {
	t.Helper()
	srv := httptest.NewServer(handler)
	t.Cleanup(srv.Close)

	// Use unexported field injection via a test-only constructor would require
	// exporting baseURL. Instead we use a wrapper that overrides the base URL.
	svc := cloudflare.NewServiceWithBaseURL("account-id", "tunnel-id", "test-token", srv.URL)
	return svc, srv
}

func TestGetConfig_filtersHostnames(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "Bearer test-token" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
			"errors":  []any{},
			"result": map[string]any{
				"config": map[string]any{
					"ingress": []any{
						map[string]any{"hostname": "app.example.com", "service": "http://traefik"},
						map[string]any{"hostname": "api.example.com", "service": "http://traefik"},
						map[string]any{"service": "http_status:404"}, // catch-all — no hostname
					},
				},
			},
		})
	})

	svc, _ := newTestService(t, handler)
	rules, err := svc.GetConfig(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(rules) != 2 {
		t.Fatalf("expected 2 rules (catch-all excluded), got %d", len(rules))
	}
}

func TestGetConfig_apiError(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"errors":  []any{map[string]any{"code": 1003, "message": "Invalid token"}},
			"result":  nil,
		})
	})

	svc, _ := newTestService(t, handler)
	_, err := svc.GetConfig(context.Background())
	if err == nil {
		t.Fatal("expected error for failed API response, got nil")
	}
}

func TestPutConfig_appendsCatchAll(t *testing.T) {
	var captured map[string]any

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPut {
			http.Error(w, "expected PUT", http.StatusMethodNotAllowed)
			return
		}
		json.NewDecoder(r.Body).Decode(&captured)
		json.NewEncoder(w).Encode(map[string]any{"success": true, "errors": []any{}})
	})

	svc, _ := newTestService(t, handler)
	rules := []cloudflare.IngressRule{
		{Hostname: "app.example.com", Service: "http://traefik"},
	}
	if err := svc.PutConfig(context.Background(), rules); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	config, _ := captured["config"].(map[string]any)
	ingress, _ := config["ingress"].([]any)
	if len(ingress) != 2 {
		t.Fatalf("expected 2 rules (1 real + catch-all), got %d", len(ingress))
	}
	last := ingress[len(ingress)-1].(map[string]any)
	if last["service"] != "http_status:404" {
		t.Errorf("last rule should be catch-all, got %v", last)
	}
}

func TestPutConfig_apiError(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"errors":  []any{map[string]any{"code": 1003, "message": "Invalid token"}},
		})
	})

	svc, _ := newTestService(t, handler)
	err := svc.PutConfig(context.Background(), nil)
	if err == nil {
		t.Fatal("expected error for failed API response, got nil")
	}
}
