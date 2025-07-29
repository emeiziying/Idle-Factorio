/**
 * 燃料服务（重构版本）
 * 展示如何使用BaseService减少重复代码
 */
import { BaseService } from '../base/BaseService';
import type { GameConfig } from '../GameConfig';

interface FuelInfo {
  id: string;
  name: string;
  fuelValue: number;
  pollution: number;
  accelerationMultiplier?: number;
  topSpeedMultiplier?: number;
}





export class RefactoredFuelService extends BaseService {
  private gameConfig?: GameConfig;
  private customFuelPriority: string[] | null = null;
  
  // 声明依赖
  protected dependencies = ['GameConfig'];

  protected constructor() {
    super();
    
    // 从存储加载自定义优先级
    this.customFuelPriority = this.loadFromStorage<string[]>('fuelPriority');
  }

  /**
   * 初始化依赖（重写父类方法）
   */
  protected initializeDependencies(): void {
    super.initializeDependencies();
    
    // 使用父类的依赖注入
    this.injectDependencies({
      gameConfig: 'GameConfig'
    });
  }

  /**
   * 设置自定义燃料优先级
   */
  setFuelPriority(priority: string[]): void {
    this.safe(() => {
      this.customFuelPriority = priority;
      this.saveToStorage(priority, 'fuelPriority');
    }, 'setFuelPriority');
  }

  /**
   * 获取当前燃料优先级
   */
  getFuelPriority(): string[] {
    return this.safe(() => {
      if (this.customFuelPriority) {
        return this.customFuelPriority;
      }
      
      // 使用默认优先级
      return this.gameConfig?.getFuelPriority() || [];
    }, 'getFuelPriority', []);
  }

  /**
   * 获取燃料信息
   */
  getFuelInfo(itemId: string): FuelInfo | null {
    return this.safe(() => {
      const item = this.dataService?.getItem(itemId);
      if (!item?.fuel_value) return null;

      return {
        id: item.id,
        name: item.name,
        fuelValue: parseFloat(item.fuel_value),
        pollution: item.fuel_emissions_multiplier || 1,
        accelerationMultiplier: item.fuel_acceleration_multiplier,
        topSpeedMultiplier: item.fuel_top_speed_multiplier
      };
    }, 'getFuelInfo', null);
  }

  /**
   * 获取所有燃料物品
   */
  getAllFuels(): FuelInfo[] {
    return this.safe(() => {
      const items = this.dataService?.getAllItems() || [];
      return items
        .filter(item => item.fuel_value && parseFloat(item.fuel_value) > 0)
        .map(item => ({
          id: item.id,
          name: item.name,
          fuelValue: parseFloat(item.fuel_value!),
          pollution: item.fuel_emissions_multiplier || 1,
          accelerationMultiplier: item.fuel_acceleration_multiplier,
          topSpeedMultiplier: item.fuel_top_speed_multiplier
        }))
        .sort((a, b) => b.fuelValue - a.fuelValue);
    }, 'getAllFuels', []);
  }

  /**
   * 检查物品是否可作为燃料
   */
  isFuel(itemId: string): boolean {
    return this.safe(() => {
      const item = this.dataService?.getItem(itemId);
      return !!(item?.fuel_value && parseFloat(item.fuel_value) > 0);
    }, 'isFuel', false);
  }

  /**
   * 获取推荐的燃料
   */
  getRecommendedFuel(availableFuels: string[]): string | null {
    return this.safe(() => {
      const priority = this.getFuelPriority();
      
      // 按优先级查找
      for (const fuelId of priority) {
        if (availableFuels.includes(fuelId)) {
          return fuelId;
        }
      }
      
      // 如果没有匹配优先级，选择燃烧值最高的
      const fuels = availableFuels
        .map(id => this.getFuelInfo(id))
        .filter(info => info !== null)
        .sort((a, b) => b!.fuelValue - a!.fuelValue);
      
      return fuels[0]?.id || null;
    }, 'getRecommendedFuel', null);
  }

  /**
   * 计算燃料消耗
   */
  calculateFuelConsumption(facilityId: string, recipe?: any): number {
    return this.safe(() => {
      const facility = this.dataService?.getItem(facilityId);
      if (!facility?.energy_source?.type) return 0;

      const baseConsumption = facility.energy_source.usage_priority || 1;
      const recipeFactor = recipe?.energy_required || 1;
      
      return baseConsumption * recipeFactor;
    }, 'calculateFuelConsumption', 0);
  }

  /**
   * 获取服务状态信息（重写父类方法）
   */
  getServiceInfo() {
    const baseInfo = super.getServiceInfo();
    return {
      ...baseInfo,
      storageKeys: ['fuelPriority'],
      customSettings: {
        hasFuelPriority: !!this.customFuelPriority,
        priorityCount: this.customFuelPriority?.length || 0
      }
    };
  }

  /**
   * 健康检查（重写父类方法）
   */
  async healthCheck() {
    const fuels = this.getAllFuels();
    return {
      healthy: fuels.length > 0,
      message: `Found ${fuels.length} fuel types`
    };
  }
}