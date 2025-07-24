import type { Recipe } from '../types';
import { RecipeService } from '../services/RecipeService';

/**
 * 自定义配方工具函数
 * 提供便捷的配方获取方法，支持多种物品类型
 */

/**
 * 获取所有包含指定物品的配方
 * @param itemId 物品ID
 */
export const getAllRecipesByItem = (itemId: string): Recipe[] => {
  return RecipeService.getRecipesByItem(itemId);
};

/**
 * 获取生产指定物品的配方
 * @param itemId 物品ID
 */
export const getProductionRecipes = (itemId: string): Recipe[] => {
  return RecipeService.getRecipesThatProduce(itemId);
};

/**
 * 获取使用指定物品的配方
 * @param itemId 物品ID
 */
export const getConsumptionRecipes = (itemId: string): Recipe[] => {
  return RecipeService.getRecipesThatUse(itemId);
};

/**
 * 获取手动采集指定物品的配方
 * @param itemId 物品ID
 */
export const getManualRecipes = (itemId: string): Recipe[] => {
  return RecipeService.getManualRecipes(itemId);
};

/**
 * 获取自动化指定物品的配方
 * @param itemId 物品ID
 */
export const getAutomatedRecipes = (itemId: string): Recipe[] => {
  return RecipeService.getAutomatedRecipes(itemId);
};

/**
 * 获取指定物品的采矿配方
 * @param itemId 物品ID
 */
export const getMiningRecipes = (itemId: string): Recipe[] => {
  return RecipeService.getMiningRecipes(itemId);
};

/**
 * 获取指定物品的回收配方
 * @param itemId 物品ID
 */
export const getRecyclingRecipes = (itemId: string): Recipe[] => {
  return RecipeService.getRecyclingRecipes(itemId);
};

/**
 * 获取最高效率的指定物品生产配方
 * @param itemId 物品ID
 */
export const getMostEfficientRecipe = (itemId: string): Recipe | undefined => {
  return RecipeService.getMostEfficientRecipe(itemId);
};

/**
 * 获取指定物品的配方统计信息
 * @param itemId 物品ID
 */
export const getRecipeStats = (itemId: string) => {
  return RecipeService.getRecipeStats(itemId);
};

/**
 * 按效率排序指定物品的配方
 * @param itemId 物品ID
 */
export const getRecipesByEfficiency = (itemId: string): Recipe[] => {
  const recipes = getProductionRecipes(itemId);
  return recipes.sort((a, b) => {
    const efficiencyA = RecipeService.getRecipeEfficiency(a, itemId);
    const efficiencyB = RecipeService.getRecipeEfficiency(b, itemId);
    return efficiencyB - efficiencyA; // 降序排列
  });
};

/**
 * 获取指定物品的配方分类
 * @param itemId 物品ID
 */
export const getRecipeCategories = (itemId: string): {
  manual: Recipe[];
  automated: Recipe[];
  mining: Recipe[];
  recycling: Recipe[];
  other: Recipe[];
} => {
  const allRecipes = getProductionRecipes(itemId);
  
  return {
    manual: allRecipes.filter(r => r.flags?.includes("manual")),
    automated: allRecipes.filter(r => !r.flags?.includes("manual")),
    mining: allRecipes.filter(r => r.flags?.includes("mining")),
    recycling: allRecipes.filter(r => r.flags?.includes("recycling")),
    other: allRecipes.filter(r => 
      !r.flags?.includes("manual") && 
      !r.flags?.includes("mining") && 
      !r.flags?.includes("recycling")
    )
  };
};

/**
 * 获取配方详细信息
 * @param recipeId 配方ID
 * @param itemId 物品ID（可选）
 */
