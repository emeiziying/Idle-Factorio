import type { Recipe } from '../../types';
import { CUSTOM_RECIPES } from '../../data/customRecipes';
import { ServiceLocator, SERVICE_NAMES } from '../utils/ServiceLocator';
import type { DataService } from './DataService';
import type { IManualCraftingValidator } from '../interfaces/IManualCraftingValidator';
import { BaseService } from '../base/BaseService';
import { CacheManager } from '../base/CacheManager';

/**
 * 配方服务
 * 统一管理所有配方的获取和查询逻辑
 */
export class RecipeService extends BaseService {
  private static allRecipes: Recipe[] = [];
  private recipesByItemCache = new CacheManager<string, Recipe[]>();
  private manualCraftingCache = new CacheManager<string, Recipe | null>();

  protected constructor() {
    super();
    this.initializeDependencies();
  }

  /**
   * 初始化配方数据
   * @param dataJsonRecipes 从 data.json 加载的配方
   */
  static initializeRecipes(dataJsonRecipes: Recipe[]): void {
    // 合并 data.json 配方和自定义配方
    this.allRecipes = [
      ...dataJsonRecipes,
      ...CUSTOM_RECIPES
    ];
  }

  /**
   * 获取所有配方
   */
  getAllRecipes(): Recipe[] {
    return [...RecipeService.allRecipes];
  }

  /**
   * 根据物品ID获取所有相关配方（带缓存）
   * @param itemId 物品ID
   */
  getRecipesByItem(itemId: string): Recipe[] {
    const cached = this.recipesByItemCache.get(itemId);
    if (cached) {
      return cached;
    }

    const recipes = RecipeService.allRecipes.filter(recipe => 
      (recipe.out && recipe.out[itemId] !== undefined) ||
      (recipe.in && recipe.in[itemId] !== undefined)
    );

    this.recipesByItemCache.set(itemId, recipes);
    return recipes;
  }

  /**
   * 获取生产指定物品的配方
   * @param itemId 物品ID
   */
  getRecipesThatProduce(itemId: string): Recipe[] {
    return RecipeService.allRecipes.filter(recipe => 
      recipe.out && recipe.out[itemId] !== undefined
    );
  }

  /**
   * 获取使用指定物品的配方
   * @param itemId 物品ID
   */
  getRecipesThatUse(itemId: string): Recipe[] {
    return RecipeService.allRecipes.filter(recipe => 
      recipe.in && recipe.in[itemId] !== undefined
    );
  }

  /**
   * 获取手动采集配方
   * @param itemId 物品ID（可选，不指定则获取所有手动采集配方）
   */
  getManualRecipes(itemId?: string): Recipe[] {
    let recipes = RecipeService.allRecipes.filter(recipe => 
      recipe.flags?.includes("manual")
    );

    if (itemId) {
      recipes = recipes.filter(recipe => 
        recipe.out && recipe.out[itemId] !== undefined
      );
    }

    return recipes;
  }

  /**
   * 获取自动化配方
   * @param itemId 物品ID（可选，不指定则获取所有自动化配方）
   */
  getAutomatedRecipes(itemId?: string): Recipe[] {
    let recipes = RecipeService.allRecipes.filter(recipe => 
      !recipe.flags?.includes("manual")
    );

    if (itemId) {
      recipes = recipes.filter(recipe => 
        recipe.out && recipe.out[itemId] !== undefined
      );
    }

    return recipes;
  }

  /**
   * 获取采矿配方
   * @param itemId 物品ID（可选，不指定则获取所有采矿配方）
   */
  getMiningRecipes(itemId?: string): Recipe[] {
    let recipes = RecipeService.allRecipes.filter(recipe => 
      recipe.flags?.includes("mining")
    );

    if (itemId) {
      recipes = recipes.filter(recipe => 
        recipe.out && recipe.out[itemId] !== undefined
      );
    }

    return recipes;
  }

