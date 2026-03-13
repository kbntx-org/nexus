import * as k8s from '@kubernetes/client-node';

import { createCloudflareService } from './cloudflare.service';
import { reconcile } from './controller';
import { createK8sService } from './k8s.service';

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    console.error(`[main] missing required env var: ${name}`);
    process.exit(1);
  }
  return val;
}

async function main() {
  const targetServiceUrl = requireEnv('TARGET_SERVICE_URL');
  const cfApiToken = requireEnv('CF_API_TOKEN');
  const cfAccountId = requireEnv('CF_ACCOUNT_ID');
  const cfTunnelId = requireEnv('CF_TUNNEL_ID');
  const cfZoneId = requireEnv('CF_ZONE_ID');
  const podName = requireEnv('POD_NAME');
  const podNamespace = requireEnv('POD_NAMESPACE');
  const ingressClassName = process.env['INGRESS_CLASS_NAME'] || undefined;
  const reconcileIntervalMs = parseInt(process.env['RECONCILE_INTERVAL_MS'] ?? '30000', 10);

  // suppress unused warning — zoneId reserved for future DNS operations
  void cfZoneId;

  const k8sService = createK8sService(ingressClassName);
  const cfService = createCloudflareService({
    apiToken: cfApiToken,
    accountId: cfAccountId,
    tunnelId: cfTunnelId
  });

  console.log(
    `[main] starting cloudflare-ingress-controller (class filter: ${ingressClassName ?? 'all'})`
  );

  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();

  const coordinationApi = kc.makeApiClient(k8s.CoordinationV1Api);

  let stopWatch: (() => void) | null = null;
  let intervalHandle: ReturnType<typeof setInterval> | null = null;

  function startLeaderWork() {
    console.log(`[main] ${podName} became leader, starting reconciliation`);

    const run = () =>
      reconcile(k8sService, cfService, targetServiceUrl).catch((err: Error) => {
        console.error('[main] reconcile error:', err.message);
      });

    run();
    intervalHandle = setInterval(run, reconcileIntervalMs);

    stopWatch = k8sService.watch(() => {
      run();
    });
  }

  function stopLeaderWork() {
    console.log(`[main] ${podName} lost leadership, stopping reconciliation`);
    stopWatch?.();
    stopWatch = null;
    if (intervalHandle !== null) {
      clearInterval(intervalHandle);
      intervalHandle = null;
    }
  }

  const leaderElector = new k8s.LeaderElector(
    {
      lock: new k8s.LeaseLock(
        'cloudflare-ingress-controller-leader',
        podNamespace,
        podName,
        coordinationApi
      ),
      leaseDuration: 15,
      renewDeadline: 10,
      retryPeriod: 2,
      onStartedLeading: startLeaderWork,
      onStoppedLeading: stopLeaderWork,
      onNewLeader: (identity: string) => {
        if (identity !== podName) {
          console.log(`[main] current leader: ${identity}`);
        }
      }
    },
    false
  );

  leaderElector.run();
  console.log(`[main] ${podName} is waiting for leadership...`);

  function shutdown() {
    console.log('[main] shutting down');
    stopLeaderWork();
    process.exit(0);
  }

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err: Error) => {
  console.error('[main] fatal:', err.message);
  process.exit(1);
});
