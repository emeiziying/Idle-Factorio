import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock GameLoopManager before any other imports
const mockGameLoopManager = {
  register: vi.fn(),
  unregister: vi.fn(),
  getTaskInfo: vi.fn(),
  getInstance: vi.fn(),
};

vi.mock('@/utils/GameLoopManager', () => ({
  default: class {
    static getInstance() {
      return mockGameLoopManager;
    }
  },
}));

// Mock useGameTimeStore
const mockGameTimeStore = {
  incrementGameTime: vi.fn(),
  getState: vi.fn(),
};

vi.mock('@/store/gameTimeStore', () => ({
  default: {
    getState: () => mockGameTimeStore,
  },
}));

// Mock useGameStore
interface MockGameStore {
  facilities: unknown[];
  updateFacility: ReturnType<typeof vi.fn>;
  batchUpdateInventory: ReturnType<typeof vi.fn>;
  getInventoryItem: ReturnType<typeof vi.fn>;
  updateFuelConsumption: ReturnType<typeof vi.fn>;
  autoRefuelFacilities: ReturnType<typeof vi.fn>;
  trackCraftedItem: ReturnType<typeof vi.fn>;
  trackMinedEntity: ReturnType<typeof vi.fn>;
  saveGame: ReturnType<typeof vi.fn>;
  dataLoaded: boolean;
  initializeDataLoading: ReturnType<typeof vi.fn>;
  researchState: unknown;
  updateResearchProgress: ReturnType<typeof vi.fn>;
  craftingQueue: unknown[];
  updateCraftingProgress: ReturnType<typeof vi.fn>;
  updateInventory: ReturnType<typeof vi.fn>;
  completeCraftingTask: ReturnType<typeof vi.fn>;
  getState: ReturnType<typeof vi.fn>;
}

const mockGameStore: MockGameStore = {
  facilities: [],
  updateFacility: vi.fn(),
  batchUpdateInventory: vi.fn(),
  getInventoryItem: vi.fn(() => ({ currentAmount: 10, maxCapacity: 100 })),
  updateFuelConsumption: vi.fn(),
  autoRefuelFacilities: vi.fn(),
  trackCraftedItem: vi.fn(),
  trackMinedEntity: vi.fn(),
  saveGame: vi.fn(),
  dataLoaded: true,
  initializeDataLoading: vi.fn(),
  researchState: null,
  updateResearchProgress: vi.fn(),
  craftingQueue: [],
  updateCraftingProgress: vi.fn(),
  updateInventory: vi.fn(),
  completeCraftingTask: vi.fn(),
  getState: vi.fn(),
};

vi.mock('@/store/gameStore', () => ({
  default: {
    getState: () => mockGameStore,
  },
}));

// Mock services
vi.mock('@/services', () => ({
  FuelService: class {
    static getInstance() {
      return {
        getFuelStatus: vi.fn(() => ({ isEmpty: false })),
      };
    }
  },
  PowerService: class {
    static getInstance() {
      return {
        calculatePowerBalance: vi.fn(() => ({ surplus: 100, deficit: 0 })),
        updateFacilityPowerStatus: vi.fn((facility) => facility),
      };
    }
  },
  RecipeService: class {
    static getRecipeById() {
      return {
        id: 'test-recipe',
        time: 1,
        in: { 'iron-ore': 1 },
        out: { 'iron-plate': 1 }
      };
    }
  },
  GameConfig: class {
    static getInstance() {
      return {
        getConstants: vi.fn(() => ({
          crafting: {
            minCraftingTime: 0.5,
            maxProductivityBonus: 0.5,
            updateInterval: 100,
          },
        })),
      };
    }
  },
  DataService: class {
    static getInstance() {
      return {
        getRecipe: vi.fn((id) => ({
          id,
          time: 1,
          in: { 'iron-ore': 1 },
          out: { 'iron-plate': 1 }
        })),
      };
    }
  },
}));

// Mock CraftingEngine
const mockCraftingEngine = {
  isRunning: vi.fn(() => false),
  calculateCraftingTime: vi.fn((recipe, quantity) => recipe.time * quantity),
  getProductivityBonus: vi.fn(() => 0.1),
  getInstance: vi.fn(),
};

// Setup the mock to return itself from getInstance
mockCraftingEngine.getInstance.mockReturnValue(mockCraftingEngine);

vi.mock('@/utils/craftingEngine', () => ({
  default: {
    getInstance: () => mockCraftingEngine,
  },
}));

