import { CloudflareClient } from './cloudflare-client';
import { CloudflareTunnelIngress } from './types';

describe('CloudflareClient.buildIngressRules', () => {
  let client: CloudflareClient;

  beforeEach(() => {
    client = new CloudflareClient('token', 'account', 'tunnel');
  });

  it('creates ingress rules for each hostname pointing to traefik', () => {
    const result = client.buildIngressRules(
      ['portfolio.kbntx.com', 'blog.kbntx.com'],
      'http://traefik.traefik.svc.cluster.local:80',
      []
    );

    expect(result).toContainEqual({
      hostname: 'portfolio.kbntx.com',
      service: 'http://traefik.traefik.svc.cluster.local:80'
    });
    expect(result).toContainEqual({
      hostname: 'blog.kbntx.com',
      service: 'http://traefik.traefik.svc.cluster.local:80'
    });
  });

  it('appends a catch-all rule at the end when none exists', () => {
    const result = client.buildIngressRules(
      ['portfolio.kbntx.com'],
      'http://traefik.traefik.svc.cluster.local:80',
      []
    );

    const last = result[result.length - 1];
    expect(last).toEqual({ service: 'http_status:404' });
  });

  it('does not duplicate the catch-all rule when one already exists in existing ingress', () => {
    const existing: CloudflareTunnelIngress[] = [{ service: 'http_status:404' }];

    const result = client.buildIngressRules(
      ['portfolio.kbntx.com'],
      'http://traefik.traefik.svc.cluster.local:80',
      existing
    );

    const catchAlls = result.filter(e => !e.hostname && e.service === 'http_status:404');
    expect(catchAlls).toHaveLength(1);
  });

  it('preserves entries pointing to non-traefik services (external entries)', () => {
    const existing: CloudflareTunnelIngress[] = [
      { hostname: 'external.kbntx.com', service: 'http://some-other-svc:8080' },
      { service: 'http_status:404' }
    ];

    const result = client.buildIngressRules(
      ['portfolio.kbntx.com'],
      'http://traefik.traefik.svc.cluster.local:80',
      existing
    );

    expect(result.some(e => e.hostname === 'external.kbntx.com')).toBe(true);
    expect(result.some(e => e.hostname === 'portfolio.kbntx.com')).toBe(true);
  });

  it('replaces managed entries (hostname pointing to traefik) when reconciling new hostnames', () => {
    const existing: CloudflareTunnelIngress[] = [
      { hostname: 'old.kbntx.com', service: 'http://traefik.traefik.svc.cluster.local:80' },
      { service: 'http_status:404' }
    ];

    const result = client.buildIngressRules(
      ['new.kbntx.com'],
      'http://traefik.traefik.svc.cluster.local:80',
      existing
    );

    expect(result.some(e => e.hostname === 'old.kbntx.com')).toBe(false);
    expect(result.some(e => e.hostname === 'new.kbntx.com')).toBe(true);
  });

  it('returns only a catch-all when hostname list is empty', () => {
    const result = client.buildIngressRules(
      [],
      'http://traefik.traefik.svc.cluster.local:80',
      []
    );

    expect(result).toEqual([{ service: 'http_status:404' }]);
  });
});
