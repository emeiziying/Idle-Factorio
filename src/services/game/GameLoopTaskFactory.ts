// 重新设计的游戏循环任务工厂 - 高效模块化任务系统
import useGameStore from '@/store/gameStore';
import type { FacilityInstance } from '@/types/facilities';
import type { GameLoopTask } from '@/types/gameLoop';
import { GameLoopTaskType } from '@/types/gameLoop';
import CraftingEngine from '@/utils/craftingEngine';

// 任务配置接口
interface TaskConfig {
  id: string;
  name: string;
  priority: number;
  baseInterval: number; // 基础更新间隔
  enabledByDefault: boolean;
  shouldRun?: () => boolean; // 条件检查函数
}

// 任务配置表
const TASK_CONFIGS: Record<string, TaskConfig> = {
  [GameLoopTaskType.CRAFTING]: {
    id: GameLoopTaskType.CRAFTING,
    name: '手动制作系统更新',
    priority: 1,
    baseInterval: 100, // 100ms
    enabledByDefault: false,
    shouldRun: () => {
      const store = useGameStore.getState();
      // craftingQueue 中的所有任务都是手动制作任务
      return store.craftingQueue.length > 0;
    },
  },
  [GameLoopTaskType.FACILITIES]: {
    id: GameLoopTaskType.FACILITIES,
    name: '设施系统更新',
    priority: 2,
    baseInterval: 1000, // 1秒
    enabledByDefault: false,
    shouldRun: () => {
      const store = useGameStore.getState();
      return store.facilities.some(f => f.status === 'running');
    },
  },
  [GameLoopTaskType.FUEL_CONSUMPTION]: {
    id: GameLoopTaskType.FUEL_CONSUMPTION,
    name: '燃料消耗更新',
    priority: 3,
    baseInterval: 1000,
    enabledByDefault: true, // 燃料消耗任务应该一直执行
  },
  [GameLoopTaskType.RESEARCH]: {
    id: GameLoopTaskType.RESEARCH,
    name: '研究系统更新',
    priority: 4,
    baseInterval: 1000,
    enabledByDefault: false,
    shouldRun: () => {
      const store = useGameStore.getState();
      return store.researchState !== null;
    },
  },
  [GameLoopTaskType.STATISTICS]: {
    id: GameLoopTaskType.STATISTICS,
    name: '统计数据更新',
    priority: 5,
    baseInterval: 5000, // 5秒
    enabledByDefault: true,
  },
  [GameLoopTaskType.AUTO_SAVE]: {
    id: GameLoopTaskType.AUTO_SAVE,
    name: '自动存档',
    priority: 10,
    baseInterval: 30000, // 30秒
    enabledByDefault: true,
  },
  [GameLoopTaskType.UI_UPDATES]: {
    id: GameLoopTaskType.UI_UPDATES,
    name: 'UI 更新',
    priority: 6,
    baseInterval: 1000, // 降低到 1秒，因为 UI 更新主要是响应式的
    enabledByDefault: true,
  },
};

export class GameLoopTaskFactory {
  // 创建任务的通用方法
  private static createTask(
    config: TaskConfig,
    updateFn: (deltaTime: number, totalTime: number) => void
  ): GameLoopTask {
    return {
      id: config.id,
      name: config.name,
      priority: config.priority,
      fixedTimeStep: config.baseInterval,
      lastExecutionTime: 0,
      enabled: config.enabledByDefault,
      update: updateFn,
    };
  }

  // 创建制作系统任务 - 优化后的版本
  static createCraftingTask(): GameLoopTask {
    const config = TASK_CONFIGS[GameLoopTaskType.CRAFTING];

    return this.createTask(config, () => {
      // 检查是否需要执行
      if (config.shouldRun && !config.shouldRun()) {
        return;
      }

      try {
        CraftingEngine.updateCraftingQueue();
      } catch (error) {
        console.error('制作系统更新失败:', error);
      }
    });
  }

