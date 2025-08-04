// 制作引擎 - 处理手动制作队列

import { getService } from '@/services/core/DIServiceInitializer';
import { SERVICE_TOKENS } from '@/services/core/ServiceTokens';
import type { RecipeService } from '@/services/crafting/RecipeService';
import useGameStore from '@/store/gameStore';
import type { CraftingTask } from '@/types/index';
import { secondsToMs } from '@/utils/common';

class CraftingEngine {
  // 静态方法：更新制作队列（供GameLoop调用）
  static updateCraftingQueue(): void {
    const gameStore = useGameStore.getState();
    const { craftingQueue, updateCraftingProgress } = gameStore;

    if (craftingQueue.length === 0) return;

    const now = Date.now();

    // 处理队列中的第一个任务（只有第一个任务会进行制作）
    const currentTask = craftingQueue[0];
    if (!currentTask || currentTask.status === 'completed') return;

    // craftingQueue 中的所有任务都是手动制作任务

    // 手动合成任务直接从recipeId获取配方
    const recipeService = getService<RecipeService>(SERVICE_TOKENS.RECIPE_SERVICE);
    const selectedRecipe = recipeService.getRecipeById(currentTask.recipeId);

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
        CraftingEngine.completeManualCraft(currentTask);
      }
    }
  }

  // 完成手动合成
  private static completeManualCraft(task: CraftingTask): void {
    const { updateInventory, completeCraftingTask, trackMinedEntity } = useGameStore.getState();

    // 直接使用任务的recipeId获取配方
    const recipeService = getService<RecipeService>(SERVICE_TOKENS.RECIPE_SERVICE);
    const selectedRecipe = recipeService.getRecipeById(task.recipeId);

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
      trackMinedEntity(task.itemId, task.quantity);
    }

    // 完成任务（completeCraftingTask会自动调用updateInventory添加产品）
    completeCraftingTask(task.id);

    // Completed manual crafting task
  }
}

export default CraftingEngine;
