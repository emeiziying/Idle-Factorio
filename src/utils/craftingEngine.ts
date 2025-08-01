// 制作引擎 - 处理制作队列和物品生产

import type { CraftingTask, Recipe } from '../types/index';
import useGameStore from '../store/gameStore';
import { DataService } from '../services/core/DataService';
import { RecipeService } from '../services/crafting/RecipeService';
import { GameConfig } from '../services/core/GameConfig';
import { secondsToMs } from '../utils/common';

// 设备效率配置 - 基于Factorio的采矿机设计
interface DeviceEfficiency {
  speed: number; // 基础速度
  coverage: number; // 覆盖范围
  power: number; // 功率消耗
  pollution: number; // 污染产生
}

// 资源特性配置 - 基于Factorio的资源硬度
interface ResourceProperties {
  miningTime: number; // 采矿时间（硬度）
  category: string; // 资源类别
  rarity: number; // 稀有度
}

class CraftingEngine {
  private static instance: CraftingEngine;
  private intervalId: number | null = null;
  private gameConfig: GameConfig;
  private isStarting: boolean = false; // 防止重复启动

  // 设备效率缓存 - 从data.json的机器数据动态获取
  private deviceEfficiencyCache = new Map<string, DeviceEfficiency>();

  // 资源特性缓存 - 从data.json的mining配方动态获取
  private resourcePropertiesCache = new Map<string, ResourceProperties>();

  private constructor() {
    this.gameConfig = GameConfig.getInstance();
  }

  static getInstance(): CraftingEngine {
    if (!CraftingEngine.instance) {
      CraftingEngine.instance = new CraftingEngine();
    }
    return CraftingEngine.instance;
  }

  // 启动制作引擎
  start(): void {
    // 如果已经在运行或正在启动中，直接返回
    if (this.intervalId !== null || this.isStarting) {
      return;
    }

    this.isStarting = true;

    try {
      const constants = this.gameConfig.getConstants();
      this.intervalId = window.setInterval(() => {
        this.updateCraftingQueue();
      }, constants.crafting.updateInterval);

      // Crafting engine started
    } finally {
      this.isStarting = false;
    }
  }

