/**
 * 依赖分析服务（重构版）
 * 使用 BaseService 架构
 */
import { BaseService } from '../base/BaseService';
import type { Recipe, CraftingTask } from '../../types/index';
import { RecipeService } from '../core/RecipeService';
import ManualCraftingValidator from '../../utils/manualCraftingValidator';

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
  totalRawMaterialNeeds?: Map<string, number>; // 总原材料需求
}

/**
 * 依赖分析服务类
 * 负责分析制作链和依赖关系
 */
export class DependencyService extends BaseService {
  private validator?: ManualCraftingValidator;
  
  constructor() {
    super();
    this.serviceName = 'DependencyService';
    this.dependencies = [];
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    this.validator = ManualCraftingValidator.getInstance();
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
    return this.safe(() => {
      // 获取主要制作配方
      const mainRecipe = this.getBestManualCraftingRecipe(itemId);
      if (!mainRecipe) {
        return null;
      }

      const dependencies: CraftingDependency[] = [];
      const tasks: CraftingTask[] = [];
      const totalRawMaterialNeeds = new Map<string, number>(); // 总原材料需求
      let taskIdCounter = 1;

      // 首先计算总的原材料需求
      this.calculateTotalRawMaterialNeeds(mainRecipe, quantity, totalRawMaterialNeeds);

      // 检查总原材料是否足够
      for (const [rawMaterialId, totalNeeded] of totalRawMaterialNeeds) {
        const available = inventory.get(rawMaterialId)?.currentAmount || 0;
        if (available < totalNeeded) {
          // 如果总的原材料不够，无法创建链式制作
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
          const canCraftManually = this.validator!.validateManualCrafting(inputItemId).canCraftManually;

          const dependency: CraftingDependency = {
            itemId: inputItemId,
            required: totalRequired,
            available,
            shortage,
            recipe: materialRecipe || undefined,
            canCraftManually
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
              status: 'pending'
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
        status: 'pending'
      });

      return {
        mainTask: {
          itemId,
          quantity,
          recipe: mainRecipe
        },
        dependencies,
        tasks,
        totalItems: dependencies.length + 1,
        totalRawMaterialNeeds // 添加总原材料需求信息
      };
    }, 'analyzeCraftingChain', null);
  }

  /**
   * 递归计算总的原材料需求
   * @param recipe 配方
   * @param quantity 制作数量
   * @param totalNeeds 总需求映射
   */
  private calculateTotalRawMaterialNeeds(
    recipe: Recipe, 
    quantity: number, 
    totalNeeds: Map<string, number>
  ): void {
    for (const [inputItemId, requiredPerCraft] of Object.entries(recipe.in)) {
      const totalRequired = requiredPerCraft * quantity;
      
      // 检查这个材料是否可以进一步制作
      const inputRecipe = this.getBestManualCraftingRecipe(inputItemId);
      
      // 采矿配方不需要材料，不应计入原材料需求
      if (inputRecipe && inputRecipe.in && Object.keys(inputRecipe.in).length > 0 && !inputRecipe.flags?.includes('mining')) {
        // 这是一个中间产物，需要递归计算其原材料需求
        this.calculateTotalRawMaterialNeeds(inputRecipe, Math.ceil(totalRequired / Object.values(inputRecipe.out)[0]), totalNeeds);
      } else {
        // 这是原材料或可采矿物品，不计入原材料需求
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
    return this.safe(() => {
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
    }, 'hasMissingDependencies', false);
  }

  /**
   * 获取最佳的手动制作配方
   * @param itemId 物品ID
   * @returns 配方或null
   */
  private getBestManualCraftingRecipe(itemId: string): Recipe | null {
    const recipes = RecipeService.getRecipesThatProduce(itemId);
    
    // 过滤出可手动制作的配方
    const manualRecipes = recipes.filter(recipe => {
      const validation = this.validator!.validateRecipe(recipe);
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
    return this.safe(() => {
      const manualEfficiency = 0.5; // 手动效率
      let totalTime = 0;

      // 计算所有任务的时间
      for (const task of chain.tasks) {
        const baseTime = task.craftingTime || 1;
        const actualTime = baseTime / manualEfficiency;
        totalTime += actualTime * task.quantity;
      }

      return totalTime;
    }, 'calculateChainDuration', 0);
  }

  /**
   * 分析物品的制作路径
   * @param itemId 物品ID
   * @returns 制作路径信息
   */
  analyzeCraftingPath(itemId: string): {
    canCraft: boolean;
    canCraftManually: boolean;
    recipes: Recipe[];
    rawMaterials: Set<string>;
  } {
    return this.safe(() => {
      const recipes = RecipeService.getRecipesThatProduce(itemId);
      const canCraft = recipes.length > 0;
      const canCraftManually = recipes.some(r => 
        this.validator!.validateRecipe(r).canCraftManually
      );
      
      // 收集所有原材料
      const rawMaterials = new Set<string>();
      const processedItems = new Set<string>();
      
      const collectRawMaterials = (recipeId: string) => {
        if (processedItems.has(recipeId)) return;
        processedItems.add(recipeId);
        
        const recipe = RecipeService.getRecipesThatProduce(recipeId)[0];
        if (!recipe) {
          rawMaterials.add(recipeId);
          return;
        }
        
        for (const inputId of Object.keys(recipe.in)) {
          const inputRecipes = RecipeService.getRecipesThatProduce(inputId);
          if (inputRecipes.length === 0 || inputRecipes[0].flags?.includes('mining')) {
            rawMaterials.add(inputId);
          } else {
            collectRawMaterials(inputId);
          }
        }
      };
      
      if (canCraft) {
        collectRawMaterials(itemId);
      }
      
      return {
        canCraft,
        canCraftManually,
        recipes,
        rawMaterials
      };
    }, 'analyzeCraftingPath', {
      canCraft: false,
      canCraftManually: false,
      recipes: [],
      rawMaterials: new Set()
    });
  }

  /**
   * 优化制作链，移除冗余任务
   * @param chain 原始制作链
   * @returns 优化后的制作链
   */
  optimizeCraftingChain(chain: CraftingChainAnalysis): CraftingChainAnalysis {
    return this.safe(() => {
      // 合并相同物品的任务
      const taskMap = new Map<string, CraftingTask>();
      
      for (const task of chain.tasks) {
        const existing = taskMap.get(task.itemId);
        if (existing) {
          existing.quantity += task.quantity;
        } else {
          taskMap.set(task.itemId, { ...task });
        }
      }
      
      // 重新生成任务列表
      const optimizedTasks = Array.from(taskMap.values());
      optimizedTasks.forEach((task, index) => {
        task.id = `chain_${index + 1}`;
      });
      
      return {
        ...chain,
        tasks: optimizedTasks,
        totalItems: optimizedTasks.length
      };
    }, 'optimizeCraftingChain', chain);
  }

  // ========== 服务信息 ==========

  getServiceInfo() {
    return {
      ...super.getServiceInfo(),
      storageKeys: []
    };
  }

  async healthCheck() {
    const isHealthy = !!this.validator;
    return {
      healthy: isHealthy,
      message: isHealthy ? 'Service is running' : 'Validator not loaded'
    };
  }
}

// 导出单例实例以保持向后兼容
export const dependencyService = DependencyService.getInstance();

export default DependencyService;