export interface TunnelIngress {
  hostname?: string;
  service: string;
}

interface CloudflareConfig {
  apiToken: string;
  accountId: string;
  tunnelId: string;
}

interface CfApiResponse<T> {
  success: boolean;
  errors: { code: number; message: string }[];
  result: T;
}

interface TunnelConfigResult {
  config: {
    ingress: TunnelIngress[];
  };
}

const CATCH_ALL: TunnelIngress = { service: 'http_status:404' };

export interface CloudflareService {
  getConfig(): Promise<TunnelIngress[]>;
  putConfig(rules: TunnelIngress[]): Promise<void>;
}

export function createCloudflareService(config: CloudflareConfig): CloudflareService {
  const { apiToken, accountId, tunnelId } = config;
  const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/cfd_tunnel/${tunnelId}/configurations`;
  const headers = {
    Authorization: `Bearer ${apiToken}`,
    'Content-Type': 'application/json'
  };

  return {
    async getConfig(): Promise<TunnelIngress[]> {
      const res = await fetch(baseUrl, { headers });
      const body = (await res.json()) as CfApiResponse<TunnelConfigResult>;
      if (!body.success) {
        throw new Error(`Cloudflare getConfig failed: ${JSON.stringify(body.errors)}`);
      }
      const ingress = body.result?.config?.ingress ?? [];
      return ingress.filter(rule => rule.hostname !== undefined);
    },

    async putConfig(rules: TunnelIngress[]): Promise<void> {
      const payload = {
        config: {
          ingress: [...rules, CATCH_ALL]
        }
      };
      const res = await fetch(baseUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });
      const body = (await res.json()) as CfApiResponse<unknown>;
      if (!body.success) {
        throw new Error(`Cloudflare putConfig failed: ${JSON.stringify(body.errors)}`);
      }
    }
  };
}
