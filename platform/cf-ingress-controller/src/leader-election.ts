import * as k8s from '@kubernetes/client-node';

const LEASE_DURATION_SECONDS = 15;
const RENEW_INTERVAL_MS = 5000;
const RETRY_INTERVAL_MS = 5000;

export class LeaderElection {
  private readonly leaseName: string;
  private readonly namespace: string;
  private readonly identity: string;
  private readonly coordinationApi: k8s.CoordinationV1Api;
  private isLeader = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private isRunning = false;

  constructor(
    leaseName: string,
    namespace: string,
    identity: string,
    coordinationApi?: k8s.CoordinationV1Api
  ) {
    this.leaseName = leaseName;
    this.namespace = namespace;
    this.identity = identity;

    if (coordinationApi) {
      this.coordinationApi = coordinationApi;
    } else {
      const kc = new k8s.KubeConfig();
      kc.loadFromDefault();
      this.coordinationApi = kc.makeApiClient(k8s.CoordinationV1Api);
    }
  }

  public run(onStartLeading: () => Promise<void>, onStopLeading: () => void): void {
    this.isRunning = true;
    void this.loop(onStartLeading, onStopLeading);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private async loop(
    onStartLeading: () => Promise<void>,
    onStopLeading: () => void
  ): Promise<void> {
    while (this.isRunning) {
      const acquired = await this.tryAcquireOrRenew();

      if (acquired && !this.isLeader) {
        this.isLeader = true;
        console.log(`[leader-election] Became leader (${this.identity})`);
        onStartLeading().catch(err => {
          console.error('[leader-election] Error in leading callback:', err);
        });
      } else if (!acquired && this.isLeader) {
        this.isLeader = false;
        console.log(`[leader-election] Lost leadership (${this.identity})`);
        onStopLeading();
      }

      await this.sleep(acquired ? RENEW_INTERVAL_MS : RETRY_INTERVAL_MS);
    }
  }

  private async tryAcquireOrRenew(): Promise<boolean> {
    const now = new k8s.V1MicroTime();

    try {
      let existing: k8s.V1Lease;

      try {
        existing = await this.coordinationApi.readNamespacedLease({
          name: this.leaseName,
          namespace: this.namespace
        });
      } catch {
        // Lease does not exist yet — try to create it
        await this.coordinationApi.createNamespacedLease({
          namespace: this.namespace,
          body: {
            metadata: { name: this.leaseName, namespace: this.namespace },
            spec: {
              holderIdentity: this.identity,
              leaseDurationSeconds: LEASE_DURATION_SECONDS,
              acquireTime: now,
              renewTime: now,
              leaseTransitions: 0
            }
          }
        });
        return true;
      }

      const spec = existing.spec;
      const holder = spec?.holderIdentity;
      const renewTime = spec?.renewTime ? spec.renewTime.getTime() : 0;
      const duration = (spec?.leaseDurationSeconds ?? LEASE_DURATION_SECONDS) * 1000;
      const isExpired = Date.now() > renewTime + duration;

      if (holder && holder !== this.identity && !isExpired) {
        return false;
      }

      // We can take or renew the lease
      const isRenewal = holder === this.identity;
      await this.coordinationApi.replaceNamespacedLease({
        name: this.leaseName,
        namespace: this.namespace,
        body: {
          ...existing,
          spec: {
            holderIdentity: this.identity,
            leaseDurationSeconds: LEASE_DURATION_SECONDS,
            acquireTime: isRenewal ? spec?.acquireTime : now,
            renewTime: now,
            leaseTransitions: isRenewal
              ? (spec?.leaseTransitions ?? 0)
              : (spec?.leaseTransitions ?? 0) + 1
          }
        }
      });

      return true;
    } catch (err) {
      console.warn(`[leader-election] Failed to acquire/renew lease: ${err}`);
      return false;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
      this.timer = setTimeout(resolve, ms);
    });
  }
}
