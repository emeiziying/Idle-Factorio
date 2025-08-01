import { ServiceLocator, SERVICE_NAMES } from '@/services/core/ServiceLocator';
import { DataService } from '@/services/core/DataService';
import { RecipeService } from '@/services/crafting/RecipeService';
import { TechnologyService } from '@/services/technology/TechnologyService';
import { UserProgressService } from '@/services/game/UserProgressService';
import { FuelService } from '@/services/crafting/FuelService';
import { PowerService } from '@/services/game/PowerService';
import { StorageService } from '@/services/storage/StorageService';
import { GameStateAdapter } from '@/services/storage/GameStateAdapter';
import { GameLoopService } from '@/services/game/GameLoopService';
import { GameLoopTaskFactory } from '@/services/game/GameLoopTaskFactory';
import ManualCraftingValidator from '@/utils/manualCraftingValidator';
import useGameStore from '@/store/gameStore';

/**
 * 服务初始化器
 * 负责按正确顺序初始化所有服务并注册到服务定位器
 */
export class ServiceInitializer {
  private static initialized = false;
  private static initializationPromise: Promise<void> | null = null;

  /**
   * 初始化所有服务（带防重复保护）
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
    console.time('[ServiceInit] 总初始化时间');
    console.log('[ServiceInit] 开始服务初始化...');

    try {
      // 1. 首先初始化不依赖其他服务的基础服务
      console.time('[ServiceInit] 基础服务初始化');
      const userProgressService = UserProgressService.getInstance();
      ServiceLocator.register(SERVICE_NAMES.USER_PROGRESS, userProgressService);

      const storageService = StorageService.getInstance();
      ServiceLocator.register(SERVICE_NAMES.STORAGE, storageService);

      // 注册游戏状态适配器
      const gameStateAdapter = GameStateAdapter.getInstance();
      ServiceLocator.register(SERVICE_NAMES.GAME_STATE, gameStateAdapter);

      // 注册手动制作验证器
      const manualCraftingValidator = ManualCraftingValidator.getInstance();
      ServiceLocator.register(SERVICE_NAMES.MANUAL_CRAFTING_VALIDATOR, manualCraftingValidator);
      console.timeEnd('[ServiceInit] 基础服务初始化');

      // 2. 初始化数据服务（现在不再直接依赖其他服务）
      console.time('[ServiceInit] 数据服务注册');
      const dataService = DataService.getInstance();
      ServiceLocator.register(SERVICE_NAMES.DATA, dataService);
      console.timeEnd('[ServiceInit] 数据服务注册');

      // 3. 加载游戏数据 - 这是关键步骤
      console.time('[ServiceInit] 游戏数据加载');
      const gameData = await dataService.loadGameData();
      console.timeEnd('[ServiceInit] 游戏数据加载');
      console.log('[ServiceInit] 游戏数据加载完成');

      // 4. 初始化配方服务
      console.time('[ServiceInit] 配方服务初始化');
      const recipeService = RecipeService.getInstance();
      ServiceLocator.register(SERVICE_NAMES.RECIPE, recipeService);

      // 使用游戏数据初始化配方
      if (gameData.recipes) {
        RecipeService.initializeRecipes(gameData.recipes);
      }
      console.timeEnd('[ServiceInit] 配方服务初始化');

      // 5. 初始化其他服务
      console.time('[ServiceInit] 科技服务初始化');
      const technologyService = TechnologyService.getInstance();
      ServiceLocator.register(SERVICE_NAMES.TECHNOLOGY, technologyService);
      await technologyService.initialize();
      console.timeEnd('[ServiceInit] 科技服务初始化');

      console.time('[ServiceInit] 其他服务初始化');
      const fuelService = FuelService.getInstance();
      ServiceLocator.register(SERVICE_NAMES.FUEL, fuelService);

      const powerService = PowerService.getInstance();
      ServiceLocator.register(SERVICE_NAMES.POWER, powerService);
      console.timeEnd('[ServiceInit] 其他服务初始化');

      // 6. 应用层初始化
      console.time('[ServiceInit] 应用层初始化');
      await this.initializeApplication();
      console.timeEnd('[ServiceInit] 应用层初始化');

      this.initialized = true;
      console.log('[ServiceInit] 所有服务和应用层初始化完成');
    } catch (error) {
      console.error('[ServiceInit] 初始化失败:', error);
      throw error;
    } finally {
      console.timeEnd('[ServiceInit] 总初始化时间');
    }
  }

  /**
   * 初始化应用层（gameStore同步和游戏循环）
   */
  private static async initializeApplication(): Promise<void> {
    try {
      // 1. 同步科技数据到gameStore（确保科技数据可用）
      console.time('[ServiceInit] 科技数据同步');
      const { initializeTechnologyService } = useGameStore.getState();
      await initializeTechnologyService();
      console.timeEnd('[ServiceInit] 科技数据同步');

      // 2. 启动游戏循环系统
      console.time('[ServiceInit] 游戏循环启动');
      const gameLoopService = GameLoopService.getInstance();

      // 添加所有游戏系统任务
      const defaultTasks = GameLoopTaskFactory.createAllDefaultTasks();
      defaultTasks.forEach(task => gameLoopService.addTask(task));

      // 启动游戏循环
      gameLoopService.start();

      // 同时启动gameStore的游戏循环状态管理
      const { startGameLoop } = useGameStore.getState();
      startGameLoop();
      console.timeEnd('[ServiceInit] 游戏循环启动');

      console.log('[ServiceInit] 应用层初始化完成，游戏已就绪');
    } catch (error) {
      console.error('[ServiceInit] 应用层初始化失败:', error);
      throw error;
    }
  }

  /**
   * 重置初始化状态（主要用于测试）
   */
  static reset(): void {
    ServiceLocator.clear();
    this.initialized = false;
    this.initializationPromise = null;
  }

  /**
   * 检查是否已初始化
   */
  static isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 清理资源（主要用于应用卸载）
   */
  static cleanup(): void {
    try {
      console.log('[ServiceInit] 开始清理资源...');

      // 停止游戏循环
      const gameLoopService = GameLoopService.getInstance();
      gameLoopService.stop();

      // 停止gameStore的游戏循环状态管理
      const { stopGameLoop } = useGameStore.getState();
      stopGameLoop();

      console.log('[ServiceInit] 资源清理完成');
    } catch (error) {
      console.error('[ServiceInit] 资源清理失败:', error);
    }
  }
}
