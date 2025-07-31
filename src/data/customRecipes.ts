import type { Recipe } from '@/types';

/**
 * 自定义配方数据
 * 包含游戏中缺失或需要特殊处理的配方
 *
 * 基于 Factorio Wiki 官方数据：
 * - 木材：https://wiki.factorio.com/Wood
 * - 石矿：https://wiki.factorio.com/Stone
 */

/**
 * 木材获取配方
 * 木材是唯一无法通过自动化设备采集的原材料
 * - 死树给 2 个木材，采集时间 0.5 秒
 */
const WOOD_RECIPES: Recipe[] = [
  // 手动砍树 - 死树
  {
    id: 'wood-mining-dead-tree',
    name: 'Wood (Dead Tree)',
    category: 'intermediate-products',
    time: 0.5,
    in: {},
    out: { wood: 2 },
    cost: 0, // 手动采集，无成本
    flags: ['mining', 'manual'],
    producers: [], // 只能手动采集，不能自动化
    locations: ['nauvis'],
  },
];

/**
 * 石矿获取配方
 * 石矿可以手动采集或使用采矿机自动化采集
 * - 手动采集时间 2 秒，产出 1 个石矿
 */
const STONE_RECIPES: Recipe[] = [
  // 手动采集石矿
  {
    id: 'stone-mining-manual',
    name: 'Stone (Manual)',
    category: 'intermediate-products',
    time: 2,
    in: {},
    out: { stone: 1 },
    cost: 0, // 手动采集，无成本
    flags: ['mining', 'manual'],
    producers: [], // 只能手动采集
    locations: ['nauvis', 'gleba'],
  },
];

/**
 * 所有自定义配方
 * 按物品类型分组，便于管理和扩展
 * 注意：只包含data.json中不存在的特殊配方，如手动采集等
 */
export const CUSTOM_RECIPES: Recipe[] = [
  ...WOOD_RECIPES,
  ...STONE_RECIPES,
  // 在这里添加其他真正需要的自定义配方
  // 例如：其他原材料的手动采集配方
  // 例如：游戏机制特殊需求的配方
  // 注意：不要重复data.json中已有的配方
];

/**
 * 按物品类型分组的自定义配方
 */
export const CUSTOM_RECIPES_BY_ITEM: Record<string, Recipe[]> = {
  wood: WOOD_RECIPES,
  stone: STONE_RECIPES,
  // 在这里添加其他物品的配方
  // 例如：
  // iron_ore: IRON_ORE_RECIPES,
  // copper_ore: COPPER_ORE_RECIPES,
};

/**
 * 配方类型常量
 */
export const RecipeType = {
  // 木材配方
  WOOD: {
    MANUAL_DEAD_TREE: 'wood-mining-dead-tree',
    MANUAL_BIG_TREE: 'wood-mining-big-tree',
    MANUAL_AVERAGE: 'wood-mining-average',
  },
  // 石矿配方
  STONE: {
    MANUAL_MINING: 'stone-mining-manual',
  },
  // 在这里添加其他物品的配方类型
  // 例如：
  // IRON_ORE: {
  //   MANUAL_MINING: "iron-ore-mining-manual",
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
  return CUSTOM_RECIPES.filter((recipe) => recipe.flags?.includes('manual'));
};

/**
 * 获取采矿类型的自定义配方
 */
export const getMiningCustomRecipes = (): Recipe[] => {
  return CUSTOM_RECIPES.filter((recipe) => recipe.flags?.includes('mining'));
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
export { WOOD_RECIPES, STONE_RECIPES, RecipeType as WoodRecipeType };
