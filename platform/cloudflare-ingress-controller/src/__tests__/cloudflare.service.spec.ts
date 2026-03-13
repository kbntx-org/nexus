import { createCloudflareService, type TunnelIngress } from '../cloudflare.service';

const mockConfig = {
  apiToken: 'test-token',
  accountId: 'acc-123',
  tunnelId: 'tun-456'
};

const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${mockConfig.accountId}/cfd_tunnel/${mockConfig.tunnelId}/configurations`;

function mockFetch(response: unknown, ok = true) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: jest.fn().mockResolvedValue(response)
  });
}

describe('createCloudflareService', () => {
  afterEach(() => jest.restoreAllMocks());

  describe('getConfig', () => {
    it('returns hostname rules from CF response', async () => {
      mockFetch({
        success: true,
        errors: [],
        result: {
          config: {
            ingress: [
              { hostname: 'a.com', service: 'http://traefik:80' },
              { hostname: 'b.com', service: 'http://traefik:80' },
              { service: 'http_status:404' }
            ]
          }
        }
      });

      const service = createCloudflareService(mockConfig);
      const rules = await service.getConfig();

      expect(rules).toHaveLength(2);
      expect(rules[0].hostname).toBe('a.com');
      expect(rules[1].hostname).toBe('b.com');
    });

    it('filters out the catch-all rule', async () => {
      mockFetch({
        success: true,
        errors: [],
        result: {
          config: {
            ingress: [{ service: 'http_status:404' }]
          }
        }
      });

      const service = createCloudflareService(mockConfig);
      const rules = await service.getConfig();
      expect(rules).toHaveLength(0);
    });

    it('throws on API error', async () => {
      mockFetch({ success: false, errors: [{ code: 1003, message: 'Invalid token' }] });

      const service = createCloudflareService(mockConfig);
      await expect(service.getConfig()).rejects.toThrow('Cloudflare getConfig failed');
    });
  });

  describe('putConfig', () => {
    it('sends correct request body with catch-all appended', async () => {
      mockFetch({ success: true, errors: [], result: {} });

      const service = createCloudflareService(mockConfig);
      const rules: TunnelIngress[] = [
        { hostname: 'a.com', service: 'http://traefik:80' },
        { hostname: 'b.com', service: 'http://traefik:80' }
      ];

      await service.putConfig(rules);

      expect(global.fetch).toHaveBeenCalledWith(
        baseUrl,
        expect.objectContaining({ method: 'PUT' })
      );

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      const body = JSON.parse(callArgs.body as string);
      const ingress: TunnelIngress[] = body.config.ingress;

      expect(ingress).toHaveLength(3);
      expect(ingress[0].hostname).toBe('a.com');
      expect(ingress[1].hostname).toBe('b.com');
      expect(ingress[2]).toEqual({ service: 'http_status:404' });
    });

    it('throws on API error response', async () => {
      mockFetch({ success: false, errors: [{ code: 1003, message: 'Bad request' }] });

      const service = createCloudflareService(mockConfig);
      await expect(service.putConfig([])).rejects.toThrow('Cloudflare putConfig failed');
    });

    it('sends auth header with bearer token', async () => {
      mockFetch({ success: true, errors: [], result: {} });

      const service = createCloudflareService(mockConfig);
      await service.putConfig([]);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.headers['Authorization']).toBe(`Bearer ${mockConfig.apiToken}`);
    });
  });
});
