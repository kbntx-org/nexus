import * as https from 'https';

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
    this.baseUrl = 'api.cloudflare.com';
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

  private request<T>(method: string, path: string, body?: unknown): Promise<CloudflareApiResponse<T>> {
    return new Promise((resolve, reject) => {
      const bodyStr = body ? JSON.stringify(body) : undefined;
      const options: https.RequestOptions = {
        hostname: this.baseUrl,
        path,
        method,
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
          ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
        }
      };

      const req = https.request(options, res => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf-8');
          let parsed: CloudflareApiResponse<T>;
          try {
            parsed = JSON.parse(text) as CloudflareApiResponse<T>;
          } catch {
            return reject(new Error(`Failed to parse Cloudflare API response: ${text}`));
          }
          if (!parsed.success) {
            const errMsg = parsed.errors.map(e => `${e.code}: ${e.message}`).join(', ');
            return reject(new Error(`Cloudflare API error: ${errMsg}`));
          }
          resolve(parsed);
        });
      });

      req.on('error', reject);

      if (bodyStr) {
        req.write(bodyStr);
      }
      req.end();
    });
  }
}