  // 停止制作引擎
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      // Crafting engine stopped
    }
  }

  // 获取资源特性 - 从data.json的mining配方动态获取
  private getResourceProperties(itemId: string): ResourceProperties {
    // 检查缓存
    if (this.resourcePropertiesCache.has(itemId)) {
      return this.resourcePropertiesCache.get(itemId)!;
    }

    // 查找该物品的mining配方
    const miningRecipes = RecipeService.getRecipesThatProduce(itemId).filter(recipe =>
      recipe.flags?.includes('mining')
    );

    let resourceProps: ResourceProperties;

    if (miningRecipes.length > 0) {
      const miningRecipe = miningRecipes[0];

      // 从mining配方获取真实数据
      const miningTime = miningRecipe.time || 1;
      const hasInputs = Object.keys(miningRecipe.in || {}).length > 0;

      // 根据mining配方特征判断资源类别和稀有度
      let category = 'basic';
      let rarity = 1;

      if (hasInputs) {
        // 需要输入材料的资源（如uranium-ore需要硫酸）
        category = 'advanced';
        rarity = 2;
      }

      // 根据mining时间进一步调整稀有度
      if (miningTime >= 5) {
        category = 'advanced';
        rarity = 5;
      } else if (miningTime >= 2) {
        category = 'advanced';
        rarity = Math.max(rarity, 3);
      }

      resourceProps = {
        miningTime,
        category,
        rarity,
      };
    } else {
      // 没有mining配方的物品，使用默认值
      resourceProps = { miningTime: 1, category: 'basic', rarity: 1 };
    }

    // 缓存结果
    this.resourcePropertiesCache.set(itemId, resourceProps);
    return resourceProps;
  }

  // 获取设备效率 - 从配方的生产者机器动态获取
  private getDeviceEfficiency(recipe: Recipe, preferredMachineId?: string): DeviceEfficiency {
    // 为手动合成提供固定效率
    if (!recipe.producers || recipe.producers.length === 0) {
      return { speed: 0.5, coverage: 1, power: 0, pollution: 0 }; // 手动合成
    }

    // 选择机器：优先使用指定机器，否则使用第一个生产者
    const machineId =
      preferredMachineId && recipe.producers.includes(preferredMachineId)
        ? preferredMachineId
        : recipe.producers[0];

    // 检查缓存
    if (this.deviceEfficiencyCache.has(machineId)) {
      return this.deviceEfficiencyCache.get(machineId)!;
    }

    const dataService = DataService.getInstance();
    const machineItem = dataService.getItem(machineId);

    let deviceEfficiency: DeviceEfficiency;

    if (machineItem?.machine) {
      const machine = machineItem.machine;

      // 从data.json获取真实机器数据
      deviceEfficiency = {
        speed: machine.speed || 1,
        coverage: machine.size ? machine.size[0] * machine.size[1] : 9, // 默认3x3
        power: machine.usage || 0,
        pollution: machine.pollution || 0,
      };
    } else {
      // 回退到默认值
      deviceEfficiency = { speed: 1, coverage: 9, power: 0, pollution: 0 };
    }

    // 缓存结果
    this.deviceEfficiencyCache.set(machineId, deviceEfficiency);
    return deviceEfficiency;
  }

  // 计算设备效率 - 基于Factorio的采矿速度公式
  private calculateDeviceEfficiency(recipe: Recipe, preferredMachineId?: string): number {
    const device = this.getDeviceEfficiency(recipe, preferredMachineId);

    // 获取主要输入资源的特性（动态从data.json获取）
    const mainInput = Object.keys(recipe.in || {})[0];
    const resourceProps = mainInput
      ? this.getResourceProperties(mainInput)
      : { miningTime: 1, category: 'basic', rarity: 1 };

    // 基于Factorio公式：采矿速度 / 采矿时间 = 生产速率
    const baseEfficiency = device.speed / resourceProps.miningTime;

    // 考虑资源稀有度的影响
    const rarityMultiplier = 1 / resourceProps.rarity;

    // 考虑设备覆盖范围的影响（简化为基于面积的加成）
    const coverageMultiplier = Math.min(device.coverage / 9, 2); // 基于3x3=9的面积，最大2倍效率

    return baseEfficiency * rarityMultiplier * coverageMultiplier;
  }

  // 计算生产力加成 - 基于Factorio的生产力系统
  private calculateProductivityBonus(recipe: Recipe): number {
    // 基础生产力加成
    let productivityBonus = 0;

    // 根据配方类别给予不同加成
    if (recipe.category === 'smelting') {
      productivityBonus += 0.1; // 冶炼配方 +10%
    } else if (recipe.category === 'advanced-crafting') {
      productivityBonus += 0.2; // 高级配方 +20%
    }

    // 根据输出物品数量给予加成
    const outputCount = Object.keys(recipe.out).length;
    if (outputCount > 1) {
      productivityBonus += 0.05 * (outputCount - 1); // 每多一个输出 +5%
    }

    const constants = this.gameConfig.getConstants();
    return Math.min(productivityBonus, constants.crafting.maxProductivityBonus); // 使用配置的最大加成
  }

  // 计算最终制作时间 - 基于Factorio的效率公式
  private calculateCraftingTime(
    recipe: Recipe,
    quantity: number,
    preferredMachineId?: string
  ): number {
    // 基础制作时间
    const baseTime = recipe.time;

    // 设备效率影响
    const deviceEfficiency = this.calculateDeviceEfficiency(recipe, preferredMachineId);
    const efficiencyTime = baseTime / deviceEfficiency;

    // 生产力加成影响
    const productivityBonus = this.calculateProductivityBonus(recipe);
    const productivityTime = efficiencyTime / (1 + productivityBonus);

    // 数量影响
    const totalTime = productivityTime * quantity;

    const constants = this.gameConfig.getConstants();
    return Math.max(totalTime, constants.crafting.minCraftingTime); // 使用配置的最小制作时间
  }

  // 公开的更新制作队列方法（供GameLoop调用）
  public updateCraftingQueue(): void {
    const gameStore = useGameStore.getState();
    const { craftingQueue, updateCraftingProgress } = gameStore;

    if (craftingQueue.length === 0) return;

    const now = Date.now();
    const dataService = DataService.getInstance();

    // 处理队列中的第一个任务（只有第一个任务会进行制作）
    const currentTask = craftingQueue[0];
    if (!currentTask || currentTask.status === 'completed') return;

    // 检查是否为手动合成任务
    if (currentTask.recipeId.startsWith('manual_')) {
      // 手动合成任务需要时间计算
      const itemId = currentTask.itemId;

      // 获取物品的配方数据（用于时间计算）
      const recipes = RecipeService.getRecipesThatProduce(itemId);

      // 优先选择mining类型的配方，而不是recycling配方
      let selectedRecipe = null;
      if (recipes.length > 0) {
        // 优先选择mining配方
        const miningRecipe = recipes.find(r => r.flags?.includes('mining'));
        if (miningRecipe) {
          selectedRecipe = miningRecipe;
        } else {
          // 如果没有mining配方，选择第一个非recycling配方
          const nonRecyclingRecipe = recipes.find(r => !r.flags?.includes('recycling'));
          selectedRecipe = nonRecyclingRecipe || recipes[0];
        }
      }

      if (selectedRecipe) {
        // 使用手动合成效率计算时间
        const manualEfficiency = 0.5; // 玩家默认效率
        const baseTime = selectedRecipe.time || 1; // 基础时间
        const craftingTime = secondsToMs((baseTime / manualEfficiency) * currentTask.quantity);

        // 确保有开始时间 - 只在第一次执行时设定
        if (!currentTask.startTime || currentTask.startTime === 0) {
          currentTask.startTime = now;
          updateCraftingProgress(currentTask.id, 0);
        }

        // 计算进度
        const elapsed = now - currentTask.startTime;
        const progress = Math.min((elapsed / craftingTime) * 100, 100);

        updateCraftingProgress(currentTask.id, progress);

        // 检查是否完成
        if (progress >= 100) {
          this.completeManualCraft(currentTask);
        }
      } else {
        // 如果没有配方（原材料），立即完成
        this.completeManualCraft(currentTask);
      }
      return;
    }

    const recipe = dataService.getRecipe(currentTask.recipeId);
    if (!recipe) return;

    // 如果任务刚开始，设置开始时间并开始制作
    if (currentTask.status === 'pending') {
      // 只在第一次执行时设定开始时间
      if (!currentTask.startTime || currentTask.startTime === 0) {
        currentTask.startTime = now;
        updateCraftingProgress(currentTask.id, 0);
      }
    }

    // 基于Factorio机制计算制作时间（使用配方的第一个生产者）
    const craftingTime = this.calculateCraftingTime(recipe, currentTask.quantity) * 1000; // 转换为毫秒
    const elapsed = now - currentTask.startTime;
    const progress = Math.min((elapsed / craftingTime) * 100, 100);

    updateCraftingProgress(currentTask.id, progress);

    // 检查是否完成
    if (progress >= 100) {
      this.completeCraft(currentTask, recipe);
    }
  }

  // 完成制作
  private completeCraft(task: CraftingTask, recipe: Recipe): void {
    const { updateInventory, completeCraftingTask, trackMinedEntity } = useGameStore.getState();

    // 1. 先消耗输入材料（链式任务的原材料已在创建时扣除，这里只扣除中间产物）
    if (recipe.in && !task.chainId) {
      // 非链式任务才扣除材料
      Object.entries(recipe.in).forEach(([itemId, required]) => {
        const totalRequired = (required as number) * task.quantity;
        updateInventory(itemId, -totalRequired);
      });
    }

    // 2. 计算生产力加成后的产出
    const productivityBonus = this.calculateProductivityBonus(recipe);
    const bonusMultiplier = 1 + productivityBonus;

    // 3. 添加产品到库存（包含生产力加成）
    Object.entries(recipe.out).forEach(([itemId, quantity]) => {
      const baseQuantity = (quantity as number) * task.quantity;
      const bonusQuantity = Math.floor(baseQuantity * bonusMultiplier);
      updateInventory(itemId, bonusQuantity);

      // 4. 如果是采矿配方，追踪挖掘的实体（用于研究触发器）
      if (recipe.flags?.includes('mining')) {
        trackMinedEntity(itemId, bonusQuantity);
      }
    });

    // 5. 完成任务
    completeCraftingTask(task.id);

    // Completed crafting task
  }

  // 完成手动合成
  private completeManualCraft(task: CraftingTask): void {
    const { updateInventory, completeCraftingTask, trackMinedEntity } = useGameStore.getState();

    // 获取手动合成的配方信息
    const itemId = task.itemId;
    const recipes = RecipeService.getRecipesThatProduce(itemId);

    // 找到合适的配方（优先mining配方）
    let selectedRecipe = null;
    if (recipes.length > 0) {
      const miningRecipe = recipes.find(r => r.flags?.includes('mining'));
      if (miningRecipe) {
        selectedRecipe = miningRecipe;
      } else {
        const nonRecyclingRecipe = recipes.find(r => !r.flags?.includes('recycling'));
        selectedRecipe = nonRecyclingRecipe || recipes[0];
      }
    }

    // 如果有配方且有输入材料，则消耗材料（链式任务的原材料已在创建时扣除）
    if (selectedRecipe && selectedRecipe.in && !task.chainId) {
      // 非链式任务才扣除材料
      Object.entries(selectedRecipe.in).forEach(([inputItemId, required]) => {
        const totalRequired = (required as number) * task.quantity;
        updateInventory(inputItemId, -totalRequired);
      });
    }

    // 如果是采矿配方，追踪挖掘的实体（用于研究触发器）
    if (selectedRecipe && selectedRecipe.flags?.includes('mining')) {
      trackMinedEntity(itemId, task.quantity);
    }

    // 完成任务（completeCraftingTask会自动调用updateInventory添加产品）
    completeCraftingTask(task.id);

    // Completed manual crafting task
  }
}

export default CraftingEngine;
