import * as k8s from '@kubernetes/client-node';

export interface IngressInfo {
  name: string;
  namespace: string;
  hostnames: string[];
  ingressClassName?: string;
}

function matchesClass(ingress: k8s.V1Ingress, className: string | undefined): boolean {
  if (!className) return true;
  const specClass = ingress.spec?.ingressClassName;
  const annotationClass = ingress.metadata?.annotations?.['kubernetes.io/ingress.class'];
  return specClass === className || annotationClass === className;
}

function toIngressInfo(ingress: k8s.V1Ingress): IngressInfo {
  const hostnames = (ingress.spec?.rules ?? [])
    .map((r) => r.host)
    .filter((h): h is string => typeof h === 'string' && h.length > 0);

  return {
    name: ingress.metadata?.name ?? '',
    namespace: ingress.metadata?.namespace ?? '',
    hostnames,
    ingressClassName: ingress.spec?.ingressClassName,
  };
}

export interface K8sService {
  list(): Promise<IngressInfo[]>;
  watch(onEvent: (type: 'ADDED' | 'MODIFIED' | 'DELETED', info: IngressInfo) => void): () => void;
}

export function createK8sService(className: string | undefined): K8sService {
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();

  const networkingApi = kc.makeApiClient(k8s.NetworkingV1Api);
  const watch = new k8s.Watch(kc);

  return {
    async list(): Promise<IngressInfo[]> {
      const res = await networkingApi.listIngressForAllNamespaces();
      return res.items
        .filter((ing) => matchesClass(ing, className))
        .map(toIngressInfo);
    },

    watch(onEvent): () => void {
      let req: { abort: () => void } | null = null;
      let stopped = false;

      async function start() {
        if (stopped) return;
        try {
          req = await watch.watch(
            '/apis/networking.k8s.io/v1/ingresses',
            {},
            (type: string, obj: k8s.V1Ingress) => {
              if (type !== 'ADDED' && type !== 'MODIFIED' && type !== 'DELETED') return;
              if (!matchesClass(obj, className)) return;
              onEvent(type as 'ADDED' | 'MODIFIED' | 'DELETED', toIngressInfo(obj));
            },
            (err) => {
              if (!stopped) {
                if (err) console.error('[k8s] watch error, restarting:', err.message);
                setTimeout(start, 5000);
              }
            },
          );
        } catch (err) {
          if (!stopped) {
            console.error('[k8s] watch failed to start, retrying:', (err as Error).message);
            setTimeout(start, 5000);
          }
        }
      }

      start();

      return () => {
        stopped = true;
        req?.abort();
      };
    },
  };
}
