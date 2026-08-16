package cloudflare

import (
	"context"
	"fmt"

	cloudflaresdk "github.com/cloudflare/cloudflare-go/v7"
	"github.com/cloudflare/cloudflare-go/v7/option"
	"github.com/cloudflare/cloudflare-go/v7/shared"
	"github.com/cloudflare/cloudflare-go/v7/zero_trust"
)

type Client struct {
	sdk       *cloudflaresdk.Client
	accountID string
}

func NewClient(apiToken, accountID string) *Client {
	return &Client{
		sdk:       cloudflaresdk.NewClient(option.WithAPIToken(apiToken)),
		accountID: accountID,
	}
}

type Rule struct {
	Everyone    bool
	Email       string
	EmailDomain string
	IPRange     string
}

type PolicyPayload struct {
	Name     string
	Decision string
	Include  []Rule
	Exclude  []Rule
	Require  []Rule
}

type ApplicationPayload struct {
	Name            string
	Domain          string
	Type            string
	SessionDuration string
	Policies        []string
}

func toAccessRules(rules []Rule) []zero_trust.AccessRuleUnionParam {
	converted := make([]zero_trust.AccessRuleUnionParam, len(rules))
	for i, rule := range rules {
		converted[i] = toAccessRule(rule)
	}
	return converted
}

func toAccessRule(rule Rule) zero_trust.AccessRuleUnionParam {
	switch {
	case rule.Everyone:
		return zero_trust.EveryoneRuleParam{Everyone: cloudflaresdk.F(zero_trust.EveryoneRuleEveryoneParam{})}
	case rule.Email != "":
		return zero_trust.EmailRuleParam{Email: cloudflaresdk.F(zero_trust.EmailRuleEmailParam{Email: cloudflaresdk.F(rule.Email)})}
	case rule.EmailDomain != "":
		return zero_trust.DomainRuleParam{EmailDomain: cloudflaresdk.F(zero_trust.DomainRuleEmailDomainParam{Domain: cloudflaresdk.F(rule.EmailDomain)})}
	default:
		return zero_trust.IPRuleParam{IP: cloudflaresdk.F(zero_trust.IPRuleIPParam{IP: cloudflaresdk.F(rule.IPRange)})}
	}
}

func (c *Client) CreatePolicy(ctx context.Context, payload PolicyPayload) (string, error) {
	result, err := c.sdk.ZeroTrust.Access.Policies.New(ctx, zero_trust.AccessPolicyNewParams{
		AccountID: cloudflaresdk.F(c.accountID),
		Decision:  cloudflaresdk.F(zero_trust.Decision(payload.Decision)),
		Include:   cloudflaresdk.F(toAccessRules(payload.Include)),
		Name:      cloudflaresdk.F(payload.Name),
		Exclude:   cloudflaresdk.F(toAccessRules(payload.Exclude)),
		Require:   cloudflaresdk.F(toAccessRules(payload.Require)),
	})
	if err != nil {
		return "", fmt.Errorf("create access policy: %w", err)
	}
	return result.ID, nil
}

func (c *Client) UpdatePolicy(ctx context.Context, id string, payload PolicyPayload) error {
	_, err := c.sdk.ZeroTrust.Access.Policies.Update(ctx, id, zero_trust.AccessPolicyUpdateParams{
		AccountID: cloudflaresdk.F(c.accountID),
		Decision:  cloudflaresdk.F(zero_trust.Decision(payload.Decision)),
		Include:   cloudflaresdk.F(toAccessRules(payload.Include)),
		Name:      cloudflaresdk.F(payload.Name),
		Exclude:   cloudflaresdk.F(toAccessRules(payload.Exclude)),
		Require:   cloudflaresdk.F(toAccessRules(payload.Require)),
	})
	if err != nil {
		return fmt.Errorf("update access policy %q: %w", id, err)
	}
	return nil
}

