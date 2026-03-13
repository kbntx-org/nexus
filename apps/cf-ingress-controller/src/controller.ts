import * as k8s from '@kubernetes/client-node';

import { CloudflareClient } from './cloudflare-client';
import { Config } from './types';

export class IngressController {
  private readonly k8sApi: k8s.NetworkingV1Api;
  private readonly cfClient: CloudflareClient;
  private readonly config: Config;
  private reconcileTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly trackedHostnames = new Set<string>();
  private isRunning = false;

  constructor(config: Config, k8sApi?: k8s.NetworkingV1Api, cfClient?: CloudflareClient) {
    this.config = config;

    if (k8sApi) {
      this.k8sApi = k8sApi;
    } else {
      const kc = new k8s.KubeConfig();
      kc.loadFromDefault();
      this.k8sApi = kc.makeApiClient(k8s.NetworkingV1Api);
    }

    this.cfClient = cfClient ?? new CloudflareClient(
      config.cfApiToken,
      config.cfAccountId,
      config.cfTunnelId
    );
  }

  public async start(): Promise<void> {
    this.isRunning = true;
    console.log('Starting Cloudflare Ingress Controller');
    console.log(`Traefik service: ${this.config.traefikService}`);
    console.log(
      `Watching ingress class: ${this.config.ingressClassName ?? '(all classes)'}`
    );
    console.log(`Namespace: ${this.config.namespace ?? '(all namespaces)'}`);

    await this.reconcile();
    this.scheduleReconcile();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.reconcileTimer) {
      clearTimeout(this.reconcileTimer);
      this.reconcileTimer = null;
    }
    console.log('Cloudflare Ingress Controller stopped');
  }

  public async reconcile(): Promise<void> {
    try {
      const hostnames = await this.collectHostnames();
      const hostnameList = [...hostnames].sort();

      const currentList = [...this.trackedHostnames].sort();
      const changed =
        hostnameList.length !== currentList.length ||
        hostnameList.some((h, i) => h !== currentList[i]);

      if (!changed) {
        console.log(`No changes detected (${hostnameList.length} hostnames tracked)`);
        return;
      }

      console.log(`Reconciling ${hostnameList.length} hostname(s): ${hostnameList.join(', ')}`);

      const existingConfig = await this.cfClient.getTunnelConfig();
      const newIngress = this.cfClient.buildIngressRules(
        hostnameList,
        this.config.traefikService,
        existingConfig.ingress
      );

      await this.cfClient.putTunnelConfig({ ...existingConfig, ingress: newIngress });

      this.trackedHostnames.clear();
      hostnameList.forEach(h => this.trackedHostnames.add(h));

      console.log(`Tunnel config updated successfully`);
    } catch (err) {
      console.error('Reconciliation failed:', err);
    }
  }

  public async collectHostnames(): Promise<Set<string>> {
    const hostnames = new Set<string>();

    let ingressList: k8s.V1IngressList;
    try {
      if (this.config.namespace) {
        const res = await this.k8sApi.listNamespacedIngress({ namespace: this.config.namespace });
        ingressList = res;
      } else {
        const res = await this.k8sApi.listIngressForAllNamespaces();
        ingressList = res;
      }
    } catch (err) {
      throw new Error(`Failed to list ingresses: ${String(err)}`);
    }

    for (const ingress of ingressList.items) {
      if (!this.shouldWatch(ingress)) {
        continue;
      }

      const rules = ingress.spec?.rules ?? [];
      for (const rule of rules) {
        if (rule.host) {
          hostnames.add(rule.host);
        }
      }
    }

    return hostnames;
  }

  private shouldWatch(ingress: k8s.V1Ingress): boolean {
    if (!this.config.ingressClassName) {
      return true;
    }
    // Check spec.ingressClassName
    if (ingress.spec?.ingressClassName === this.config.ingressClassName) {
      return true;
    }
    // Check annotation kubernetes.io/ingress.class (legacy)
    const annotations = ingress.metadata?.annotations ?? {};
    if (annotations['kubernetes.io/ingress.class'] === this.config.ingressClassName) {
      return true;
    }
    return false;
  }

  private scheduleReconcile(): void {
    if (!this.isRunning) {
      return;
    }
    this.reconcileTimer = setTimeout(async () => {
      await this.reconcile();
      this.scheduleReconcile();
    }, this.config.reconcileIntervalMs);
  }
}
