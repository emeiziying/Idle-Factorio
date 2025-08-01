import type { Recipe } from '@/types';
import { CUSTOM_RECIPES } from '@/data/customRecipes';
import { getService, hasService } from '@/services/core/DIServiceInitializer';
import { SERVICE_TOKENS } from '@/services/core/ServiceTokens';
import type { DataService } from '@/services/core/DataService';
import type { IManualCraftingValidator } from '@/services/interfaces/IManualCraftingValidator';

/**
 * 配方服务
 * 统一管理所有配方的获取和查询逻辑
 */
export class RecipeService {
  private allRecipes: Recipe[] = [];
  private recipesByItem: Map<string, Recipe[]> = new Map();

  constructor() {
    // 公开构造函数，支持依赖注入
  }

  /**
   * 初始化配方数据
   * @param dataJsonRecipes 从 data.json 加载的配方
   */
  initializeRecipes(dataJsonRecipes: Recipe[]): void {
    // 合并 data.json 配方和自定义配方
    this.allRecipes = [...dataJsonRecipes, ...CUSTOM_RECIPES];

    // 构建物品到配方的映射
    this.buildRecipeIndex();
  }

  /**
   * 构建配方索引，用于快速查找
   */
  private buildRecipeIndex(): void {
    this.recipesByItem.clear();

    for (const recipe of this.allRecipes) {
      // 索引输出物品
      for (const itemId of Object.keys(recipe.out)) {
        if (!this.recipesByItem.has(itemId)) {
          this.recipesByItem.set(itemId, []);
        }
        this.recipesByItem.get(itemId)!.push(recipe);
      }

      // 索引输入物品
      for (const itemId of Object.keys(recipe.in)) {
        if (!this.recipesByItem.has(itemId)) {
          this.recipesByItem.set(itemId, []);
        }
        // 避免重复添加同一个配方
        const existingRecipes = this.recipesByItem.get(itemId)!;
        if (!existingRecipes.find(r => r.id === recipe.id)) {
          existingRecipes.push(recipe);
        }
      }
    }
  }

  /**
   * 获取所有配方
   */
  getAllRecipes(): Recipe[] {
    return [...this.allRecipes];
  }

  /**
   * 根据物品ID获取所有相关配方
   * @param itemId 物品ID
   */
  getRecipesByItem(itemId: string): Recipe[] {
    return this.recipesByItem.get(itemId) || [];
  }

  /**
   * 获取生产指定物品的配方
   * @param itemId 物品ID
   */
  getRecipesThatProduce(itemId: string): Recipe[] {
    return this.allRecipes.filter(recipe => recipe.out && recipe.out[itemId] !== undefined);
  }

  /**
   * 获取使用指定物品的配方
   * @param itemId 物品ID
   */
  getRecipesThatUse(itemId: string): Recipe[] {
    return this.allRecipes.filter(recipe => recipe.in && recipe.in[itemId] !== undefined);
  }

  /**
   * 获取手动采集配方
   * @param itemId 物品ID（可选，不指定则获取所有手动采集配方）
   */
  getManualRecipes(itemId?: string): Recipe[] {
    let recipes = this.allRecipes.filter(recipe => recipe.flags?.includes('manual'));

    if (itemId) {
      recipes = recipes.filter(recipe => recipe.out && recipe.out[itemId] !== undefined);
    }

    return recipes;
  }

  /**
   * 获取自动化配方
   * @param itemId 物品ID（可选，不指定则获取所有自动化配方）
   */
  getAutomatedRecipes(itemId?: string): Recipe[] {
    let recipes = this.allRecipes.filter(recipe => !recipe.flags?.includes('manual'));

    if (itemId) {
      recipes = recipes.filter(recipe => recipe.out && recipe.out[itemId] !== undefined);
    }

    return recipes;
  }

