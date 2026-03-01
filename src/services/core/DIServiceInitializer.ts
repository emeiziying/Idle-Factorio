/**
 * 基于依赖注入的服务初始化器
 * 替代原有的 ServiceInitializer，使用 DI 容器管理依赖关系
 */

import {
  resetAppRuntimeContext,
  updateAppRuntimeContext,
  type GameLoopRuntimePorts,
  type GameStoreAdapter,
  type StoreRuntimeServices,
} from '@/services/core/AppRuntimeContext';
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
import { TechDataLoader } from '@/services/technology/TechDataLoader';
import { TechnologyService } from '@/services/technology/TechnologyService';
import { TechProgressTracker } from '@/services/technology/TechProgressTracker';
import { TechTreeService } from '@/services/technology/TechTreeService';
import { TechUnlockService } from '@/services/technology/TechUnlockService';

// 游戏循环服务
import { GameLoopService } from '@/services/game/GameLoopService';
import { GameLoopTaskFactory } from '@/services/game/GameLoopTaskFactory';

// 存档服务
import { GameStorageService } from '@/services/storage/GameStorageService';

import useGameStore from '@/store/gameStore';

interface CoreRuntime {
  dataService: DataService;
  fuelService: FuelService;
  gameLoopService: GameLoopService;
  gameStorageService: GameStorageService;
  recipeService: RecipeService;
  storageService: StorageService;
  technologyService: TechnologyService;
}

export class DIServiceInitializer {
  private static initialized = false;
  private static servicesRegistered = false;
  private static initializationPromise: Promise<void> | null = null;
  private static taskMonitorIntervalId: ReturnType<typeof setInterval> | null = null;