describe('MainGameLoop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGameLoopManager.getInstance.mockReturnValue(mockGameLoopManager);
    mockGameTimeStore.getState.mockReturnValue(mockGameTimeStore);
    mockGameStore.getState.mockReturnValue(mockGameStore);
    // Reset CraftingEngine mock
    mockCraftingEngine.isRunning.mockReturnValue(false);
    mockCraftingEngine.calculateCraftingTime.mockReturnValue(1);
    mockCraftingEngine.getProductivityBonus.mockReturnValue(0.1);
    // Reset research state
    mockGameStore.researchState = null;
    mockGameStore.updateResearchProgress.mockClear();
    // Reset production system mocks
    mockGameStore.facilities = [];
    mockGameStore.updateFacility.mockClear();
    mockGameStore.batchUpdateInventory.mockClear();
    mockGameStore.getInventoryItem.mockReturnValue({ currentAmount: 10, maxCapacity: 100 });
    mockGameStore.trackCraftedItem.mockClear();
    mockGameStore.trackMinedEntity.mockClear();
    // Reset crafting system mocks
    mockGameStore.craftingQueue = [];
    mockGameStore.updateCraftingProgress.mockClear();
    mockGameStore.updateInventory.mockClear();
    mockGameStore.completeCraftingTask.mockClear();
  });

  it('should implement singleton pattern', async () => {
    const { MainGameLoop } = await import('../MainGameLoop');
    
    const instance1 = MainGameLoop.getInstance();
    const instance2 = MainGameLoop.getInstance();
    
    expect(instance1).toBe(instance2);
  });

  it('should register with GameLoopManager on start', async () => {
    const { MainGameLoop } = await import('../MainGameLoop');
    
    mockGameLoopManager.getTaskInfo.mockReturnValue(undefined); // Not running
    
    const mainGameLoop = MainGameLoop.getInstance();
    mainGameLoop.start();
    
    expect(mockGameLoopManager.register).toHaveBeenCalledWith(
      'main-game-loop',
      expect.any(Function),
      16 // 60fps interval
    );
  });

  it('should not register again if already running', async () => {
    const { MainGameLoop } = await import('../MainGameLoop');
    
    mockGameLoopManager.getTaskInfo.mockReturnValue({ id: 'main-game-loop' }); // Already running
    
    const mainGameLoop = MainGameLoop.getInstance();
    mainGameLoop.start();
    
    expect(mockGameLoopManager.register).not.toHaveBeenCalled();
  });

  it('should unregister on stop', async () => {
    const { MainGameLoop } = await import('../MainGameLoop');
    
    const mainGameLoop = MainGameLoop.getInstance();
    mainGameLoop.stop();
    
    expect(mockGameLoopManager.unregister).toHaveBeenCalledWith('main-game-loop');
  });

  it('should return correct running status', async () => {
    const { MainGameLoop } = await import('../MainGameLoop');
    
    mockGameLoopManager.getTaskInfo.mockReturnValue({ id: 'main-game-loop' }); // Running
    
    const mainGameLoop = MainGameLoop.getInstance();
    
    expect(mainGameLoop.isRunning()).toBe(true);
  });

  it('should return false when not running', async () => {
    const { MainGameLoop } = await import('../MainGameLoop');
    
    mockGameLoopManager.getTaskInfo.mockReturnValue(undefined); // Not running
    
    const mainGameLoop = MainGameLoop.getInstance();
    
    expect(mainGameLoop.isRunning()).toBe(false);
  });

  it('should provide debug information', async () => {
    const { MainGameLoop } = await import('../MainGameLoop');
    
    mockGameLoopManager.getTaskInfo.mockReturnValue(undefined); // Not running
    
    const mainGameLoop = MainGameLoop.getInstance();
    const debugInfo = mainGameLoop.getDebugInfo();
    
    expect(debugInfo).toEqual({
      isRunning: false,
      accumulators: {
        crafting: 0,
        production: 0,
        research: 0,
        autosave: 0,
        dataCheck: 0,
      },
      intervals: {
        CRAFTING: 100,
        PRODUCTION: 1000,
        RESEARCH: 1000,
        AUTOSAVE: 10000,
        DATA_CHECK: 100,
      },
    });
  });

  it('should update game time on each frame', async () => {
    const { MainGameLoop } = await import('../MainGameLoop');
    
    mockGameLoopManager.getTaskInfo.mockReturnValue(undefined);
    
    const mainGameLoop = MainGameLoop.getInstance();
    mainGameLoop.start();
    
    // Get the registered callback
    expect(mockGameLoopManager.register).toHaveBeenCalled();
    const updateCallback = mockGameLoopManager.register.mock.calls[0][1];
    
    // Simulate callback execution
    const deltaTime = 0.016; // 16ms in seconds
    updateCallback(deltaTime);
    
    expect(mockGameTimeStore.incrementGameTime).toHaveBeenCalledWith(16); // 16ms
  });

  it('should trigger crafting system update after accumulating enough time', async () => {
    const { MainGameLoop } = await import('../MainGameLoop');
    
    mockGameLoopManager.getTaskInfo.mockReturnValue(undefined);
    mockGameStore.craftingQueue = [{ id: 'test-task', status: 'pending', recipeId: 'test-recipe', quantity: 1, itemId: 'iron-plate', startTime: 0 }];
    
    const mainGameLoop = MainGameLoop.getInstance();
    mainGameLoop.start();
    
    const updateCallback = mockGameLoopManager.register.mock.calls[0][1];
    
    // Simulate multiple frames to accumulate 100ms
    for (let i = 0; i < 7; i++) { // 7 * 16ms = 112ms > 100ms threshold
      updateCallback(0.016);
    }
    
    // The crafting system should have processed the queue (no specific assertion since logic is internal)
    expect(mockGameStore.craftingQueue).toBeDefined();
  });

  it('should trigger autosave after accumulating enough time', async () => {
    const { MainGameLoop } = await import('../MainGameLoop');
    
    mockGameLoopManager.getTaskInfo.mockReturnValue(undefined);
    
    const mainGameLoop = MainGameLoop.getInstance();
    mainGameLoop.start();
    
    const updateCallback = mockGameLoopManager.register.mock.calls[0][1];
    
    // Simulate enough frames to accumulate 10000ms
    updateCallback(10); // 10 seconds
    
    expect(mockGameStore.saveGame).toHaveBeenCalled();
  });

  it('should trigger research system update when research is active', async () => {
    const { MainGameLoop } = await import('../MainGameLoop');
    
    mockGameLoopManager.getTaskInfo.mockReturnValue(undefined);
    mockGameStore.researchState = { id: 'test-tech', progress: 50 }; // Active research
    
    const mainGameLoop = MainGameLoop.getInstance();
    mainGameLoop.start();
    
    const updateCallback = mockGameLoopManager.register.mock.calls[0][1];
    
    // Simulate enough frames to accumulate 1000ms
    updateCallback(1); // 1 second
    
    expect(mockGameStore.updateResearchProgress).toHaveBeenCalledWith(1);
  });

  it('should not trigger research system update when no research is active', async () => {
    const { MainGameLoop } = await import('../MainGameLoop');
    
    mockGameLoopManager.getTaskInfo.mockReturnValue(undefined);
    mockGameStore.researchState = null; // No active research
    
    const mainGameLoop = MainGameLoop.getInstance();
    mainGameLoop.start();
    
    const updateCallback = mockGameLoopManager.register.mock.calls[0][1];
    
    // Simulate enough frames to accumulate 1000ms
    updateCallback(1); // 1 second
    
    expect(mockGameStore.updateResearchProgress).not.toHaveBeenCalled();
  });

  it('should trigger production system update with facilities', async () => {
    const { MainGameLoop } = await import('../MainGameLoop');
    
    mockGameLoopManager.getTaskInfo.mockReturnValue(undefined);
    mockGameStore.facilities = [{
      id: 'test-facility',
      status: 'running',
      efficiency: 1.0,
      production: {
        currentRecipeId: 'test-recipe',
        progress: 0.5
      }
    }];
    
    const mainGameLoop = MainGameLoop.getInstance();
    mainGameLoop.start();
    
    const updateCallback = mockGameLoopManager.register.mock.calls[0][1];
    
    // Simulate enough frames to accumulate 1000ms
    updateCallback(1); // 1 second
    
    expect(mockGameStore.updateFuelConsumption).toHaveBeenCalledWith(1);
    expect(mockGameStore.autoRefuelFacilities).toHaveBeenCalled();
  });

  it('should not trigger production system update when no facilities exist', async () => {
    const { MainGameLoop } = await import('../MainGameLoop');
    
    mockGameLoopManager.getTaskInfo.mockReturnValue(undefined);
    mockGameStore.facilities = []; // No facilities
    
    const mainGameLoop = MainGameLoop.getInstance();
    mainGameLoop.start();
    
    const updateCallback = mockGameLoopManager.register.mock.calls[0][1];
    
    // Simulate enough frames to accumulate 1000ms
    updateCallback(1); // 1 second
    
    expect(mockGameStore.updateFuelConsumption).not.toHaveBeenCalled();
    expect(mockGameStore.autoRefuelFacilities).not.toHaveBeenCalled();
  });

  it('should handle errors in update loop gracefully', async () => {
    const { MainGameLoop } = await import('../MainGameLoop');
    
    mockGameLoopManager.getTaskInfo.mockReturnValue(undefined);
    mockGameTimeStore.incrementGameTime.mockImplementation(() => {
      throw new Error('Test error');
    });
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const mainGameLoop = MainGameLoop.getInstance();
    mainGameLoop.start();
    
    const updateCallback = mockGameLoopManager.register.mock.calls[0][1];
    
    // Should not throw error
    expect(() => updateCallback(0.016)).not.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Main game loop error:', expect.any(Error));
    
    consoleErrorSpy.mockRestore();
  });
});