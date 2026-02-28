import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataService } from '@/services/core/DataService';
import { GameStorageService } from '../GameStorageService';

describe('GameStorageService disposal lifecycle', () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
    vi.useRealTimers();
    localStorage.clear();
  });

  it('removes the beforeunload listener on dispose', () => {
    const dataService = {
      getItem: vi.fn(),
    } as unknown as DataService;
    const gameStorageService = new GameStorageService(dataService);
    const beforeUnloadRegistration = addEventListenerSpy.mock.calls.find(
      call => call[0] === 'beforeunload'
    );

    expect(beforeUnloadRegistration).toBeDefined();

    gameStorageService.dispose();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      beforeUnloadRegistration?.[1]
    );
  });

  it('flushes pending saves during dispose', async () => {
    const dataService = {
      getItem: vi.fn(),
    } as unknown as DataService;
    const gameStorageService = new GameStorageService(dataService);

    const savePromise = gameStorageService.saveGame({
      inventory: new Map(),
      craftingQueue: [],
      craftingChains: [],
      facilities: [],
      deployedContainers: [],
      totalItemsProduced: 0,
      favoriteRecipes: new Set(),
      recentRecipes: [],
      researchState: null,
      researchQueue: [],
      unlockedTechs: new Set(),
      autoResearch: true,
      craftedItemCounts: new Map(),
      builtEntityCounts: new Map(),
      minedEntityCounts: new Map(),
      lastSaveTime: Date.now(),
      saveKey: 'test-save',
    });

    gameStorageService.dispose();
    await expect(savePromise).resolves.toBeUndefined();
    expect(localStorage.getItem('factorio-game-storage')).toBeTruthy();
  });
});
