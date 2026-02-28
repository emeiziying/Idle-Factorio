import { describe, expect, it, vi } from 'vitest';
import { DIContainer } from '../DIContainer';

describe('DIContainer disposal lifecycle', () => {
  it('disposes resolved instances when clear is called', () => {
    const testContainer = new DIContainer();
    const disposableInstance = {
      dispose: vi.fn(),
    };

    testContainer.registerInstance('DisposableService', disposableInstance);
    testContainer.clear();

    expect(disposableInstance.dispose).toHaveBeenCalledTimes(1);
    expect(testContainer.hasInstance('DisposableService')).toBe(false);
  });

  it('disposeInstances clears instances but keeps service definitions', () => {
    const testContainer = new DIContainer();
    const disposeSpy = vi.fn();

    testContainer.registerFactory('DisposableService', () => ({
      dispose: disposeSpy,
      createdAt: Date.now(),
    }));

    const firstInstance = testContainer.resolve<{ dispose: () => void; createdAt: number }>(
      'DisposableService'
    );

    testContainer.disposeInstances();

    expect(disposeSpy).toHaveBeenCalledTimes(1);
    expect(testContainer.has('DisposableService')).toBe(true);
    expect(testContainer.hasInstance('DisposableService')).toBe(false);

    const secondInstance = testContainer.resolve<{ dispose: () => void; createdAt: number }>(
      'DisposableService'
    );

    expect(secondInstance).not.toBe(firstInstance);
  });
});
