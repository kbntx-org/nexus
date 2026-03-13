/* eslint-disable @typescript-eslint/no-unused-vars */
export class KubeConfig {
  public loadFromDefault(): void {}
  public makeApiClient<T>(_: new (...args: unknown[]) => T): T {
    return {} as T;
  }
}

export class NetworkingV1Api {}
export class CoordinationV1Api {}

export class V1MicroTime extends Date {
  public toISOString(): string {
    return super.toISOString();
  }
}
