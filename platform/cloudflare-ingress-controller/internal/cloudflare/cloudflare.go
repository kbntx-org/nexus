package cloudflare

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// IngressRule represents a single tunnel ingress routing rule.
type IngressRule struct {
	Hostname string `json:"hostname,omitempty"`
	Service  string `json:"service"`
}

const catchAllRule = "http_status:404"

type cloudflareError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

type getConfigResponse struct {
	Success bool               `json:"success"`
	Errors  []cloudflareError  `json:"errors"`
	Result  struct {
		Config struct {
			Ingress []IngressRule `json:"ingress"`
		} `json:"config"`
	} `json:"result"`
}

type putConfigRequest struct {
	Config struct {
		Ingress []IngressRule `json:"ingress"`
	} `json:"config"`
}

type putConfigResponse struct {
	Success bool              `json:"success"`
	Errors  []cloudflareError `json:"errors"`
}

// Service manages Cloudflare Tunnel ingress configuration.
type Service interface {
	GetConfig(ctx context.Context) ([]IngressRule, error)
	PutConfig(ctx context.Context, rules []IngressRule) error
}

type service struct {
	accountID  string
	tunnelID   string
	apiToken   string
	httpClient *http.Client
	baseURL    string
}

// NewService constructs a Service backed by the Cloudflare API.
func NewService(accountID, tunnelID, apiToken string) Service {
	return NewServiceWithBaseURL(accountID, tunnelID, apiToken,
		fmt.Sprintf("https://api.cloudflare.com/client/v4/accounts/%s/cfd_tunnel/%s/configurations", accountID, tunnelID),
	)
}

// NewServiceWithBaseURL constructs a Service with a custom base URL. Intended for testing.
func NewServiceWithBaseURL(accountID, tunnelID, apiToken, baseURL string) Service {
	return &service{
		accountID:  accountID,
		tunnelID:   tunnelID,
		apiToken:   apiToken,
		httpClient: &http.Client{},
		baseURL:    baseURL,
	}
}

// GetConfig returns the current tunnel ingress rules, excluding the catch-all.
func (s *service) GetConfig(ctx context.Context) ([]IngressRule, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, s.baseURL, nil)
	if err != nil {
		return nil, err
	}
	s.setHeaders(req)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result getConfigResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decode response: %w", err)
	}
	if !result.Success {
		return nil, fmt.Errorf("cloudflare getConfig failed: %v", result.Errors)
	}

	var rules []IngressRule
	for _, rule := range result.Result.Config.Ingress {
		if rule.Hostname != "" {
			rules = append(rules, rule)
		}
	}
	return rules, nil
}

// PutConfig replaces the tunnel ingress rules. A catch-all 404 rule is always appended.
func (s *service) PutConfig(ctx context.Context, rules []IngressRule) error {
	var payload putConfigRequest
	payload.Config.Ingress = append(rules, IngressRule{Service: catchAllRule})

	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPut, s.baseURL, bytes.NewReader(body))
	if err != nil {
		return err
	}
	s.setHeaders(req)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var result putConfigResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return fmt.Errorf("decode response: %w", err)
	}
	if !result.Success {
		return fmt.Errorf("cloudflare putConfig failed: %v", result.Errors)
	}
	return nil
}

func (s *service) setHeaders(req *http.Request) {
	req.Header.Set("Authorization", "Bearer "+s.apiToken)
	req.Header.Set("Content-Type", "application/json")
}
