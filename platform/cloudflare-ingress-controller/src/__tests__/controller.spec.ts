import type { CloudflareService, TunnelIngress } from '../cloudflare.service';
import { reconcile } from '../controller';
import type { K8sService, IngressInfo } from '../k8s.service';

function makeK8s(hostnames: string[]): K8sService {
  return {
    list: jest
      .fn()
      .mockResolvedValue([{ name: 'test', namespace: 'default', hostnames } satisfies IngressInfo]),
    watch: jest.fn().mockReturnValue(() => {})
  };
}

function makeCf(existing: string[]): { service: CloudflareService; putConfig: jest.Mock } {
  const putConfig = jest.fn().mockResolvedValue(undefined);
  const service: CloudflareService = {
    getConfig: jest
      .fn()
      .mockResolvedValue(
        existing.map((h): TunnelIngress => ({ hostname: h, service: 'http://traefik:80' }))
      ),
    putConfig
  };
  return { service, putConfig };
}

describe('reconcile', () => {
  it('adds new hostnames', async () => {
    const k8s = makeK8s(['a.com', 'b.com']);
    const { service: cf, putConfig } = makeCf([]);

    await reconcile(k8s, cf, 'http://traefik:80');

    expect(putConfig).toHaveBeenCalledTimes(1);
    const rules: TunnelIngress[] = putConfig.mock.calls[0][0];
    const hostnames = rules.map(r => r.hostname);
    expect(hostnames).toContain('a.com');
    expect(hostnames).toContain('b.com');
  });

  it('removes deleted hostnames', async () => {
    const k8s = makeK8s(['a.com']);
    const { service: cf, putConfig } = makeCf(['a.com', 'b.com']);

    await reconcile(k8s, cf, 'http://traefik:80');

    expect(putConfig).toHaveBeenCalledTimes(1);
    const rules: TunnelIngress[] = putConfig.mock.calls[0][0];
    expect(rules.map(r => r.hostname)).not.toContain('b.com');
    expect(rules.map(r => r.hostname)).toContain('a.com');
  });

  it('no-ops when state matches', async () => {
    const k8s = makeK8s(['a.com', 'b.com']);
    const { service: cf, putConfig } = makeCf(['a.com', 'b.com']);

    await reconcile(k8s, cf, 'http://traefik:80');

    expect(putConfig).not.toHaveBeenCalled();
  });

  it('handles multiple ingresses', async () => {
    const k8sMock: K8sService = {
      list: jest
        .fn()
        .mockResolvedValue([
          { name: 'ing1', namespace: 'default', hostnames: ['a.com'] } satisfies IngressInfo,
          { name: 'ing2', namespace: 'apps', hostnames: ['b.com', 'c.com'] } satisfies IngressInfo
        ]),
      watch: jest.fn().mockReturnValue(() => {})
    };
    const { service: cf, putConfig } = makeCf([]);

    await reconcile(k8sMock, cf, 'http://traefik:80');

    const rules: TunnelIngress[] = putConfig.mock.calls[0][0];
    const hostnames = rules.map(r => r.hostname);
    expect(hostnames).toContain('a.com');
    expect(hostnames).toContain('b.com');
    expect(hostnames).toContain('c.com');
  });

  it('deduplicates hostnames across ingresses', async () => {
    const k8sMock: K8sService = {
      list: jest
        .fn()
        .mockResolvedValue([
          { name: 'ing1', namespace: 'ns1', hostnames: ['a.com'] } satisfies IngressInfo,
          { name: 'ing2', namespace: 'ns2', hostnames: ['a.com'] } satisfies IngressInfo
        ]),
      watch: jest.fn().mockReturnValue(() => {})
    };
    const { service: cf, putConfig } = makeCf([]);

    await reconcile(k8sMock, cf, 'http://traefik:80');

    const rules: TunnelIngress[] = putConfig.mock.calls[0][0];
    expect(rules.filter(r => r.hostname === 'a.com')).toHaveLength(1);
  });
});
