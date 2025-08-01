// 游戏循环任务工厂 - 创建各种游戏系统的更新任务
import type { GameLoopTask } from '@/types/gameLoop';
import { GameLoopTaskType } from '@/types/gameLoop';
import useGameStore from '@/store/gameStore';

export class GameLoopTaskFactory {
  // 创建制作系统任务
  static createCraftingTask(): GameLoopTask {
    return {
      id: GameLoopTaskType.CRAFTING,
      name: '制作系统更新',
      priority: 1, // 高优先级
      fixedTimeStep: 100, // 100ms 更新一次，比原来的 setInterval 更精确
      lastExecutionTime: 0,
      enabled: true,
      update: () => {
        // 制作系统使用CraftingEngine的现有逻辑
        // 直接导入并调用更新方法
        import('../utils/craftingEngine')
          .then(({ default: CraftingEngine }) => {
            const engine = CraftingEngine.getInstance();
            engine.updateCraftingQueue();
          })
          .catch(error => {
            console.error('制作系统更新失败:', error);
          });
      },
    };
  }

  // 创建设施系统任务
  static createFacilitiesTask(): GameLoopTask {
    return {
      id: GameLoopTaskType.FACILITIES,
      name: '设施系统更新',
      priority: 2,
      fixedTimeStep: 1000, // 1秒更新一次
      lastExecutionTime: 0,
      enabled: true,
      update: (deltaTime: number) => {
        const store = useGameStore.getState();
        const { facilities, updateFacility, updateInventory } = store;

        facilities.forEach(facility => {
          if (facility.status !== 'running' || !facility.production) return;

          const production = facility.production;
          if (!production.currentRecipeId) return;

          // 更新生产进度 - 使用基础制作时间计算
          // 默认制作时间1秒，可以根据配方调整
          const baseCraftingTime = 1000; // 1秒
          const progressIncrement = deltaTime / baseCraftingTime;
          const newProgress = Math.min((production.progress || 0) + progressIncrement, 1);

          updateFacility(facility.id, {
            production: {
              ...production,
              progress: newProgress,
            },
          });

          // 完成生产
          if (newProgress >= 1) {
            // 添加产品到库存
            if (facility.targetItemId) {
              updateInventory(facility.targetItemId, 1); // 每次生产1个物品
            }

            // 重置进度，开始下一个循环
            updateFacility(facility.id, {
              production: {
                ...production,
                progress: 0,
              },
            });
          }
        });
      },
    };
  }

  // 创建燃料消耗任务
  static createFuelConsumptionTask(): GameLoopTask {
    return {
      id: GameLoopTaskType.FUEL_CONSUMPTION,
      name: '燃料消耗更新',
      priority: 3,
      fixedTimeStep: 1000, // 1秒更新一次
      lastExecutionTime: 0,
      enabled: true,
      update: (deltaTime: number) => {
        const store = useGameStore.getState();
        store.updateFuelConsumption(deltaTime);
      },
    };
  }

  // 创建研究系统任务
  static createResearchTask(): GameLoopTask {
    return {
      id: GameLoopTaskType.RESEARCH,
      name: '研究系统更新',
      priority: 4,
      fixedTimeStep: 1000, // 1秒更新一次
      lastExecutionTime: 0,
      enabled: true,
      update: (deltaTime: number) => {
        const store = useGameStore.getState();
        store.updateResearchProgress(deltaTime);
      },
    };
  }

  // 创建统计更新任务
  static createStatisticsTask(): GameLoopTask {
    return {
      id: GameLoopTaskType.STATISTICS,
      name: '统计数据更新',
      priority: 5,
      fixedTimeStep: 5000, // 5秒更新一次
      lastExecutionTime: 0,
      enabled: true,
      update: () => {
        const store = useGameStore.getState();

        // 更新游戏循环状态统计
        if (store._updateGameLoopState) {
          store._updateGameLoopState();
        }

        // 可以在这里添加其他统计更新逻辑
        // 比如计算生产效率、资源消耗率等
      },
    };
  }

  // 创建自动存档任务
  static createAutoSaveTask(): GameLoopTask {
    return {
      id: GameLoopTaskType.AUTO_SAVE,
      name: '自动存档',
      priority: 10, // 低优先级
      fixedTimeStep: 30000, // 30秒存档一次
      lastExecutionTime: 0,
      enabled: true,
      update: () => {
        const store = useGameStore.getState();

        // 使用普通存档，不是强制存档
        store.saveGame();
      },
    };
  }

  // 创建UI更新任务
  static createUIUpdatesTask(): GameLoopTask {
    return {
      id: GameLoopTaskType.UI_UPDATES,
      name: 'UI 更新',
      priority: 6,
      fixedTimeStep: 16, // ~60fps for UI updates
      lastExecutionTime: 0,
      enabled: true,
      update: () => {
        // 可以在这里更新需要实时更新的 UI 元素
        // 比如进度条动画、数值滚动等
        // 由于使用了 Zustand，大部分 UI 更新是响应式的
        // 这个任务主要用于一些特殊的动画效果
      },
    };
  }

  // 创建所有默认任务
  static createAllDefaultTasks(): GameLoopTask[] {
    return [
      this.createCraftingTask(),
      this.createFacilitiesTask(),
      this.createFuelConsumptionTask(),
      this.createResearchTask(),
      this.createStatisticsTask(),
      this.createAutoSaveTask(),
      this.createUIUpdatesTask(),
    ];
  }

  // 根据游戏状态动态启用/禁用任务
  static updateTasksState(tasks: Map<string, GameLoopTask>): void {
    const store = useGameStore.getState();

    // 根据制作队列状态控制制作任务
    const craftingTask = tasks.get(GameLoopTaskType.CRAFTING);
    if (craftingTask) {
      craftingTask.enabled = store.craftingQueue.length > 0;
    }

    // 根据设施状态控制设施任务
    const facilitiesTask = tasks.get(GameLoopTaskType.FACILITIES);
    if (facilitiesTask) {
      facilitiesTask.enabled = store.facilities.some(f => f.status === 'running');
    }

    // 根据研究状态控制研究任务
    const researchTask = tasks.get(GameLoopTaskType.RESEARCH);
    if (researchTask) {
      researchTask.enabled = store.researchState !== null;
    }

    // 燃料消耗任务只在有设施时启用
    const fuelTask = tasks.get(GameLoopTaskType.FUEL_CONSUMPTION);
    if (fuelTask) {
      fuelTask.enabled = store.facilities.length > 0;
    }
  }
}
