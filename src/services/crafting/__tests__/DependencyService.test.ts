/**
 * DependencyService 单元测试
 *
 * 覆盖范围：
 *  - hasMissingDependencies（判断是否需要链式制作）
 *  - analyzeCraftingChain（构建链式制作计划）
 *    - 返回 null 场景（无配方 / 基础材料不足 / 无法手动制作）
 *    - 成功构建（无依赖 / 单层依赖 / 多输入依赖）
 *    - 多输出配方产出量计算修复验证           ← 修复验证
 *    - 数量缩放（quantity > 1）
 *    - 采矿配方不消耗库存
 *  - calculateChainDuration（预估完成时间）
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DependencyService } from '../DependencyService';
import type { Recipe } from '../../../types/index';

// ──────────────────── Mock 依赖 ────────────────────
vi.mock('../../core/DIServiceInitializer', () => ({
  getService: vi.fn(),
}));

import { getService } from '../../core/DIServiceInitializer';

// ──────────────────── 共享 Fixtures ────────────────────
/**
 * 模拟生产链：
 *   iron-ore  ──(mining)─────────────────► iron-ore  (无输入材料)
 *   iron-ore  ──(smelting)───────────────► iron-plate (time=3.2s)
 *   iron-plate ──(assembly)──────────────► iron-gear-wheel (1×, time=0.5s)
 *   copper-plate ──(assembly)────────────► copper-cable (2× per craft, time=0.5s)
 *   iron-plate + copper-cable ──(assembly)► electronic-circuit (time=0.5s)
 *   crude-oil ──(refinery, multi-output)─► petroleum-gas(45) + light-oil(30)
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
    producers: ['stone-furnace'],
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

  // 每次制作产出 2 根铜线
  copperCable: {
    id: 'copper-cable',
    name: 'Copper Cable',
    category: 'intermediate-products',
    time: 0.5,
    in: { 'copper-plate': 1 },
    out: { 'copper-cable': 2 },
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

  // 多输出配方：petroleum-gas 排在 light-oil 前面
  basicOilProcessing: {
    id: 'basic-oil-processing',
    name: 'Basic Oil Processing',
    category: 'oil-processing',
    time: 5,
    in: { 'crude-oil': 100 },
    out: { 'petroleum-gas': 45, 'light-oil': 30 },
    producers: ['oil-refinery'],
  },
};

// ──────────────────── Mock 辅助 ────────────────────
type Inventory = Map<string, { currentAmount: number }>;

/** 快速创建库存 Map */
const makeInventory = (items: Record<string, number> = {}): Inventory =>
  new Map(Object.entries(items).map(([id, amount]) => [id, { currentAmount: amount }]));

/**
 * 配置 DependencyService 的依赖 mock 并返回实例。
 *
 * @param recipeDb  itemId → Recipe[] 映射（模拟 RecipeService.getRecipesThatProduce）
 * @param canCraft  是否允许手动制作（默认 true）
 */
const setup = (recipeDb: Map<string, Recipe[]>, canCraft = true) => {
  const mockValidator = {
    validateManualCrafting: vi.fn().mockReturnValue({ canCraftManually: canCraft }),
    validateRecipe: vi.fn().mockReturnValue({ canCraftManually: canCraft }),
  };
  const mockRecipeService = {
    getRecipesThatProduce: vi.fn((itemId: string) => recipeDb.get(itemId) ?? []),
  };

  vi.mocked(getService).mockImplementation((token: symbol | string) => {
    if (token === 'ManualCraftingValidator') return mockValidator;
    if (token === 'RecipeService') return mockRecipeService;
    return null;
  });

  return { service: new DependencyService(), mockValidator, mockRecipeService };
};

