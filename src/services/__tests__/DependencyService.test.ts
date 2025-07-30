import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import DependencyService from '../DependencyService';
import { RecipeService } from '../RecipeService';
import ManualCraftingValidator from '../../utils/manualCraftingValidator';
import type { Recipe } from '../../types/index';
import type { ManualCraftingValidation } from '../../utils/manualCraftingValidator';

// Mock dependencies
vi.mock('../RecipeService');
vi.mock('../../utils/manualCraftingValidator');

const mockRecipeService = vi.mocked(RecipeService);
const mockValidator = vi.mocked(ManualCraftingValidator);

describe('DependencyService', () => {
  let dependencyService: DependencyService;
  let mockValidatorInstance: {
    validateManualCrafting: ReturnType<typeof vi.fn>;
    validateRecipe: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock validator instance with proper return values
    const mockValidation: ManualCraftingValidation = {
      canCraftManually: true,
      reason: 'basic_crafting',
      category: 'craftable'
    };
    
    mockValidatorInstance = {
      validateManualCrafting: vi.fn().mockReturnValue(mockValidation),
      validateRecipe: vi.fn().mockReturnValue(mockValidation)
    };
    mockValidator.getInstance.mockReturnValue(mockValidatorInstance as unknown as ManualCraftingValidator);
    
    // Reset the singleton instance to ensure fresh mocks
    (DependencyService as unknown as { instance?: DependencyService }).instance = undefined;
    dependencyService = DependencyService.getInstance();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = DependencyService.getInstance();
      const instance2 = DependencyService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('hasMissingDependencies', () => {
    const mockInventory = new Map([
      ['iron-ore', { currentAmount: 10 }],
      ['iron-plate', { currentAmount: 2 }]
    ]);

    const mockRecipe: Recipe = {
      id: 'iron-gear-wheel',
      name: 'Iron Gear Wheel',
      time: 0.5,
      in: { 'iron-plate': 2 },
      out: { 'iron-gear-wheel': 1 },
      category: 'crafting'
    };

    beforeEach(() => {
      mockRecipeService.getRecipesThatProduce.mockReturnValue([mockRecipe]);
    });

    it('should return false when all dependencies are satisfied', () => {
      const result = dependencyService.hasMissingDependencies('iron-gear-wheel', 1, mockInventory);
      
      expect(result).toBe(false);
    });

    it('should return true when dependencies are missing', () => {
      const result = dependencyService.hasMissingDependencies('iron-gear-wheel', 3, mockInventory);
      
      expect(result).toBe(true);
    });

    it('should return false when no recipe is available', () => {
      mockRecipeService.getRecipesThatProduce.mockReturnValue([]);
      
      const result = dependencyService.hasMissingDependencies('unknown-item', 1, mockInventory);
      
      expect(result).toBe(false);
    });
  });

  describe('calculateChainDuration', () => {
    const mockChain = {
      mainTask: {
        itemId: 'iron-plate',
        quantity: 5,
        recipe: {
          id: 'iron-plate',
          name: 'Iron Plate',
          time: 3.2,
          in: { 'iron-ore': 1 },
          out: { 'iron-plate': 1 },
          category: 'smelting'
        }
      },
      dependencies: [
        {
          itemId: 'iron-ore',
          required: 5,
          available: 0,
          shortage: 5,
          recipe: {
            id: 'iron-ore-mining',
            name: 'Iron Ore Mining',
            time: 1,
            in: {},
            out: { 'iron-ore': 1 },
            category: 'mining',
            flags: ['mining']
          },
          canCraftManually: true
        }
      ],
      tasks: [
        {
          id: 'chain_1',
          recipeId: 'manual_iron-ore',
          itemId: 'iron-ore',
          quantity: 5,
          progress: 0,
          startTime: 0,
          craftingTime: 1,
          status: 'pending' as const
        },
        {
          id: 'chain_2',
          recipeId: 'manual_iron-plate',
          itemId: 'iron-plate',
          quantity: 5,
          progress: 0,
          startTime: 0,
          craftingTime: 3.2,
          status: 'pending' as const
        }
      ],
      totalItems: 2,
      totalRawMaterialNeeds: new Map()
    };

    it('should calculate total duration correctly', () => {
      const duration = dependencyService.calculateChainDuration(mockChain);
      
      // Expected: (5 * 1 / 0.5) + (5 * 3.2 / 0.5) = 10 + 32 = 42 seconds
      expect(duration).toBe(42);
    });

    it('should handle chain with single task', () => {
      const singleTaskChain = {
        ...mockChain,
        tasks: [mockChain.tasks[1]] // Only main task
      };
      
      const duration = dependencyService.calculateChainDuration(singleTaskChain);
      
      // Expected: 5 * 3.2 / 0.5 = 32 seconds
      expect(duration).toBe(32);
    });

    it('should handle tasks with default crafting time', () => {
      const chainWithDefaultTime = {
        ...mockChain,
        tasks: [
          {
            ...mockChain.tasks[0],
            craftingTime: 1 // Use default time
          }
        ]
      };
      
      const duration = dependencyService.calculateChainDuration(chainWithDefaultTime);
      
      // Expected: 5 * 1 / 0.5 = 10 seconds
      expect(duration).toBe(10);
    });
  });

  describe('analyzeCraftingChain - basic functionality', () => {
    const mockInventory = new Map([
      ['iron-ore', { currentAmount: 10 }],
      ['copper-ore', { currentAmount: 5 }],
      ['coal', { currentAmount: 20 }]
    ]);



    it('should return null when no manual crafting recipe available', () => {
      mockRecipeService.getRecipesThatProduce.mockReturnValue([]);
      
      const result = dependencyService.analyzeCraftingChain('unknown-item', 1, mockInventory);
      
      expect(result).toBeNull();
    });

    it('should return null when insufficient raw materials', () => {
      // Mock recipe that requires more iron ore than available
      const expensiveRecipe: Recipe = {
        id: 'expensive-item',
        name: 'Expensive Item',
        time: 1,
        in: { 'iron-ore': 5 },
        out: { 'expensive-item': 1 },
        category: 'crafting'
      };
      
      // Mock to return empty array for iron-ore to prevent recursion
      mockRecipeService.getRecipesThatProduce
        .mockReturnValueOnce([expensiveRecipe]) // For expensive-item
        .mockReturnValue([]); // For iron-ore (no recipes to prevent recursion)
      
      const result = dependencyService.analyzeCraftingChain('expensive-item', 3, mockInventory);
      
      expect(result).toBeNull();
    });

    it('should handle mining recipes correctly', () => {
      const miningRecipe: Recipe = {
        id: 'iron-ore-mining',
        name: 'Iron Ore Mining',
        time: 1,
        in: {},
        out: { 'iron-ore': 1 },
        category: 'mining',
        flags: ['mining']
      };
      
      mockRecipeService.getRecipesThatProduce.mockReturnValue([miningRecipe]);
      
      const result = dependencyService.analyzeCraftingChain('iron-ore', 5, mockInventory);
      
      expect(result).toBeDefined();
      expect(result?.dependencies).toHaveLength(0); // Mining recipes have no dependencies
    });
  });
}); 