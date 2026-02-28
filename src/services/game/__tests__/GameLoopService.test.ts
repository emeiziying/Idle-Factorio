import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameLoopService } from '../GameLoopService';

describe('GameLoopService disposal lifecycle', () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('removes the visibilitychange listener on dispose', () => {
    const gameLoopService = new GameLoopService();
    const visibilityChangeRegistration = addEventListenerSpy.mock.calls.find(
      call => call[0] === 'visibilitychange'
    );

    expect(visibilityChangeRegistration).toBeDefined();

    gameLoopService.dispose();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'visibilitychange',
      visibilityChangeRegistration?.[1]
    );
  });
});