func (c *Client) DeletePolicy(ctx context.Context, id string) error {
	_, err := c.sdk.ZeroTrust.Access.Policies.Delete(ctx, id, zero_trust.AccessPolicyDeleteParams{
		AccountID: cloudflaresdk.F(c.accountID),
	})
	if err != nil {
		return fmt.Errorf("delete access policy %q: %w", id, err)
	}
	return nil
}

func toApplicationPolicies(policyIDs []string) []zero_trust.AccessApplicationNewParamsBodySelfHostedApplicationPolicyUnion {
	policies := make([]zero_trust.AccessApplicationNewParamsBodySelfHostedApplicationPolicyUnion, len(policyIDs))
	for i, id := range policyIDs {
		policies[i] = shared.UnionString(id)
	}
	return policies
}

func (c *Client) CreateApplication(ctx context.Context, payload ApplicationPayload) (string, error) {
	result, err := c.sdk.ZeroTrust.Access.Applications.New(ctx, zero_trust.AccessApplicationNewParams{
		AccountID: cloudflaresdk.F(c.accountID),
		Body: zero_trust.AccessApplicationNewParamsBodySelfHostedApplication{
			Domain:          cloudflaresdk.F(payload.Domain),
			Type:            cloudflaresdk.F(zero_trust.ApplicationType(payload.Type)),
			Name:            cloudflaresdk.F(payload.Name),
			SessionDuration: cloudflaresdk.F(payload.SessionDuration),
			Policies:        cloudflaresdk.F(toApplicationPolicies(payload.Policies)),
		},
	})
	if err != nil {
		return "", fmt.Errorf("create access application: %w", err)
	}
	return result.ID, nil
}

func (c *Client) UpdateApplication(ctx context.Context, id string, payload ApplicationPayload) error {
	policies := make([]zero_trust.AccessApplicationUpdateParamsBodySelfHostedApplicationPolicyUnion, len(payload.Policies))
	for i, policyID := range payload.Policies {
		policies[i] = shared.UnionString(policyID)
	}
	_, err := c.sdk.ZeroTrust.Access.Applications.Update(ctx, id, zero_trust.AccessApplicationUpdateParams{
		AccountID: cloudflaresdk.F(c.accountID),
		Body: zero_trust.AccessApplicationUpdateParamsBodySelfHostedApplication{
			Domain:          cloudflaresdk.F(payload.Domain),
			Type:            cloudflaresdk.F(zero_trust.ApplicationType(payload.Type)),
			Name:            cloudflaresdk.F(payload.Name),
			SessionDuration: cloudflaresdk.F(payload.SessionDuration),
			Policies:        cloudflaresdk.F(policies),
		},
	})
	if err != nil {
		return fmt.Errorf("update access application %q: %w", id, err)
	}
	return nil
}

func (c *Client) DeleteApplication(ctx context.Context, id string) error {
	_, err := c.sdk.ZeroTrust.Access.Applications.Delete(ctx, id, zero_trust.AccessApplicationDeleteParams{
		AccountID: cloudflaresdk.F(c.accountID),
	})
	if err != nil {
		return fmt.Errorf("delete access application %q: %w", id, err)
	}
	return nil
}

type Route struct {
	ID      string
	Network string
}

func (c *Client) CreateTunnel(ctx context.Context, name string) (string, error) {
	result, err := c.sdk.ZeroTrust.Tunnels.Cloudflared.New(ctx, zero_trust.TunnelCloudflaredNewParams{
		AccountID: cloudflaresdk.F(c.accountID),
		Name:      cloudflaresdk.F(name),
		ConfigSrc: cloudflaresdk.F(zero_trust.TunnelCloudflaredNewParamsConfigSrcCloudflare),
	})
	if err != nil {
		return "", fmt.Errorf("create tunnel: %w", err)
	}
	return result.ID, nil
}

func (c *Client) DeleteTunnel(ctx context.Context, id string) error {
	_, err := c.sdk.ZeroTrust.Tunnels.Cloudflared.Delete(ctx, id, zero_trust.TunnelCloudflaredDeleteParams{
		AccountID: cloudflaresdk.F(c.accountID),
	})
	if err != nil {
		return fmt.Errorf("delete tunnel %q: %w", id, err)
	}
	return nil
}

