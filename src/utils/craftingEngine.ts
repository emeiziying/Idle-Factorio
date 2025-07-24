// 制作引擎 - 处理制作队列和物品生产

import type { CraftingTask, Recipe } from '../types/index';
import useGameStore from '../store/gameStore';
import DataService from '../services/DataService';

// 设备效率配置 - 基于Factorio的采矿机设计
interface DeviceEfficiency {
  speed: number;        // 基础速度
  coverage: number;     // 覆盖范围
  power: number;        // 功率消耗
  pollution: number;    // 污染产生
}

// 资源特性配置 - 基于Factorio的资源硬度
interface ResourceProperties {
  miningTime: number;   // 采矿时间（硬度）
  category: string;     // 资源类别
  rarity: number;       // 稀有度
}

class CraftingEngine {
  private static instance: CraftingEngine;
  private intervalId: number | null = null;
  private readonly UPDATE_INTERVAL = 100; // 100ms更新一次

  // 设备效率配置 - 参考Factorio的采矿机
  private readonly DEVICE_EFFICIENCIES: Record<string, DeviceEfficiency> = {
    'manual': { speed: 0.5, coverage: 1, power: 0, pollution: 0 },           // 手动合成
    'burner': { speed: 0.25, coverage: 2, power: 150, pollution: 12 },        // 燃烧设备
    'electric': { speed: 0.5, coverage: 5, power: 90, pollution: 10 },        // 电力设备
    'advanced': { speed: 2.5, coverage: 13, power: 300, pollution: 40 }       // 高级设备
  };

  // 资源特性配置 - 参考Factorio的资源硬度
  private readonly RESOURCE_PROPERTIES: Record<string, ResourceProperties> = {
    'iron-ore': { miningTime: 1, category: 'basic', rarity: 1 },
    'copper-ore': { miningTime: 1, category: 'basic', rarity: 1 },
    'coal': { miningTime: 1, category: 'basic', rarity: 1 },
    'stone': { miningTime: 1, category: 'basic', rarity: 1 },
    'uranium-ore': { miningTime: 2, category: 'advanced', rarity: 3 },
    'tungsten-ore': { miningTime: 5, category: 'advanced', rarity: 5 }
  };

  private constructor() {}

  static getInstance(): CraftingEngine {
    if (!CraftingEngine.instance) {
      CraftingEngine.instance = new CraftingEngine();
    }
    return CraftingEngine.instance;
  }

  // 启动制作引擎
  start(): void {
    if (this.intervalId !== null) return;

    this.intervalId = window.setInterval(() => {
      this.updateCraftingQueue();
    }, this.UPDATE_INTERVAL);

    console.log('Crafting engine started');
  }

  // 停止制作引擎
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Crafting engine stopped');
    }
  }

  // 计算设备效率 - 基于Factorio的采矿速度公式
  private calculateDeviceEfficiency(recipe: Recipe, deviceType: string = 'electric'): number {
    const device = this.DEVICE_EFFICIENCIES[deviceType] || this.DEVICE_EFFICIENCIES.electric;
    
    // 获取主要输入资源的特性
    const mainInput = Object.keys(recipe.in)[0];
    const resourceProps = this.RESOURCE_PROPERTIES[mainInput] || { miningTime: 1, category: 'basic', rarity: 1 };
    
    // 基于Factorio公式：采矿速度 / 采矿时间 = 生产速率
    const baseEfficiency = device.speed / resourceProps.miningTime;
    
    // 考虑资源稀有度的影响
    const rarityMultiplier = 1 / resourceProps.rarity;
    
    // 考虑设备覆盖范围的影响
    const coverageMultiplier = Math.min(device.coverage / 5, 2); // 最大2倍效率
    
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
    
    return Math.min(productivityBonus, 0.5); // 最大50%加成
  }

  // 计算最终制作时间 - 基于Factorio的效率公式
  private calculateCraftingTime(recipe: Recipe, quantity: number, deviceType: string = 'electric'): number {
    // 基础制作时间
    const baseTime = recipe.time;
    
    // 设备效率影响
    const deviceEfficiency = this.calculateDeviceEfficiency(recipe, deviceType);
    const efficiencyTime = baseTime / deviceEfficiency;
    
    // 生产力加成影响
    const productivityBonus = this.calculateProductivityBonus(recipe);
    const productivityTime = efficiencyTime / (1 + productivityBonus);
    
    // 数量影响
    const totalTime = productivityTime * quantity;
    
    return Math.max(totalTime, 0.1); // 最小0.1秒
  }

  // 更新制作队列
  private updateCraftingQueue(): void {
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
      const dataService = DataService.getInstance();
      const itemId = currentTask.itemId;
      
      // 获取物品的配方数据（用于时间计算）
      const recipes = dataService.getRecipesForItem(itemId);
      
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
        const craftingTime = (baseTime / manualEfficiency) * currentTask.quantity * 1000; // 转换为毫秒，考虑数量
        
        // 确保有开始时间
        if (!currentTask.startTime) {
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
      // 重新设置开始时间，确保时间计算正确
      currentTask.startTime = now;
      updateCraftingProgress(currentTask.id, 0);
    }

    // 基于Factorio机制计算制作时间
    const deviceType = this.determineDeviceType(recipe);
    const craftingTime = this.calculateCraftingTime(recipe, currentTask.quantity, deviceType) * 1000; // 转换为毫秒
    const elapsed = now - currentTask.startTime;
    const progress = Math.min((elapsed / craftingTime) * 100, 100);

    updateCraftingProgress(currentTask.id, progress);

    // 检查是否完成
    if (progress >= 100) {
      this.completeCraft(currentTask, recipe);
    }
  }

  // 确定设备类型 - 基于配方特性
  private determineDeviceType(recipe: Recipe): string {
    // 根据配方类别确定设备类型
    if (recipe.category === 'smelting') {
      return 'electric'; // 冶炼使用电力设备
    } else if (recipe.category === 'advanced-crafting') {
      return 'advanced'; // 高级配方使用高级设备
    } else if (recipe.category === 'basic-crafting') {
      return 'burner'; // 基础配方使用燃烧设备
    }
    
    return 'electric'; // 默认使用电力设备
  }

  // 完成制作
  private completeCraft(task: CraftingTask, recipe: Recipe): void {
    const { updateInventory, completeCraftingTask } = useGameStore.getState();

    // 计算生产力加成后的产出
    const productivityBonus = this.calculateProductivityBonus(recipe);
    const bonusMultiplier = 1 + productivityBonus;

    // 添加产品到库存（包含生产力加成）
    Object.entries(recipe.out).forEach(([itemId, quantity]) => {
      const baseQuantity = (quantity as number) * task.quantity;
      const bonusQuantity = Math.floor(baseQuantity * bonusMultiplier);
      updateInventory(itemId, bonusQuantity);
    });

    // 完成任务
    completeCraftingTask(task.id);

    console.log(`Completed crafting: ${recipe.name} x${task.quantity} (Productivity: +${(productivityBonus * 100).toFixed(1)}%)`);
  }

  // 完成手动合成
  private completeManualCraft(task: CraftingTask): void {
    const { completeCraftingTask } = useGameStore.getState();

    // 完成任务（completeCraftingTask会自动调用updateInventory）
    completeCraftingTask(task.id);

    console.log(`Completed manual crafting: ${task.itemId} x${task.quantity}`);
  }
}

export default CraftingEngine;