  // 创建设施系统任务 - 优化后的版本
  static createFacilitiesTask(): GameLoopTask {
    const config = TASK_CONFIGS[GameLoopTaskType.FACILITIES];

    return this.createTask(config, (deltaTime: number) => {
      // 检查是否需要执行
      if (config.shouldRun && !config.shouldRun()) {
        return;
      }

      const store = useGameStore.getState();
      const { facilities, updateFacility, updateInventory } = store;

      // 批量处理设施更新，减少 store 更新次数
      const facilityUpdates: Array<{ id: string; updates: Partial<FacilityInstance> }> = [];
      const inventoryUpdates = new Map<string, number>();

      facilities.forEach(facility => {
        if (facility.status !== 'running' || !facility.production) return;

        const production = facility.production;
        if (!production.currentRecipeId) return;

        // 更新生产进度
        const baseCraftingTime = 1000; // 1秒
        const progressIncrement = deltaTime / baseCraftingTime;
        const newProgress = Math.min((production.progress || 0) + progressIncrement, 1);

        const updatedProduction = {
          ...production,
          progress: newProgress,
        };

        // 完成生产
        if (newProgress >= 1) {
          if (facility.targetItemId) {
            const currentAmount = inventoryUpdates.get(facility.targetItemId) || 0;
            inventoryUpdates.set(facility.targetItemId, currentAmount + 1);
          }
          updatedProduction.progress = 0;
        }

        facilityUpdates.push({
          id: facility.id,
          updates: { production: updatedProduction },
        });
      });

      // 批量更新 store
      facilityUpdates.forEach(({ id, updates }) => {
        updateFacility(id, updates);
      });

      inventoryUpdates.forEach((amount, itemId) => {
        updateInventory(itemId, amount);
      });
    });
  }

  // 创建燃料消耗任务
  static createFuelConsumptionTask(): GameLoopTask {
    const config = TASK_CONFIGS[GameLoopTaskType.FUEL_CONSUMPTION];

    return this.createTask(config, (deltaTime: number) => {
      const store = useGameStore.getState();
      store.updateFuelConsumption(deltaTime);
    });
  }

  // 创建研究系统任务
  static createResearchTask(): GameLoopTask {
    const config = TASK_CONFIGS[GameLoopTaskType.RESEARCH];

    return this.createTask(config, (deltaTime: number) => {
      if (config.shouldRun && !config.shouldRun()) {
        return;
      }

      const store = useGameStore.getState();
      store.updateResearchProgress(deltaTime);
    });
  }

  // 创建统计更新任务
  static createStatisticsTask(): GameLoopTask {
    const config = TASK_CONFIGS[GameLoopTaskType.STATISTICS];

    return this.createTask(config, () => {
      const store = useGameStore.getState();

      // 更新游戏循环状态统计
      if (store._updateGameLoopState) {
        store._updateGameLoopState();
      }

      // 可以在这里添加其他统计更新逻辑
      // 比如计算生产效率、资源消耗率等
    });
  }

  // 创建自动存档任务
  static createAutoSaveTask(): GameLoopTask {
    const config = TASK_CONFIGS[GameLoopTaskType.AUTO_SAVE];

    return this.createTask(config, () => {
      try {
        const store = useGameStore.getState();
        store.saveGame();
      } catch (error) {
        console.error('自动存档失败:', error);
        // 不重新抛出错误，因为存档失败不应该影响游戏循环
      }
    });
  }

  // 创建 UI 更新任务 - 优化频率
  static createUIUpdatesTask(): GameLoopTask {
    const config = TASK_CONFIGS[GameLoopTaskType.UI_UPDATES];

    return this.createTask(config, () => {
      // 由于使用了 Zustand，大部分 UI 更新是响应式的
      // 这里只处理一些需要主动更新的 UI 元素
      // 比如进度条动画、数值滚动等
      // TODO: 在这里添加需要的 UI 更新逻辑
    });
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

  // 智能任务状态管理 - 根据游戏状态动态调整任务
  static updateTasksState(tasks: Map<string, GameLoopTask>): void {
    // 根据配置自动更新任务状态
    Object.values(TASK_CONFIGS).forEach(config => {
      const task = tasks.get(config.id);
      if (task && config.shouldRun) {
        const shouldEnable = config.shouldRun();

        // 只有在状态发生改变时才更新
        if (task.enabled !== shouldEnable) {
          task.enabled = shouldEnable;
          console.log(`[GameLoop] 任务 ${config.name} ${shouldEnable ? '已启用' : '已禁用'}`);
        }
      }
    });
  }

  // 获取任务配置
  static getTaskConfig(taskId: string): TaskConfig | undefined {
    return TASK_CONFIGS[taskId];
  }

  // 获取所有任务配置
  static getAllTaskConfigs(): Record<string, TaskConfig> {
    return { ...TASK_CONFIGS };
  }
}
