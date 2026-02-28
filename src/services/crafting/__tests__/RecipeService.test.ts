import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecipeService } from '../RecipeService';
import type { Recipe } from '../../../types/index';

// 使用相对路径 mock（测试文件规范）
vi.mock('../../../data/customRecipes', () => ({
  CUSTOM_RECIPES: [],
}));

vi.mock('../../core/DIServiceInitializer', () => ({
  getService: vi.fn(),
}));

import { getService } from '../../core/DIServiceInitializer';

// 测试用配方数据
const makeRecipe = (overrides: Partial<Recipe>): Recipe => ({
  id: 'test-recipe',
  name: 'Test Recipe',
  category: 'intermediate-products',
  time: 1,
  in: {},
  out: { 'test-item': 1 },
  ...overrides,
});

describe('RecipeService', () => {
  let service: RecipeService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RecipeService();
  });

  // ======== 初始化与索引构建 ========
  describe('initializeRecipes', () => {
    it('should merge data.json recipes with custom recipes', () => {
      const dataRecipes: Recipe[] = [makeRecipe({ id: 'iron-plate', out: { 'iron-plate': 1 } })];
      service.initializeRecipes(dataRecipes);
      // CUSTOM_RECIPES mocked as [], so only data recipe
      expect(service.getAllRecipes()).toHaveLength(1);
      expect(service.getAllRecipes()[0].id).toBe('iron-plate');
    });

    it('should build index for output items', () => {
      const recipe = makeRecipe({
        id: 'iron-gear-wheel',
        out: { 'iron-gear-wheel': 1 },
        in: { 'iron-plate': 2 },
      });
      service.initializeRecipes([recipe]);
      expect(service.getRecipesThatProduce('iron-gear-wheel')).toHaveLength(1);
    });

    it('should build index for input items without duplicates', () => {
      const recipe = makeRecipe({
        id: 'iron-gear-wheel',
        out: { 'iron-gear-wheel': 1 },
        in: { 'iron-plate': 2 },
      });
      service.initializeRecipes([recipe]);
      const byItem = service.getRecipesByItem('iron-plate');
      // Should appear once, not twice
      expect(byItem.filter(r => r.id === 'iron-gear-wheel')).toHaveLength(1);
    });
  });

  // ======== 配方查询 ========
  describe('getRecipesThatProduce', () => {
    it('should return recipes producing the given item', () => {
      const recipes = [
        makeRecipe({ id: 'r1', out: { copper: 1 } }),
        makeRecipe({ id: 'r2', out: { iron: 1 } }),
        makeRecipe({ id: 'r3', out: { copper: 2, byproduct: 1 } }),
      ];
      service.initializeRecipes(recipes);
      const result = service.getRecipesThatProduce('copper');
      expect(result).toHaveLength(2);
      expect(result.map(r => r.id)).toContain('r1');
      expect(result.map(r => r.id)).toContain('r3');
    });

    it('should return empty array when no recipe produces the item', () => {
      service.initializeRecipes([makeRecipe({ id: 'r1', out: { copper: 1 } })]);
      expect(service.getRecipesThatProduce('gold')).toHaveLength(0);
    });
  });

  describe('getRecipesThatUse', () => {
    it('should return recipes that consume the given item', () => {
      const recipes = [
        makeRecipe({ id: 'r1', in: { 'iron-plate': 2 }, out: { gear: 1 } }),
        makeRecipe({ id: 'r2', in: { copper: 1 }, out: { wire: 2 } }),
      ];
      service.initializeRecipes(recipes);
      expect(service.getRecipesThatUse('iron-plate')).toHaveLength(1);
      expect(service.getRecipesThatUse('iron-plate')[0].id).toBe('r1');
    });
  });

  describe('getRecipeById', () => {
    it('should find recipe by id', () => {
      const recipe = makeRecipe({ id: 'special-recipe' });
      service.initializeRecipes([recipe]);
      expect(service.getRecipeById('special-recipe')).toBeDefined();
      expect(service.getRecipeById('nonexistent')).toBeUndefined();
    });
  });

  describe('getMiningRecipes', () => {
    it('should return only recipes with mining flag', () => {
      const recipes = [
        makeRecipe({ id: 'mine-iron', flags: ['mining'], out: { 'iron-ore': 1 } }),
        makeRecipe({ id: 'smelt-iron', out: { 'iron-plate': 1 } }),
      ];
      service.initializeRecipes(recipes);
      expect(service.getMiningRecipes()).toHaveLength(1);
      expect(service.getMiningRecipes()[0].id).toBe('mine-iron');
    });
  });

  // ======== 效率计算 ========
  describe('getRecipeEfficiency', () => {
    it('should compute output per second for specific item', () => {
      const recipe = makeRecipe({ id: 'r1', time: 2, out: { copper: 4 } });
      service.initializeRecipes([recipe]);
      expect(service.getRecipeEfficiency(recipe, 'copper')).toBeCloseTo(2.0);
    });

    it('should return 0 for zero time recipes', () => {
      const recipe = makeRecipe({ id: 'r1', time: 0, out: { copper: 4 } });
      service.initializeRecipes([recipe]);
      expect(service.getRecipeEfficiency(recipe, 'copper')).toBe(0);
    });

    it('should return 0 when item not in recipe output', () => {
      const recipe = makeRecipe({ id: 'r1', time: 2, out: { copper: 4 } });
      service.initializeRecipes([recipe]);
      expect(service.getRecipeEfficiency(recipe, 'iron')).toBe(0);
    });
  });

  describe('getMostEfficientRecipe', () => {
    it('should pick recipe with highest output rate', () => {
      const slow = makeRecipe({ id: 'slow', time: 4, out: { copper: 1 } }); // 0.25/s
      const fast = makeRecipe({ id: 'fast', time: 1, out: { copper: 2 } }); // 2/s
      service.initializeRecipes([slow, fast]);
      expect(service.getMostEfficientRecipe('copper')?.id).toBe('fast');
    });
  });

  // ======== 解锁检查（修复验证）========
  describe('getAllManualCraftingRecipes - unlock check', () => {
    it('should call isRecipeUnlocked (not isItemUnlocked) for filtering', () => {
      const mockValidator = {
        validateManualCrafting: vi.fn().mockReturnValue({ canCraftManually: true }),
        validateRecipe: vi.fn().mockReturnValue({ canCraftManually: true }),
      };
      const mockTechService = {
        isRecipeUnlocked: vi.fn().mockReturnValue(true),
        isItemUnlocked: vi.fn().mockReturnValue(false), // Should NOT be called
      };

      vi.mocked(getService).mockImplementation((token: symbol | string) => {
        if (token === 'ManualCraftingValidator') return mockValidator;
        if (token === 'TechnologyService') return mockTechService;
        return null;
      });

      const recipe = makeRecipe({
        id: 'copper-cable',
        out: { 'copper-cable': 2 },
        in: { copper: 1 },
      });
      service.initializeRecipes([recipe]);

      service.getAllManualCraftingRecipes('copper-cable');

      expect(mockTechService.isRecipeUnlocked).toHaveBeenCalledWith('copper-cable');
      expect(mockTechService.isItemUnlocked).not.toHaveBeenCalled();
    });

    it('should exclude recipes where isRecipeUnlocked returns false', () => {
      const mockValidator = {
        validateManualCrafting: vi.fn().mockReturnValue({ canCraftManually: true }),
        validateRecipe: vi.fn().mockReturnValue({ canCraftManually: true }),
      };
      const mockTechService = {
        isRecipeUnlocked: vi.fn().mockReturnValue(false),
        isItemUnlocked: vi.fn(),
      };

      vi.mocked(getService).mockImplementation((token: symbol | string) => {
        if (token === 'ManualCraftingValidator') return mockValidator;
        if (token === 'TechnologyService') return mockTechService;
        return null;
      });

      const recipe = makeRecipe({
        id: 'locked-recipe',
        out: { 'locked-item': 1 },
        in: { copper: 1 },
      });
      service.initializeRecipes([recipe]);

      const result = service.getAllManualCraftingRecipes('locked-item');
      expect(result).toHaveLength(0);
    });
  });

  // ======== 循环依赖保护（修复验证）========
  describe('calculateRecipeCost - cycle detection', () => {
    it('should not infinite-loop on self-referencing recipes', () => {
      // 配方 A 的输入包含 A 自身（极端循环情况）
      const cycleRecipe = makeRecipe({ id: 'cyclic', in: { cyclic: 1 }, out: { cyclic: 2 } });
      service.initializeRecipes([cycleRecipe]);

      // Should complete without stack overflow
      expect(() => service.calculateRecipeCost(cycleRecipe, true)).not.toThrow();
    });

    it('should not infinite-loop on mutual dependency (A needs B, B needs A)', () => {
      const recipeA = makeRecipe({ id: 'recipe-a', in: { 'item-b': 1 }, out: { 'item-a': 1 } });
      const recipeB = makeRecipe({ id: 'recipe-b', in: { 'item-a': 1 }, out: { 'item-b': 1 } });
      service.initializeRecipes([recipeA, recipeB]);

      expect(() => service.calculateRecipeCost(recipeA, true)).not.toThrow();
      expect(() => service.calculateRecipeCost(recipeB, true)).not.toThrow();
    });

    it('should correctly calculate costs for non-cyclic recipes', () => {
      // iron-plate needs iron-ore (raw), gear needs 2 iron-plate
      const ironOreRecipe = makeRecipe({
        id: 'iron-plate',
        in: { 'iron-ore': 1 },
        out: { 'iron-plate': 1 },
      });
      const gearRecipe = makeRecipe({
        id: 'gear',
        in: { 'iron-plate': 2 },
        out: { 'iron-gear-wheel': 1 },
      });
      service.initializeRecipes([ironOreRecipe, gearRecipe]);

      const cost = service.calculateRecipeCost(gearRecipe, true);
      // Direct cost: 2 iron-plate
      expect(cost.directCost.get('iron-plate')).toBe(2);
      // Raw materials: 2 iron-ore (since each iron-plate needs 1 iron-ore)
      expect(cost.rawMaterials.get('iron-ore')).toBe(2);
    });
  });

  // ======== 科技解锁联动（新方法验证）========
  describe('getUnlockedRecipesThatProduce', () => {
    const setupWithTechService = (unlockedRecipeIds: string[]) => {
      const mockTechService = {
        isRecipeUnlocked: vi.fn((id: string) => unlockedRecipeIds.includes(id)),
      };
      vi.mocked(getService).mockImplementation((token: symbol | string) => {
        if (token === 'TechnologyService') return mockTechService;
        return null;
      });
      return mockTechService;
    };

    it('should return only unlocked recipes', () => {
      const recipes = [
        makeRecipe({ id: 'r-locked', out: { copper: 1 } }),
        makeRecipe({ id: 'r-unlocked', out: { copper: 1 } }),
      ];
      service.initializeRecipes(recipes);
      setupWithTechService(['r-unlocked']);

      const result = service.getUnlockedRecipesThatProduce('copper');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('r-unlocked');
    });

    it('should return empty array when all recipes are locked', () => {
      const recipe = makeRecipe({ id: 'locked', out: { copper: 1 } });
      service.initializeRecipes([recipe]);
      setupWithTechService([]);

      expect(service.getUnlockedRecipesThatProduce('copper')).toHaveLength(0);
    });

    it('should return all recipes when all are unlocked', () => {
      const recipes = [
        makeRecipe({ id: 'r1', out: { copper: 1 } }),
        makeRecipe({ id: 'r2', out: { copper: 2 } }),
      ];
      service.initializeRecipes(recipes);
      setupWithTechService(['r1', 'r2']);

      expect(service.getUnlockedRecipesThatProduce('copper')).toHaveLength(2);
    });
  });

  describe('getUnlockedMostEfficientRecipe', () => {
    const setupWithTechService = (unlockedRecipeIds: string[]) => {
      vi.mocked(getService).mockImplementation((token: symbol | string) => {
        if (token === 'TechnologyService') {
          return { isRecipeUnlocked: (id: string) => unlockedRecipeIds.includes(id) };
        }
        return null;
      });
    };

    it('should return undefined when no recipes are unlocked', () => {
      const recipe = makeRecipe({ id: 'r1', out: { copper: 1 } });
      service.initializeRecipes([recipe]);
      setupWithTechService([]);

      expect(service.getUnlockedMostEfficientRecipe('copper')).toBeUndefined();
    });

    it('should return most efficient among unlocked recipes only', () => {
      const slow = makeRecipe({ id: 'slow', time: 4, out: { copper: 1 } }); // 0.25/s, unlocked
      const fast = makeRecipe({ id: 'fast', time: 1, out: { copper: 2 } }); // 2/s, locked
      service.initializeRecipes([slow, fast]);
      // Only slow is unlocked; fast is locked
      setupWithTechService(['slow']);

      expect(service.getUnlockedMostEfficientRecipe('copper')?.id).toBe('slow');
    });

    it('should pick fastest among multiple unlocked recipes', () => {
      const r1 = makeRecipe({ id: 'r1', time: 2, out: { copper: 1 } }); // 0.5/s
      const r2 = makeRecipe({ id: 'r2', time: 1, out: { copper: 3 } }); // 3/s
      service.initializeRecipes([r1, r2]);
      setupWithTechService(['r1', 'r2']);

      expect(service.getUnlockedMostEfficientRecipe('copper')?.id).toBe('r2');
    });
  });
});
