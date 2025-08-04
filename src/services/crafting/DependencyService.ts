// 依赖分析服务 - 用于计算制作链式任务
import type { Recipe, CraftingTask } from '@/types/index';

import { RecipeService } from '@/services/crafting/RecipeService';
import ManualCraftingValidator from '@/utils/manualCraftingValidator';
import { getService } from '@/services/core/DIServiceInitializer';
import { SERVICE_TOKENS } from '@/services/core/ServiceTokens';

export interface CraftingDependency {
  itemId: string;
  required: number;
  available: number;
  shortage: number;
  recipe?: Recipe;
  canCraftManually: boolean;
}

export interface CraftingChainAnalysis {
  mainTask: {
    itemId: string;
    quantity: number;
    recipe?: Recipe;
  };
  dependencies: CraftingDependency[];
  tasks: CraftingTask[];
  totalItems: number;
  totalBasicMaterialNeeds?: Map<string, number>; // 总基础材料需求
}

export class DependencyService {
  private validator: ManualCraftingValidator;

  constructor() {
    // 使用DI容器获取依赖
    this.validator = getService<ManualCraftingValidator>(SERVICE_TOKENS.MANUAL_CRAFTING_VALIDATOR);
  }

  /**
   * 分析制作任务的依赖链
   * @param itemId 目标物品ID
   * @param quantity 需要数量
   * @param inventory 当前库存状态
   * @returns 制作链分析结果
   */
  analyzeCraftingChain(
    itemId: string,
    quantity: number,
    inventory: Map<string, { currentAmount: number }>
  ): CraftingChainAnalysis | null {
    // 获取主要制作配方
    const mainRecipe = this.getBestManualCraftingRecipe(itemId);
    if (!mainRecipe) {
      return null;
    }

    const dependencies: CraftingDependency[] = [];
    const tasks: CraftingTask[] = [];
    const totalBasicMaterialNeeds = new Map<string, number>(); // 总基础材料需求
    let taskIdCounter = 1;

    // 首先计算总的基础材料需求
    this.calculateTotalBasicMaterialNeeds(mainRecipe, quantity, totalBasicMaterialNeeds);

    // 检查总基础材料是否足够
    for (const [basicMaterialId, totalNeeded] of totalBasicMaterialNeeds) {
      const available = inventory.get(basicMaterialId)?.currentAmount || 0;
      if (available < totalNeeded) {
        // 如果总的基础材料不够，无法创建链式制作
        return null;
      }
    }

    // 分析每个输入材料的依赖
    for (const [inputItemId, requiredPerCraft] of Object.entries(mainRecipe.in)) {
      const totalRequired = requiredPerCraft * quantity;
      const available = inventory.get(inputItemId)?.currentAmount || 0;
      const shortage = Math.max(0, totalRequired - available);

      if (shortage > 0) {
        // 查找材料的制作配方
        const materialRecipe = this.getBestManualCraftingRecipe(inputItemId);
        const canCraftManually =
          this.validator.validateManualCrafting(inputItemId).canCraftManually;

        const dependency: CraftingDependency = {
          itemId: inputItemId,
          required: totalRequired,
          available,
          shortage,
          recipe: materialRecipe || undefined,
          canCraftManually,
        };

        dependencies.push(dependency);

        // 如果可以手动制作，创建制作任务
        if (canCraftManually && materialRecipe) {
          const craftQuantity = Math.ceil(shortage / Object.values(materialRecipe.out)[0]);

          tasks.push({
            id: `chain_${taskIdCounter++}`,
            recipeId: `manual_${inputItemId}`,
            itemId: inputItemId,
            quantity: craftQuantity,
            progress: 0,
            startTime: 0,
            craftingTime: materialRecipe.time,
            status: 'pending',
          });
        }
      }
    }

    // 添加主任务
    tasks.push({
      id: `chain_${taskIdCounter++}`,
      recipeId: `manual_${itemId}`,
      itemId: itemId,
      quantity: quantity,
      progress: 0,
      startTime: 0,
      craftingTime: mainRecipe.time,
      status: 'pending',
    });

    return {
      mainTask: {
        itemId,
        quantity,
        recipe: mainRecipe,
      },
      dependencies,
      tasks,
      totalItems: dependencies.length + 1,
      totalBasicMaterialNeeds, // 添加总基础材料需求信息
    };
  }

