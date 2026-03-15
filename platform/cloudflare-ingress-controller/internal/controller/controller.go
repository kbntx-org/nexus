package controller

import (
	"context"
	"fmt"
	"log/slog"
	"sort"

	"github.com/kbntx-org/nexus/platform/cloudflare-ingress-controller/internal/cloudflare"
	"github.com/kbntx-org/nexus/platform/cloudflare-ingress-controller/internal/k8s"
)

// Reconcile computes the diff between desired Kubernetes Ingress hostnames and
// the current Cloudflare Tunnel configuration, then applies any changes.
func Reconcile(ctx context.Context, k8sSvc k8s.Service, cloudflareService cloudflare.Service, targetServiceURL string) error {
	hostnames, err := k8sSvc.List(ctx)
	if err != nil {
		return fmt.Errorf("list ingresses: %w", err)
	}

	currentRules, err := cloudflareService.GetConfig(ctx)
	if err != nil {
		return fmt.Errorf("get cloudflare config: %w", err)
	}

	desired := toSet(hostnames)
	current := make(map[string]bool, len(currentRules))
	for _, rule := range currentRules {
		current[rule.Hostname] = true
	}

	var added, removed []string
	for hostname := range desired {
		if !current[hostname] {
			added = append(added, hostname)
		}
	}
	for hostname := range current {
		if !desired[hostname] {
			removed = append(removed, hostname)
		}
	}

	if len(added) == 0 && len(removed) == 0 {
		slog.Info("tunnel config is up to date, nothing to do")
		return nil
	}

	if len(added) > 0 {
		slog.Info("adding hostnames", "hostnames", added)
	}
	if len(removed) > 0 {
		slog.Info("removing hostnames", "hostnames", removed)
	}

	rules := make([]cloudflare.IngressRule, 0, len(desired))
	for hostname := range desired {
		rules = append(rules, cloudflare.IngressRule{Hostname: hostname, Service: targetServiceURL})
	}
	sort.Slice(rules, func(i, j int) bool { return rules[i].Hostname < rules[j].Hostname })

	if err := cloudflareService.PutConfig(ctx, rules); err != nil {
		return fmt.Errorf("put cloudflare config: %w", err)
	}

	slog.Info("tunnel config updated", "rules", len(rules))
	return nil
}

func toSet(items []string) map[string]bool {
	set := make(map[string]bool, len(items))
	for _, item := range items {
		set[item] = true
	}
	return set
}
