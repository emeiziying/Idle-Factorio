// 制作队列切片
import type { SliceCreator, CraftingSlice } from '../types';
import type { CraftingTask, CraftingChain } from '../../types/index';
import { RecipeService } from '../../services/RecipeService';

export const createCraftingSlice: SliceCreator<CraftingSlice> = (set, get) => ({
  // 初始状态
  craftingQueue: [],
  craftingChains: [],
  maxQueueSize: 50,

  // 制作队列管理
  addCraftingTask: (task) => {
    const state = get();
    if (state.craftingQueue.length >= state.maxQueueSize) {
      return false;
    }

    const newTask: CraftingTask = {
      ...task,
      id: `craft_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    };

    set((state) => ({
      craftingQueue: [...state.craftingQueue, newTask]
    }));

    return true;
  },

  addCraftingChain: (chainData) => {
    const chainId = `chain_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    // 为链中的每个任务分配ID和链ID
    const tasksWithIds = chainData.tasks.map((task, index) => ({
      ...task,
      id: `${chainId}_task_${index}`,
      chainId: chainId
    }));

    const newChain: CraftingChain = {
      ...chainData,
      id: chainId,
      tasks: tasksWithIds,
      status: 'pending',
      totalProgress: 0
    };

    // 将任务添加到队列中
    const currentTaskCount = get().craftingQueue.length;
    if (currentTaskCount + tasksWithIds.length > get().maxQueueSize) {
      return ''; // 队列空间不足
    }

    set((state) => ({
      craftingQueue: [...state.craftingQueue, ...tasksWithIds],
      craftingChains: [...state.craftingChains, newChain]
    }));

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
            // 任务完成，只移除这个任务，保留链和其他任务
            console.log(`[链式任务] 移除已完成任务: ${taskId}`);
            set((state) => ({
              craftingQueue: state.craftingQueue.filter(t => t.id !== taskId)
            }));
            return;
          } else {
            // 任务被手动取消，需要取消整个链
            if (chain.rawMaterialsConsumed) {
              // 归还所有预扣的原材料
              for (const [materialId, amount] of chain.rawMaterialsConsumed) {
                get().updateInventory(materialId, amount);
              }
            }
            
            console.log(`[链式任务] 取消整个链: ${chain.name}`);
            // 移除整个链
            set((state) => ({
              craftingQueue: state.craftingQueue.filter(task => task.chainId !== chain.id),
              craftingChains: state.craftingChains.filter(c => c.id !== chain.id)
            }));
            return;
          }
        }
      }
      
      // 普通任务处理
      // 如果是手动合成任务，不需要归还库存（因为手动合成没有消耗库存）
      if (!task.recipeId.startsWith('manual_')) {
        // 获取配方信息并归还库存
        const recipe = RecipeService.getRecipeById(task.recipeId);
        if (recipe) {
          // 归还输入材料
          Object.entries(recipe.in).forEach(([itemId, required]) => {
            get().updateInventory(itemId, (required as number) * task.quantity);
          });
        }
      }
      
      // 移除任务
      set((state) => ({
        craftingQueue: state.craftingQueue.filter(task => task.id !== taskId)
      }));
    }
  },

  updateCraftingProgress: (taskId: string, progress: number) => {
    set((state) => ({
      craftingQueue: state.craftingQueue.map(task =>
        task.id === taskId ? { ...task, progress, status: 'crafting' as const } : task
      )
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
      console.log(`中间产物完成: ${task.itemId} x${task.quantity} (不添加到库存)`);
      
      // 检查链中是否有依赖于此任务的任务，如果有则可以开始执行
      const chain = state.craftingChains.find(c => c.id === task.chainId);
      if (chain) {
        // 更新链的进度
        const completedTasks = chain.tasks.filter(t => 
          state.craftingQueue.find(qt => qt.id === t.id)?.status === 'completed'
        ).length + 1; // +1 for the current task
        const totalProgress = completedTasks / chain.tasks.length;
        
        set((state) => ({
          craftingChains: state.craftingChains.map(c => 
            c.id === task.chainId 
              ? { ...c, totalProgress }
              : c
          )
        }));
        
        // 检查是否是链的最后一个任务
        const isLastTask = chain.tasks[chain.tasks.length - 1].id === taskId;
        console.log(`[链式任务] 任务完成: ${task.itemId} x${task.quantity}, chainId: ${task.chainId}, taskId: ${taskId}`);
        console.log(`[链式任务] 链中最后任务ID: ${chain.tasks[chain.tasks.length - 1].id}, 当前任务ID: ${taskId}, 是否最后任务: ${isLastTask}`);
        console.log(`[链式任务] 是否中间产物: ${task.isIntermediateProduct}`);
        
        if (isLastTask) {
          // 最后一个任务完成，将最终产物添加到库存
          get().updateInventory(task.itemId, task.quantity);
          console.log(`[链式任务] 链式任务完成: ${chain.name}, 最终产物: ${task.itemId} x${task.quantity} 已添加到库存`);
          
          // 标记链为完成
          set((state) => ({
            craftingChains: state.craftingChains.map(c => 
              c.id === task.chainId 
                ? { ...c, status: 'completed' as const, totalProgress: 1 }
                : c
            )
          }));
        }
      }
    } else {
      // 普通任务，直接添加产品到库存
      get().updateInventory(task.itemId, task.quantity);
    }
    
    // 先标记任务为已完成，然后移除
    set((state) => ({
      craftingQueue: state.craftingQueue.map(t => 
        t.id === taskId ? { ...t, status: 'completed' as const } : t
      )
    }));
    
    // 移除任务
    get().removeCraftingTask(taskId);
  },
});