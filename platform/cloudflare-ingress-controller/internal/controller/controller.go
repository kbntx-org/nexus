package controller

import (
	"context"
	"fmt"
	"log/slog"
	"sort"
	"strings"

	"github.com/kbntx-org/nexus/platform/cloudflare-ingress-controller/internal/cloudflare"
	"github.com/kbntx-org/nexus/platform/cloudflare-ingress-controller/internal/k8s"
)

const secretKeyTunnelID = "tunnelID"
const secretKeyTunnelToken = "tunnelToken"

// ReconcileConfig holds the static configuration for the reconciliation loop.
type ReconcileConfig struct {
	TargetServiceURL    string
	TunnelNamePrefix    string // e.g. "k8s" → Cloudflare tunnel name = "k8s-{annotation value}"
	ControllerNamespace string // namespace where cloudflared Secrets, Deployments, and PDBs are created
	CloudflaredImage    string
	CloudflaredReplicas int32
	ZoneDomain          string // e.g. "example.com"; only hostnames in this zone are processed; empty = no filter
}

// Reconcile performs a full reconciliation of Cloudflare Tunnels against the
// current set of Kubernetes Ingress resources.
func Reconcile(
	ctx context.Context,
	kubernetesService k8s.Service,
	cloudflareService cloudflare.Service,
	config ReconcileConfig,
) error {
	entries, err := kubernetesService.List(ctx)
	if err != nil {
		return fmt.Errorf("list ingresses: %w", err)
	}

	if config.ZoneDomain != "" {
		var inZone []k8s.IngressEntry
		for _, entry := range entries {
			if HostnameInZone(entry.Hostname, config.ZoneDomain) {
				inZone = append(inZone, entry)
			} else {
				slog.Warn("hostname not in zone, skipping",
					"hostname", entry.Hostname, "zone", config.ZoneDomain)
			}
		}
		entries = inZone
	}

	groups := GroupByTunnel(entries)
	cleanGroups, conflicts := DetectCollisions(groups)
	for hostname, tunnels := range conflicts {
		slog.Error("hostname claimed by multiple tunnels — skipping",
			"hostname", hostname, "tunnels", tunnels)
	}

	existingTunnels, err := cloudflareService.ListTunnels(ctx)
	if err != nil {
		return fmt.Errorf("list cloudflare tunnels: %w", err)
	}

	// Build lookup of existing prefixed tunnels by short name.
	existingByName := map[string]cloudflare.TunnelSummary{}
	for _, tunnel := range existingTunnels {
		if shortName, ok := StripPrefix(config.TunnelNamePrefix, tunnel.Name); ok {
			existingByName[shortName] = tunnel
		}
	}

	// Orphan cleanup: delete any prefixed tunnel not referenced by current Ingresses.
	for shortName, tunnel := range existingByName {
		if _, active := cleanGroups[shortName]; !active {
			slog.Info("deleting orphan tunnel", "tunnel", tunnel.Name)
			if err := deleteTunnelResources(ctx, kubernetesService, cloudflareService, config, shortName, tunnel.ID); err != nil {
				slog.Error("failed to delete orphan tunnel", "tunnel", tunnel.Name, "error", err)
			}
		}
	}

	// Reconcile each active tunnel.
	for shortName, hostnames := range cleanGroups {
		if err := reconcileTunnel(ctx, kubernetesService, cloudflareService, config, shortName, hostnames, existingByName); err != nil {
			slog.Error("failed to reconcile tunnel", "tunnel", shortName, "error", err)
		}
	}

	return nil
}