  /**
   * 注册所有服务到 DI 容器
   */
  static registerServices(): void {
    if (this.servicesRegistered) {
      return;
    }

    // 1. 注册基础服务（无依赖）
    container.register(SERVICE_TOKENS.USER_PROGRESS_SERVICE, UserProgressService);
    container.register(SERVICE_TOKENS.DATA_SERVICE, DataService);

    container.registerFactory(SERVICE_TOKENS.STORAGE_SERVICE, () => {
      const dataService = container.resolve<DataService>(SERVICE_TOKENS.DATA_SERVICE);
      return new StorageService(dataService);
    });

    container.registerFactory(SERVICE_TOKENS.MANUAL_CRAFTING_VALIDATOR, () => {
      const dataService = container.resolve<DataService>(SERVICE_TOKENS.DATA_SERVICE);
      return new ManualCraftingValidator(dataService);
    });

    // 注册 GameConfig 服务（依赖 DataService）
    container.registerFactory(SERVICE_TOKENS.GAME_CONFIG, () => {
      const dataService = container.resolve<DataService>(SERVICE_TOKENS.DATA_SERVICE);
      return new GameConfig(dataService);
    });

    // 2. 注册事件系统和基础业务服务
    container.register(SERVICE_TOKENS.TECH_EVENT_EMITTER, TechEventEmitter);
    container.registerFactory(SERVICE_TOKENS.RECIPE_SERVICE, () => {
      const validator = container.resolve<ManualCraftingValidator>(
        SERVICE_TOKENS.MANUAL_CRAFTING_VALIDATOR
      );
      const recipeService = new RecipeService(validator);
      validator.setRecipeQuery(recipeService);
      return recipeService;
    });

    // 3. 注册科技系统子服务
    container.registerFactory(SERVICE_TOKENS.TECH_TREE_SERVICE, () => {
      const dataService = container.resolve<DataService>(SERVICE_TOKENS.DATA_SERVICE);
      const recipeService = container.resolve<RecipeService>(SERVICE_TOKENS.RECIPE_SERVICE);
      const dataLoader = new TechDataLoader(dataService, recipeService);
      return new TechTreeService(dataLoader);
    });

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
      const treeService = container.resolve<TechTreeService>(SERVICE_TOKENS.TECH_TREE_SERVICE);
      const unlockService = container.resolve<TechUnlockService>(
        SERVICE_TOKENS.TECH_UNLOCK_SERVICE
      );
      return new ResearchService(eventEmitter, treeService, unlockService);
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

      return new TechnologyService(
        eventEmitter,
        treeService,
        unlockService,
        researchService,
        queueService,
        progressTracker
      );
    });

    // 5. 注册其他业务服务
    container.registerFactory(SERVICE_TOKENS.DEPENDENCY_SERVICE, () => {
      const recipeService = container.resolve<RecipeService>(SERVICE_TOKENS.RECIPE_SERVICE);
      const validator = container.resolve<ManualCraftingValidator>(
        SERVICE_TOKENS.MANUAL_CRAFTING_VALIDATOR
      );
      return new DependencyService(recipeService, validator);
    });

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

    // 7. 注册存档服务（依赖 DataService，通过 DI 注入避免自行 new DataService）
    container.registerFactory(SERVICE_TOKENS.GAME_STORAGE_SERVICE, () => {
      const dataService = container.resolve<DataService>(SERVICE_TOKENS.DATA_SERVICE);
      return new GameStorageService(dataService);
    });

    this.servicesRegistered = true;
  }

  /**
   * 初始化所有服务
   */
  static async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      this.registerServices();

      try {
        const coreRuntime = await this.initializeCoreServices();
        await this.initializeApplication(coreRuntime);
        this.initialized = true;
      } catch (error) {
        this.cleanup();
        this.initialized = false;
        throw error;
      } finally {
        this.initializationPromise = null;
      }
    })();

    return this.initializationPromise;
  }

  /**
   * 初始化核心服务
   */
  private static async initializeCoreServices(): Promise<CoreRuntime> {
    const startTime = Date.now();

    try {
      const dataService = container.resolve<DataService>(SERVICE_TOKENS.DATA_SERVICE);
      const gameData = await dataService.loadGameData();
      const recipeService = container.resolve<RecipeService>(SERVICE_TOKENS.RECIPE_SERVICE);
      const storageService = container.resolve<StorageService>(SERVICE_TOKENS.STORAGE_SERVICE);
      const fuelService = container.resolve<FuelService>(SERVICE_TOKENS.FUEL_SERVICE);
      const gameLoopService = container.resolve<GameLoopService>(SERVICE_TOKENS.GAME_LOOP_SERVICE);
      const gameStorageService = container.resolve<GameStorageService>(
        SERVICE_TOKENS.GAME_STORAGE_SERVICE
      );

      if (gameData.recipes) {
        recipeService.initializeRecipes(gameData.recipes);
      }

      const technologyService = container.resolve<TechnologyService>(
        SERVICE_TOKENS.TECHNOLOGY_SERVICE
      );
      await technologyService.initialize();
      recipeService.setUnlockPorts({
        isRecipeUnlocked: recipeId => technologyService.isRecipeUnlocked(recipeId),
      });

      dataService.setDependencyPorts({
        recipeQuery: recipeService,
        itemUnlockChecker: itemId => technologyService.isItemUnlocked(itemId),
      });

      const coreRuntime: CoreRuntime = {
        dataService,
        fuelService,
        gameLoopService,
        gameStorageService,
        recipeService,
        storageService,
        technologyService,
      };

      this.publishCoreRuntimeContext(coreRuntime);

      const totalTime = Date.now() - startTime;
      console.log(`[ServiceInit] All core services initialized in ${totalTime}ms`);

      return coreRuntime;
    } catch (error) {
      console.error('[ServiceInit] Core services initialization failed:', error);
      throw error;
    }
  }

  /**
   * 初始化应用层
   *
   * 注意：此方法是项目中唯一被允许直接调用 useGameStore.getState() 的 Service 层代码。
   * 它作为 DI 容器与 Zustand Store 之间的桥接层，通过 StoreAccessor/回调模式
   * 将所有 Store 访问封装后注入到 Service 层，避免 Service 层直接依赖 Store。
   */
  private static async initializeApplication(coreRuntime: CoreRuntime): Promise<void> {
    const { loadGameData, initializeTechnologyService, startGameLoop } = useGameStore.getState();
    await loadGameData();
    await initializeTechnologyService();

    try {
      const store = useGameStore.getState();
      const facilities = store.facilities;
      facilities.forEach(f => {
        if (!f.fuelBuffer) return;
        const item = coreRuntime.dataService.getItem(f.facilityId);
        const usage = item?.machine?.usage;
        if (typeof usage === 'number' && usage > 0 && f.fuelBuffer.burnRate !== usage) {
          store.updateFacility(f.id, {
            fuelBuffer: { ...f.fuelBuffer, burnRate: usage },
          });
        }
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[ServiceInit] 校正设施燃料功率失败（可忽略）:', error);
      }
    }

    const researchService = container.resolve<ResearchService>(SERVICE_TOKENS.RESEARCH_SERVICE);
    researchService.setFacilitiesProvider(() => useGameStore.getState().facilities);

    const runtimePorts: GameLoopRuntimePorts = {
      recipeQuery: coreRuntime.recipeService,
    };
    const storeAdapter = this.createGameStoreAdapter();
    this.publishApplicationRuntimeContext(storeAdapter, runtimePorts);

    const defaultTasks = GameLoopTaskFactory.createAllDefaultTasks();
    defaultTasks.forEach(task => coreRuntime.gameLoopService.addTask(task));

    // Immediately sync task enabled/disabled states based on current game state.
    // Without this, tasks like FACILITIES (enabledByDefault: false) stay disabled for up
    // to 10 seconds after a save/load, causing facilities in output_full/running/no_resource
    // to not be processed and get stuck in their current state.
    GameLoopTaskFactory.updateTasksState(coreRuntime.gameLoopService.getTasks());

    if (!coreRuntime.gameLoopService.isRunningState()) {
      startGameLoop();
    }

    if (this.taskMonitorIntervalId !== null) {
      clearInterval(this.taskMonitorIntervalId);
    }
    this.taskMonitorIntervalId = setInterval(() => {
      GameLoopTaskFactory.updateTasksState(coreRuntime.gameLoopService.getTasks());
    }, 10000);
  }

  /**
   * 清理资源
   */
  static cleanup(): void {
    if (!this.initialized && this.initializationPromise === null) {
      return;
    }

    if (this.taskMonitorIntervalId !== null) {
      clearInterval(this.taskMonitorIntervalId);
      this.taskMonitorIntervalId = null;
    }

    if (container.hasInstance(SERVICE_TOKENS.GAME_LOOP_SERVICE)) {
      const gameLoopService = container.resolve<GameLoopService>(SERVICE_TOKENS.GAME_LOOP_SERVICE);
      gameLoopService.stop();
    }

    try {
      const { stopGameLoop } = useGameStore.getState();
      stopGameLoop();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[DIServiceInit] 游戏循环停止失败:', error);
      }
    }

    try {
      container.disposeInstances();
    } finally {
      resetAppRuntimeContext();
      this.initialized = false;
      this.initializationPromise = null;
    }
  }

  /**
   * 重置初始化状态（主要用于测试）
   */
  static reset(): void {
    this.cleanup();
    container.clear();
    resetAppRuntimeContext();
    this.initialized = false;
    this.servicesRegistered = false;
    this.initializationPromise = null;
  }

  /**
   * 获取服务实例
   */
  static getService<T>(token: string): T {
    return container.resolve<T>(token);
  }

  private static createGameStoreAdapter(): GameStoreAdapter {
    return {
      getCraftingQueueLength: () => useGameStore.getState().craftingQueue.length,
      hasFacilitiesWithStatus: (statuses: string[]) =>
        useGameStore.getState().facilities.some(f => statuses.includes(f.status)),
      hasActiveResearch: () => useGameStore.getState().researchState !== null,
      getCraftingQueue: () => useGameStore.getState().craftingQueue,
      updateCraftingProgress: (taskId, progress, startTime) =>
        useGameStore.getState().updateCraftingProgress(taskId, progress, startTime),
      updateInventory: (itemId, amount) => useGameStore.getState().updateInventory(itemId, amount),
      completeCraftingTask: taskId => useGameStore.getState().completeCraftingTask(taskId),
      trackMinedEntity: (itemId, count) => useGameStore.getState().trackMinedEntity(itemId, count),
      trackCraftedItem: (itemId, count) => useGameStore.getState().trackCraftedItem(itemId, count),
      getFacilities: () => useGameStore.getState().facilities,
      getInventoryItem: itemId => useGameStore.getState().getInventoryItem(itemId),
      updateFacility: (id, updates) => useGameStore.getState().updateFacility(id, updates),
      batchUpdateInventory: updates => useGameStore.getState().batchUpdateInventory(updates),
      updateFuelConsumption: dt => useGameStore.getState().updateFuelConsumption(dt),
      updateResearchProgress: dt => useGameStore.getState().updateResearchProgress(dt),
      updateGameLoopState: () => useGameStore.getState()._updateGameLoopState?.(),
      saveGame: () => useGameStore.getState().saveGame(),
    };
  }

  private static publishCoreRuntimeContext(coreRuntime: CoreRuntime): void {
    const storeRuntimeServices: StoreRuntimeServices = {
      dataQuery: coreRuntime.dataService,
      fuelService: coreRuntime.fuelService,
      gameLoopService: coreRuntime.gameLoopService,
      gameStorage: coreRuntime.gameStorageService,
      recipeQuery: coreRuntime.recipeService,
      technologyService: coreRuntime.technologyService,
    };

    updateAppRuntimeContext({
      inventoryDataQuery: coreRuntime.dataService,
      storageConfigQuery: coreRuntime.storageService,
      storeRuntimeServices,
      gameLoopRuntimePorts: {
        recipeQuery: coreRuntime.recipeService,
      },
    });
  }

  private static publishApplicationRuntimeContext(
    gameStoreAdapter: GameStoreAdapter,
    gameLoopRuntimePorts: GameLoopRuntimePorts
  ): void {
    updateAppRuntimeContext({
      gameStoreAdapter,
      gameLoopRuntimePorts,
    });
  }
}

// 导出便捷的服务获取函数
export const getService = <T>(token: string): T => {
  return DIServiceInitializer.getService<T>(token);
};
