import { describe, expect, it, vi } from 'vitest';

vi.mock('@/app/runtime/GameRuntimeRegistry', () => ({
  getGameRuntimeRegistryState: vi.fn(),
}));

import { getGameRuntimeRegistryState } from '@/app/runtime/GameRuntimeRegistry';
import { isLegacyFacilityLoopEnabled } from '@/services/game/GameLoopTaskFactory';

describe('GameLoopTaskFactory runtime gating', () => {
  it('enables legacy facility loop when runtime is not ready', () => {
    vi.mocked(getGameRuntimeRegistryState).mockReturnValue({
      status: 'booting',
      source: null,
      runtime: null,
      runtimeState: null,
      error: null,
      lastBootAtMs: null,
    });

    expect(isLegacyFacilityLoopEnabled()).toBe(true);
  });

  it('disables legacy facility loop when runtime is ready', () => {
    vi.mocked(getGameRuntimeRegistryState).mockReturnValue({
      status: 'ready',
      source: 'snapshot',
      runtime: null,
      runtimeState: null,
      error: null,
      lastBootAtMs: Date.now(),
    });

    expect(isLegacyFacilityLoopEnabled()).toBe(false);
  });
});