func reconcileTunnel(
	ctx context.Context,
	kubernetesService k8s.Service,
	cloudflareService cloudflare.Service,
	config ReconcileConfig,
	shortName string,
	hostnames []string,
	existingByName map[string]cloudflare.TunnelSummary,
) error {
	fullName := TunnelFullName(config.TunnelNamePrefix, shortName)
	secretName := "cloudflared-credentials-" + shortName
	deploymentName := "cloudflared-" + shortName

	// Ensure the CF tunnel exists and the credentials Secret is present.
	secretData, found, err := kubernetesService.GetSecret(ctx, config.ControllerNamespace, secretName)
	if err != nil {
		return fmt.Errorf("get secret for tunnel %q: %w", shortName, err)
	}

	var tunnelID string
	if !found {
		slog.Info("creating cloudflare tunnel", "tunnel", fullName)
		info, err := cloudflareService.CreateTunnel(ctx, fullName)
		if err != nil {
			return fmt.Errorf("create tunnel %q: %w", fullName, err)
		}
		tunnelID = info.ID
		secretData = map[string][]byte{
			secretKeyTunnelID:    []byte(info.ID),
			secretKeyTunnelToken: []byte(info.Token),
		}
		if err := kubernetesService.CreateSecret(ctx, config.ControllerNamespace, secretName, secretData); err != nil {
			return fmt.Errorf("create secret for tunnel %q: %w", shortName, err)
		}
		slog.Info("tunnel created", "tunnel", fullName, "tunnelID", tunnelID)
	} else {
		tunnelID = string(secretData[secretKeyTunnelID])
	}

	// If the CF tunnel no longer appears in Cloudflare (e.g. deleted manually) but the
	// Secret (and possibly Deployment/PDB) still exist, clean up the stale k8s resources
	// so the next reconcile cycle hits the secret-not-found path and recreates everything.
	if _, exists := existingByName[shortName]; !exists && found {
		slog.Warn("tunnel not found in cloudflare but secret exists — cleaning up stale resources",
			"tunnel", fullName)
		if err := kubernetesService.DeletePDB(ctx, config.ControllerNamespace, deploymentName); err != nil {
			slog.Error("failed to delete stale pdb", "pdb", deploymentName, "error", err)
		}
		if err := kubernetesService.DeleteDeployment(ctx, config.ControllerNamespace, deploymentName); err != nil {
			slog.Error("failed to delete stale deployment", "deployment", deploymentName, "error", err)
		}
		if err := kubernetesService.DeleteSecret(ctx, config.ControllerNamespace, secretName); err != nil {
			slog.Error("failed to delete stale secret", "secret", secretName, "error", err)
		}
		return nil
	}

	// Sync ingress rules.
	currentRules, err := cloudflareService.GetConfig(ctx, tunnelID)
	if err != nil {
		return fmt.Errorf("get config for tunnel %q: %w", fullName, err)
	}

	desiredRules := make([]cloudflare.IngressRule, 0, len(hostnames))
	for _, hostname := range hostnames {
		desiredRules = append(desiredRules, cloudflare.IngressRule{
			Hostname: hostname,
			Service:  config.TargetServiceURL,
		})
	}
	sort.Slice(desiredRules, func(i, j int) bool { return desiredRules[i].Hostname < desiredRules[j].Hostname })

	if !rulesEqual(currentRules, desiredRules) {
		slog.Info("updating tunnel ingress rules", "tunnel", fullName,
			"hostnames", hostnames)
		if err := cloudflareService.PutConfig(ctx, tunnelID, desiredRules); err != nil {
			return fmt.Errorf("put config for tunnel %q: %w", fullName, err)
		}
		slog.Info("tunnel config updated", "tunnel", fullName)
	} else {
		slog.Info("tunnel config is up to date, nothing to do", "tunnel", fullName)
	}

	// Ensure Deployment exists.
	deploymentExists, err := kubernetesService.DeploymentExists(ctx, config.ControllerNamespace, deploymentName)
	if err != nil {
		return fmt.Errorf("check deployment for tunnel %q: %w", shortName, err)
	}
	if !deploymentExists {
		slog.Info("creating cloudflared deployment", "deployment", deploymentName)
		if err := kubernetesService.CreateDeployment(ctx, k8s.CloudflaredDeploymentSpec{
			Namespace:             config.ControllerNamespace,
			Name:                  deploymentName,
			Replicas:              config.CloudflaredReplicas,
			Image:                 config.CloudflaredImage,
			CredentialsSecretName: secretName,
		}); err != nil {
			return fmt.Errorf("create deployment for tunnel %q: %w", shortName, err)
		}
	}

	// Ensure PDB exists.
	pdbExists, err := kubernetesService.PDBExists(ctx, config.ControllerNamespace, deploymentName)
	if err != nil {
		return fmt.Errorf("check pdb for tunnel %q: %w", shortName, err)
	}
	if !pdbExists {
		slog.Info("creating cloudflared pdb", "pdb", deploymentName)
		if err := kubernetesService.CreatePDB(ctx, config.ControllerNamespace, deploymentName, deploymentName); err != nil {
			return fmt.Errorf("create pdb for tunnel %q: %w", shortName, err)
		}
	}

	return nil
}