// TunnelToken is safe to call on every reconcile without caching: Cloudflare derives it
// deterministically from the tunnel's stored secret, so it's stable across calls.
func (c *Client) TunnelToken(ctx context.Context, id string) (string, error) {
	token, err := c.sdk.ZeroTrust.Tunnels.Cloudflared.Token.Get(ctx, id, zero_trust.TunnelCloudflaredTokenGetParams{
		AccountID: cloudflaresdk.F(c.accountID),
	})
	if err != nil {
		return "", fmt.Errorf("fetch tunnel token %q: %w", id, err)
	}
	return *token, nil
}

func (c *Client) ListRoutes(ctx context.Context, tunnelID string) ([]Route, error) {
	var routes []Route
	iter := c.sdk.ZeroTrust.Networks.Routes.ListAutoPaging(ctx, zero_trust.NetworkRouteListParams{
		AccountID: cloudflaresdk.F(c.accountID),
		TunnelID:  cloudflaresdk.F(tunnelID),
	})
	for iter.Next() {
		route := iter.Current()
		routes = append(routes, Route{ID: route.ID, Network: route.Network})
	}
	if err := iter.Err(); err != nil {
		return nil, fmt.Errorf("list routes for tunnel %q: %w", tunnelID, err)
	}
	return routes, nil
}

func (c *Client) CreateRoute(ctx context.Context, tunnelID, network string) error {
	_, err := c.sdk.ZeroTrust.Networks.Routes.New(ctx, zero_trust.NetworkRouteNewParams{
		AccountID: cloudflaresdk.F(c.accountID),
		Network:   cloudflaresdk.F(network),
		TunnelID:  cloudflaresdk.F(tunnelID),
	})
	if err != nil {
		return fmt.Errorf("create route %q: %w", network, err)
	}
	return nil
}

func (c *Client) DeleteRoute(ctx context.Context, routeID string) error {
	_, err := c.sdk.ZeroTrust.Networks.Routes.Delete(ctx, routeID, zero_trust.NetworkRouteDeleteParams{
		AccountID: cloudflaresdk.F(c.accountID),
	})
	if err != nil {
		return fmt.Errorf("delete route %q: %w", routeID, err)
	}
	return nil
}

type IngressRule struct {
	Hostname      string
	Service       string
	OriginRequest *OriginRequest
}

type OriginRequest struct {
	MatchSNIToHost bool
}

func (c *Client) PutTunnelConfiguration(ctx context.Context, tunnelID string, rules []IngressRule) error {
	ingress := make([]zero_trust.TunnelCloudflaredConfigurationUpdateParamsConfigIngress, len(rules))
	for i, rule := range rules {
		entry := zero_trust.TunnelCloudflaredConfigurationUpdateParamsConfigIngress{
			Service: cloudflaresdk.F(rule.Service),
		}
		if rule.Hostname != "" {
			entry.Hostname = cloudflaresdk.F(rule.Hostname)
		}
		if rule.OriginRequest != nil {
			entry.OriginRequest = cloudflaresdk.F(zero_trust.TunnelCloudflaredConfigurationUpdateParamsConfigIngressOriginRequest{
				MatchSnItoHost: cloudflaresdk.F(rule.OriginRequest.MatchSNIToHost),
			})
		}
		ingress[i] = entry
	}

	_, err := c.sdk.ZeroTrust.Tunnels.Cloudflared.Configurations.Update(ctx, tunnelID, zero_trust.TunnelCloudflaredConfigurationUpdateParams{
		AccountID: cloudflaresdk.F(c.accountID),
		Config: cloudflaresdk.F(zero_trust.TunnelCloudflaredConfigurationUpdateParamsConfig{
			Ingress: cloudflaresdk.F(ingress),
		}),
	})
	if err != nil {
		return fmt.Errorf("update tunnel configuration %q: %w", tunnelID, err)
	}
	return nil
}
