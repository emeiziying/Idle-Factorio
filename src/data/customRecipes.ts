import type { Recipe } from '../types';

/**
 * 自定义配方数据
 * 包含游戏中缺失或需要特殊处理的配方
 * 
 * 基于 Factorio Wiki 官方数据：
 * - 木材：https://wiki.factorio.com/Wood
 */

/**
 * 木材获取配方
 * 木材是唯一无法通过自动化设备采集的原材料
 * - 死树给 2 个木材，采集时间 0.5 秒
 * - 大树给 4 个木材，采集时间 0.55 秒
 */
const WOOD_RECIPES: Recipe[] = [
  // 手动砍树 - 死树
  {
    id: "wood-mining-dead-tree",
    name: "Wood (Dead Tree)",
    category: "intermediate-products",
    time: 0.5,
    in: {},
    out: { "wood": 2 },
    cost: 0, // 手动采集，无成本
    flags: ["mining", "manual"],
    producers: [], // 只能手动采集，不能自动化
    locations: ["nauvis"]
  },

  // 手动砍树 - 大树
  {
    id: "wood-mining-big-tree", 
    name: "Wood (Big Tree)",
    category: "intermediate-products",
    time: 0.55,
    in: {},
    out: { "wood": 4 },
    cost: 0, // 手动采集，无成本
    flags: ["mining", "manual"],
    producers: [], // 只能手动采集，不能自动化
    locations: ["nauvis"]
  },

  // 手动砍树 - 平均产出（用于计算）
  {
    id: "wood-mining-average",
    name: "Wood (Average)",
    category: "intermediate-products", 
    time: 0.525, // 平均时间
    in: {},
    out: { "wood": 3 }, // 平均产出
    cost: 0,
    flags: ["mining", "manual"],
    producers: [],
    locations: ["nauvis"]
  }
];

/**
 * 科技包配方
 * 基于 Factorio 官方数据
 */
const SCIENCE_PACK_RECIPES: Recipe[] = [
  // 自动化科技包
  {
    id: "automation-science-pack",
    name: "Automation Science Pack",
    category: "science-packs",
    time: 5,
    in: { 
      "copper-plate": 1, 
      "iron-gear-wheel": 1 
    },
    out: { "automation-science-pack": 1 },
    cost: 0.5, // 制作成本
    flags: ["automation"],
    producers: ["assembling-machine-1", "assembling-machine-2", "assembling-machine-3"],
    locations: ["nauvis"]
  },

  // 铁齿轮配方（如果需要）
  {
    id: "iron-gear-wheel",
    name: "Iron Gear Wheel",
    category: "intermediate-products",
    time: 0.5,
    in: { "iron-plate": 2 },
    out: { "iron-gear-wheel": 1 },
    cost: 0.25,
    flags: ["automation"],
    producers: ["assembling-machine-1", "assembling-machine-2", "assembling-machine-3"],
    locations: ["nauvis"]
  }
];

/**
 * 所有自定义配方
 * 按物品类型分组，便于管理和扩展
 */
export const CUSTOM_RECIPES: Recipe[] = [
  ...WOOD_RECIPES,
  ...SCIENCE_PACK_RECIPES,
  // 在这里添加其他自定义配方
  // 例如：其他原材料的手动采集配方
  // 例如：特殊物品的配方
  // 例如：平衡性调整的配方
];

/**
 * 按物品类型分组的自定义配方
 */
export const CUSTOM_RECIPES_BY_ITEM: Record<string, Recipe[]> = {
  wood: WOOD_RECIPES,
  'automation-science-pack': SCIENCE_PACK_RECIPES.filter(r => r.out['automation-science-pack']),
  'iron-gear-wheel': SCIENCE_PACK_RECIPES.filter(r => r.out['iron-gear-wheel']),
  // 在这里添加其他物品的配方
  // 例如：
  // stone: STONE_RECIPES,
  // iron_ore: IRON_ORE_RECIPES,
  // copper_ore: COPPER_ORE_RECIPES,
};

/**
 * 配方类型常量
 */
export const RecipeType = {
  // 木材配方
  WOOD: {
    MANUAL_DEAD_TREE: "wood-mining-dead-tree",
    MANUAL_BIG_TREE: "wood-mining-big-tree", 
    MANUAL_AVERAGE: "wood-mining-average"
  },
  // 在这里添加其他物品的配方类型
  // 例如：
  // STONE: {
  //   MANUAL_MINING: "stone-mining-manual",
  //   AUTOMATED_MINING: "stone-mining-automated"
  // },
} as const;

/**
 * 获取指定物品的自定义配方
 * @param itemId 物品ID
 */
export const getCustomRecipesByItem = (itemId: string): Recipe[] => {
  return CUSTOM_RECIPES_BY_ITEM[itemId] || [];
};

/**
 * 获取所有自定义配方
 */
export const getAllCustomRecipes = (): Recipe[] => {
  return [...CUSTOM_RECIPES];
};

/**
 * 获取手动采集类型的自定义配方
 */
export const getManualCustomRecipes = (): Recipe[] => {
  return CUSTOM_RECIPES.filter(recipe => 
    recipe.flags?.includes("manual")
  );
};

/**
 * 获取采矿类型的自定义配方
 */
export const getMiningCustomRecipes = (): Recipe[] => {
  return CUSTOM_RECIPES.filter(recipe => 
    recipe.flags?.includes("mining")
  );
};

/**
 * 检查指定物品是否有自定义配方
 * @param itemId 物品ID
 */
export const hasCustomRecipes = (itemId: string): boolean => {
  return Object.prototype.hasOwnProperty.call(CUSTOM_RECIPES_BY_ITEM, itemId);
};

/**
 * 获取自定义配方的物品列表
 */
export const getItemsWithCustomRecipes = (): string[] => {
  return Object.keys(CUSTOM_RECIPES_BY_ITEM);
};

// 向后兼容的导出（保持现有代码不变）
export { WOOD_RECIPES, RecipeType as WoodRecipeType }; 