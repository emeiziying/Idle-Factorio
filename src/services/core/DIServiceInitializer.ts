/**
 * 基于依赖注入的服务初始化器
 * 替代原有的 ServiceInitializer，使用 DI 容器管理依赖关系
 */

import { container } from '@/services/core/DIContainer';
import { SERVICE_TOKENS } from '@/services/core/ServiceTokens';

// 核心服务
import { DataService } from '@/services/core/DataService';
import { UserProgressService } from '@/services/game/UserProgressService';
import { StorageService } from '@/services/storage/StorageService';
import ManualCraftingValidator from '@/utils/manualCraftingValidator';

// 业务服务
import { RecipeService } from '@/services/crafting/RecipeService';
import { FuelService } from '@/services/crafting/FuelService';
import { PowerService } from '@/services/game/PowerService';

// 科技系统服务
import { TechnologyService } from '@/services/technology/TechnologyService';
import { TechTreeService } from '@/services/technology/TechTreeService';
import { TechUnlockService } from '@/services/technology/TechUnlockService';
import { ResearchService } from '@/services/technology/ResearchService';
import { ResearchQueueService } from '@/services/technology/ResearchQueueService';
import { TechProgressTracker } from '@/services/technology/TechProgressTracker';
import { TechEventEmitter } from '@/services/technology/events';

// 游戏循环服务
import { GameLoopService } from '@/services/game/GameLoopService';
import { GameLoopTaskFactory } from '@/services/game/GameLoopTaskFactory';

import useGameStore from '@/store/gameStore';

export class DIServiceInitializer {
  private static initialized = false;

  /**
   * 注册所有服务到 DI 容器
   */
  static registerServices(): void {
    // 1. 注册基础服务（无依赖）
    container.register(SERVICE_TOKENS.USER_PROGRESS_SERVICE, UserProgressService);
    container.register(SERVICE_TOKENS.STORAGE_SERVICE, StorageService);
    container.register(SERVICE_TOKENS.MANUAL_CRAFTING_VALIDATOR, ManualCraftingValidator);
    container.register(SERVICE_TOKENS.DATA_SERVICE, DataService);

    // 2. 注册事件系统
    container.register(SERVICE_TOKENS.TECH_EVENT_EMITTER, TechEventEmitter);

    // 3. 注册科技系统子服务
    container.register(SERVICE_TOKENS.TECH_TREE_SERVICE, TechTreeService);

    container.register(SERVICE_TOKENS.TECH_UNLOCK_SERVICE, TechUnlockService, {
      dependencies: [
        SERVICE_TOKENS.USER_PROGRESS_SERVICE,
        SERVICE_TOKENS.TECH_EVENT_EMITTER,
        SERVICE_TOKENS.TECH_TREE_SERVICE,
      ],
    });

    container.register(SERVICE_TOKENS.RESEARCH_SERVICE, ResearchService, {
      dependencies: [SERVICE_TOKENS.TECH_EVENT_EMITTER],
    });

    container.register(SERVICE_TOKENS.RESEARCH_QUEUE_SERVICE, ResearchQueueService, {
      dependencies: [SERVICE_TOKENS.TECH_EVENT_EMITTER],
    });

    container.register(SERVICE_TOKENS.TECH_PROGRESS_TRACKER, TechProgressTracker);

    // 4. 注册主要科技服务（依赖子服务）
    container.registerFactory(SERVICE_TOKENS.TECHNOLOGY_SERVICE, () => {
      const eventEmitter = container.resolve<TechEventEmitter>(SERVICE_TOKENS.TECH_EVENT_EMITTER);
      const treeService = container.resolve<TechTreeService>(SERVICE_TOKENS.TECH_TREE_SERVICE);
      const unlockService = container.resolve<TechUnlockService>(
        SERVICE_TOKENS.TECH_UNLOCK_SERVICE
      );
      const researchService = container.resolve<ResearchService>(SERVICE_TOKENS.RESEARCH_SERVICE);
      const queueService = container.resolve<ResearchQueueService>(
        SERVICE_TOKENS.RESEARCH_QUEUE_SERVICE
      );
      const progressTracker = container.resolve<TechProgressTracker>(
        SERVICE_TOKENS.TECH_PROGRESS_TRACKER
      );

      const technologyService = new TechnologyService();
      // 通过反射设置私有属性（临时方案，后续可以通过构造函数注入）
      (technologyService as any).eventEmitter = eventEmitter;
      (technologyService as any).treeService = treeService;
      (technologyService as any).unlockService = unlockService;
      (technologyService as any).researchService = researchService;
      (technologyService as any).queueService = queueService;
      (technologyService as any).progressTracker = progressTracker;

      return technologyService;
    });

    // 5. 注册其他业务服务
    container.register(SERVICE_TOKENS.RECIPE_SERVICE, RecipeService);
    container.register(SERVICE_TOKENS.FUEL_SERVICE, FuelService);
    container.register(SERVICE_TOKENS.POWER_SERVICE, PowerService);

    // 6. 注册游戏循环服务
    container.register(SERVICE_TOKENS.GAME_LOOP_SERVICE, GameLoopService);
    container.register(SERVICE_TOKENS.GAME_LOOP_TASK_FACTORY, GameLoopTaskFactory);
  }

