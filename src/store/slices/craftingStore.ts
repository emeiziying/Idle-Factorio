// 制作队列切片
import { getStoreGameLoopService, getStoreRecipeQuery } from '@/store/storeRuntimeServices';
import type { CraftingSlice, SliceCreator } from '@/store/types';
import type { CraftingChain, CraftingTask } from '@/types/index';
import { GameLoopTaskType } from '@/types/gameLoop';
import { info as logInfo, warn as logWarn } from '@/utils/logger';

const syncCraftingTask = (enabled: boolean): void => {
  try {
    const gameLoopService = getStoreGameLoopService();
    if (enabled) {
      gameLoopService.enableTask(GameLoopTaskType.CRAFTING);
    } else {
      gameLoopService.disableTask(GameLoopTaskType.CRAFTING);
    }
  } catch (error) {
    logWarn(`[制作队列] 无法${enabled ? '启用' : '禁用'}制作任务:`, error);
  }
};

export const createCraftingSlice: SliceCreator<CraftingSlice> = (set, get) => ({
  // 初始状态
  craftingQueue: [],
  craftingChains: [],
  maxQueueSize: 50,

  // 制作队列管理
  addCraftingTask: task => {
    const state = get();
    if (state.craftingQueue.length >= state.maxQueueSize) {
      return false;
    }

    const newTask: CraftingTask = {
      ...task,
      id: `craft_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    };

    // 如果这是第一个任务，立即启用制作系统
    const wasEmpty = state.craftingQueue.length === 0;

    set(state => ({
      craftingQueue: [...state.craftingQueue, newTask],
    }));

    // 立即启用制作任务
    if (wasEmpty) {
      syncCraftingTask(true);
    }

    return true;
  },

  addCraftingChain: chainData => {
    const chainId = `chain_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // 为链中的每个任务分配ID和链ID
    const tasksWithIds = chainData.tasks.map((task, index) => ({
      ...task,
      id: `${chainId}_task_${index}`,
      chainId: chainId,
    }));

    const newChain: CraftingChain = {
      ...chainData,
      id: chainId,
      tasks: tasksWithIds,
      status: 'pending',
      totalProgress: 0,
    };

    // 将任务添加到队列中
    const currentTaskCount = get().craftingQueue.length;
    if (currentTaskCount + tasksWithIds.length > get().maxQueueSize) {
      return ''; // 队列空间不足
    }

    // 如果队列为空，启用制作系统
    const wasEmpty = currentTaskCount === 0;

    set(state => ({
      craftingQueue: [...state.craftingQueue, ...tasksWithIds],
      craftingChains: [...state.craftingChains, newChain],
    }));

    // 立即启用制作任务
    if (wasEmpty) {
      syncCraftingTask(true);
    }

    return chainId;
  },

  removeCraftingTask: (taskId: string) => {
    const state = get();
    const task = state.craftingQueue.find(t => t.id === taskId);

    if (task) {
      // 检查是否为链式任务的一部分
      if (task.chainId) {
        const chain = state.craftingChains.find(c => c.id === task.chainId);
        if (chain) {
          // 检查这是任务完成(completed)还是手动取消
          const isTaskCompleted = task.status === 'completed';

          if (isTaskCompleted) {
            // 任务完成，移除这个任务；若链中已无剩余任务则同时清理链记录
            logInfo(`[链式任务] 移除已完成任务: ${taskId}`);
            set(state => {
              const newQueue = state.craftingQueue.filter(t => t.id !== taskId);
              const hasRemainingTasks = newQueue.some(t => t.chainId === chain.id);
              return {
                craftingQueue: newQueue,
                craftingChains: hasRemainingTasks
                  ? state.craftingChains
                  : state.craftingChains.filter(c => c.id !== chain.id),
              };
            });
            // 链的最后一个任务完成时，队列可能已空，需要禁用制作系统
            if (get().craftingQueue.length === 0) {
              syncCraftingTask(false);
            }
            return;
          } else {
            // 任务被手动取消，需要取消整个链
            if (chain.rawMaterialsConsumed) {
              // 归还所有预扣的基础材料
              for (const [materialId, amount] of chain.rawMaterialsConsumed) {
                get().updateInventory(materialId, amount);
              }
            }

            logInfo(`[链式任务] 取消整个链: ${chain.name}`);
            // 移除整个链
            set(state => ({
              craftingQueue: state.craftingQueue.filter(task => task.chainId !== chain.id),
              craftingChains: state.craftingChains.filter(c => c.id !== chain.id),
            }));
            // 取消整个链后，队列可能已空，需要禁用制作系统
            if (get().craftingQueue.length === 0) {
              syncCraftingTask(false);
            }
            return;
          }
        }
      }

      // 普通手动制作任务处理
      // 手动制作任务的材料在完成时才消耗，取消未完成任务不需要归还材料
      // 只有链式任务的基础材料需要在取消时归还（因为在创建链时已预先扣除）

      // 移除任务
      set(state => ({
        craftingQueue: state.craftingQueue.filter(task => task.id !== taskId),
      }));

      // 检查队列是否为空，如果为空则禁用制作系统
      if (get().craftingQueue.length === 0) {
        syncCraftingTask(false);
      }
    }
  },

  updateCraftingProgress: (taskId: string, progress: number, startTime?: number) => {
    set(state => ({
      craftingQueue: state.craftingQueue.map(task =>
        task.id === taskId
          ? {
              ...task,
              progress,
              status: 'crafting' as const,
              ...(startTime !== undefined && { startTime }),
            }
          : task
      ),
    }));
  },

  completeCraftingTask: (taskId: string) => {
    const state = get();
    const task = state.craftingQueue.find(t => t.id === taskId);
    if (!task) return;

    // 追踪制造的物品（用于研究触发器）
    get().trackCraftedItem(task.itemId, task.quantity);

    // 如果是链式任务的中间产物，不添加到库存
    if (task.isIntermediateProduct && task.chainId) {
      logInfo(`[链式任务] 中间产物完成: ${task.itemId} x${task.quantity} (不添加到库存)`);

      // 检查链中是否有依赖于此任务的任务，如果有则可以开始执行
      const chain = state.craftingChains.find(c => c.id === task.chainId);
      if (chain) {
        // 更新链的进度：用当前队列中剩余任务数反推已完成数（含当前任务）
        const remainingInQueue = get().craftingQueue.filter(
          t => t.chainId === chain.id && t.id !== taskId
        ).length;
        const completedTasks = chain.tasks.length - remainingInQueue;
        const totalProgress = completedTasks / chain.tasks.length;

        set(state => ({
          craftingChains: state.craftingChains.map(c =>
            c.id === task.chainId ? { ...c, totalProgress } : c
          ),
        }));

        // 检查是否是链的最后一个任务
        const isLastTask = chain.tasks[chain.tasks.length - 1].id === taskId;

        if (isLastTask) {
          // 最后一个任务完成，根据配方将所有产出物（含副产物）加入库存
          const recipeService = getStoreRecipeQuery();
          const recipe = recipeService.getRecipeById(task.recipeId);

          if (recipe && recipe.out) {
            // 遍历配方所有产出，包括副产物
            for (const [outputItemId, outputPerCraft] of Object.entries(recipe.out)) {
              const actualOutput = task.quantity * (outputPerCraft as number);
              get().updateInventory(outputItemId, actualOutput);
            }
          } else {
            // 找不到配方时回退到任务数量
            get().updateInventory(task.itemId, task.quantity);
          }

          logInfo(
            `[链式任务] 链式任务完成: ${chain.name}, 最终产物: ${task.itemId} x${task.quantity} 已添加到库存`
          );

          // 标记链为完成
          set(state => ({
            craftingChains: state.craftingChains.map(c =>
              c.id === task.chainId ? { ...c, status: 'completed' as const, totalProgress: 1 } : c
            ),
          }));
        }
      }
    } else {
      // 普通任务，根据配方将所有产出物（含副产物）加入库存
      const recipeService = getStoreRecipeQuery();
      const recipe = recipeService.getRecipeById(task.recipeId);

      if (recipe && recipe.out) {
        // 遍历配方所有产出，包括副产物
        for (const [outputItemId, outputPerCraft] of Object.entries(recipe.out)) {
          const actualOutput = task.quantity * (outputPerCraft as number);
          get().updateInventory(outputItemId, actualOutput);
        }
      } else {
        // 找不到配方时回退到任务数量
        get().updateInventory(task.itemId, task.quantity);
      }
    }

    // 先标记任务为已完成，然后移除
    set(state => ({
      craftingQueue: state.craftingQueue.map(t =>
        t.id === taskId ? { ...t, status: 'completed' as const } : t
      ),
    }));

    // 移除任务（removeCraftingTask 内部已处理队列为空时禁用制作任务）
    get().removeCraftingTask(taskId);
  },
});
