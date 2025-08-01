import { ServiceLocator, SERVICE_NAMES } from '@/services/core/ServiceLocator';
import { DataService } from '@/services/core/DataService';
import { GameConfig } from '@/services/core/GameConfig';
import { RecipeService } from '@/services/crafting/RecipeService';
import { TechnologyService } from '@/services/technology/TechnologyService';
import { UserProgressService } from '@/services/game/UserProgressService';
import { FuelService } from '@/services/crafting/FuelService';
import { PowerService } from '@/services/game/PowerService';
import { StorageService } from '@/services/storage/StorageService';
import { GameLoopService } from '@/services/game/GameLoopService';
import { GameLoopTaskFactory } from '@/services/game/GameLoopTaskFactory';
import ManualCraftingValidator from '@/utils/manualCraftingValidator';
import useGameStore from '@/store/gameStore';

/**
 * 服务初始化器
 *
 * 负责按照正确的依赖顺序初始化所有游戏服务并注册到服务定位器中。
 * 确保系统的各个组件能够正确协同工作。
 *
 * 初始化顺序：
 * 1. 基础服务（UserProgress、Storage、ManualCraftingValidator等）
 * 2. 数据服务（DataService）
 * 3. 游戏数据加载
 * 4. 配方服务（RecipeService）
 * 5. 科技服务（TechnologyService）
 * 6. 其他业务服务（Fuel、Power等）
 * 7. 应用层初始化（游戏循环、状态同步）
 */
export class ServiceInitializer {
  private static initialized = false;
  private static initializationPromise: Promise<void> | null = null;

  /**
   * 初始化所有服务
   *
   * 提供防重复初始化保护，确保服务只被初始化一次。
   * 如果多个地方同时调用此方法，会返回同一个初始化Promise。
   *
   * @returns Promise<void> 初始化完成的Promise
   * @throws Error 如果初始化过程中发生错误
   */
  static async initialize(): Promise<void> {
    // 如果已经初始化完成，直接返回
    if (this.initialized) {
      return;
    }

    // 如果正在初始化中，返回同一个Promise
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // 开始新的初始化过程
    this.initializationPromise = this.doInitialize();

    try {
      await this.initializationPromise;
    } finally {
      // 初始化完成后清除Promise缓存
      this.initializationPromise = null;
    }
  }

  /**
   * 执行实际的初始化过程
   */
  private static async doInitialize(): Promise<void> {
    // 1. 初始化基础服务层
    // 这些服务不依赖其他服务，可以优先初始化
    const userProgressService = new UserProgressService();
    ServiceLocator.register(SERVICE_NAMES.USER_PROGRESS, userProgressService);

    const storageService = new StorageService();
    ServiceLocator.register(SERVICE_NAMES.STORAGE, storageService);

    // 注册手动制作验证器 - 负责制作逻辑验证
    const manualCraftingValidator = new ManualCraftingValidator();
    ServiceLocator.register(SERVICE_NAMES.MANUAL_CRAFTING_VALIDATOR, manualCraftingValidator);

    // 2. 初始化数据服务
    // DataService 是核心服务，负责游戏数据的加载和管理
    const dataService = new DataService();
    ServiceLocator.register(SERVICE_NAMES.DATA, dataService);

    // 3. 加载游戏数据
    // 这是关键步骤，所有业务逻辑都依赖于游戏数据
    const gameData = await dataService.loadGameData();

    // 4. 初始化配方服务
    // 依赖游戏数据，负责配方分析和制作逻辑
    const recipeService = new RecipeService();
    ServiceLocator.register(SERVICE_NAMES.RECIPE, recipeService);

    // 使用加载的游戏数据初始化配方系统
    if (gameData.recipes) {
      recipeService.initializeRecipes(gameData.recipes);
    }

    // 5. 初始化科技服务
    // 负责科技树管理和研究进度跟踪
    const technologyService = new TechnologyService();
    ServiceLocator.register(SERVICE_NAMES.TECHNOLOGY, technologyService);
    await technologyService.initialize();

    // 6. 初始化其他业务服务
    // 这些服务提供特定的游戏功能支持
    // GameConfig is still singleton, so get instance
    const gameConfig = new GameConfig(dataService);
    const fuelService = new FuelService(dataService, gameConfig, recipeService);
    ServiceLocator.register(SERVICE_NAMES.FUEL, fuelService);

    const powerService = new PowerService(dataService, gameConfig);
    ServiceLocator.register(SERVICE_NAMES.POWER, powerService);

    // 7. 应用层初始化
    // 启动游戏循环和状态同步系统
    await this.initializeApplication();

    this.initialized = true;
  }

  /**
   * 初始化应用层
   *
   * 负责启动游戏循环系统和状态同步，确保游戏能够正常运行。
   * 包括科技数据同步、游戏循环启动和任务状态监控。
   *
   * @private
   * @returns Promise<void> 应用层初始化完成的Promise
   * @throws Error 如果应用层初始化失败
   */
  private static async initializeApplication(): Promise<void> {
    // 1. 同步科技数据到游戏状态存储
    // 确保前端状态与后端服务数据保持一致
    const { initializeTechnologyService } = useGameStore.getState();
    await initializeTechnologyService();

    // 2. 启动游戏循环系统
    const gameLoopService = new GameLoopService();

    // 添加所有默认的游戏系统任务（生产、制作、研究等）
    const defaultTasks = GameLoopTaskFactory.createAllDefaultTasks();
    defaultTasks.forEach(task => gameLoopService.addTask(task));

    // 启动底层游戏循环服务
    gameLoopService.start();

    // 启动状态管理层的游戏循环控制器
    const { startGameLoop } = useGameStore.getState();
    startGameLoop();

    // 设置任务状态监控定时器（每10秒更新一次任务执行状态）
    setInterval(() => {
      GameLoopTaskFactory.updateTasksState(gameLoopService['tasks']);
    }, 10000);
  }

  /**
   * 重置初始化状态
   *
   * 清除所有已注册的服务和初始化状态，主要用于测试环境。
   * 在生产环境中谨慎使用。
   */
  static reset(): void {
    ServiceLocator.clear();
    this.initialized = false;
    this.initializationPromise = null;
  }

  /**
   * 检查服务是否已完成初始化
   *
   * @returns boolean 如果所有服务都已初始化完成返回true，否则返回false
   */
  static isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 清理系统资源
   *
   * 在应用卸载或页面关闭时调用，负责停止游戏循环和清理相关资源，
   * 防止内存泄漏和后台任务继续执行。
   */
  static cleanup(): void {
    try {
      // 停止底层游戏循环服务
      // Note: We would need to track the gameLoopService instance to stop it
      // For now, we'll skip this cleanup as it requires architectural changes

      // 停止状态管理层的游戏循环控制器
      const { stopGameLoop } = useGameStore.getState();
      stopGameLoop();
    } catch (error) {
      // 清理过程中的错误不应该阻断应用卸载
      // 在开发环境下可以输出错误信息用于调试
      if (import.meta.env.DEV) {
        console.error('[ServiceInit] 资源清理失败:', error);
      }
    }
  }
}