export const getRecipeDetails = (recipeId: string, itemId?: string) => {
  const recipe = RecipeService.getRecipeById(recipeId);
  if (!recipe) return null;

  const efficiency = itemId ? RecipeService.getRecipeEfficiency(recipe, itemId) : RecipeService.getRecipeEfficiency(recipe);
  const isManual = recipe.flags?.includes("manual") || false;
  const isMining = recipe.flags?.includes("mining") || false;
  const isRecycling = recipe.flags?.includes("recycling") || false;

  return {
    recipe,
    efficiency,
    isManual,
    isMining,
    isRecycling,
    output: itemId ? (recipe.out?.[itemId] || 0) : Object.values(recipe.out || {}).reduce((sum, val) => sum + val, 0),
    time: recipe.time,
    category: recipe.category
  };
};

/**
 * 搜索指定物品的相关配方
 * @param itemId 物品ID
 * @param query 搜索关键词
 */
export const searchRecipes = (itemId: string, query: string): Recipe[] => {
  const allRecipes = getAllRecipesByItem(itemId);
  const lowerQuery = query.toLowerCase();
  
  return allRecipes.filter(recipe => 
    recipe.name.toLowerCase().includes(lowerQuery) ||
    recipe.id.toLowerCase().includes(lowerQuery)
  );
};

/**
 * 获取推荐的指定物品获取方式
 * @param itemId 物品ID
 */
export const getRecommendedSource = (itemId: string): Recipe | undefined => {
  // 优先推荐最高效率的配方
  const mostEfficient = getMostEfficientRecipe(itemId);
  if (mostEfficient) return mostEfficient;

  // 如果没有效率数据，推荐第一个手动采集配方
  const manualRecipes = getManualRecipes(itemId);
  if (manualRecipes.length > 0) return manualRecipes[0];

  // 最后推荐第一个可用配方
  const allRecipes = getProductionRecipes(itemId);
  return allRecipes[0];
};

/**
 * 检查配方是否与指定物品相关
 * @param recipe 配方
 * @param itemId 物品ID
 */
export const isItemRelatedRecipe = (recipe: Recipe, itemId: string): boolean => {
  return recipe.out?.[itemId] !== undefined || recipe.in?.[itemId] !== undefined;
};

/**
 * 获取配方类型描述
 * @param recipe 配方
 */
export const getRecipeTypeDescription = (recipe: Recipe): string => {
  if (recipe.flags?.includes("manual")) return "手动采集";
  if (recipe.flags?.includes("mining")) return "采矿";
  if (recipe.flags?.includes("recycling")) return "回收";
  if (recipe.flags?.includes("grow")) return "种植";
  return "制作";
};

// 向后兼容的木材专用函数
export const getAllWoodRecipes = (): Recipe[] => getAllRecipesByItem("wood");
export const getWoodProductionRecipes = (): Recipe[] => getProductionRecipes("wood");
export const getWoodConsumptionRecipes = (): Recipe[] => getConsumptionRecipes("wood");
export const getManualWoodRecipes = (): Recipe[] => getManualRecipes("wood");
export const getAutomatedWoodRecipes = (): Recipe[] => getAutomatedRecipes("wood");
export const getWoodMiningRecipes = (): Recipe[] => getMiningRecipes("wood");
export const getWoodRecyclingRecipes = (): Recipe[] => getRecyclingRecipes("wood");
export const getMostEfficientWoodRecipe = (): Recipe | undefined => getMostEfficientRecipe("wood");
export const getWoodRecipeStats = () => getRecipeStats("wood");
export const getWoodRecipesByEfficiency = (): Recipe[] => getRecipesByEfficiency("wood");
export const getWoodRecipeCategories = () => getRecipeCategories("wood");
export const getWoodRecipeDetails = (recipeId: string) => getRecipeDetails(recipeId, "wood");
export const searchWoodRecipes = (query: string): Recipe[] => searchRecipes("wood", query);
export const getRecommendedWoodSource = (): Recipe => getRecommendedSource("wood")!;
export const isWoodRelatedRecipe = (recipe: Recipe): boolean => isItemRelatedRecipe(recipe, "wood");
export const getWoodRecipeTypeDescription = (recipe: Recipe): string => getRecipeTypeDescription(recipe);

// ========== 新增高级功能工具函数 ==========

/**
 * 获取配方依赖链
 * @param recipe 配方
 * @param maxDepth 最大深度
 */