  /**
   * 获取回收配方
   * @param itemId 物品ID（可选，不指定则获取所有回收配方）
   */
  getRecyclingRecipes(itemId?: string): Recipe[] {
    let recipes = RecipeService.allRecipes.filter(recipe => 
      recipe.flags?.includes("recycling")
    );

    if (itemId) {
      recipes = recipes.filter(recipe => 
        recipe.out && recipe.out[itemId] !== undefined
      );
    }

    return recipes;
  }

  /**
   * 获取物品的手动制作配方（带缓存）
   * 基于 ManualCraftingValidator 的验证逻辑
   * @param itemId 物品ID
   * @returns 手动制作配方，如果不能手动制作则返回 null
   */
  getManualCraftingRecipe(itemId: string): Recipe | null {
    return this.safeAsync(async () => {
      const cached = this.manualCraftingCache.get(itemId);
      if (cached !== undefined) {
        return cached;
      }

      const validator = ServiceLocator.has(SERVICE_NAMES.MANUAL_CRAFTING_VALIDATOR)
        ? ServiceLocator.get<IManualCraftingValidator>(SERVICE_NAMES.MANUAL_CRAFTING_VALIDATOR)
        : null;
      
      if (!validator) {
        this.manualCraftingCache.set(itemId, null);
        return null;
      }
      
      const dataService = ServiceLocator.has(SERVICE_NAMES.DATA) 
        ? ServiceLocator.get<DataService>(SERVICE_NAMES.DATA) 
        : null;
      
      // 1. 先判断物品是否可以手动制作
      const validation = validator.validateManualCrafting(itemId);
      if (!validation.canCraftManually) {
        this.manualCraftingCache.set(itemId, null);
        return null;
      }

      // 2. 查找手动制作配方
      const manualRecipes = this.getRecipesThatProduce(itemId).filter(recipe => 
        recipe.flags?.includes("manual")
      );

      let bestRecipe: Recipe | null = null;

      if (manualRecipes.length > 0) {
        // 有专门的手动制作配方，选择最优的
        bestRecipe = manualRecipes.reduce((best, current) => {
          const bestTime = best.time || 1;
          const currentTime = current.time || 1;
          return currentTime < bestTime ? current : best;
        });
      } else {
        // 3. 使用自动化配方的简化版本
        const automatedRecipes = this.getRecipesThatProduce(itemId).filter(recipe => 
          !recipe.flags?.includes("manual") && 
          !recipe.flags?.includes("mining") &&
          !recipe.flags?.includes("recycling")
        );

        if (automatedRecipes.length > 0) {
          const baseRecipe = automatedRecipes[0];
          
          // 创建手动制作配方
          bestRecipe = {
            id: `${baseRecipe.id}_manual`,
            name: `${baseRecipe.name || baseRecipe.id} (手动制作)`,
            category: baseRecipe.category,
            in: baseRecipe.in,
            out: baseRecipe.out,
            time: (baseRecipe.time || 1) * 2, // 手动制作时间加倍
            flags: ["manual"],
            producers: ["character"], // 只能由角色制作
            energy: undefined, // 手动制作不需要能源
            icon: baseRecipe.icon
          };
        }
      }

      this.manualCraftingCache.set(itemId, bestRecipe);
      return bestRecipe;
    }, 'getManualCraftingRecipe', null);
  }

  /**
   * 根据配方ID获取配方
   * @param recipeId 配方ID
   */
  getRecipeById(recipeId: string): Recipe | undefined {
    return RecipeService.allRecipes.find(recipe => recipe.id === recipeId);
  }

