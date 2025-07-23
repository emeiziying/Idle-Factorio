// 制作引擎 - 处理制作队列和物品生产

import type { CraftingTask } from '../types/index';
import useGameStore from '../store/gameStore';
import DataService from '../services/DataService';

class CraftingEngine {
  private static instance: CraftingEngine;
  private intervalId: number | null = null;
  private readonly UPDATE_INTERVAL = 100; // 100ms更新一次

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

  // 更新制作队列
  private updateCraftingQueue(): void {
    const gameStore = useGameStore.getState();
    const { craftingQueue, updateCraftingProgress, completeCraftingTask, updateInventory } = gameStore;

    if (craftingQueue.length === 0) return;

    const now = Date.now();
    const dataService = DataService.getInstance();

    // 处理队列中的第一个任务（只有第一个任务会进行制作）
    const currentTask = craftingQueue[0];
    if (!currentTask || currentTask.status === 'completed') return;

    const recipe = dataService.getRecipe(currentTask.recipeId);
    if (!recipe) return;

    // 检查材料是否足够
    const canCraft = this.checkMaterials(recipe, 1);
    if (!canCraft) {
      // 材料不足，暂停制作
      return;
    }

    // 如果任务刚开始，消耗材料
    if (currentTask.status === 'pending') {
      this.consumeMaterials(recipe, 1);
      updateCraftingProgress(currentTask.id, 0);
    }

    // 计算制作进度
    const craftingTime = recipe.time * 1000; // 转换为毫秒
    const elapsed = now - currentTask.startTime;
    const progress = Math.min((elapsed / craftingTime) * 100, 100);

    updateCraftingProgress(currentTask.id, progress);

    // 检查是否完成
    if (progress >= 100) {
      this.completeCraft(currentTask, recipe);
    }
  }

  // 检查材料是否足够
  private checkMaterials(recipe: any, quantity: number): boolean {
    const gameStore = useGameStore.getState();
    
    return Object.entries(recipe.in).every(([itemId, required]) => {
      const available = gameStore.getInventoryItem(itemId).currentAmount;
      return available >= (required as number) * quantity;
    });
  }

  // 消耗制作材料
  private consumeMaterials(recipe: any, quantity: number): void {
    const { updateInventory } = useGameStore.getState();

    Object.entries(recipe.in).forEach(([itemId, required]) => {
      updateInventory(itemId, -(required as number) * quantity);
    });
  }

  // 完成制作
  private completeCraft(task: CraftingTask, recipe: any): void {
    const { updateInventory, completeCraftingTask } = useGameStore.getState();

    // 添加产品到库存
    Object.entries(recipe.out).forEach(([itemId, quantity]) => {
      updateInventory(itemId, (quantity as number) * task.quantity);
    });

    // 完成任务
    completeCraftingTask(task.id);

    console.log(`Completed crafting: ${recipe.name} x${task.quantity}`);
  }
}

export default CraftingEngine;