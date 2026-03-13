import { CloudflareClient } from './cloudflare-client';
import { IngressController } from './controller';
import { Config } from './types';

// These types mirror the k8s shapes used by the controller without importing the ESM-only package
interface V1IngressRule {
  host?: string;
  http?: { paths: unknown[] };
}

interface V1Ingress {
  metadata?: { name?: string; annotations?: Record<string, string> };
  spec?: { ingressClassName?: string; rules?: V1IngressRule[] };
}

interface MockNetworkingV1Api {
  listIngressForAllNamespaces: jest.Mock;
  listNamespacedIngress: jest.Mock;
}

function makeIngress(
  host: string,
  ingressClassName?: string,
  annotations?: Record<string, string>
): V1Ingress {
  return {
    metadata: { name: `ingress-${host}`, annotations: annotations ?? {} },
    spec: {
      ingressClassName,
      rules: [{ host, http: { paths: [] } }]
    }
  };
}

function makeMockK8sApi(ingresses: V1Ingress[]): MockNetworkingV1Api {
  return {
    listIngressForAllNamespaces: jest.fn().mockResolvedValue({ items: ingresses }),
    listNamespacedIngress: jest.fn().mockResolvedValue({ items: ingresses })
  };
}

function makeMockCfClient(): jest.Mocked<CloudflareClient> {
  return {
    getTunnelConfig: jest.fn().mockResolvedValue({ ingress: [] }),
    putTunnelConfig: jest.fn().mockResolvedValue(undefined),
    buildIngressRules: jest.fn().mockImplementation(
      (hostnames: string[], traefikService: string) =>
        hostnames.map(h => ({ hostname: h, service: traefikService }))
    )
  } as unknown as jest.Mocked<CloudflareClient>;
}

const baseConfig: Config = {
  cfApiToken: 'token',
  cfAccountId: 'account',
  cfTunnelId: 'tunnel',
  traefikService: 'http://traefik.traefik.svc.cluster.local:80',
  ingressClassName: null,
  namespace: null,
  reconcileIntervalMs: 60000,
  podName: 'cf-ingress-controller-0',
  leaderElectionNamespace: 'platform'
};

describe('IngressController.collectHostnames', () => {
  it('collects all hostnames when no ingressClassName is set', async () => {
    const ingresses = [makeIngress('portfolio.kbntx.com'), makeIngress('blog.kbntx.com')];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const controller = new IngressController(baseConfig, makeMockK8sApi(ingresses) as any, makeMockCfClient());

    const hostnames = await controller.collectHostnames();
    expect(hostnames).toEqual(new Set(['portfolio.kbntx.com', 'blog.kbntx.com']));
  });

  it('filters hostnames by ingressClassName when set', async () => {
    const ingresses = [
      makeIngress('portfolio.kbntx.com', 'traefik'),
      makeIngress('other.kbntx.com', 'nginx')
    ];
    const config: Config = { ...baseConfig, ingressClassName: 'traefik' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const controller = new IngressController(config, makeMockK8sApi(ingresses) as any, makeMockCfClient());

    const hostnames = await controller.collectHostnames();
    expect(hostnames).toEqual(new Set(['portfolio.kbntx.com']));
  });

  it('matches ingresses by legacy annotation when ingressClassName is set', async () => {
    const ingresses = [
      makeIngress('portfolio.kbntx.com', undefined, {
        'kubernetes.io/ingress.class': 'traefik'
      }),
      makeIngress('other.kbntx.com', undefined, {
        'kubernetes.io/ingress.class': 'nginx'
      })
    ];
    const config: Config = { ...baseConfig, ingressClassName: 'traefik' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const controller = new IngressController(config, makeMockK8sApi(ingresses) as any, makeMockCfClient());

    const hostnames = await controller.collectHostnames();
    expect(hostnames).toEqual(new Set(['portfolio.kbntx.com']));
  });

  it('lists namespaced ingresses when namespace is set', async () => {
    const ingresses = [makeIngress('portfolio.kbntx.com')];
    const api = makeMockK8sApi(ingresses);
    const config: Config = { ...baseConfig, namespace: 'production' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const controller = new IngressController(config, api as any, makeMockCfClient());

    await controller.collectHostnames();
    expect(api.listNamespacedIngress).toHaveBeenCalledWith({ namespace: 'production' });
    expect(api.listIngressForAllNamespaces).not.toHaveBeenCalled();
  });

  it('ignores ingresses with no host rules', async () => {
    const ingress: V1Ingress = {
      metadata: { name: 'no-host' },
      spec: { rules: [{ http: { paths: [] } }] }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const controller = new IngressController(baseConfig, makeMockK8sApi([ingress]) as any, makeMockCfClient());

    const hostnames = await controller.collectHostnames();
    expect(hostnames.size).toBe(0);
  });
});

describe('IngressController.reconcile', () => {
  it('calls putTunnelConfig when hostnames change', async () => {
    const ingresses = [makeIngress('portfolio.kbntx.com', 'traefik')];
    const cfClient = makeMockCfClient();
    const config: Config = { ...baseConfig, ingressClassName: 'traefik' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const controller = new IngressController(config, makeMockK8sApi(ingresses) as any, cfClient);

    await controller.reconcile();

    expect(cfClient.getTunnelConfig).toHaveBeenCalledTimes(1);
    expect(cfClient.putTunnelConfig).toHaveBeenCalledTimes(1);
  });

  it('does not call putTunnelConfig when hostnames have not changed', async () => {
    const ingresses = [makeIngress('portfolio.kbntx.com', 'traefik')];
    const cfClient = makeMockCfClient();
    const config: Config = { ...baseConfig, ingressClassName: 'traefik' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const controller = new IngressController(config, makeMockK8sApi(ingresses) as any, cfClient);

    await controller.reconcile();
    await controller.reconcile();

    expect(cfClient.putTunnelConfig).toHaveBeenCalledTimes(1);
  });
});