  /**
   * 递归计算总的基础材料需求
   * @param recipe 配方
   * @param quantity 制作数量
   * @param totalNeeds 总需求映射
   */
  private calculateTotalBasicMaterialNeeds(
    recipe: Recipe,
    quantity: number,
    totalNeeds: Map<string, number>
  ): void {
    for (const [inputItemId, requiredPerCraft] of Object.entries(recipe.in)) {
      const totalRequired = requiredPerCraft * quantity;

      // 检查这个材料是否可以进一步制作
      const inputRecipe = this.getBestManualCraftingRecipe(inputItemId);

      // 采矿配方不需要材料，不应计入基础材料需求
      if (
        inputRecipe &&
        inputRecipe.in &&
        Object.keys(inputRecipe.in).length > 0 &&
        !inputRecipe.flags?.includes('mining')
      ) {
        // 这是一个中间产物，需要递归计算其基础材料需求
        this.calculateTotalBasicMaterialNeeds(
          inputRecipe,
          Math.ceil(totalRequired / Object.values(inputRecipe.out)[0]),
          totalNeeds
        );
      } else {
        // 这是基础材料或可采矿物品，不计入基础材料需求
        // 采矿物品可以无限制获取，所以不需要验证库存
        if (!inputRecipe || !inputRecipe.flags?.includes('mining')) {
          const existingNeed = totalNeeds.get(inputItemId) || 0;
          totalNeeds.set(inputItemId, existingNeed + totalRequired);
        }
      }
    }
  }

  /**
   * 检查是否需要创建依赖任务
   * @param itemId 物品ID
   * @param quantity 数量
   * @param inventory 库存状态
   * @returns 是否有依赖缺失
   */
  hasMissingDependencies(
    itemId: string,
    quantity: number,
    inventory: Map<string, { currentAmount: number }>
  ): boolean {
    const recipe = this.getBestManualCraftingRecipe(itemId);
    if (!recipe) return false;

    // 检查是否有任何材料不足
    for (const [inputItemId, requiredPerCraft] of Object.entries(recipe.in)) {
      const totalRequired = requiredPerCraft * quantity;
      const available = inventory.get(inputItemId)?.currentAmount || 0;

      if (available < totalRequired) {
        return true;
      }
    }

    return false;
  }

  /**
   * 获取最佳的手动制作配方
   * @param itemId 物品ID
   * @returns 配方或null
   */
  private getBestManualCraftingRecipe(itemId: string): Recipe | null {
    // 通过DI获取RecipeService实例
    const recipeService = getService<RecipeService>(SERVICE_TOKENS.RECIPE_SERVICE);
    const recipes = recipeService.getRecipesThatProduce(itemId) || [];

    // 过滤出可手动制作的配方
    const manualRecipes = recipes.filter(recipe => {
      const validation = this.validator.validateRecipe(recipe);
      return validation.canCraftManually;
    });

    if (manualRecipes.length === 0) {
      return null;
    }

    // 优先选择采矿配方
    const miningRecipe = manualRecipes.find(r => r.flags?.includes('mining'));
    if (miningRecipe) {
      return miningRecipe;
    }

    // 其次选择基础制作配方（非回收）
    const basicRecipe = manualRecipes.find(r => !r.flags?.includes('recycling'));
    if (basicRecipe) {
      return basicRecipe;
    }

    // 最后选择第一个可用配方
    return manualRecipes[0];
  }

  /**
   * 计算制作链的预计完成时间
   * @param chain 制作链
   * @returns 总时间（秒）
   */
  calculateChainDuration(chain: CraftingChainAnalysis): number {
    const manualEfficiency = 0.5; // 手动效率
    let totalTime = 0;

    // 计算所有任务的时间
    for (const task of chain.tasks) {
      const baseTime = task.craftingTime || 1;
      const actualTime = baseTime / manualEfficiency;
      totalTime += actualTime * task.quantity;
    }

    return totalTime;
  }
}

export default DependencyService;
