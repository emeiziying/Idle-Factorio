import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useGameStore from '@/store/gameStore';
import { resetStoreRuntimeServices, setStoreRuntimeServices } from '@/store/storeRuntimeServices';

describe('craftingStore queue popup visibility', () => {
  beforeEach(() => {
    setStoreRuntimeServices({
      dataQuery: {
        getRecipe: vi.fn(),
        getItemsByRow: vi.fn(),
      },
      fuelService: {
        initializeFuelBuffer: vi.fn(),
        addFuel: vi.fn(),
        smartFuelDistribution: vi.fn(),
        updateFuelConsumption: vi.fn(),
        getFuelPriority: vi.fn(),
        isFuelCompatible: vi.fn(),
      },
      gameLoopService: {
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
      },
      gameStorage: {
        clearGameData: vi.fn(),
        saveGame: vi.fn(),
        loadGame: vi.fn(),
        forceSaveGame: vi.fn(),
      },
      recipeQuery: {
        getRecipeById: vi.fn(),
        getUnlockedRecipesThatProduce: vi.fn(),
        getUnlockedMostEfficientRecipe: vi.fn(),
        getRecipeStats: vi.fn(),
        searchRecipes: vi.fn(),
        getAllRecipes: vi.fn(),
      },
      technologyService: {
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
      },
    });

    useGameStore.setState(state => ({
      ...state,
      craftingQueue: [],
      craftingChains: [],
      production: {
        ...state.production,
        showCraftingQueue: false,
      },
    }));
  });

  afterEach(() => {
    resetStoreRuntimeServices();
  });

  it('opens crafting queue popup when first crafting task is added', () => {
    act(() => {
      useGameStore.getState().addCraftingTask({
        recipeId: 'wood-mining',
        itemId: 'wood',
        quantity: 1,
        progress: 0,
        startTime: 0,
        craftingTime: 0.5,
        status: 'pending',
      });
    });

    expect(useGameStore.getState().production.showCraftingQueue).toBe(true);
  });

  it('opens crafting queue popup when first crafting chain is added', () => {
    act(() => {
      useGameStore.getState().addCraftingChain({
        name: '制作木材(含依赖)',
        tasks: [
          {
            id: 'chain_task_1',
            recipeId: 'wood-mining',
            itemId: 'wood',
            quantity: 1,
            progress: 0,
            startTime: 0,
            craftingTime: 0.5,
            status: 'pending',
          },
        ],
        finalProduct: {
          itemId: 'wood',
          quantity: 1,
        },
        status: 'pending',
        totalProgress: 0,
      });
    });

    expect(useGameStore.getState().production.showCraftingQueue).toBe(true);
  });

  it('closes crafting queue popup after removing the last task', () => {
    act(() => {
      useGameStore.getState().addCraftingTask({
        recipeId: 'wood-mining',
        itemId: 'wood',
        quantity: 1,
        progress: 0,
        startTime: 0,
        craftingTime: 0.5,
        status: 'pending',
      });
    });

    const [task] = useGameStore.getState().craftingQueue;
    expect(task).toBeDefined();

    act(() => {
      useGameStore.getState().removeCraftingTask(task.id);
    });

    expect(useGameStore.getState().craftingQueue).toHaveLength(0);
    expect(useGameStore.getState().production.showCraftingQueue).toBe(false);
  });
});