export const getRecipeDependencyChain = (recipe: Recipe, maxDepth: number = 5) => {
  return RecipeService.getRecipeDependencyChain(recipe, maxDepth);
};

/**
 * 计算配方总成本
 * @param recipe 配方
 * @param includeRawMaterials 是否包含原材料成本
 */
export const calculateRecipeCost = (recipe: Recipe, includeRawMaterials: boolean = true) => {
  return RecipeService.calculateRecipeCost(recipe, includeRawMaterials);
};

/**
 * 获取最优生产路径
 * @param targetItemId 目标物品ID
 * @param quantity 目标数量
 * @param unlockedItems 已解锁的物品列表
 */
export const getOptimalProductionPath = (
  targetItemId: string,
  quantity: number = 1,
  unlockedItems: string[] = []
) => {
  return RecipeService.getOptimalProductionPath(targetItemId, quantity, unlockedItems);
};

/**
 * 获取配方推荐
 * @param itemId 物品ID
 * @param unlockedItems 已解锁的物品列表
 * @param preferences 用户偏好
 */
export const getRecipeRecommendations = (
  itemId: string,
  unlockedItems: string[] = [],
  preferences: 'efficiency' | 'speed' | 'cost' | 'manual' = 'efficiency'
): Recipe[] => {
  return RecipeService.getRecipeRecommendations(itemId, unlockedItems, preferences);
};

/**
 * 获取增强的配方统计信息
 * @param itemId 物品ID
 * @param unlockedItems 已解锁的物品列表
 */
export const getEnhancedRecipeStats = (
  itemId: string,
  unlockedItems: string[] = []
) => {
  return RecipeService.getEnhancedRecipeStats(itemId, unlockedItems);
};

/**
 * 获取配方复杂度评分
 * @param recipe 配方
 */
export const getRecipeComplexityScore = (recipe: Recipe): number => {
  return RecipeService.getRecipeComplexityScore(recipe);
};

/**
 * 获取配方分类统计
 */
export const getRecipeCategoryStats = (): Map<string, number> => {
  return RecipeService.getRecipeCategoryStats();
};

/**
 * 获取配方成本分析
 * @param recipe 配方
 */
export const getRecipeCostAnalysis = (recipe: Recipe) => {
  const cost = calculateRecipeCost(recipe, true);
  const complexity = getRecipeComplexityScore(recipe);
  const efficiency = RecipeService.getRecipeEfficiency(recipe);
  
  return {
    recipe,
    cost,
    complexity,
    efficiency,
    costEfficiencyRatio: efficiency / (complexity + 1) // 避免除零
  };
};

/**
 * 获取物品生产路径分析
 * @param itemId 物品ID
 * @param unlockedItems 已解锁的物品列表
 */
export const getItemProductionAnalysis = (
  itemId: string,
  unlockedItems: string[] = []
) => {
  const recipes = getProductionRecipes(itemId);
  const recommendations = getRecipeRecommendations(itemId, unlockedItems, 'efficiency');
  const enhancedStats = getEnhancedRecipeStats(itemId, unlockedItems);
  const optimalPath = getOptimalProductionPath(itemId, 1, unlockedItems);
  
  return {
    itemId,
    totalRecipes: recipes.length,
    availableRecipes: enhancedStats.availableRecipes,
    recommendations,
    enhancedStats,
    optimalPath,
    bestRecipe: enhancedStats.mostEfficientRecipe
  };
};

/**
 * 获取配方比较分析
 * @param recipes 配方列表
 * @param itemId 目标物品ID
 */
export const getRecipeComparison = (recipes: Recipe[], itemId: string) => {
  return recipes.map(recipe => ({
    recipe,
    efficiency: RecipeService.getRecipeEfficiency(recipe, itemId),
    complexity: getRecipeComplexityScore(recipe),
    cost: calculateRecipeCost(recipe, true),
    type: getRecipeTypeDescription(recipe)
  })).sort((a, b) => b.efficiency - a.efficiency);
}; 