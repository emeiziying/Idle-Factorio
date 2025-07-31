import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock GameLoopManager before any other imports
const mockGameLoopManager = {
  register: vi.fn(),
  unregister: vi.fn(),
  getTaskInfo: vi.fn(),
  getInstance: vi.fn(),
};

vi.mock('../GameLoopManager', () => ({
  default: class {
    static getInstance() {
      return mockGameLoopManager;
    }
  },
}));

// Mock services to prevent import issues
vi.mock('@/services', () => ({
  GameConfig: class {
    static getInstance() {
      return {
        getConstants: vi.fn(() => ({
          crafting: {
            updateInterval: 100,
            minCraftingTime: 0.1,
            maxProductivityBonus: 0.5,
          },
        })),
      };
    }
  },
  DataService: class {
    static getInstance() {
      return {
        getRecipe: vi.fn(),
        getItem: vi.fn(),
      };
    }
  },
  RecipeService: class {
    static getRecipesThatProduce() {
      return [];
    }
    static getRecipeById() {
      return null;
    }
  },
}));

// Mock gameStore
vi.mock('@/store/gameStore', () => ({
  default: {
    getState: vi.fn(() => ({
      craftingQueue: [],
      updateCraftingProgress: vi.fn(),
      completeCraftingTask: vi.fn(),
      updateInventory: vi.fn(),
      trackMinedEntity: vi.fn(),
    })),
  },
}));

describe('CraftingEngine GameLoopManager Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGameLoopManager.getInstance.mockReturnValue(mockGameLoopManager);
  });

  it('should integrate with GameLoopManager correctly', async () => {
    // Dynamic import to ensure mocks are in place
    const { default: CraftingEngine } = await import('../craftingEngine');
    
    const craftingEngine = CraftingEngine.getInstance();
    
    // Test start
    mockGameLoopManager.getTaskInfo.mockReturnValue(null); // Not running
    
    craftingEngine.start();
    
    expect(mockGameLoopManager.register).toHaveBeenCalledWith(
      'crafting-engine',
      expect.any(Function),
      100
    );
    
    // Test stop
    mockGameLoopManager.getTaskInfo.mockReturnValue({ id: 'crafting-engine' }); // Running
    
    craftingEngine.stop();
    
    expect(mockGameLoopManager.unregister).toHaveBeenCalledWith('crafting-engine');
  });

  it('should not start if already running', async () => {
    const { default: CraftingEngine } = await import('../craftingEngine');
    
    const craftingEngine = CraftingEngine.getInstance();
    
    mockGameLoopManager.getTaskInfo.mockReturnValue({ id: 'crafting-engine' }); // Already running
    
    craftingEngine.start();
    
    expect(mockGameLoopManager.register).not.toHaveBeenCalled();
  });

  it('should maintain singleton pattern', async () => {
    const { default: CraftingEngine } = await import('../craftingEngine');
    
    const instance1 = CraftingEngine.getInstance();
    const instance2 = CraftingEngine.getInstance();
    
    expect(instance1).toBe(instance2);
  });
});