import { IngressController } from './controller';
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
    reconcileIntervalMs: parseInt(getEnv('RECONCILE_INTERVAL_MS', false) || '30000', 10)
  };
}

async function main(): Promise<void> {
  const config = loadConfig();
  const controller = new IngressController(config);

  const shutdown = (): void => {
    console.log('Received shutdown signal, stopping controller...');
    controller.stop();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  await controller.start();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