func deleteTunnelResources(
	ctx context.Context,
	kubernetesService k8s.Service,
	cloudflareService cloudflare.Service,
	config ReconcileConfig,
	shortName string,
	tunnelID string,
) error {
	deploymentName := "cloudflared-" + shortName
	secretName := "cloudflared-credentials-" + shortName

	// Delete k8s resources first so cloudflared stops and drains connections,
	// then delete the CF tunnel (which requires no active connections).
	if err := kubernetesService.DeletePDB(ctx, config.ControllerNamespace, deploymentName); err != nil {
		return fmt.Errorf("delete pdb: %w", err)
	}
	if err := kubernetesService.DeleteDeployment(ctx, config.ControllerNamespace, deploymentName); err != nil {
		return fmt.Errorf("delete deployment: %w", err)
	}
	if err := kubernetesService.DeleteSecret(ctx, config.ControllerNamespace, secretName); err != nil {
		return fmt.Errorf("delete secret: %w", err)
	}
	if err := cloudflareService.DeleteTunnel(ctx, tunnelID); err != nil {
		return fmt.Errorf("delete cloudflare tunnel: %w", err)
	}
	return nil
}

// GroupByTunnel groups hostnames by their tunnel annotation value.
func GroupByTunnel(entries []k8s.IngressEntry) map[string][]string {
	groups := map[string][]string{}
	for _, entry := range entries {
		groups[entry.TunnelName] = append(groups[entry.TunnelName], entry.Hostname)
	}
	return groups
}

// DetectCollisions returns a clean set of groups (conflicting hostnames removed)
// and a map of hostname → tunnel names for each conflicting hostname.
func DetectCollisions(groups map[string][]string) (clean map[string][]string, conflicts map[string][]string) {
	// Count how many tunnel groups each hostname appears in.
	hostnameToTunnels := map[string][]string{}
	for tunnelName, hostnames := range groups {
		for _, hostname := range hostnames {
			hostnameToTunnels[hostname] = append(hostnameToTunnels[hostname], tunnelName)
		}
	}

	conflicting := map[string]bool{}
	conflicts = map[string][]string{}
	for hostname, tunnels := range hostnameToTunnels {
		if len(tunnels) > 1 {
			conflicting[hostname] = true
			conflicts[hostname] = tunnels
		}
	}

	clean = map[string][]string{}
	for tunnelName, hostnames := range groups {
		for _, hostname := range hostnames {
			if !conflicting[hostname] {
				clean[tunnelName] = append(clean[tunnelName], hostname)
			}
		}
	}
	return clean, conflicts
}

// TunnelFullName returns the prefixed Cloudflare Tunnel name for a given short name.
func TunnelFullName(prefix, shortName string) string {
	return prefix + "-" + shortName
}

// StripPrefix extracts the short name from a full tunnel name if it matches the prefix.
func StripPrefix(prefix, fullName string) (string, bool) {
	expectedPrefix := prefix + "-"
	if !strings.HasPrefix(fullName, expectedPrefix) {
		return "", false
	}
	return fullName[len(expectedPrefix):], true
}

// HostnameInZone reports whether hostname belongs to zoneDomain.
// A hostname belongs to a zone if it equals the zone domain or is a subdomain of it.
// If zoneDomain is empty, all hostnames are accepted.
func HostnameInZone(hostname, zoneDomain string) bool {
	if zoneDomain == "" {
		return true
	}
	return hostname == zoneDomain || strings.HasSuffix(hostname, "."+zoneDomain)
}

// rulesEqual reports whether two sorted rule slices are identical.
func rulesEqual(current, desired []cloudflare.IngressRule) bool {
	if len(current) != len(desired) {
		return false
	}
	for idx := range current {
		if current[idx].Hostname != desired[idx].Hostname || current[idx].Service != desired[idx].Service {
			return false
		}
	}
	return true
}