  /**
   * 初始化所有服务
   */
  static async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // 1. 注册服务
    this.registerServices();

    // 2. 初始化数据服务并加载游戏数据
    const dataService = container.resolve<DataService>(SERVICE_TOKENS.DATA_SERVICE);
    const gameData = await dataService.loadGameData();

    // 3. 初始化配方服务
    if (gameData.recipes) {
      const recipeService = container.resolve<RecipeService>(SERVICE_TOKENS.RECIPE_SERVICE);
      recipeService.initializeRecipes(gameData.recipes);
    }

    // 4. 初始化科技服务
    const technologyService = container.resolve<TechnologyService>(
      SERVICE_TOKENS.TECHNOLOGY_SERVICE
    );
    await technologyService.initialize();

    // 5. 初始化应用层
    await this.initializeApplication();

    this.initialized = true;
  }

  /**
   * 初始化应用层
   */
  private static async initializeApplication(): Promise<void> {
    // 1. 同步科技数据到游戏状态存储
    const { initializeTechnologyService } = useGameStore.getState();
    await initializeTechnologyService();

    // 2. 启动游戏循环系统
    const gameLoopService = container.resolve<GameLoopService>(SERVICE_TOKENS.GAME_LOOP_SERVICE);

    // 添加所有默认的游戏系统任务
    const defaultTasks = GameLoopTaskFactory.createAllDefaultTasks();
    defaultTasks.forEach(task => gameLoopService.addTask(task));

    // 启动游戏循环
    gameLoopService.start();

    // 启动状态管理层的游戏循环控制器
    const { startGameLoop } = useGameStore.getState();
    startGameLoop();

    // 设置任务状态监控定时器
    setInterval(() => {
      GameLoopTaskFactory.updateTasksState(gameLoopService['tasks']);
    }, 10000);
  }

  /**
   * 清理资源
   */
  static cleanup(): void {
    // 停止游戏循环
    if (container.has(SERVICE_TOKENS.GAME_LOOP_SERVICE)) {
      const gameLoopService = container.resolve<GameLoopService>(SERVICE_TOKENS.GAME_LOOP_SERVICE);
      gameLoopService.stop();
    }

    // 停止状态管理层的游戏循环控制器
    try {
      const { stopGameLoop } = useGameStore.getState();
      stopGameLoop();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[DIServiceInit] 游戏循环停止失败:', error);
      }
    }
  }

  /**
   * 检查是否已初始化
   */
  static isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 重置初始化状态（主要用于测试）
   */
  static reset(): void {
    container.clear();
    this.initialized = false;
  }

  /**
   * 获取服务实例
   */
  static getService<T>(token: string): T {
    return container.resolve<T>(token);
  }
}

// 导出便捷的服务获取函数
export const getService = <T>(token: string): T => {
  return DIServiceInitializer.getService<T>(token);
};
