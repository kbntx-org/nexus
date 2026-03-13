import type { CloudflareService, TunnelIngress } from './cloudflare.service';
import type { K8sService } from './k8s.service';

export async function reconcile(
  k8s: K8sService,
  cloudflare: CloudflareService,
  targetServiceUrl: string
): Promise<void> {
  const ingresses = await k8s.list();
  const desired = new Set<string>();
  for (const ing of ingresses) {
    for (const host of ing.hostnames) {
      desired.add(host);
    }
  }

  const current = await cloudflare.getConfig();
  const currentHostnames = new Set(current.map(r => r.hostname!));

  const added = [...desired].filter(h => !currentHostnames.has(h));
  const removed = [...currentHostnames].filter(h => !desired.has(h));

  if (added.length === 0 && removed.length === 0) {
    console.log('[controller] tunnel config is up to date, nothing to do');
    return;
  }

  if (added.length > 0) {
    console.log('[controller] adding hostnames:', added);
  }
  if (removed.length > 0) {
    console.log('[controller] removing hostnames:', removed);
  }

  const newRules: TunnelIngress[] = [...desired].map(hostname => ({
    hostname,
    service: targetServiceUrl
  }));

  await cloudflare.putConfig(newRules);
  console.log(`[controller] tunnel config updated (${newRules.length} rules)`);
}
