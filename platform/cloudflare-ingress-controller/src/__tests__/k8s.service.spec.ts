import type { V1Ingress } from '@kubernetes/client-node';

// Filter and extraction logic extracted for unit testing without K8s API calls
function matchesClass(ingress: V1Ingress, className: string | undefined): boolean {
  if (!className) {
    return true;
  }
  const specClass = ingress.spec?.ingressClassName;
  const annotationClass = ingress.metadata?.annotations?.['kubernetes.io/ingress.class'];
  return specClass === className || annotationClass === className;
}

function extractHostnames(ingress: V1Ingress): string[] {
  return (ingress.spec?.rules ?? [])
    .map(r => r.host)
    .filter((h): h is string => typeof h === 'string' && h.length > 0);
}

function makeIngress(
  host: string | undefined,
  opts: { specClass?: string; annotationClass?: string } = {}
): V1Ingress {
  return {
    metadata: {
      name: 'test',
      annotations: opts.annotationClass
        ? { 'kubernetes.io/ingress.class': opts.annotationClass }
        : undefined
    },
    spec: {
      ingressClassName: opts.specClass,
      rules: host ? [{ host, http: { paths: [] } }] : []
    }
  };
}

describe('matchesClass', () => {
  it('returns all ingresses when className is undefined', () => {
    const ingresses = [
      makeIngress('a.com', { specClass: 'traefik' }),
      makeIngress('b.com', { specClass: 'nginx' }),
      makeIngress('c.com')
    ];
    expect(ingresses.filter(i => matchesClass(i, undefined))).toHaveLength(3);
  });

  it('filters by spec ingressClassName', () => {
    const traefik = makeIngress('a.com', { specClass: 'traefik' });
    const nginx = makeIngress('b.com', { specClass: 'nginx' });
    expect(matchesClass(traefik, 'traefik')).toBe(true);
    expect(matchesClass(nginx, 'traefik')).toBe(false);
  });

  it('filters by annotation kubernetes.io/ingress.class', () => {
    const ingress = makeIngress('a.com', { annotationClass: 'traefik' });
    expect(matchesClass(ingress, 'traefik')).toBe(true);
    expect(matchesClass(ingress, 'nginx')).toBe(false);
  });

  it('ingress with no class is excluded when filter is set', () => {
    const ingress = makeIngress('a.com');
    expect(matchesClass(ingress, 'traefik')).toBe(false);
  });
});

describe('extractHostnames', () => {
  it('extracts all hostnames from spec rules', () => {
    const ingress: V1Ingress = {
      spec: {
        rules: [
          { host: 'a.com', http: { paths: [] } },
          { host: 'b.com', http: { paths: [] } }
        ]
      }
    };
    expect(extractHostnames(ingress)).toEqual(['a.com', 'b.com']);
  });

  it('ignores rules without a host', () => {
    const ingress: V1Ingress = {
      spec: {
        rules: [{ http: { paths: [] } }, { host: 'a.com', http: { paths: [] } }]
      }
    };
    expect(extractHostnames(ingress)).toEqual(['a.com']);
  });

  it('returns empty array for ingress with no rules', () => {
    const ingress: V1Ingress = { spec: { rules: [] } };
    expect(extractHostnames(ingress)).toEqual([]);
  });

  it('filters out empty string hosts', () => {
    const ingress: V1Ingress = {
      spec: {
        rules: [{ host: '', http: { paths: [] } }]
      }
    };
    expect(extractHostnames(ingress)).toEqual([]);
  });
});
