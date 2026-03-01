// 制作引擎 - 处理手动制作队列

import type { RecipeService } from '@/services/crafting/RecipeService';
import type { CraftingTask } from '@/types/index';
import { secondsToMs } from '@/utils/common';

export interface CraftingEngineAdapter {
  getCraftingQueue: () => CraftingTask[];
  updateCraftingProgress: (taskId: string, progress: number, startTime?: number) => void;
  updateInventory: (itemId: string, amount: number) => void;
  completeCraftingTask: (taskId: string) => void;
  trackMinedEntity: (entityId: string, count: number) => void;
}

export type CraftingRecipeLookup = Pick<RecipeService, 'getRecipeById'>;

class CraftingEngine {
  // 静态方法：更新制作队列（供GameLoop调用）
  static updateCraftingQueue(
    adapter: CraftingEngineAdapter,
    recipeLookup: CraftingRecipeLookup,
    now: number = Date.now()
  ): void {
    const craftingQueue = adapter.getCraftingQueue();

    if (craftingQueue.length === 0) return;

    // 处理队列中的第一个任务（只有第一个任务会进行制作）
    const currentTask = craftingQueue[0];
    if (!currentTask || currentTask.status === 'completed') return;

    // craftingQueue 中的所有任务都是手动制作任务

    // 手动合成任务直接从recipeId获取配方
    const selectedRecipe = recipeLookup.getRecipeById(currentTask.recipeId);

    if (selectedRecipe) {
      // 使用手动合成效率计算时间
      const manualEfficiency = 0.5; // 玩家默认效率
      const baseTime = selectedRecipe.time || 1; // 基础时间
      const craftingTime = secondsToMs((baseTime / manualEfficiency) * currentTask.quantity);

      // 确保有开始时间 - 只在第一次执行时设定（通过 store 更新，避免直接变更 Zustand 状态）
      if (!currentTask.startTime || currentTask.startTime === 0) {
        adapter.updateCraftingProgress(currentTask.id, 0, now);
        return; // 下一帧再计算进度，此时 startTime 已写入 store
      }

      // 计算进度
      const elapsed = now - currentTask.startTime;
      const progress = Math.min((elapsed / craftingTime) * 100, 100);

      adapter.updateCraftingProgress(currentTask.id, progress);

      // 检查是否完成
      if (progress >= 100) {
        CraftingEngine.completeManualCraft(currentTask, adapter, recipeLookup);
      }
    }
  }

  // 完成手动合成
  private static completeManualCraft(
    task: CraftingTask,
    adapter: CraftingEngineAdapter,
    recipeLookup: CraftingRecipeLookup
  ): void {
    // 直接使用任务的recipeId获取配方
    const selectedRecipe = recipeLookup.getRecipeById(task.recipeId);

    // 如果是采矿配方，追踪挖掘的实体（用于研究触发器）
    if (selectedRecipe && selectedRecipe.flags?.includes('mining')) {
      adapter.trackMinedEntity(task.itemId, task.quantity);
    }

    // 完成任务（completeCraftingTask会自动调用updateInventory添加产品）
    adapter.completeCraftingTask(task.id);

    // Completed manual crafting task
  }
}

export default CraftingEngine;
