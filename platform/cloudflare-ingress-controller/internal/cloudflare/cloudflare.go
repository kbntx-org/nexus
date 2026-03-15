package cloudflare

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"

	cloudflareSDK "github.com/cloudflare/cloudflare-go/v6"
	"github.com/cloudflare/cloudflare-go/v6/option"
	"github.com/cloudflare/cloudflare-go/v6/zero_trust"
	"github.com/cloudflare/cloudflare-go/v6/zones"
)

// IngressRule represents a single tunnel routing rule.
type IngressRule struct {
	Hostname string
	Service  string
}

// TunnelSummary carries identifying information about an existing Cloudflare Tunnel.
type TunnelSummary struct {
	ID   string
	Name string
}

// TunnelInfo carries the details returned when a new tunnel is created.
type TunnelInfo struct {
	ID    string
	Token string // value for the TUNNEL_TOKEN environment variable
}

const catchAllRule = "http_status:404"

const tunnelSecretByteLength = 32

// Service manages Cloudflare Tunnel lifecycle and ingress configuration.
type Service interface {
	LookupZoneName(ctx context.Context, zoneID string) (string, error)
	ListTunnels(ctx context.Context) ([]TunnelSummary, error)
	CreateTunnel(ctx context.Context, name string) (TunnelInfo, error)
	DeleteTunnel(ctx context.Context, tunnelID string) error
	GetConfig(ctx context.Context, tunnelID string) ([]IngressRule, error)
	PutConfig(ctx context.Context, tunnelID string, rules []IngressRule) error
}

type service struct {
	accountID string
	client    *cloudflareSDK.Client
}

// NewService constructs a Service backed by the Cloudflare API.
func NewService(accountID, apiToken string) Service {
	return newService(accountID, apiToken)
}

// NewServiceWithBaseURL constructs a Service with a custom base URL. Intended for testing.
// Retries are disabled so test servers don't receive unexpected retry requests.
func NewServiceWithBaseURL(accountID, apiToken, baseURL string) Service {
	return newService(accountID, apiToken, option.WithBaseURL(baseURL), option.WithMaxRetries(0))
}

func newService(accountID, apiToken string, extraOpts ...option.RequestOption) *service {
	opts := append([]option.RequestOption{option.WithAPIToken(apiToken)}, extraOpts...)
	return &service{
		accountID: accountID,
		client:    cloudflareSDK.NewClient(opts...),
	}
}

// LookupZoneName returns the domain name for the given Cloudflare Zone ID.
func (s *service) LookupZoneName(ctx context.Context, zoneID string) (string, error) {
	zone, err := s.client.Zones.Get(ctx, zones.ZoneGetParams{
		ZoneID: cloudflareSDK.F(zoneID),
	})
	if err != nil {
		return "", fmt.Errorf("lookup zone %q: %w", zoneID, err)
	}
	return zone.Name, nil
}

// ListTunnels returns all non-deleted tunnels in the account.
func (s *service) ListTunnels(ctx context.Context) ([]TunnelSummary, error) {
	pager := s.client.ZeroTrust.Tunnels.Cloudflared.ListAutoPaging(ctx, zero_trust.TunnelCloudflaredListParams{
		AccountID: cloudflareSDK.F(s.accountID),
		IsDeleted: cloudflareSDK.F(false),
	})

	var summaries []TunnelSummary
	for pager.Next() {
		tunnel := pager.Current()
		summaries = append(summaries, TunnelSummary{
			ID:   tunnel.ID,
			Name: tunnel.Name,
		})
	}
	if err := pager.Err(); err != nil {
		return nil, fmt.Errorf("list tunnels: %w", err)
	}
	return summaries, nil
}

