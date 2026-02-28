/**
 * 基于依赖注入的服务初始化器
 * 替代原有的 ServiceInitializer，使用 DI 容器管理依赖关系
 */

import { container } from '@/services/core/DIContainer';
import { SERVICE_TOKENS } from '@/services/core/ServiceTokens';

// 核心服务
import { DataService } from '@/services/core/DataService';
import { GameConfig } from '@/services/core/GameConfig';
import { UserProgressService } from '@/services/game/UserProgressService';
import { StorageService } from '@/services/storage/StorageService';
import ManualCraftingValidator from '@/utils/manualCraftingValidator';

// 业务服务
import { DependencyService } from '@/services/crafting/DependencyService';
import { FuelService } from '@/services/crafting/FuelService';
import { RecipeService } from '@/services/crafting/RecipeService';
import { PowerService } from '@/services/game/PowerService';

// 科技系统服务
import { TechEventEmitter } from '@/services/technology/events';
import { ResearchQueueService } from '@/services/technology/ResearchQueueService';
import { ResearchService } from '@/services/technology/ResearchService';
import { TechnologyService } from '@/services/technology/TechnologyService';
import { TechProgressTracker } from '@/services/technology/TechProgressTracker';
import { TechTreeService } from '@/services/technology/TechTreeService';
import { TechUnlockService } from '@/services/technology/TechUnlockService';

// 游戏循环服务
import { GameLoopService } from '@/services/game/GameLoopService';
import { GameLoopTaskFactory } from '@/services/game/GameLoopTaskFactory';

import useGameStore from '@/store/gameStore';

export class DIServiceInitializer {
  private static initialized = false;
  private static initializingPromise: Promise<void> | null = null;
  private static activeConsumers = 0;
  private static taskMonitorIntervalId: ReturnType<typeof setInterval> | null = null;
  private static cleanupTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /**
   * 声明一个运行时消费者，避免 StrictMode 开发环境下初始化后立刻被清理
   */
  static async acquire(): Promise<void> {
    this.activeConsumers += 1;
    this.cancelScheduledCleanup();
    try {
      await this.initialize();
    } catch (error) {
      this.activeConsumers = Math.max(0, this.activeConsumers - 1);
      if (this.activeConsumers === 0) {
        this.scheduleCleanup();
      }
      throw error;
    }
  }

  /**
   * 释放一个运行时消费者；当没有消费者时再执行清理
   */
  static release(): void {
    this.activeConsumers = Math.max(0, this.activeConsumers - 1);

    if (this.activeConsumers === 0) {
      this.scheduleCleanup();
    }
  }

  /**
   * 注册所有服务到 DI 容器
   */
  static registerServices(): void {
    // 1. 注册基础服务（无依赖）
    container.register(SERVICE_TOKENS.USER_PROGRESS_SERVICE, UserProgressService);
    container.register(SERVICE_TOKENS.STORAGE_SERVICE, StorageService);
    container.register(SERVICE_TOKENS.MANUAL_CRAFTING_VALIDATOR, ManualCraftingValidator);
    container.register(SERVICE_TOKENS.DATA_SERVICE, DataService);

    // 注册 GameConfig 服务（依赖 DataService）
    container.registerFactory(SERVICE_TOKENS.GAME_CONFIG, () => {
      const dataService = container.resolve<DataService>(SERVICE_TOKENS.DATA_SERVICE);
      return new GameConfig(dataService);
    });

    // 2. 注册事件系统和基础业务服务
    container.register(SERVICE_TOKENS.TECH_EVENT_EMITTER, TechEventEmitter);
    container.register(SERVICE_TOKENS.RECIPE_SERVICE, RecipeService);

    // 3. 注册科技系统子服务
    container.register(SERVICE_TOKENS.TECH_TREE_SERVICE, TechTreeService);

    container.registerFactory(SERVICE_TOKENS.TECH_UNLOCK_SERVICE, () => {
      const userProgressService = container.resolve<UserProgressService>(
        SERVICE_TOKENS.USER_PROGRESS_SERVICE
      );
      const eventEmitter = container.resolve<TechEventEmitter>(SERVICE_TOKENS.TECH_EVENT_EMITTER);
      const treeService = container.resolve<TechTreeService>(SERVICE_TOKENS.TECH_TREE_SERVICE);
      const recipeService = container.resolve<RecipeService>(SERVICE_TOKENS.RECIPE_SERVICE);
      const dataService = container.resolve<DataService>(SERVICE_TOKENS.DATA_SERVICE);
      return new TechUnlockService(
        userProgressService,
        eventEmitter,
        treeService,
        recipeService,
        dataService
      );
    });

    container.registerFactory(SERVICE_TOKENS.RESEARCH_SERVICE, () => {
      const eventEmitter = container.resolve<TechEventEmitter>(SERVICE_TOKENS.TECH_EVENT_EMITTER);
      return new ResearchService(eventEmitter);
    });

    container.registerFactory(SERVICE_TOKENS.RESEARCH_QUEUE_SERVICE, () => {
      const eventEmitter = container.resolve<TechEventEmitter>(SERVICE_TOKENS.TECH_EVENT_EMITTER);
      return new ResearchQueueService(eventEmitter);
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

      const technologyService = new TechnologyService(
        eventEmitter,
        treeService,
        unlockService,
        researchService,
        queueService,
        progressTracker
      );

      return technologyService;
    });

    // 5. 注册其他业务服务
    container.register(SERVICE_TOKENS.DEPENDENCY_SERVICE, DependencyService);

    container.registerFactory(SERVICE_TOKENS.FUEL_SERVICE, () => {
      const dataService = container.resolve<DataService>(SERVICE_TOKENS.DATA_SERVICE);
      const gameConfig = container.resolve<GameConfig>(SERVICE_TOKENS.GAME_CONFIG);
      const recipeService = container.resolve<RecipeService>(SERVICE_TOKENS.RECIPE_SERVICE);
      return new FuelService(dataService, gameConfig, recipeService);
    });

    container.registerFactory(SERVICE_TOKENS.POWER_SERVICE, () => {
      const dataService = container.resolve<DataService>(SERVICE_TOKENS.DATA_SERVICE);
      const gameConfig = container.resolve<GameConfig>(SERVICE_TOKENS.GAME_CONFIG);
      return new PowerService(dataService, gameConfig);
    });

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

    if (this.initializingPromise) {
      return this.initializingPromise;
    }

    this.initializingPromise = (async () => {
      try {
        container.clear();

        // 1. 注册服务
        this.registerServices();

        // 2. 初始化核心服务
        await this.initializeCoreServices();

        // 3. 初始化应用层
        await this.initializeApplication();

        this.initialized = true;
      } catch (error) {
        // 如果初始化失败，重置状态
        this.initialized = false;
        container.clear();
        throw error;
      } finally {
        this.initializingPromise = null;
      }
    })();

    return this.initializingPromise;
  }

