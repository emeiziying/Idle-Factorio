import { ServiceLocator, SERVICE_NAMES } from './ServiceLocator';
import { DataService } from './DataService';
import { RecipeService } from '../crafting/RecipeService';
import { TechnologyService } from '../technology/TechnologyService';
import { UserProgressService } from '../game/UserProgressService';
import { FuelService } from '../crafting/FuelService';
import { PowerService } from '../game/PowerService';
import { StorageService } from '../storage/StorageService';
import { GameStateAdapter } from '../storage/GameStateAdapter';
import ManualCraftingValidator from '../../utils/manualCraftingValidator';

/**
 * 服务初始化器
 * 负责按正确顺序初始化所有服务并注册到服务定位器
 */
export class ServiceInitializer {
  private static initialized = false;

  /**
   * 初始化所有服务
   */
  static async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // 1. 首先初始化不依赖其他服务的基础服务
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

    // 2. 初始化数据服务（现在不再直接依赖其他服务）
    const dataService = DataService.getInstance();
    ServiceLocator.register(SERVICE_NAMES.DATA, dataService);

    // 3. 加载游戏数据
    const gameData = await dataService.loadGameData();

    // 4. 初始化配方服务
    const recipeService = RecipeService.getInstance();
    ServiceLocator.register(SERVICE_NAMES.RECIPE, recipeService);

    // 使用游戏数据初始化配方
    if (gameData.recipes) {
      RecipeService.initializeRecipes(gameData.recipes);
    }

    // 5. 初始化其他服务
    const technologyService = TechnologyService.getInstance();
    ServiceLocator.register(SERVICE_NAMES.TECHNOLOGY, technologyService);
    await technologyService.initialize();

    const fuelService = FuelService.getInstance();
    ServiceLocator.register(SERVICE_NAMES.FUEL, fuelService);

    const powerService = PowerService.getInstance();
    ServiceLocator.register(SERVICE_NAMES.POWER, powerService);

    this.initialized = true;
  }

  /**
   * 重置初始化状态（主要用于测试）
   */
  static reset(): void {
    ServiceLocator.clear();
    this.initialized = false;
  }

  /**
   * 检查是否已初始化
   */
  static isInitialized(): boolean {
    return this.initialized;
  }
}
