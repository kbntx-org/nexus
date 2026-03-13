export interface Config {
  cfApiToken: string;
  cfAccountId: string;
  cfTunnelId: string;
  traefikService: string;
  ingressClassName: string | null;
  namespace: string | null;
  reconcileIntervalMs: number;
  podName: string;
  leaderElectionNamespace: string;
}

export interface CloudflareTunnelIngress {
  hostname?: string;
  service: string;
  originRequest?: Record<string, unknown>;
  path?: string;
}

export interface CloudflareTunnelConfig {
  ingress: CloudflareTunnelIngress[];
  originRequest?: Record<string, unknown>;
}

export interface CloudflareApiResponse<T> {
  result: T;
  success: boolean;
  errors: { code: number; message: string }[];
  messages: string[];
}
