import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DependencyService } from '../DependencyService';
import type { Recipe } from '../../../types/index';

// 使用相对路径 mock（测试文件规范）
vi.mock('../../core/DIServiceInitializer', () => ({
  getService: vi.fn(),
}));

import { getService } from '../../core/DIServiceInitializer';

// 测试辅助：构建 Recipe
const makeRecipe = (overrides: Partial<Recipe>): Recipe => ({
  id: 'test-recipe',
  name: 'Test Recipe',
  category: 'intermediate-products',
  time: 1,
  in: {},
  out: { 'test-item': 1 },
  ...overrides,
});

// 构建 MockManualCraftingValidator（让所有非流体配方均可手动制作）
const makeMockValidator = (canCraft = true) => ({
  validateManualCrafting: vi.fn().mockReturnValue({ canCraftManually: canCraft }),
  validateRecipe: vi.fn().mockReturnValue({ canCraftManually: canCraft }),
});

describe('DependencyService', () => {
  let service: DependencyService;

  // 配方数据库（by itemId -> recipes）
  let recipeDb: Map<string, Recipe[]>;
  let mockValidator: ReturnType<typeof makeMockValidator>;

  beforeEach(() => {
    vi.clearAllMocks();
    recipeDb = new Map();
    mockValidator = makeMockValidator();

    // 构建 MockRecipeService
    const mockRecipeService = {
      getRecipesThatProduce: vi.fn((itemId: string) => recipeDb.get(itemId) ?? []),
    };

    vi.mocked(getService).mockImplementation((token: symbol | string) => {
      if (token === 'ManualCraftingValidator') return mockValidator;
      if (token === 'RecipeService') return mockRecipeService;
      return null;
    });

    service = new DependencyService();
  });

  // ======== hasMissingDependencies ========
  describe('hasMissingDependencies', () => {
    it('should return false when item has no recipe', () => {
      const inventory = new Map<string, { currentAmount: number }>();
      expect(service.hasMissingDependencies('unknown-item', 1, inventory)).toBe(false);
    });

    it('should return false when all materials are available', () => {
      const gearRecipe = makeRecipe({
        id: 'iron-gear-wheel',
        in: { 'iron-plate': 2 },
        out: { 'iron-gear-wheel': 1 },
      });
      recipeDb.set('iron-gear-wheel', [gearRecipe]);

      const inventory = new Map([['iron-plate', { currentAmount: 10 }]]);
      expect(service.hasMissingDependencies('iron-gear-wheel', 1, inventory)).toBe(false);
    });

    it('should return true when materials are insufficient', () => {
      const gearRecipe = makeRecipe({
        id: 'iron-gear-wheel',
        in: { 'iron-plate': 2 },
        out: { 'iron-gear-wheel': 1 },
      });
      recipeDb.set('iron-gear-wheel', [gearRecipe]);

      const inventory = new Map([['iron-plate', { currentAmount: 1 }]]); // Need 2, have 1
      expect(service.hasMissingDependencies('iron-gear-wheel', 1, inventory)).toBe(true);
    });
  });

  // ======== analyzeCraftingChain ========
  describe('analyzeCraftingChain', () => {
    it('should return null when no recipe exists for the target item', () => {
      const inventory = new Map<string, { currentAmount: number }>();
      expect(service.analyzeCraftingChain('unknown', 1, inventory)).toBeNull();
    });

    it('should return null when basic materials are insufficient', () => {
      const gearRecipe = makeRecipe({
        id: 'iron-gear-wheel',
        in: { 'iron-plate': 2 },
        out: { 'iron-gear-wheel': 1 },
      });
      recipeDb.set('iron-gear-wheel', [gearRecipe]);

      // No recipe for iron-plate (it's a raw material), and inventory is empty
      const inventory = new Map<string, { currentAmount: number }>();
      expect(service.analyzeCraftingChain('iron-gear-wheel', 1, inventory)).toBeNull();
    });

    it('should return a valid chain when materials are available', () => {
      const gearRecipe = makeRecipe({
        id: 'iron-gear-wheel',
        in: { 'iron-plate': 2 },
        out: { 'iron-gear-wheel': 1 },
      });
      recipeDb.set('iron-gear-wheel', [gearRecipe]);

      const inventory = new Map([['iron-plate', { currentAmount: 10 }]]);
      const chain = service.analyzeCraftingChain('iron-gear-wheel', 1, inventory);

      expect(chain).not.toBeNull();
      expect(chain!.mainTask.itemId).toBe('iron-gear-wheel');
      // No dependencies needed since we have iron-plate in inventory
      expect(chain!.dependencies).toHaveLength(0);
    });

    it('should create dependency task when intermediate material is missing', () => {
      const plateRecipe = makeRecipe({
        id: 'iron-plate',
        in: { 'iron-ore': 1 },
        out: { 'iron-plate': 1 },
        flags: [],
      });
      const gearRecipe = makeRecipe({
        id: 'iron-gear-wheel',
        in: { 'iron-plate': 2 },
        out: { 'iron-gear-wheel': 1 },
      });
      recipeDb.set('iron-gear-wheel', [gearRecipe]);
      recipeDb.set('iron-plate', [plateRecipe]);

      // Have iron-ore but not iron-plate
      const inventory = new Map([['iron-ore', { currentAmount: 10 }]]);
      const chain = service.analyzeCraftingChain('iron-gear-wheel', 1, inventory);

      expect(chain).not.toBeNull();
      expect(chain!.dependencies).toHaveLength(1);
      expect(chain!.dependencies[0].itemId).toBe('iron-plate');
      // Tasks: [craft iron-plate task, craft gear task]
      expect(chain!.tasks).toHaveLength(2);
      expect(chain!.tasks[0].itemId).toBe('iron-plate');
      expect(chain!.tasks[1].itemId).toBe('iron-gear-wheel');
    });

    // ======== 多输出配方数量计算修复验证 ========
    it('should correctly calculate craftQuantity for multi-output recipes (fix verification)', () => {
      // 配方：制作1次 → 产出 item-a: 3, byproduct: 1
      const multiOutputRecipe = makeRecipe({
        id: 'multi-output',
        in: { 'raw-material': 1 },
        out: { 'item-a': 3, byproduct: 1 },
        flags: [],
      });
      const mainRecipe = makeRecipe({
        id: 'main-item',
        in: { 'item-a': 6 }, // Need 6 item-a
        out: { 'main-item': 1 },
      });

      recipeDb.set('main-item', [mainRecipe]);
      recipeDb.set('item-a', [multiOutputRecipe]);

      // Have raw-material for 3 crafts (3 crafts × 3 item-a = 9, need 6 → ceil(6/3) = 2 crafts)
      const inventory = new Map([['raw-material', { currentAmount: 10 }]]);
      const chain = service.analyzeCraftingChain('main-item', 1, inventory);

      expect(chain).not.toBeNull();
      const itemATask = chain!.tasks.find(t => t.itemId === 'item-a');
      expect(itemATask).toBeDefined();
      // Need 6, each craft produces 3 → need ceil(6/3) = 2 crafts
      expect(itemATask!.quantity).toBe(2);
    });

    it('should use item-specific output quantity not first output (fix verification)', () => {
      // 配方中 byproduct 产出量比 target 更大，但应用 target 的产出量
      const multiOutputRecipe = makeRecipe({
        id: 'multi-output',
        in: { 'raw-material': 1 },
        // 输出顺序：byproduct(10) 排在 target-item(1) 前面
        out: { byproduct: 10, 'target-item': 1 },
        flags: [],
      });
      const mainRecipe = makeRecipe({
        id: 'main-item',
        in: { 'target-item': 3 },
        out: { 'main-item': 1 },
      });

      recipeDb.set('main-item', [mainRecipe]);
      recipeDb.set('target-item', [multiOutputRecipe]);

      const inventory = new Map([['raw-material', { currentAmount: 10 }]]);
      const chain = service.analyzeCraftingChain('main-item', 1, inventory);

      expect(chain).not.toBeNull();
      const targetTask = chain!.tasks.find(t => t.itemId === 'target-item');
      expect(targetTask).toBeDefined();
      // Need 3, target-item output per craft = 1, so need ceil(3/1) = 3 crafts
      // Before fix: would use byproduct qty (10), getting ceil(3/10) = 1 craft (wrong)
      expect(targetTask!.quantity).toBe(3);
    });
  });

  // ======== calculateChainDuration ========
  describe('calculateChainDuration', () => {
    it('should sum task durations correctly', () => {
      const gearRecipe = makeRecipe({
        id: 'iron-gear-wheel',
        in: { 'iron-plate': 2 },
        out: { 'iron-gear-wheel': 1 },
      });
      recipeDb.set('iron-gear-wheel', [gearRecipe]);

      const inventory = new Map([['iron-plate', { currentAmount: 10 }]]);
      const chain = service.analyzeCraftingChain('iron-gear-wheel', 1, inventory);
      expect(chain).not.toBeNull();

      const duration = service.calculateChainDuration(chain!);
      // craftingTime = 1 (recipe.time), quantity = 1, efficiency = 0.5
      // time = 1 / 0.5 * 1 = 2 seconds
      expect(duration).toBe(2);
    });
  });
});
