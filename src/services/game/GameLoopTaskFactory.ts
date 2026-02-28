// 重新设计的游戏循环任务工厂 - 高效模块化任务系统
import {
  getGameLoopRuntimePorts,
  getGameStoreAdapter,
  updateAppRuntimeContext,
  type GameLoopRuntimePorts,
  type GameStoreAdapter,
} from '@/services/core/AppRuntimeContext';
import type { FacilityInstance } from '@/types/facilities';
import type { GameLoopTask } from '@/types/gameLoop';
import { GameLoopTaskType } from '@/types/gameLoop';
import CraftingEngine from '@/utils/craftingEngine';
import { info as logInfo, error as logError } from '@/utils/logger';

// 任务配置接口
interface TaskConfig {
  id: string;
  name: string;
  priority: number;
  baseInterval: number; // 基础更新间隔
  enabledByDefault: boolean;
  shouldRun?: () => boolean;
}

const tryGetAdapter = (): GameStoreAdapter | null => {
  try {
    return getGameStoreAdapter();
  } catch {
    return null;
  }
};

// 任务配置表
const TASK_CONFIGS: Record<string, TaskConfig> = {
  [GameLoopTaskType.CRAFTING]: {
    id: GameLoopTaskType.CRAFTING,
    name: '手动制作系统更新',
    priority: 1,
    baseInterval: 100, // 100ms
    enabledByDefault: false,
    shouldRun: () => (tryGetAdapter()?.getCraftingQueueLength() ?? 0) > 0,
  },
  [GameLoopTaskType.FACILITIES]: {
    id: GameLoopTaskType.FACILITIES,
    name: '设施系统更新',
    priority: 2,
    baseInterval: 1000, // 1秒
    enabledByDefault: false,
    shouldRun: () =>
      tryGetAdapter()?.hasFacilitiesWithStatus(['running', 'no_resource', 'output_full']) ?? false,
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
    shouldRun: () => tryGetAdapter()?.hasActiveResearch() ?? false,
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
  /**
   * 注入 Store 访问适配器（由 DIServiceInitializer 在 DI 完成后调用）
   * 将 Service 层对 Zustand Store 的直接依赖转换为接口依赖。
   */
  static setAdapter(adapter: GameStoreAdapter): void {
    updateAppRuntimeContext({ gameStoreAdapter: adapter });
  }

  static resetAdapter(): void {
    updateAppRuntimeContext({ gameStoreAdapter: null });
  }

  static setRuntimePorts(runtimePorts: GameLoopRuntimePorts): void {
    updateAppRuntimeContext({ gameLoopRuntimePorts: runtimePorts });
  }

  static resetRuntimePorts(): void {
    updateAppRuntimeContext({ gameLoopRuntimePorts: null });
  }

  /** 获取适配器（内部使用，适配器不存在时抛出明确错误） */
  private static getAdapter(): GameStoreAdapter {
    return getGameStoreAdapter();
  }

  private static getRuntimePorts(): GameLoopRuntimePorts {
    return getGameLoopRuntimePorts();
  }

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
        CraftingEngine.updateCraftingQueue(
          GameLoopTaskFactory.getAdapter(),
          GameLoopTaskFactory.getRuntimePorts().recipeQuery
        );
      } catch (error) {
        logError('制作系统更新失败:', error);
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

      const adapter = GameLoopTaskFactory.getAdapter();
      const { facilities, updateFacility, batchUpdateInventory, getInventoryItem } = {
        facilities: adapter.getFacilities(),
        updateFacility: adapter.updateFacility,
        batchUpdateInventory: adapter.batchUpdateInventory,
        getInventoryItem: adapter.getInventoryItem,
      };
      const recipeService = GameLoopTaskFactory.getRuntimePorts().recipeQuery;

      // 批量处理设施更新，减少 store 更新次数
      const facilityUpdates: Array<{ id: string; updates: Partial<FacilityInstance> }> = [];
      const batchedInventoryUpdates: Array<{ itemId: string; amount: number }> = [];

      facilities.forEach(facility => {
        const production = facility.production;
        if (!production || !production.currentRecipeId) return;

        const recipe = recipeService.getRecipeById(production.currentRecipeId);
        if (!recipe) return;

        // ── 阻塞状态恢复检查 ──────────────────────────────────────────────
        // no_resource：当材料补充后恢复运行；output_full：当输出空间释放后恢复运行
        if (facility.status === 'no_resource' || facility.status === 'output_full') {
          if (facility.status === 'no_resource') {
            const hasEnoughMaterials =
              !recipe.in ||
              Object.entries(recipe.in).every(
                ([itemId, required]) =>
                  getInventoryItem(itemId).currentAmount >= (required as number)
              );
            if (hasEnoughMaterials) {
              facilityUpdates.push({ id: facility.id, updates: { status: 'running' } });
            }
          } else {
            // output_full：progress 保留在 >= 1，恢复后下一轮立即输出
            const hasOutputSpace =
              !recipe.out ||
              Object.entries(recipe.out).every(([itemId, qty]) => {
                const inv = getInventoryItem(itemId);
                return inv.currentAmount + (qty as number) <= inv.maxCapacity;
              });
            if (hasOutputSpace) {
              facilityUpdates.push({ id: facility.id, updates: { status: 'running' } });
            }
          }
          // 本轮跳过生产更新，下轮以 running 状态处理
          return;
        }

        if (facility.status !== 'running') return;

        const currentProgress = production.progress || 0;

        // 如果是新开始的生产（进度为0），需要检查并扣除输入材料
        if (currentProgress === 0) {
          // 检查材料是否充足
          const hasEnoughMaterials =
            !recipe.in ||
            Object.entries(recipe.in).every(
              ([itemId, required]) => getInventoryItem(itemId).currentAmount >= (required as number)
            );
          if (!hasEnoughMaterials) {
            facilityUpdates.push({ id: facility.id, updates: { status: 'no_resource' } });
            return;
          }

          // 检查输出容量是否足够
          const hasOutputSpace =
            !recipe.out ||
            Object.entries(recipe.out).every(([itemId, qty]) => {
              const inv = getInventoryItem(itemId);
              return inv.currentAmount + (qty as number) <= inv.maxCapacity;
            });
          if (!hasOutputSpace) {
            facilityUpdates.push({ id: facility.id, updates: { status: 'output_full' } });
            return;
          }

          // 材料充足且有输出空间，开始生产并立即扣除输入材料
          if (recipe.in) {
            for (const [itemId, quantity] of Object.entries(recipe.in)) {
              batchedInventoryUpdates.push({ itemId, amount: -(quantity as number) });
            }
          }
        }

        // 推进生产进度
        const progressIncrement = (deltaTime / (recipe.time * 1000)) * (facility.efficiency || 1);
        const newProgress = Math.min(currentProgress + progressIncrement, 1);

        const updatedProduction = {
          ...production,
          progress: newProgress,
        };

        // 完成生产时只需要添加产出
        if (newProgress >= 1) {
          // 再次检查输出容量（防止在生产过程中容量被其他途径占用）
          const canOutput =
            !recipe.out ||
            Object.entries(recipe.out).every(([itemId, qty]) => {
              const inv = getInventoryItem(itemId);
              return inv.currentAmount + (qty as number) <= inv.maxCapacity;
            });

          if (!canOutput) {
            // 输出空间不足，设施停止但不重置进度（恢复时直接输出）
            facilityUpdates.push({ id: facility.id, updates: { status: 'output_full' } });
          } else {
            // 添加产出并重置进度开始下一轮生产
            if (recipe.out) {
              for (const [itemId, quantity] of Object.entries(recipe.out)) {
                batchedInventoryUpdates.push({ itemId, amount: quantity as number });
              }
            }
            updatedProduction.progress = 0;
          }
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

      if (batchedInventoryUpdates.length > 0) {
        batchUpdateInventory(batchedInventoryUpdates);
      }
    });
  }

  // 创建燃料消耗任务
  static createFuelConsumptionTask(): GameLoopTask {
    const config = TASK_CONFIGS[GameLoopTaskType.FUEL_CONSUMPTION];

    return this.createTask(config, (deltaTime: number) => {
      GameLoopTaskFactory.getAdapter().updateFuelConsumption(deltaTime);
    });
  }

  // 创建研究系统任务
  static createResearchTask(): GameLoopTask {
    const config = TASK_CONFIGS[GameLoopTaskType.RESEARCH];

    return this.createTask(config, (deltaTime: number) => {
      if (config.shouldRun && !config.shouldRun()) {
        return;
      }

      GameLoopTaskFactory.getAdapter().updateResearchProgress(deltaTime);
    });
  }

  // 创建统计更新任务
  static createStatisticsTask(): GameLoopTask {
    const config = TASK_CONFIGS[GameLoopTaskType.STATISTICS];

    return this.createTask(config, () => {
      const adapter = GameLoopTaskFactory.getAdapter();
      adapter.updateGameLoopState?.();
    });
  }

  // 创建自动存档任务
  static createAutoSaveTask(): GameLoopTask {
    const config = TASK_CONFIGS[GameLoopTaskType.AUTO_SAVE];

    return this.createTask(config, () => {
      try {
        GameLoopTaskFactory.getAdapter().saveGame();
      } catch (error) {
        logError('自动存档失败:', error);
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
  static updateTasksState(tasks: ReadonlyMap<string, GameLoopTask>): void {
    if (!tryGetAdapter()) return;

    // 根据配置自动更新任务状态
    Object.values(TASK_CONFIGS).forEach(config => {
      const task = tasks.get(config.id);
      if (task && config.shouldRun) {
        const shouldEnable = config.shouldRun();

        // 只有在状态发生改变时才更新
        if (task.enabled !== shouldEnable) {
          task.enabled = shouldEnable;
          logInfo(`[GameLoop] 任务 ${config.name} ${shouldEnable ? '已启用' : '已禁用'}`);
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
