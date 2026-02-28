/**
 * RecipeService 单元测试
 *
 * 覆盖范围：
 *  - 初始化与索引构建（initializeRecipes）
 *  - 配方查询（getRecipesThatProduce / getRecipesThatUse / getRecipeById / getRecipesByCategory）
 *  - 按 flags 分类查询（getMiningRecipes / getAutomatedRecipes / getRecyclingRecipes）
 *  - 搜索（searchRecipes）
 *  - 效率计算（getRecipeEfficiency / getMostEfficientRecipe）
 *  - 手动制作解锁检查（getAllManualCraftingRecipes）         ← 修复验证
 *  - 循环依赖保护（calculateRecipeCost）                    ← 修复验证
 *  - 科技解锁联动（getUnlockedRecipesThatProduce / getUnlockedMostEfficientRecipe）
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecipeService } from '../RecipeService';
import type { Recipe } from '../../../types/index';

// ──────────────────── Mock 依赖 ────────────────────
// 测试文件使用相对路径 mock（项目规范）
vi.mock('../../../data/customRecipes', () => ({
  CUSTOM_RECIPES: [],
}));

vi.mock('../../core/DIServiceInitializer', () => ({
  getService: vi.fn(),
}));

import { getService } from '../../core/DIServiceInitializer';

// ──────────────────── 共享 Fixtures ────────────────────
/**
 * 模拟一段 Factorio 基础生产链：
 *
 *   iron-ore  ──(mining)──────────────────────────► iron-ore
 *   iron-ore  ──(smelting)─────────────────────────► iron-plate
 *   iron-plate ──(assembly)────────────────────────► iron-gear-wheel
 *   copper-plate ──(assembly)──────────────────────► copper-cable x2
 *   iron-plate + copper-cable ──(assembly)─────────► electronic-circuit
 *   crude-oil ──(refinery, multi-output)───────────► petroleum-gas + light-oil + heavy-oil
 *   iron-plate ──(recycling)───────────────────────► iron-ore (recycling flag)
 */
const R: Record<string, Recipe> = {
  ironOreMining: {
    id: 'iron-ore-mining',
    name: 'Iron Ore',
    category: 'mining',
    time: 1,
    in: {},
    out: { 'iron-ore': 1 },
    flags: ['mining'],
    producers: [],
  },

  ironSmelting: {
    id: 'iron-plate',
    name: 'Iron Plate',
    category: 'smelting',
    time: 3.2,
    in: { 'iron-ore': 1 },
    out: { 'iron-plate': 1 },
    producers: ['stone-furnace', 'steel-furnace'],
  },

  ironGear: {
    id: 'iron-gear-wheel',
    name: 'Iron Gear Wheel',
    category: 'intermediate-products',
    time: 0.5,
    in: { 'iron-plate': 2 },
    out: { 'iron-gear-wheel': 1 },
    producers: ['assembling-machine-1'],
  },

  copperCable: {
    id: 'copper-cable',
    name: 'Copper Cable',
    category: 'intermediate-products',
    time: 0.5,
    in: { 'copper-plate': 1 },
    out: { 'copper-cable': 2 }, // 每次产出 2 个
    producers: ['assembling-machine-1'],
  },

  electronicCircuit: {
    id: 'electronic-circuit',
    name: 'Electronic Circuit',
    category: 'intermediate-products',
    time: 0.5,
    in: { 'iron-plate': 1, 'copper-cable': 3 },
    out: { 'electronic-circuit': 1 },
    producers: ['assembling-machine-1'],
  },

  // 多输出配方
  basicOilProcessing: {
    id: 'basic-oil-processing',
    name: 'Basic Oil Processing',
    category: 'oil-processing',
    time: 5,
    in: { 'crude-oil': 100 },
    out: { 'petroleum-gas': 45, 'light-oil': 30, 'heavy-oil': 25 },
    producers: ['oil-refinery'],
  },

  // 回收配方
  ironRecycling: {
    id: 'iron-plate-recycling',
    name: 'Iron Plate Recycling',
    category: 'recycling',
    time: 0.2,
    in: { 'iron-plate': 1 },
    out: { 'iron-ore': 0.25 },
    flags: ['recycling'],
    producers: ['recycler'],
  },
};

/** 包含所有 fixture 的配方列表 */
const ALL_FIXTURES = Object.values(R);

// ──────────────────── Mock DI 辅助 ────────────────────
interface MockTechService {
  isRecipeUnlocked?: (id: string) => boolean;
  isItemUnlocked?: (id: string) => boolean;
}