  /**
   * 获取采矿配方
   * @param itemId 物品ID（可选，不指定则获取所有采矿配方）
   */
  getMiningRecipes(itemId?: string): Recipe[] {
    let recipes = this.allRecipes.filter(recipe => recipe.flags?.includes('mining'));

    if (itemId) {
      recipes = recipes.filter(recipe => recipe.out && recipe.out[itemId] !== undefined);
    }

    return recipes;
  }

  /**
   * 获取回收配方
   * @param itemId 物品ID（可选，不指定则获取所有回收配方）
   */
  getRecyclingRecipes(itemId?: string): Recipe[] {
    let recipes = this.allRecipes.filter(recipe => recipe.flags?.includes('recycling'));

    if (itemId) {
      recipes = recipes.filter(recipe => recipe.out && recipe.out[itemId] !== undefined);
    }

    return recipes;
  }

  /**
   * 获取物品的手动制作配方
   * 基于 ManualCraftingValidator 的验证逻辑
   * @param itemId 物品ID
   * @returns 手动制作配方，如果不能手动制作则返回 null
   */
  getManualCraftingRecipe(itemId: string): Recipe | null {
    let validator: IManualCraftingValidator | null = null;
    try {
      validator = getService<IManualCraftingValidator>(SERVICE_TOKENS.MANUAL_CRAFTING_VALIDATOR);
    } catch {
      return null;
    }

    let dataService: DataService | null = null;
    try {
      dataService = getService<DataService>(SERVICE_TOKENS.DATA_SERVICE);
    } catch {
      // 服务未注册
    }

    // 1. 先判断物品是否可以手动制作
    const validation = validator.validateManualCrafting(itemId);
    if (!validation.canCraftManually) {
      return null;
    }

    // 2. 如果是原材料（无配方），返回 null
    if (validation.reason === 'raw_material') {
      return null; // 原材料不需要配方
    }

    // 3. 获取所有配方并找到可手动制作的
    const allRecipes = this.getRecipesThatProduce(itemId);

    for (const recipe of allRecipes) {
      // 检查配方是否被解锁
      if (dataService && !dataService.isItemUnlocked(recipe.id)) {
        continue; // 跳过未解锁的配方
      }

      const recipeValidation = validator.validateRecipe(recipe);
      if (recipeValidation.canCraftManually) {
        return recipe; // 返回第一个可手动制作的配方
      }
    }

    return null;
  }

  /**
   * 获取物品的所有手动制作配方
   * @param itemId 物品ID
   * @returns 所有可手动制作的配方列表
   */
  getAllManualCraftingRecipes(itemId: string): Recipe[] {
    let validator: IManualCraftingValidator | null = null;
    try {
      validator = getService<IManualCraftingValidator>(SERVICE_TOKENS.MANUAL_CRAFTING_VALIDATOR);
    } catch {
      return [];
    }

    let dataService: DataService | null = null;
    try {
      dataService = getService<DataService>(SERVICE_TOKENS.DATA_SERVICE);
    } catch {
      // 服务未注册
    }

    // 1. 先判断物品是否可以手动制作
    const validation = validator.validateManualCrafting(itemId);
    if (!validation.canCraftManually) {
      return [];
    }

    // 2. 如果是原材料（无配方），返回空数组
    if (validation.reason === 'raw_material') {
      return []; // 原材料不需要配方
    }

    // 3. 获取所有配方并筛选可手动制作的
    const allRecipes = this.getRecipesThatProduce(itemId);

    return allRecipes.filter(recipe => {
      // 检查配方是否被解锁
      if (dataService && !dataService.isItemUnlocked(recipe.id)) {
        return false; // 跳过未解锁的配方
      }

      const recipeValidation = validator.validateRecipe(recipe);
      return recipeValidation.canCraftManually;
    });
  }

  /**
   * 检查物品是否可以手动制作
   * @param itemId 物品ID
   * @returns 是否可以手动制作
   */
  canCraftManually(itemId: string): boolean {
    let validator: IManualCraftingValidator | null = null;
    try {
      validator = getService<IManualCraftingValidator>(SERVICE_TOKENS.MANUAL_CRAFTING_VALIDATOR);
    } catch {
      return false;
    }

    const validation = validator.validateManualCrafting(itemId);
    return validation.canCraftManually;
  }

