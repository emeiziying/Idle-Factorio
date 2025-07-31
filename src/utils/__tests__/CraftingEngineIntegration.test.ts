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

describe('CraftingEngine Business Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should maintain singleton pattern', async () => {
    const { default: CraftingEngine } = await import('../craftingEngine');
    
    const instance1 = CraftingEngine.getInstance();
    const instance2 = CraftingEngine.getInstance();
    
    expect(instance1).toBe(instance2);
  });

  it('should report not running (loop management moved to MainGameLoop)', async () => {
    const { default: CraftingEngine } = await import('../craftingEngine');
    
    const craftingEngine = CraftingEngine.getInstance();
    
    // CraftingEngine is now a pure business logic class - always returns false
    expect(craftingEngine.isRunning()).toBe(false);
  });

  it('should provide crafting time calculation', async () => {
    const { default: CraftingEngine } = await import('../craftingEngine');
    
    const craftingEngine = CraftingEngine.getInstance();
    
    const testRecipe = {
      id: 'test-recipe',
      name: 'Test Recipe',
      time: 2,
      in: { 'iron-ore': 2 },
      out: { 'iron-plate': 1 },
      category: 'smelting',
      producers: ['furnace']
    };
    
    const craftingTime = craftingEngine.calculateCraftingTime(testRecipe, 5);
    
    expect(craftingTime).toBeGreaterThan(0);
    expect(typeof craftingTime).toBe('number');
  });

  it('should provide productivity bonus calculation', async () => {
    const { default: CraftingEngine } = await import('../craftingEngine');
    
    const craftingEngine = CraftingEngine.getInstance();
    
    const testRecipe = {
      id: 'test-recipe',
      name: 'Test Recipe',
      time: 2,
      in: { 'iron-ore': 2 },
      out: { 'iron-plate': 1 },
      category: 'smelting',
      producers: ['furnace']
    };
    
    const productivityBonus = craftingEngine.getProductivityBonus(testRecipe);
    
    expect(typeof productivityBonus).toBe('number');
    expect(productivityBonus).toBeGreaterThanOrEqual(0);
  });
});