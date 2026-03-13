import { LeaderElection } from './leader-election';

interface MockCoordinationV1Api {
  readNamespacedLease: jest.Mock;
  createNamespacedLease: jest.Mock;
  replaceNamespacedLease: jest.Mock;
}

function makeMockCoordinationApi(leaseHolder?: string): MockCoordinationV1Api {
  const now = new Date();
  const existingLease = {
    metadata: { name: 'cf-ingress-controller-leader', namespace: 'platform' },
    spec: {
      holderIdentity: leaseHolder,
      leaseDurationSeconds: 15,
      acquireTime: now,
      renewTime: now,
      leaseTransitions: 0
    }
  };

  return {
    readNamespacedLease: leaseHolder
      ? jest.fn().mockResolvedValue(existingLease)
      : jest.fn().mockRejectedValue(new Error('not found')),
    createNamespacedLease: jest.fn().mockResolvedValue(existingLease),
    replaceNamespacedLease: jest.fn().mockResolvedValue(existingLease)
  };
}

describe('LeaderElection.tryAcquireOrRenew', () => {
  it('creates a new lease and returns true when no lease exists', async () => {
    const api = makeMockCoordinationApi();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const le = new LeaderElection('test-lease', 'platform', 'pod-0', api as any);

    // @ts-expect-error - accessing private method for testing
    const result = await le.tryAcquireOrRenew();

    expect(result).toBe(true);
    expect(api.createNamespacedLease).toHaveBeenCalledTimes(1);
  });

  it('returns true and updates the lease when we are already the holder', async () => {
    const api = makeMockCoordinationApi('pod-0');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const le = new LeaderElection('test-lease', 'platform', 'pod-0', api as any);

    // @ts-expect-error - accessing private method for testing
    const result = await le.tryAcquireOrRenew();

    expect(result).toBe(true);
    expect(api.replaceNamespacedLease).toHaveBeenCalledTimes(1);
  });

  it('returns false when another replica holds a valid (non-expired) lease', async () => {
    const api = makeMockCoordinationApi('pod-1');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const le = new LeaderElection('test-lease', 'platform', 'pod-0', api as any);

    // @ts-expect-error - accessing private method for testing
    const result = await le.tryAcquireOrRenew();

    expect(result).toBe(false);
    expect(api.replaceNamespacedLease).not.toHaveBeenCalled();
  });

  it('acquires the lease when the current holder lease has expired', async () => {
    const pastTime = new Date(Date.now() - 60000); // 60 seconds ago, well past the 15s duration
    const expiredLease = {
      metadata: { name: 'test-lease', namespace: 'platform' },
      spec: {
        holderIdentity: 'pod-1',
        leaseDurationSeconds: 15,
        acquireTime: pastTime,
        renewTime: pastTime,
        leaseTransitions: 1
      }
    };
    const api = {
      readNamespacedLease: jest.fn().mockResolvedValue(expiredLease),
      createNamespacedLease: jest.fn(),
      replaceNamespacedLease: jest.fn().mockResolvedValue(expiredLease)
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const le = new LeaderElection('test-lease', 'platform', 'pod-0', api as any);

    // @ts-expect-error - accessing private method for testing
    const result = await le.tryAcquireOrRenew();

    expect(result).toBe(true);
    expect(api.replaceNamespacedLease).toHaveBeenCalledTimes(1);
  });
});