  /**
   * 获取物品手动制作的详细信息
   * @param itemId 物品ID
   * @returns 手动制作的详细信息
   */
  getManualCraftingInfo(itemId: string): {
    canCraft: boolean;
    recipe: Recipe | null;
    allRecipes: Recipe[];
    validation: import('../interfaces/IManualCraftingValidator').ManualCraftingValidation;
  } {
    const validator = ServiceLocator.has(SERVICE_NAMES.MANUAL_CRAFTING_VALIDATOR)
      ? ServiceLocator.get<IManualCraftingValidator>(SERVICE_NAMES.MANUAL_CRAFTING_VALIDATOR)
      : null;

    if (!validator) {
      return {
        canCraft: false,
        recipe: null,
        allRecipes: [],
        validation: {
          canCraftManually: false,
          category: 'error',
          reason: 'validator_unavailable',
        },
      };
    }

    const validation = validator.validateManualCrafting(itemId);
    const recipe = this.getManualCraftingRecipe(itemId);
    const allRecipes = this.getAllManualCraftingRecipes(itemId);

    return {
      canCraft: validation.canCraftManually,
      recipe,
      allRecipes,
      validation,
    };
  }

  /**
   * 根据配方ID获取配方
   * @param recipeId 配方ID
   */
  getRecipeById(recipeId: string): Recipe | undefined {
    return this.allRecipes.find(recipe => recipe.id === recipeId);
  }

  /**
   * 根据分类获取配方
   * @param category 配方分类
   */
  getRecipesByCategory(category: string): Recipe[] {
    return this.allRecipes.filter(recipe => recipe.category === category);
  }

