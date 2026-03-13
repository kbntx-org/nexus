import { IngressController } from './controller';
import { LeaderElection } from './leader-election';
import { Config } from './types';

function getEnv(name: string, required = true): string {
  const value = process.env[name];
  if (!value && required) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? '';
}

function loadConfig(): Config {
  return {
    cfApiToken: getEnv('CF_API_TOKEN'),
    cfAccountId: getEnv('CF_ACCOUNT_ID'),
    cfTunnelId: getEnv('CF_TUNNEL_ID'),
    traefikService: getEnv('TRAEFIK_SERVICE'),
    ingressClassName: getEnv('INGRESS_CLASS_NAME', false) || null,
    namespace: getEnv('NAMESPACE', false) || null,
    reconcileIntervalMs: parseInt(getEnv('RECONCILE_INTERVAL_MS', false) || '30000', 10),
    podName: getEnv('POD_NAME'),
    leaderElectionNamespace: getEnv('LEADER_ELECTION_NAMESPACE')
  };
}

async function main(): Promise<void> {
  const config = loadConfig();
  const controller = new IngressController(config);
  const leaderElection = new LeaderElection(
    'cf-ingress-controller-leader',
    config.leaderElectionNamespace,
    config.podName
  );

  const shutdown = async (): Promise<void> => {
    console.log('Received shutdown signal, stopping controller...');
    leaderElection.stop();
    controller.stop();
    // Allow any in-flight reconciliation to complete before exiting
    await new Promise(resolve => setTimeout(resolve, 500));
    process.exit(0);
  };

  process.on('SIGTERM', () => {
    shutdown().catch(err => console.error('Error during shutdown:', err));
  });
  process.on('SIGINT', () => {
    shutdown().catch(err => console.error('Error during shutdown:', err));
  });

  leaderElection.run(
    () => controller.start(),
    () => controller.stop()
  );
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