// ──────────────────── Test Suite ────────────────────
describe('DependencyService', () => {
  beforeEach(() => vi.clearAllMocks());

  // ════════════════════════════════════════════════════════
  // 1. hasMissingDependencies
  // ════════════════════════════════════════════════════════
  describe('hasMissingDependencies', () => {
    it('returns false when item has no craftable recipe', () => {
      const { service } = setup(new Map());
      expect(service.hasMissingDependencies('unknown-item', 1, makeInventory())).toBe(false);
    });

    it('returns false when all inputs are fully stocked', () => {
      const db = new Map([['iron-gear-wheel', [R.ironGear]]]);
      const { service } = setup(db);
      // gear needs 2 iron-plate; have 10
      expect(
        service.hasMissingDependencies('iron-gear-wheel', 1, makeInventory({ 'iron-plate': 10 }))
      ).toBe(false);
    });

    it('returns true when an input is partially missing', () => {
      const db = new Map([['iron-gear-wheel', [R.ironGear]]]);
      const { service } = setup(db);
      // need 2 iron-plate, have 1
      expect(
        service.hasMissingDependencies('iron-gear-wheel', 1, makeInventory({ 'iron-plate': 1 }))
      ).toBe(true);
    });

    it('scales requirements with quantity: quantity=5 needs 10 iron-plate', () => {
      const db = new Map([['iron-gear-wheel', [R.ironGear]]]);
      const { service } = setup(db);

      expect(
        service.hasMissingDependencies('iron-gear-wheel', 5, makeInventory({ 'iron-plate': 9 }))
      ).toBe(true); // 9 < 10

      expect(
        service.hasMissingDependencies('iron-gear-wheel', 5, makeInventory({ 'iron-plate': 10 }))
      ).toBe(false); // 10 = 10 (exact)
    });

    it('returns true when one of multiple inputs is missing', () => {
      const db = new Map([['electronic-circuit', [R.electronicCircuit]]]);
      const { service } = setup(db);
      // circuit needs iron-plate(1) + copper-cable(3); have iron-plate but only 2 copper-cable
      expect(
        service.hasMissingDependencies(
          'electronic-circuit',
          1,
          makeInventory({ 'iron-plate': 5, 'copper-cable': 2 })
        )
      ).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════
  // 2. analyzeCraftingChain — null 场景
  // ════════════════════════════════════════════════════════
  describe('analyzeCraftingChain — returns null', () => {
    it('returns null when no recipe exists for the target item', () => {
      const { service } = setup(new Map());
      expect(service.analyzeCraftingChain('unknown', 1, makeInventory())).toBeNull();
    });

    it('returns null when a raw material (no sub-recipe) is absent from inventory', () => {
      // gear needs iron-plate; iron-plate has no sub-recipe → raw material
      const db = new Map([['iron-gear-wheel', [R.ironGear]]]);
      const { service } = setup(db);
      // inventory empty → iron-plate (raw) = 0 < 2 → null
      expect(service.analyzeCraftingChain('iron-gear-wheel', 1, makeInventory())).toBeNull();
    });

    it('returns null when target item cannot be crafted manually', () => {
      const db = new Map([['iron-gear-wheel', [R.ironGear]]]);
      const { service } = setup(db, /* canCraft */ false);
      expect(
        service.analyzeCraftingChain('iron-gear-wheel', 1, makeInventory({ 'iron-plate': 10 }))
      ).toBeNull();
    });
  });

  // ════════════════════════════════════════════════════════
  // 3. analyzeCraftingChain — 成功构建
  // ════════════════════════════════════════════════════════
  describe('analyzeCraftingChain — successful chain', () => {
    it('returns chain with 0 dependencies when all direct materials are stocked', () => {
      const db = new Map([['iron-gear-wheel', [R.ironGear]]]);
      const { service } = setup(db);

      const chain = service.analyzeCraftingChain(
        'iron-gear-wheel',
        1,
        makeInventory({ 'iron-plate': 10 })
      );

      expect(chain).not.toBeNull();
      expect(chain!.mainTask.itemId).toBe('iron-gear-wheel');
      expect(chain!.dependencies).toHaveLength(0);
      // Only the main task
      expect(chain!.tasks).toHaveLength(1);
      expect(chain!.tasks[0].itemId).toBe('iron-gear-wheel');
    });

    it('creates a dependency task for a missing intermediate material', () => {
      const db = new Map([
        ['iron-gear-wheel', [R.ironGear]],
        ['iron-plate', [R.ironSmelting]], // iron-plate craftable from iron-ore
      ]);
      const { service } = setup(db);

      // have iron-ore (raw) but no iron-plate
      const chain = service.analyzeCraftingChain(
        'iron-gear-wheel',
        1,
        makeInventory({ 'iron-ore': 10 })
      );

      expect(chain).not.toBeNull();
      expect(chain!.dependencies).toHaveLength(1);
      expect(chain!.dependencies[0].itemId).toBe('iron-plate');
      // tasks = [craft iron-plate, craft gear] in dependency order
      expect(chain!.tasks).toHaveLength(2);
      expect(chain!.tasks[0].itemId).toBe('iron-plate');
      expect(chain!.tasks[1].itemId).toBe('iron-gear-wheel');
    });

    it('stores the real recipe id on each task (not a synthetic id)', () => {
      const db = new Map([
        ['iron-gear-wheel', [R.ironGear]],
        ['iron-plate', [R.ironSmelting]],
      ]);
      const { service } = setup(db);

      const chain = service.analyzeCraftingChain(
        'iron-gear-wheel',
        1,
        makeInventory({ 'iron-ore': 10 })
      );

      expect(chain).not.toBeNull();
      const plateTask = chain!.tasks.find(t => t.itemId === 'iron-plate');
      expect(plateTask?.recipeId).toBe('iron-plate'); // real id, not 'chain_1'
    });

    it('creates dependency tasks for multiple missing materials', () => {
      const db = new Map([
        ['electronic-circuit', [R.electronicCircuit]],
        ['copper-cable', [R.copperCable]],
      ]);
      const { service } = setup(db);

      // have both raw materials, but no copper-cable in stock
      const chain = service.analyzeCraftingChain(
        'electronic-circuit',
        1,
        makeInventory({ 'iron-plate': 10, 'copper-plate': 10 })
      );

      expect(chain).not.toBeNull();
      expect(chain!.dependencies.some(d => d.itemId === 'copper-cable')).toBe(true);
      expect(chain!.tasks.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ════════════════════════════════════════════════════════
  // 4. analyzeCraftingChain — 数量缩放
  // ════════════════════════════════════════════════════════
  describe('analyzeCraftingChain — quantity scaling', () => {
    it('scales dependency quantity proportionally', () => {
      const db = new Map([
        ['iron-gear-wheel', [R.ironGear]],
        ['iron-plate', [R.ironSmelting]],
      ]);
      const { service } = setup(db);

      // craft 3 gears → need 6 iron-plate; iron-plate: 1/craft → 6 crafts
      const chain = service.analyzeCraftingChain(
        'iron-gear-wheel',
        3,
        makeInventory({ 'iron-ore': 100 })
      );

      expect(chain).not.toBeNull();
      const plateTask = chain!.tasks.find(t => t.itemId === 'iron-plate');
      expect(plateTask?.quantity).toBe(6);
      expect(chain!.tasks.find(t => t.itemId === 'iron-gear-wheel')?.quantity).toBe(3);
    });
  });

  // ════════════════════════════════════════════════════════
  // 5. 多输出配方产出量计算（修复验证）
  // ════════════════════════════════════════════════════════
  describe('analyzeCraftingChain — multi-output recipe quantity (bug fix)', () => {
    it('uses item-specific output, not first-key output, when calculating craft quantity', () => {
      /**
       * Bug 场景：
       *   basic-oil-processing 的 out = { 'petroleum-gas': 45, 'light-oil': 30 }
       *   若目标材料是 light-oil (30/run)，修复前会取 Object.values()[0] = 45
       *   导致计算需要的 run 数量偏少。
       *
       *   需要 31 单位 light-oil：
       *     正确：ceil(31 / 30) = 2 runs
       *     修复前 bug：ceil(31 / 45) = 1 run（错误）
       */
      const mainRecipe: Recipe = {
        id: 'light-oil-consumer',
        name: 'Light Oil Consumer',
        category: 'chemical',
        time: 1,
        in: { 'light-oil': 31 },
        out: { lubricant: 1 },
        producers: ['chemical-plant'],
      };

      const db = new Map([
        ['lubricant', [mainRecipe]],
        ['light-oil', [R.basicOilProcessing]], // petroleum-gas(45) is first key
      ]);
      const { service } = setup(db);

      const chain = service.analyzeCraftingChain(
        'lubricant',
        1,
        makeInventory({ 'crude-oil': 1000 })
      );

      expect(chain).not.toBeNull();
      const oilTask = chain!.tasks.find(t => t.itemId === 'light-oil');
      expect(oilTask).toBeDefined();
      // correct: ceil(31 / 30) = 2; bugged: ceil(31 / 45) = 1
      expect(oilTask!.quantity).toBe(2);
    });

    it('correctly calculates craft quantity for batch-output recipes (output > 1)', () => {
      /**
       * copper-cable: 1 copper-plate → 2 copper-cable
       * Need 6 copper-cable, shortage = 6 → ceil(6 / 2) = 3 crafts
       * (修复前若取错误产出量，如取 1，则 ceil(6/1)=6，过多)
       */
      const mainRecipe: Recipe = {
        id: 'circuit',
        name: 'Circuit',
        category: 'intermediate-products',
        time: 0.5,
        in: { 'copper-cable': 6 },
        out: { circuit: 1 },
        producers: ['assembling-machine-1'],
      };

      const db = new Map([
        ['circuit', [mainRecipe]],
        ['copper-cable', [R.copperCable]], // out: { 'copper-cable': 2 }
      ]);
      const { service } = setup(db);

      const chain = service.analyzeCraftingChain(
        'circuit',
        1,
        makeInventory({ 'copper-plate': 10 }) // copper-plate is raw material
      );

      expect(chain).not.toBeNull();
      const cableTask = chain!.tasks.find(t => t.itemId === 'copper-cable');
      expect(cableTask).toBeDefined();
      // need 6, each craft produces 2 → 3 crafts
      expect(cableTask!.quantity).toBe(3);
    });
  });

  // ════════════════════════════════════════════════════════
  // 6. 采矿配方不消耗库存
  // ════════════════════════════════════════════════════════
  describe('analyzeCraftingChain — mining recipe handling', () => {
    it('does not require mined materials to be in inventory', () => {
      /**
       * gear 需要 iron-plate；iron-plate 的唯一配方是采矿（无输入材料）。
       * 采矿配方不应计入基础材料需求，故即使库存为空，链式分析也应成功。
       */
      const db = new Map([
        ['iron-gear-wheel', [R.ironGear]],
        ['iron-plate', [R.ironOreMining]], // mining recipe for iron-plate
      ]);
      const { service } = setup(db);

      // empty inventory — mined items are free
      const chain = service.analyzeCraftingChain('iron-gear-wheel', 1, makeInventory());

      expect(chain).not.toBeNull();
    });
  });

  // ════════════════════════════════════════════════════════
  // 7. calculateChainDuration
  // ════════════════════════════════════════════════════════
  describe('calculateChainDuration', () => {
    it('calculates duration for a single-task chain', () => {
      const db = new Map([['iron-gear-wheel', [R.ironGear]]]);
      const { service } = setup(db);

      const chain = service.analyzeCraftingChain(
        'iron-gear-wheel',
        1,
        makeInventory({ 'iron-plate': 10 })
      );
      expect(chain).not.toBeNull();

      const duration = service.calculateChainDuration(chain!);
      // gear: craftingTime=0.5s, quantity=1, manualEfficiency=0.5 → 0.5/0.5×1 = 1s
      expect(duration).toBeCloseTo(1.0);
    });

    it('sums durations across all tasks in the chain', () => {
      const db = new Map([
        ['iron-gear-wheel', [R.ironGear]],
        ['iron-plate', [R.ironSmelting]],
      ]);
      const { service } = setup(db);

      // gear×1 → needs iron-plate×2 from smelting
      const chain = service.analyzeCraftingChain(
        'iron-gear-wheel',
        1,
        makeInventory({ 'iron-ore': 10 })
      );
      expect(chain).not.toBeNull();

      const duration = service.calculateChainDuration(chain!);
      // iron-plate task: time=3.2s, qty=2, eff=0.5 → 3.2/0.5×2 = 12.8s
      // gear task:       time=0.5s, qty=1, eff=0.5 → 0.5/0.5×1 =  1.0s
      // total = 13.8s
      expect(duration).toBeCloseTo(13.8);
    });
  });
});