  /**
   * 搜索配方
   * @param query 搜索关键词
   */
  searchRecipes(query: string): Recipe[] {
    const lowerQuery = query.toLowerCase();
    return this.allRecipes.filter(
      recipe =>
        recipe.name.toLowerCase().includes(lowerQuery) ||
        recipe.id.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * 获取配方效率（产出/时间）
   * @param recipe 配方
   * @param itemId 物品ID（可选，不指定则计算主要产出）
   */
  getRecipeEfficiency(recipe: Recipe, itemId?: string): number {
    if (!recipe.time || recipe.time === 0) return 0;

    if (itemId) {
      const output = recipe.out[itemId];
      return output ? output / recipe.time : 0;
    }

    // 计算主要产出的效率
    const outputs = Object.values(recipe.out);
    const totalOutput = outputs.reduce((sum, amount) => (sum as number) + (amount as number), 0);
    return totalOutput / recipe.time;
  }

  /**
   * 获取最高效率的配方
   * @param itemId 物品ID
   */
  getMostEfficientRecipe(itemId: string): Recipe | undefined {
    const recipes = this.getRecipesThatProduce(itemId);
    if (recipes.length === 0) return undefined;

    let bestRecipe = recipes[0];
    let bestEfficiency = this.getRecipeEfficiency(bestRecipe, itemId);

    for (const recipe of recipes) {
      const efficiency = this.getRecipeEfficiency(recipe, itemId);
      if (efficiency > bestEfficiency) {
        bestEfficiency = efficiency;
        bestRecipe = recipe;
      }
    }

    return bestRecipe;
  }

  /**
   * 获取配方统计信息
   * @param itemId 物品ID
   */
  getRecipeStats(itemId: string): {
    totalRecipes: number;
    manualRecipes: number;
    automatedRecipes: number;
    miningRecipes: number;
    recyclingRecipes: number;
    mostEfficientRecipe?: Recipe;
  } {
    const allRecipes = this.getRecipesThatProduce(itemId);
    const manualRecipes = this.getManualRecipes(itemId);
    const automatedRecipes = this.getAutomatedRecipes(itemId);
    const miningRecipes = this.getMiningRecipes(itemId);
    const recyclingRecipes = this.getRecyclingRecipes(itemId);
    const mostEfficientRecipe = this.getMostEfficientRecipe(itemId);

    return {
      totalRecipes: allRecipes.length,
      manualRecipes: manualRecipes.length,
      automatedRecipes: automatedRecipes.length,
      miningRecipes: miningRecipes.length,
      recyclingRecipes: recyclingRecipes.length,
      mostEfficientRecipe,
    };
  }

  // ========== 新增高级功能 ==========

  /**
   * 获取配方依赖链
   * @param recipe 配方
   * @param maxDepth 最大深度（防止无限递归）
   */
  getRecipeDependencyChain(
    recipe: Recipe,
    maxDepth: number = 5
  ): {
    dependencies: Map<string, number>;
    totalCost: Map<string, number>;
    depth: number;
  } {
    const dependencies = new Map<string, number>();
    const totalCost = new Map<string, number>();

    this.calculateDependencies(recipe, dependencies, totalCost, 0, maxDepth);

    return {
      dependencies,
      totalCost,
      depth: Math.max(...Array.from(dependencies.values())),
    };
  }

  /**
   * 计算配方依赖
   * @param recipe 配方
   * @param dependencies 依赖映射
   * @param totalCost 总成本映射
   * @param currentDepth 当前深度
   * @param maxDepth 最大深度
   */
  private calculateDependencies(
    recipe: Recipe,
    dependencies: Map<string, number>,
    totalCost: Map<string, number>,
    currentDepth: number,
    maxDepth: number
  ): void {
    if (currentDepth >= maxDepth) return;

    if (!recipe.in) return;

    for (const [itemId, amount] of Object.entries(recipe.in)) {
      // 更新依赖深度
      const existingDepth = dependencies.get(itemId) || 0;
      dependencies.set(itemId, Math.max(existingDepth, currentDepth + 1));

      // 更新总成本
      const existingCost = totalCost.get(itemId) || 0;
      totalCost.set(itemId, existingCost + (amount as number));

      // 递归计算该物品的配方依赖
      const itemRecipes = this.getRecipesThatProduce(itemId);
      if (itemRecipes.length > 0) {
        const bestRecipe = this.getMostEfficientRecipe(itemId);
        if (bestRecipe) {
          this.calculateDependencies(
            bestRecipe,
            dependencies,
            totalCost,
            currentDepth + 1,
            maxDepth
          );
        }
      }
    }
  }

  /**
   * 计算配方总成本
   * @param recipe 配方
   * @param includeRawMaterials 是否包含原材料成本
   */
  calculateRecipeCost(
    recipe: Recipe,
    includeRawMaterials: boolean = true
  ): {
    directCost: Map<string, number>;
    totalCost: Map<string, number>;
    rawMaterials: Map<string, number>;
  } {
    const directCost = new Map<string, number>();
    const totalCost = new Map<string, number>();
    const rawMaterials = new Map<string, number>();

    if (!recipe.in) {
      return { directCost, totalCost, rawMaterials };
    }

    // 计算直接成本
    for (const [itemId, amount] of Object.entries(recipe.in)) {
      directCost.set(itemId, amount as number);
      totalCost.set(itemId, amount as number);
    }

    if (includeRawMaterials) {
      // 计算原材料成本
      for (const [itemId, amount] of Object.entries(recipe.in)) {
        const itemRecipes = this.getRecipesThatProduce(itemId);
        if (itemRecipes.length === 0) {
          // 这是原材料
          const existing = rawMaterials.get(itemId) || 0;
          rawMaterials.set(itemId, existing + (amount as number));
        } else {
          // 递归计算该物品的成本
          const bestRecipe = this.getMostEfficientRecipe(itemId);
          if (bestRecipe) {
            const subCost = this.calculateRecipeCost(bestRecipe, true);
            for (const [subItemId, subAmount] of subCost.totalCost) {
              const totalAmount = subAmount * (amount as number);
              const existing = totalCost.get(subItemId) || 0;
              totalCost.set(subItemId, existing + totalAmount);

              // 检查是否为原材料
              const subItemRecipes = this.getRecipesThatProduce(subItemId);
              if (subItemRecipes.length === 0) {
                const existingRaw = rawMaterials.get(subItemId) || 0;
                rawMaterials.set(subItemId, existingRaw + totalAmount);
              }
            }
          }
        }
      }
    }

    return { directCost, totalCost, rawMaterials };
  }

  /**
   * 获取最优生产路径
   * @param targetItemId 目标物品ID
   * @param quantity 目标数量
   * @param unlockedItems 已解锁的物品列表
   */
  getOptimalProductionPath(
    targetItemId: string,
    quantity: number = 1,
    unlockedItems: string[] = []
  ): {
    path: Recipe[];
    totalTime: number;
    totalCost: Map<string, number>;
    efficiency: number;
  } {
    const recipes = this.getRecipesThatProduce(targetItemId);
    if (recipes.length === 0) {
      return { path: [], totalTime: 0, totalCost: new Map(), efficiency: 0 };
    }

    // 过滤已解锁的配方
    const availableRecipes = recipes.filter(recipe => {
      if (!recipe.producers || recipe.producers.length === 0) return true;
      return recipe.producers.some((producer: string) => unlockedItems.includes(producer));
    });

    if (availableRecipes.length === 0) {
      return { path: [], totalTime: 0, totalCost: new Map(), efficiency: 0 };
    }

    // 选择最高效率的配方
    const bestRecipe = this.getMostEfficientRecipe(targetItemId) || availableRecipes[0];
    const path = [bestRecipe];
    const totalTime = bestRecipe.time * quantity;
    const totalCost = new Map<string, number>();

    // 计算总成本
    if (bestRecipe.in) {
      for (const [itemId, amount] of Object.entries(bestRecipe.in)) {
        totalCost.set(itemId, (amount as number) * quantity);
      }
    }

    const efficiency = this.getRecipeEfficiency(bestRecipe, targetItemId);

    return {
      path,
      totalTime,
      totalCost,
      efficiency,
    };
  }

  /**
   * 获取配方推荐
   * @param itemId 物品ID
   * @param unlockedItems 已解锁的物品列表
   * @param preferences 用户偏好（'efficiency' | 'speed' | 'cost' | 'manual'）
   */
  getRecipeRecommendations(
    itemId: string,
    unlockedItems: string[] = [],
    preferences: 'efficiency' | 'speed' | 'cost' | 'manual' = 'efficiency'
  ): Recipe[] {
    const allRecipes = this.getRecipesThatProduce(itemId);

    // 过滤已解锁的配方
    const availableRecipes = allRecipes.filter(recipe => {
      if (!recipe.producers || recipe.producers.length === 0) return true;
      return recipe.producers.some((producer: string) => unlockedItems.includes(producer));
    });

    if (availableRecipes.length === 0) {
      return [];
    }

    // 根据偏好排序
    switch (preferences) {
      case 'efficiency':
        return availableRecipes.sort((a, b) => {
          const efficiencyA = this.getRecipeEfficiency(a, itemId);
          const efficiencyB = this.getRecipeEfficiency(b, itemId);
          return efficiencyB - efficiencyA;
        });

      case 'speed':
        return availableRecipes.sort((a, b) => {
          const timeA = a.time || 1;
          const timeB = b.time || 1;
          return timeA - timeB;
        });

      case 'cost':
        return availableRecipes.sort((a, b) => {
          const costA = this.calculateRecipeCost(a, true).totalCost.size;
          const costB = this.calculateRecipeCost(b, true).totalCost.size;
          return costA - costB;
        });

      case 'manual': {
        const manualRecipes = availableRecipes.filter(r => r.flags?.includes('manual'));
        const automatedRecipes = availableRecipes.filter(r => !r.flags?.includes('manual'));
        return [...manualRecipes, ...automatedRecipes];
      }

      default:
        return availableRecipes;
    }
  }

  /**
   * 获取增强的配方统计信息
   * @param itemId 物品ID
   * @param unlockedItems 已解锁的物品列表
   */
  getEnhancedRecipeStats(
    itemId: string,
    unlockedItems: string[] = []
  ): {
    totalRecipes: number;
    availableRecipes: number;
    manualRecipes: number;
    automatedRecipes: number;
    miningRecipes: number;
    recyclingRecipes: number;
    mostEfficientRecipe?: Recipe;
    fastestRecipe?: Recipe;
    cheapestRecipe?: Recipe;
    dependencyDepth: number;
    averageEfficiency: number;
  } {
    const stats = this.getRecipeStats(itemId);
    const allRecipes = this.getRecipesThatProduce(itemId);

    // 过滤可用配方
    const availableRecipes = allRecipes.filter(recipe => {
      if (!recipe.producers || recipe.producers.length === 0) return true;
      return recipe.producers.some((producer: string) => unlockedItems.includes(producer));
    });

    // 找到最快配方
    const fastestRecipe = availableRecipes.reduce(
      (fastest, current) => {
        const timeA = fastest?.time || Infinity;
        const timeB = current.time || Infinity;
        return timeB < timeA ? current : fastest;
      },
      undefined as Recipe | undefined
    );

    // 找到最便宜配方
    const cheapestRecipe = availableRecipes.reduce(
      (cheapest, current) => {
        const costA = cheapest ? this.calculateRecipeCost(cheapest, true).totalCost.size : Infinity;
        const costB = this.calculateRecipeCost(current, true).totalCost.size;
        return costB < costA ? current : cheapest;
      },
      undefined as Recipe | undefined
    );

    // 计算平均效率
    const efficiencies = availableRecipes.map(r => this.getRecipeEfficiency(r, itemId));
    const averageEfficiency =
      efficiencies.length > 0
        ? efficiencies.reduce((sum, eff) => sum + eff, 0) / efficiencies.length
        : 0;

    // 计算最大依赖深度
    let maxDepth = 0;
    for (const recipe of availableRecipes) {
      const dependencyChain = this.getRecipeDependencyChain(recipe);
      maxDepth = Math.max(maxDepth, dependencyChain.depth);
    }

    return {
      ...stats,
      availableRecipes: availableRecipes.length,
      fastestRecipe,
      cheapestRecipe,
      dependencyDepth: maxDepth,
      averageEfficiency,
    };
  }

  /**
   * 获取配方复杂度评分
   * @param recipe 配方
   */
  getRecipeComplexityScore(recipe: Recipe): number {
    let score = 0;

    // 基于输入材料数量
    if (recipe.in) {
      score += Object.keys(recipe.in).length * 2;
    }

    // 基于输出材料数量
    if (recipe.out) {
      score += Object.keys(recipe.out).length;
    }

    // 基于制作时间
    score += (recipe.time || 1) / 10;

    // 基于生产者数量
    if (recipe.producers) {
      score += recipe.producers.length * 3;
    }

    // 基于标志
    if (recipe.flags) {
      if (recipe.flags.includes('manual')) score -= 2;
      if (recipe.flags.includes('mining')) score -= 1;
      if (recipe.flags.includes('recycling')) score += 3;
      if (recipe.flags.includes('technology')) score += 5;
    }

    return Math.max(0, score);
  }

  /**
   * 获取配方分类统计
   */
  getRecipeCategoryStats(): Map<string, number> {
    const categoryStats = new Map<string, number>();

    for (const recipe of this.allRecipes) {
      const category = recipe.category || 'unknown';
      const count = categoryStats.get(category) || 0;
      categoryStats.set(category, count + 1);
    }

    return categoryStats;
  }
}