  /**
   * 初始化核心服务
   */
  private static async initializeCoreServices(): Promise<void> {
    const startTime = Date.now();

    try {
      // 1. 初始化数据服务并加载游戏数据
      const dataService = container.resolve<DataService>(SERVICE_TOKENS.DATA_SERVICE);
      const gameData = await dataService.loadGameData();

      // 2. 初始化配方服务
      if (gameData.recipes) {
        const recipeService = container.resolve<RecipeService>(SERVICE_TOKENS.RECIPE_SERVICE);
        recipeService.initializeRecipes(gameData.recipes);
      }

      // 3. 初始化科技服务
      const technologyService = container.resolve<TechnologyService>(
        SERVICE_TOKENS.TECHNOLOGY_SERVICE
      );
      await technologyService.initialize();

      const totalTime = Date.now() - startTime;
      console.log(`[ServiceInit] All core services initialized in ${totalTime}ms`);
    } catch (error) {
      console.error('[ServiceInit] Core services initialization failed:', error);
      throw error;
    }
  }

  /**
   * 初始化应用层
   */
  private static async initializeApplication(): Promise<void> {
    // 1. 同步科技数据到游戏状态存储
    const { initializeTechnologyService, startGameLoop } = useGameStore.getState();
    await initializeTechnologyService();

    // 2. 启动游戏循环系统前，校正从存档恢复的设施燃料功率（可能因数据未加载而使用了占位默认值）
    try {
      const store = useGameStore.getState();
      const dataService = container.resolve<DataService>(SERVICE_TOKENS.DATA_SERVICE);
      const facilities = store.facilities;
      facilities.forEach(f => {
        if (!f.fuelBuffer) return;
        const item = dataService.getItem(f.facilityId);
        const usage = item?.machine?.usage;
        if (typeof usage === 'number' && usage > 0 && f.fuelBuffer!.burnRate !== usage) {
          store.updateFacility(f.id, {
            fuelBuffer: { ...f.fuelBuffer!, burnRate: usage },
          });
        }
      });
    } catch (e) {
      // 在开发环境下输出日志，避免打断初始化流程
      if (import.meta.env.DEV) {
        console.warn('[ServiceInit] 校正设施燃料功率失败（可忽略）:', e);
      }
    }

    // 3. 启动游戏循环系统
    const gameLoopService = container.resolve<GameLoopService>(SERVICE_TOKENS.GAME_LOOP_SERVICE);

    // 添加所有默认的游戏系统任务
    const defaultTasks = GameLoopTaskFactory.createAllDefaultTasks();
    defaultTasks.forEach(task => gameLoopService.addTask(task));

    // 启动状态管理层的游戏循环控制器（内部会调用 gameLoopService.start()）
    startGameLoop();

    // 设置任务状态监控定时器（清理旧的，防止热重载时重复创建）
    if (this.taskMonitorIntervalId !== null) {
      clearInterval(this.taskMonitorIntervalId);
    }
    this.taskMonitorIntervalId = setInterval(() => {
      GameLoopTaskFactory.updateTasksState(gameLoopService.getTasks());
    }, 10000);
  }

  private static scheduleCleanup(): void {
    this.cancelScheduledCleanup();
    this.cleanupTimeoutId = setTimeout(() => {
      this.cleanupTimeoutId = null;
      if (this.activeConsumers === 0) {
        this.cleanup();
      }
    }, 0);
  }

  private static cancelScheduledCleanup(): void {
    if (this.cleanupTimeoutId !== null) {
      clearTimeout(this.cleanupTimeoutId);
      this.cleanupTimeoutId = null;
    }
  }

  /**
   * 清理资源
   */
  static cleanup(): void {
    this.cancelScheduledCleanup();

    if (this.initializingPromise) {
      void this.initializingPromise.finally(() => {
        if (this.activeConsumers === 0) {
          this.cleanup();
        }
      });
      return;
    }

    // 清理任务监控定时器
    if (this.taskMonitorIntervalId !== null) {
      clearInterval(this.taskMonitorIntervalId);
      this.taskMonitorIntervalId = null;
    }

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

    container.clear();
    this.initialized = false;
    this.activeConsumers = 0;
  }

  /**
   * 重置初始化状态（主要用于测试）
   */
  static reset(): void {
    this.cancelScheduledCleanup();
    if (this.taskMonitorIntervalId !== null) {
      clearInterval(this.taskMonitorIntervalId);
      this.taskMonitorIntervalId = null;
    }
    container.clear();
    this.initialized = false;
    this.initializingPromise = null;
    this.activeConsumers = 0;
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
