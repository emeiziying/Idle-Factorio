import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { initializeMock, cleanupMock } = vi.hoisted(() => ({
  initializeMock: vi.fn(),
  cleanupMock: vi.fn(),
}));

vi.mock('@/services/core/DIServiceInitializer', () => ({
  DIServiceInitializer: {
    initialize: initializeMock,
    cleanup: cleanupMock,
  },
}));

import { useAppInitialization } from '@/hooks/useAppInitialization';

describe('useAppInitialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks app as ready after initialization succeeds', async () => {
    initializeMock.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAppInitialization());

    await waitFor(() => {
      expect(result.current.isAppReady).toBe(true);
    });

    expect(result.current.initError).toBeNull();
    expect(cleanupMock).not.toHaveBeenCalled();
  });

  it('surfaces initialization errors', async () => {
    initializeMock.mockRejectedValue(new Error('bootstrap failed'));

    const { result } = renderHook(() => useAppInitialization());

    await waitFor(() => {
      expect(result.current.initError).toBe('bootstrap failed');
    });

    expect(result.current.isAppReady).toBe(false);
  });

  it('does not teardown services on component unmount', async () => {
    initializeMock.mockResolvedValue(undefined);

    const { unmount } = renderHook(() => useAppInitialization());

    await waitFor(() => {
      expect(initializeMock).toHaveBeenCalledTimes(1);
    });

    unmount();

    expect(cleanupMock).not.toHaveBeenCalled();
  });
});
