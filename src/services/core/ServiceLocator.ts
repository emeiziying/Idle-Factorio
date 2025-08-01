/**
 * 服务定位器
 * 用于管理和获取服务实例，避免循环依赖
 */
export class ServiceLocator {
  private static services = new Map<string, unknown>();

  /**
   * 注册服务
   */
  static register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  /**
   * 获取服务
   */
  static get<T>(name: string): T {
    if (!this.services.has(name)) {
      throw new Error(`Service ${name} not found. Make sure it's registered.`);
    }
    return this.services.get(name) as T;
  }

  /**
   * 检查服务是否已注册
   */
  static has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * 清空所有服务（用于测试）
   */
  static clear(): void {
    this.services.clear();
  }
}

// 服务名称常量
export const SERVICE_NAMES = {
  DATA: 'DataService',
  RECIPE: 'RecipeService',
  TECHNOLOGY: 'TechnologyService',
  USER_PROGRESS: 'UserProgressService',
  FUEL: 'FuelService',
  POWER: 'PowerService',
  STORAGE: 'StorageService',
  GAME_STATE: 'GameStateProvider',
  MANUAL_CRAFTING_VALIDATOR: 'ManualCraftingValidator',
} as const;