  /**
   * 搜索配方
   * @param query 搜索关键词
   * @param type 配方类型过滤
   */
  searchRecipes(query: string, type?: 'manual' | 'automated' | 'mining' | 'recycling'): Recipe[] {
    const lowerQuery = query.toLowerCase();
    let recipes = RecipeService.allRecipes;

    // 按类型过滤
    if (type) {
      switch (type) {
        case 'manual':
          recipes = this.getManualRecipes();
          break;
        case 'automated':
          recipes = this.getAutomatedRecipes();
          break;
        case 'mining':
          recipes = this.getMiningRecipes();
          break;
        case 'recycling':
          recipes = this.getRecyclingRecipes();
          break;
      }
    }

    // 按关键词搜索
    return recipes.filter(recipe => {
      const recipeName = (recipe.name || recipe.id).toLowerCase();
      const recipeId = recipe.id.toLowerCase();
      return recipeName.includes(lowerQuery) || recipeId.includes(lowerQuery);
    });
  }

  /**
   * 获取配方的生产效率
   * @param recipeId 配方ID
   * @param producerType 生产设备类型
   */
  getRecipeEfficiency(recipeId: string, producerType?: string): number {
    const recipe = this.getRecipeById(recipeId);
    if (!recipe) return 1;

    // 基础效率
    let efficiency = 1;

    // 根据生产设备调整效率
    if (producerType && recipe.producers?.includes(producerType)) {
      // 这里可以根据不同的生产设备设置不同的效率
      switch (producerType) {
        case 'character':
          efficiency = 0.5; // 手动制作效率较低
          break;
        case 'assembling-machine-1':
          efficiency = 0.5;
          break;
        case 'assembling-machine-2':
          efficiency = 0.75;
          break;
        case 'assembling-machine-3':
          efficiency = 1.25;
          break;
        default:
          efficiency = 1;
      }
    }

    return efficiency;
  }

  /**
   * 计算配方的实际产出时间
   * @param recipeId 配方ID
   * @param producerType 生产设备类型
   * @param modules 模块效果
   */
  calculateActualTime(
    recipeId: string, 
    producerType?: string, 
    modules?: { speed?: number; productivity?: number }
  ): number {
    const recipe = this.getRecipeById(recipeId);
    if (!recipe) return 0;

    const baseTime = recipe.time || 1;
    const efficiency = this.getRecipeEfficiency(recipeId, producerType);
    
    // 应用模块效果
    let speedMultiplier = 1;
    if (modules?.speed) {
      speedMultiplier += modules.speed;
    }

    return baseTime / (efficiency * speedMultiplier);
  }

  /**
   * 计算配方的实际产出量
   * @param recipeId 配方ID
   * @param modules 模块效果
   */
  calculateActualOutput(
    recipeId: string,
    modules?: { productivity?: number }
  ): Record<string, number> {
    const recipe = this.getRecipeById(recipeId);
    if (!recipe || !recipe.out) return {};

    const output = { ...recipe.out };
    
    // 应用生产力模块效果
    if (modules?.productivity) {
      for (const itemId in output) {
        output[itemId] *= (1 + modules.productivity);
      }
    }

    return output;
  }

  /**
   * 获取配方链（递归查找原材料）
   * @param itemId 目标物品ID
   * @param depth 递归深度限制
   */
  getRecipeChain(itemId: string, depth: number = 5): Recipe[] {
    if (depth <= 0) return [];

    const chain: Recipe[] = [];
    const visited = new Set<string>();

    const findChain = (currentItemId: string, currentDepth: number): void => {
      if (currentDepth <= 0 || visited.has(currentItemId)) return;
      
      visited.add(currentItemId);
      const recipes = this.getRecipesThatProduce(currentItemId);
      
      for (const recipe of recipes) {
        if (!chain.find(r => r.id === recipe.id)) {
          chain.push(recipe);
          
          // 递归查找输入材料的配方
          if (recipe.in) {
            for (const inputItemId of Object.keys(recipe.in)) {
              findChain(inputItemId, currentDepth - 1);
            }
          }
        }
      }
    };

    findChain(itemId, depth);
    return chain;
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.recipesByItemCache.clear();
    this.manualCraftingCache.clear();
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      recipesByItem: this.recipesByItemCache.getStats(),
      manualCrafting: this.manualCraftingCache.getStats()
    };
  }
}