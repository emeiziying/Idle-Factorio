import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getStoreDataQuery,
  getStoreFuelService,
  getStoreGameLoopService,
  getStoreGameStorage,
  getStoreRecipeQuery,
  getStoreTechnologyService,
  resetStoreRuntimeServices,
  setStoreRuntimeServices,
} from '../storeRuntimeServices';

describe('storeRuntimeServices', () => {
  beforeEach(() => {
    resetStoreRuntimeServices();
  });

  it('throws before services are initialized', () => {
    expect(() => getStoreRecipeQuery()).toThrow(/not initialized/i);
    expect(() => getStoreGameLoopService()).toThrow(/not initialized/i);
  });

  it('returns the injected services after initialization', () => {
    const dataQuery = {
      getRecipe: vi.fn(),
      getItemsByRow: vi.fn(),
    };
    const fuelService = {
      initializeFuelBuffer: vi.fn(),
      addFuel: vi.fn(),
      smartFuelDistribution: vi.fn(),
      updateFuelConsumption: vi.fn(),
      getFuelPriority: vi.fn(),
      isFuelCompatible: vi.fn(),
    };
    const gameLoopService = {
      enableTask: vi.fn(),
      disableTask: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      updateConfig: vi.fn(),
      setPerformanceLevel: vi.fn(),
      getStats: vi.fn(),
      getConfig: vi.fn(),
      isRunningState: vi.fn(),
      isPausedState: vi.fn(),
    };
    const gameStorage = {
      clearGameData: vi.fn(),
      saveGame: vi.fn(),
      loadGame: vi.fn(),
      forceSaveGame: vi.fn(),
    };
    const recipeQuery = {
      getRecipeById: vi.fn(),
      getUnlockedRecipesThatProduce: vi.fn(),
      getUnlockedMostEfficientRecipe: vi.fn(),
      getRecipeStats: vi.fn(),
      searchRecipes: vi.fn(),
      getAllRecipes: vi.fn(),
    };
    const technologyService = {
      setInventoryOperations: vi.fn(),
      hydrateState: vi.fn(),
      getAllTechnologies: vi.fn(),
      getTechTreeState: vi.fn(),
      getTechCategories: vi.fn(),
      startResearch: vi.fn(),
      getCurrentResearch: vi.fn(),
      getResearchQueue: vi.fn(),
      completeResearch: vi.fn(),
      addToResearchQueue: vi.fn(),
      removeFromResearchQueue: vi.fn(),
      reorderResearchQueue: vi.fn(),
      setAutoResearch: vi.fn(),
      isTechAvailable: vi.fn(),
      updateResearchProgress: vi.fn(),
    };

    setStoreRuntimeServices({
      dataQuery,
      fuelService,
      gameLoopService,
      gameStorage,
      recipeQuery,
      technologyService,
    });

    expect(getStoreDataQuery()).toBe(dataQuery);
    expect(getStoreFuelService()).toBe(fuelService);
    expect(getStoreGameLoopService()).toBe(gameLoopService);
    expect(getStoreGameStorage()).toBe(gameStorage);
    expect(getStoreRecipeQuery()).toBe(recipeQuery);
    expect(getStoreTechnologyService()).toBe(technologyService);
  });
});