// CreateTunnel creates a remotely-managed Cloudflare Tunnel and returns its ID and token.
func (s *service) CreateTunnel(ctx context.Context, name string) (TunnelInfo, error) {
	secretBytes := make([]byte, tunnelSecretByteLength)
	if _, err := rand.Read(secretBytes); err != nil {
		return TunnelInfo{}, fmt.Errorf("generate tunnel secret: %w", err)
	}

	tunnel, err := s.client.ZeroTrust.Tunnels.Cloudflared.New(ctx, zero_trust.TunnelCloudflaredNewParams{
		AccountID:    cloudflareSDK.F(s.accountID),
		Name:         cloudflareSDK.F(name),
		ConfigSrc:    cloudflareSDK.F(zero_trust.TunnelCloudflaredNewParamsConfigSrcCloudflare),
		TunnelSecret: cloudflareSDK.F(base64.StdEncoding.EncodeToString(secretBytes)),
	})
	if err != nil {
		return TunnelInfo{}, fmt.Errorf("create tunnel %q: %w", name, err)
	}

	token, err := s.client.ZeroTrust.Tunnels.Cloudflared.Token.Get(ctx, tunnel.ID, zero_trust.TunnelCloudflaredTokenGetParams{
		AccountID: cloudflareSDK.F(s.accountID),
	})
	if err != nil {
		return TunnelInfo{}, fmt.Errorf("get token for tunnel %q: %w", name, err)
	}

	return TunnelInfo{ID: tunnel.ID, Token: *token}, nil
}

// DeleteTunnel deletes the Cloudflare Tunnel with the given ID.
func (s *service) DeleteTunnel(ctx context.Context, tunnelID string) error {
	if _, err := s.client.ZeroTrust.Tunnels.Cloudflared.Delete(ctx, tunnelID, zero_trust.TunnelCloudflaredDeleteParams{
		AccountID: cloudflareSDK.F(s.accountID),
	}); err != nil {
		return fmt.Errorf("delete tunnel %q: %w", tunnelID, err)
	}
	return nil
}

// GetConfig returns the current ingress rules for the given tunnel, excluding the catch-all.
func (s *service) GetConfig(ctx context.Context, tunnelID string) ([]IngressRule, error) {
	response, err := s.client.ZeroTrust.Tunnels.Cloudflared.Configurations.Get(ctx, tunnelID, zero_trust.TunnelCloudflaredConfigurationGetParams{
		AccountID: cloudflareSDK.F(s.accountID),
	})
	if err != nil {
		return nil, fmt.Errorf("get tunnel config %q: %w", tunnelID, err)
	}

	var rules []IngressRule
	for _, ingressRule := range response.Config.Ingress {
		if ingressRule.Hostname != "" {
			rules = append(rules, IngressRule{
				Hostname: ingressRule.Hostname,
				Service:  ingressRule.Service,
			})
		}
	}
	return rules, nil
}

// PutConfig replaces the ingress rules for the given tunnel. A catch-all 404 rule is always appended.
func (s *service) PutConfig(ctx context.Context, tunnelID string, rules []IngressRule) error {
	ingressParams := make([]zero_trust.TunnelCloudflaredConfigurationUpdateParamsConfigIngress, 0, len(rules)+1)
	for _, rule := range rules {
		ingressParams = append(ingressParams, zero_trust.TunnelCloudflaredConfigurationUpdateParamsConfigIngress{
			Hostname: cloudflareSDK.F(rule.Hostname),
			Service:  cloudflareSDK.F(rule.Service),
		})
	}
	ingressParams = append(ingressParams, zero_trust.TunnelCloudflaredConfigurationUpdateParamsConfigIngress{
		Service: cloudflareSDK.F(catchAllRule),
	})

	if _, err := s.client.ZeroTrust.Tunnels.Cloudflared.Configurations.Update(ctx, tunnelID, zero_trust.TunnelCloudflaredConfigurationUpdateParams{
		AccountID: cloudflareSDK.F(s.accountID),
		Config: cloudflareSDK.F(zero_trust.TunnelCloudflaredConfigurationUpdateParamsConfig{
			Ingress: cloudflareSDK.F(ingressParams),
		}),
	}); err != nil {
		return fmt.Errorf("put tunnel config %q: %w", tunnelID, err)
	}
	return nil
}