interface MockValidator {
  validateManualCrafting?: (itemId: string) => { canCraftManually: boolean };
  validateRecipe?: (recipe: Recipe) => { canCraftManually: boolean; category?: string };
}

/**
 * 配置 getService mock。
 * 每个 mock 服务的方法默认返回宽松值（全部允许），
 * 测试可覆盖具体方法行为。
 */
const setupMockDI = (opts: { tech?: MockTechService; validator?: MockValidator } = {}) => {
  const techService = {
    isRecipeUnlocked: vi.fn(opts.tech?.isRecipeUnlocked ?? (() => true)),
    isItemUnlocked: vi.fn(opts.tech?.isItemUnlocked ?? (() => true)),
  };
  const validator = {
    validateManualCrafting: vi.fn(
      opts.validator?.validateManualCrafting ?? (() => ({ canCraftManually: true }))
    ),
    validateRecipe: vi.fn(
      opts.validator?.validateRecipe ?? (() => ({ canCraftManually: true, category: 'basic' }))
    ),
  };

  vi.mocked(getService).mockImplementation((token: symbol | string) => {
    if (token === 'TechnologyService') return techService;
    if (token === 'ManualCraftingValidator') return validator;
    return null;
  });

  return { techService, validator };
};

// ──────────────────── Test Suite ────────────────────
describe('RecipeService', () => {
  let service: RecipeService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RecipeService();
  });

  // ════════════════════════════════════════════════════════
  // 1. 初始化与索引构建
  // ════════════════════════════════════════════════════════
  describe('initializeRecipes', () => {
    it('merges data.json recipes with CUSTOM_RECIPES (mocked as [])', () => {
      service.initializeRecipes([R.ironSmelting]);
      expect(service.getAllRecipes()).toHaveLength(1);
    });

    it('replaces previous data when called again', () => {
      service.initializeRecipes([R.ironSmelting]);
      service.initializeRecipes([R.ironGear, R.copperCable]);
      expect(service.getAllRecipes()).toHaveLength(2);
    });

    it('indexes output items so getRecipesThatProduce works immediately', () => {
      service.initializeRecipes([R.ironGear]);
      expect(service.getRecipesThatProduce('iron-gear-wheel')).toHaveLength(1);
    });

    it('indexes input items without duplicating the same recipe', () => {
      service.initializeRecipes([R.ironGear]); // in: {iron-plate:2}, out: {iron-gear-wheel:1}
      const byInput = service.getRecipesByItem('iron-plate');
      expect(byInput.filter(r => r.id === 'iron-gear-wheel')).toHaveLength(1);
    });

    it('handles empty recipe list gracefully', () => {
      service.initializeRecipes([]);
      expect(service.getAllRecipes()).toHaveLength(0);
    });
  });

  // ════════════════════════════════════════════════════════
  // 2. 基础配方查询
  // ════════════════════════════════════════════════════════
  describe('getRecipesThatProduce', () => {
    beforeEach(() => service.initializeRecipes(ALL_FIXTURES));

    it('returns all recipes whose output contains the item', () => {
      // iron-ore 由 mining 和 recycling 两个配方产出
      const result = service.getRecipesThatProduce('iron-ore');
      const ids = result.map(r => r.id);
      expect(ids).toContain('iron-ore-mining');
      expect(ids).toContain('iron-plate-recycling');
    });

    it('also matches multi-output recipes producing the item as a side-product', () => {
      const result = service.getRecipesThatProduce('light-oil');
      expect(result.map(r => r.id)).toContain('basic-oil-processing');
    });

    it('returns empty array when no recipe produces the item', () => {
      expect(service.getRecipesThatProduce('unknown-item')).toHaveLength(0);
    });
  });

  describe('getRecipesThatUse', () => {
    beforeEach(() => service.initializeRecipes(ALL_FIXTURES));

    it('returns all recipes that consume the item as input', () => {
      const ids = service.getRecipesThatUse('iron-plate').map(r => r.id);
      expect(ids).toContain('iron-gear-wheel');
      expect(ids).toContain('electronic-circuit');
      expect(ids).toContain('iron-plate-recycling');
    });

    it('returns empty array when no recipe consumes the item', () => {
      expect(service.getRecipesThatUse('unknown-item')).toHaveLength(0);
    });

    it('does not include recipes where the item appears only in output', () => {
      // iron-plate appears in ironSmelting output, but NOT in its input
      const result = service.getRecipesThatUse('iron-ore');
      const ids = result.map(r => r.id);
      expect(ids).not.toContain('iron-ore-mining'); // mining has no inputs
      expect(ids).toContain('iron-plate'); // smelting uses iron-ore as input
    });
  });

  describe('getRecipeById', () => {
    beforeEach(() => service.initializeRecipes(ALL_FIXTURES));

    it('returns the matching recipe when id exists', () => {
      const result = service.getRecipeById('iron-gear-wheel');
      expect(result).toBeDefined();
      expect(result!.id).toBe('iron-gear-wheel');
    });

    it('returns undefined when id does not exist', () => {
      expect(service.getRecipeById('nonexistent-recipe')).toBeUndefined();
    });
  });

  describe('getRecipesByCategory', () => {
    beforeEach(() => service.initializeRecipes(ALL_FIXTURES));

    it('returns all recipes in the given category', () => {
      const ids = service.getRecipesByCategory('intermediate-products').map(r => r.id);
      expect(ids).toContain('iron-gear-wheel');
      expect(ids).toContain('copper-cable');
      expect(ids).not.toContain('iron-plate'); // smelting category
    });

    it('returns empty array for unknown category', () => {
      expect(service.getRecipesByCategory('nonexistent-category')).toHaveLength(0);
    });
  });

  // ════════════════════════════════════════════════════════
  // 3. Flags 分类查询
  // ════════════════════════════════════════════════════════
  describe('getMiningRecipes', () => {
    beforeEach(() => service.initializeRecipes(ALL_FIXTURES));

    it('returns only recipes flagged as mining', () => {
      const result = service.getMiningRecipes();
      expect(result.every(r => r.flags?.includes('mining'))).toBe(true);
      expect(result.map(r => r.id)).toContain('iron-ore-mining');
    });

    it('filters by itemId when provided', () => {
      const result = service.getMiningRecipes('iron-ore');
      expect(result.every(r => r.out['iron-ore'] !== undefined)).toBe(true);
    });

    it('returns empty array when item has no mining recipe', () => {
      expect(service.getMiningRecipes('iron-plate')).toHaveLength(0);
    });
  });

  describe('getAutomatedRecipes', () => {
    beforeEach(() => service.initializeRecipes(ALL_FIXTURES));

    it('returns recipes without the manual flag', () => {
      const result = service.getAutomatedRecipes();
      expect(result.every(r => !r.flags?.includes('manual'))).toBe(true);
    });

    it('includes smelting and assembly recipes', () => {
      const ids = service.getAutomatedRecipes().map(r => r.id);
      expect(ids).toContain('iron-plate');
      expect(ids).toContain('iron-gear-wheel');
    });

    it('filters by itemId when provided', () => {
      const result = service.getAutomatedRecipes('iron-plate');
      expect(result.every(r => r.out['iron-plate'] !== undefined)).toBe(true);
    });
  });

  describe('getRecyclingRecipes', () => {
    beforeEach(() => service.initializeRecipes(ALL_FIXTURES));

    it('returns only recipes flagged as recycling', () => {
      const result = service.getRecyclingRecipes();
      expect(result.every(r => r.flags?.includes('recycling'))).toBe(true);
      expect(result.map(r => r.id)).toContain('iron-plate-recycling');
    });

    it('returns empty array when item has no recycling recipe', () => {
      expect(service.getRecyclingRecipes('copper-cable')).toHaveLength(0);
    });
  });

  // ════════════════════════════════════════════════════════
  // 4. 搜索
  // ════════════════════════════════════════════════════════
  describe('searchRecipes', () => {
    beforeEach(() => service.initializeRecipes(ALL_FIXTURES));

    it('matches by recipe name (case-insensitive)', () => {
      const ids = service.searchRecipes('iron').map(r => r.id);
      expect(ids).toContain('iron-plate');
      expect(ids).toContain('iron-gear-wheel');
    });

    it('matches by recipe id (case-insensitive)', () => {
      expect(service.searchRecipes('COPPER').map(r => r.id)).toContain('copper-cable');
    });

    it('returns empty array when no match found', () => {
      expect(service.searchRecipes('zzznonexistent')).toHaveLength(0);
    });
  });

  // ════════════════════════════════════════════════════════
  // 5. 效率计算
  // ════════════════════════════════════════════════════════
  describe('getRecipeEfficiency', () => {
    it('computes output-per-second for a specific item', () => {
      // copper-cable: out={copper-cable:2}, time=0.5s → 4/s
      expect(service.getRecipeEfficiency(R.copperCable, 'copper-cable')).toBeCloseTo(4.0);
    });

    it('returns 0 when recipe time is zero', () => {
      const zeroTime = { ...R.ironGear, time: 0 };
      expect(service.getRecipeEfficiency(zeroTime, 'iron-gear-wheel')).toBe(0);
    });

    it('returns 0 when the queried item is not in recipe output', () => {
      expect(service.getRecipeEfficiency(R.copperCable, 'iron-plate')).toBe(0);
    });

    it('sums all outputs when no itemId is specified', () => {
      // basic-oil-processing: (45+30+25)/5 = 20/s total output
      expect(service.getRecipeEfficiency(R.basicOilProcessing)).toBeCloseTo(20.0);
    });
  });

  describe('getMostEfficientRecipe', () => {
    it('picks the recipe with the highest output-per-second', () => {
      const slow = { ...R.ironGear, id: 'slow', time: 4, out: { 'iron-gear-wheel': 1 } };
      const fast = { ...R.ironGear, id: 'fast', time: 0.5, out: { 'iron-gear-wheel': 2 } };
      service.initializeRecipes([slow, fast]);
      // slow: 0.25/s, fast: 4/s
      expect(service.getMostEfficientRecipe('iron-gear-wheel')?.id).toBe('fast');
    });

    it('returns undefined when no recipe produces the item', () => {
      service.initializeRecipes([R.ironSmelting]);
      expect(service.getMostEfficientRecipe('unknown-item')).toBeUndefined();
    });

    it('returns the only recipe when there is exactly one', () => {
      service.initializeRecipes([R.ironGear]);
      expect(service.getMostEfficientRecipe('iron-gear-wheel')?.id).toBe('iron-gear-wheel');
    });
  });

  // ════════════════════════════════════════════════════════
  // 6. 手动制作解锁检查（修复验证：isItemUnlocked → isRecipeUnlocked）
  // ════════════════════════════════════════════════════════
  describe('getAllManualCraftingRecipes — unlock check (bug fix)', () => {
    it('calls isRecipeUnlocked (not isItemUnlocked) for unlock filtering', () => {
      const { techService } = setupMockDI({
        tech: {
          isRecipeUnlocked: () => true,
          isItemUnlocked: vi.fn().mockReturnValue(false), // must NOT be called
        },
      });
      service.initializeRecipes([R.ironGear]);

      service.getAllManualCraftingRecipes('iron-gear-wheel');

      expect(techService.isRecipeUnlocked).toHaveBeenCalledWith('iron-gear-wheel');
      expect(techService.isItemUnlocked).not.toHaveBeenCalled();
    });

    it('excludes recipes where isRecipeUnlocked returns false', () => {
      setupMockDI({ tech: { isRecipeUnlocked: () => false } });
      service.initializeRecipes([R.ironGear]);

      expect(service.getAllManualCraftingRecipes('iron-gear-wheel')).toHaveLength(0);
    });

    it('includes recipes where isRecipeUnlocked returns true and validator approves', () => {
      setupMockDI({ tech: { isRecipeUnlocked: () => true } });
      service.initializeRecipes([R.ironGear]);

      const result = service.getAllManualCraftingRecipes('iron-gear-wheel');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('iron-gear-wheel');
    });

    it('returns empty array immediately when item cannot be crafted manually', () => {
      setupMockDI({
        validator: { validateManualCrafting: () => ({ canCraftManually: false }) },
      });
      service.initializeRecipes([R.ironGear]);

      expect(service.getAllManualCraftingRecipes('iron-gear-wheel')).toHaveLength(0);
    });
  });

  // ════════════════════════════════════════════════════════
  // 7. 循环依赖保护（修复验证：calculateRecipeCost 无限递归）
  // ════════════════════════════════════════════════════════
  describe('calculateRecipeCost — cycle detection (bug fix)', () => {
    it('does not throw on a self-referencing recipe (A produces A and needs A)', () => {
      const cyclic = { ...R.ironGear, id: 'cyclic', in: { cyclic: 1 }, out: { cyclic: 2 } };
      service.initializeRecipes([cyclic]);

      expect(() => service.calculateRecipeCost(cyclic, true)).not.toThrow();
    });

    it('does not throw on mutual dependency (A needs B, B needs A)', () => {
      const recipeA = { ...R.ironGear, id: 'a', in: { 'item-b': 1 }, out: { 'item-a': 1 } };
      const recipeB = { ...R.ironGear, id: 'b', in: { 'item-a': 1 }, out: { 'item-b': 1 } };
      service.initializeRecipes([recipeA, recipeB]);

      expect(() => service.calculateRecipeCost(recipeA, true)).not.toThrow();
    });

    it('correctly calculates directCost and rawMaterials for linear chains', () => {
      // gear → 2 iron-plate; iron-plate → 1 iron-ore (raw material, no recipe)
      service.initializeRecipes([R.ironSmelting, R.ironGear]);

      const cost = service.calculateRecipeCost(R.ironGear, true);

      expect(cost.directCost.get('iron-plate')).toBe(2);
      expect(cost.rawMaterials.get('iron-ore')).toBe(2);
    });

    it('does not populate rawMaterials when includeRawMaterials is false', () => {
      service.initializeRecipes([R.ironSmelting, R.ironGear]);

      const cost = service.calculateRecipeCost(R.ironGear, false);

      expect(cost.directCost.get('iron-plate')).toBe(2);
      expect(cost.rawMaterials.size).toBe(0);
    });

    it('returns empty maps for a recipe with no inputs', () => {
      service.initializeRecipes([R.ironOreMining]);

      const cost = service.calculateRecipeCost(R.ironOreMining, true);

      expect(cost.directCost.size).toBe(0);
      expect(cost.totalCost.size).toBe(0);
      expect(cost.rawMaterials.size).toBe(0);
    });
  });

  // ════════════════════════════════════════════════════════
  // 8. 科技解锁联动（UI 层方法）
  // ════════════════════════════════════════════════════════
  describe('getUnlockedRecipesThatProduce', () => {
    beforeEach(() => service.initializeRecipes(ALL_FIXTURES));

    it('returns only recipes that isRecipeUnlocked approves', () => {
      setupMockDI({ tech: { isRecipeUnlocked: id => id === 'iron-plate' } });

      const result = service.getUnlockedRecipesThatProduce('iron-plate');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('iron-plate');
    });

    it('returns empty array when all recipes are locked', () => {
      setupMockDI({ tech: { isRecipeUnlocked: () => false } });

      expect(service.getUnlockedRecipesThatProduce('iron-ore')).toHaveLength(0);
    });

    it('returns all producing recipes when all are unlocked', () => {
      setupMockDI({ tech: { isRecipeUnlocked: () => true } });

      // iron-ore is produced by: iron-ore-mining AND iron-plate-recycling
      expect(service.getUnlockedRecipesThatProduce('iron-ore').length).toBeGreaterThanOrEqual(2);
    });

    it('filters using recipe id (not item id)', () => {
      const { techService } = setupMockDI({ tech: { isRecipeUnlocked: () => true } });
      service.getUnlockedRecipesThatProduce('iron-plate');

      // Verifies isRecipeUnlocked is called with recipe id 'iron-plate'
      expect(techService.isRecipeUnlocked).toHaveBeenCalledWith('iron-plate');
    });
  });

  describe('getUnlockedMostEfficientRecipe', () => {
    it('returns undefined when all recipes are locked', () => {
      service.initializeRecipes([R.ironGear]);
      setupMockDI({ tech: { isRecipeUnlocked: () => false } });

      expect(service.getUnlockedMostEfficientRecipe('iron-gear-wheel')).toBeUndefined();
    });

    it('ignores locked recipes even when they are faster', () => {
      const lockedFast = {
        ...R.ironGear,
        id: 'locked-fast',
        time: 0.1,
        out: { 'iron-gear-wheel': 10 },
      };
      const unlockedSlow = {
        ...R.ironGear,
        id: 'unlocked-slow',
        time: 4,
        out: { 'iron-gear-wheel': 1 },
      };
      service.initializeRecipes([lockedFast, unlockedSlow]);
      setupMockDI({ tech: { isRecipeUnlocked: id => id === 'unlocked-slow' } });

      expect(service.getUnlockedMostEfficientRecipe('iron-gear-wheel')?.id).toBe('unlocked-slow');
    });

    it('picks the highest-efficiency recipe among multiple unlocked ones', () => {
      const r1 = { ...R.copperCable, id: 'r1', time: 2, out: { 'copper-cable': 1 } }; // 0.5/s
      const r2 = { ...R.copperCable, id: 'r2', time: 1, out: { 'copper-cable': 3 } }; // 3/s
      service.initializeRecipes([r1, r2]);
      setupMockDI({ tech: { isRecipeUnlocked: () => true } });

      expect(service.getUnlockedMostEfficientRecipe('copper-cable')?.id).toBe('r2');
    });

    it('returns undefined when no recipe exists for the item at all', () => {
      service.initializeRecipes([]);
      setupMockDI({ tech: { isRecipeUnlocked: () => true } });

      expect(service.getUnlockedMostEfficientRecipe('unknown-item')).toBeUndefined();
    });
  });
});
