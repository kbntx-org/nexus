import {
  CloudflareApiResponse,
  CloudflareTunnelConfig,
  CloudflareTunnelIngress
} from './types';

export class CloudflareClient {
  private readonly baseUrl: string;
  private readonly accountId: string;
  private readonly tunnelId: string;
  private readonly apiToken: string;

  constructor(apiToken: string, accountId: string, tunnelId: string) {
    this.apiToken = apiToken;
    this.accountId = accountId;
    this.tunnelId = tunnelId;
    this.baseUrl = 'https://api.cloudflare.com';
  }

  public async getTunnelConfig(): Promise<CloudflareTunnelConfig> {
    const path = `/client/v4/accounts/${this.accountId}/cfd_tunnel/${this.tunnelId}/configurations`;
    const data = await this.request<{ config: CloudflareTunnelConfig }>('GET', path);
    return data.result.config ?? { ingress: [] };
  }

  public async putTunnelConfig(config: CloudflareTunnelConfig): Promise<void> {
    const path = `/client/v4/accounts/${this.accountId}/cfd_tunnel/${this.tunnelId}/configurations`;
    await this.request<unknown>('PUT', path, { config });
  }

  public buildIngressRules(
    hostnames: string[],
    traefikService: string,
    existingIngress: CloudflareTunnelIngress[]
  ): CloudflareTunnelIngress[] {
    // Keep entries not managed by this controller.
    // Managed entries are those that have a hostname AND point to the traefik service.
    // We preserve: catch-all rules (no hostname) and entries pointing to other services.
    const unmanagedEntries = existingIngress.filter(
      entry => !entry.hostname || entry.service !== traefikService
    );

    // Build new managed entries for each hostname
    const managedEntries: CloudflareTunnelIngress[] = hostnames.map(hostname => ({
      hostname,
      service: traefikService
    }));

    // Always keep a catch-all rule at the end (required by Cloudflare)
    const hasCatchAll = unmanagedEntries.some(e => !e.hostname);
    const catchAll: CloudflareTunnelIngress = { service: 'http_status:404' };

    return [...managedEntries, ...unmanagedEntries, ...(hasCatchAll ? [] : [catchAll])];
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<CloudflareApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    });

    const data = (await response.json()) as CloudflareApiResponse<T>;

    if (!data.success) {
      const errMsg = data.errors.map(e => `${e.code}: ${e.message}`).join(', ');
      throw new Error(`Cloudflare API error: ${errMsg}`);
    }

    return data;
  }
}
