/**
 * 存储服务（重构版）
 * 使用 BaseService 架构
 */
import { BaseService } from '../base/BaseService';
import type { StorageConfig } from '../../types/index';
import { STORAGE_SPECIFIC_CONFIGS } from '../../data/storageConfigData';
import { ServiceLocator } from '../ServiceLocator';
import type { DataService } from '../core/DataService';

/**
 * 存储系统服务类
 * 负责管理存储配置和存储类型信息
 */
export class StorageService extends BaseService {
  protected declare dataService?: DataService;
  
  constructor() {
    super();
    this.serviceName = 'StorageService';
    this.dependencies = ['DataService'];
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    // 获取依赖服务
    this.dataService = ServiceLocator.get<DataService>('DataService');
  }

  /**
   * 获取完整的存储配置（合并data.json和特定配置）
   */
  public getStorageConfig(storageType: string): StorageConfig | undefined {
    return this.safe(() => {
      const specificConfig = STORAGE_SPECIFIC_CONFIGS[storageType];
      if (!specificConfig) return undefined;

      if (!this.dataService) return undefined;

      // 从data.json获取基础信息
      const item = this.dataService.getItem(storageType);
      const recipe = this.dataService.getRecipe(storageType);

      if (!item || !recipe) return undefined;

      return {
        itemId: storageType,
        name: this.dataService.getLocalizedItemName(storageType) || storageType,
        category: specificConfig.category!,
        additionalStacks: specificConfig.additionalStacks,
        fluidCapacity: specificConfig.fluidCapacity,
        recipe: recipe.in,
        craftingTime: recipe.time,
        description: specificConfig.description || '',
        dimensions: specificConfig.dimensions,
        requiredTechnology: specificConfig.requiredTechnology
      };
    }, 'getStorageConfig', undefined);
  }

  /**
   * 获取所有可用的存储类型
   */
  public getAvailableStorageTypes(): string[] {
    return this.safe(() => {
      return Object.keys(STORAGE_SPECIFIC_CONFIGS);
    }, 'getAvailableStorageTypes', []);
  }

  /**
   * 获取固体存储类型
   */
  public getSolidStorageTypes(): string[] {
    return this.safe(() => {
      return Object.keys(STORAGE_SPECIFIC_CONFIGS).filter(
        key => STORAGE_SPECIFIC_CONFIGS[key].category === 'solid'
      );
    }, 'getSolidStorageTypes', []);
  }

  /**
   * 获取液体存储类型
   */
  public getLiquidStorageTypes(): string[] {
    return this.safe(() => {
      return Object.keys(STORAGE_SPECIFIC_CONFIGS).filter(
        key => STORAGE_SPECIFIC_CONFIGS[key].category === 'liquid'
      );
    }, 'getLiquidStorageTypes', []);
  }

  /**
   * 检查是否为存储设备
   */
  public isStorageDevice(itemId: string): boolean {
    return this.safe(() => {
      return itemId in STORAGE_SPECIFIC_CONFIGS;
    }, 'isStorageDevice', false);
  }

  /**
   * 获取存储设备的特定配置
   */
  public getStorageSpecificConfig(storageType: string): Partial<StorageConfig> | undefined {
    return this.safe(() => {
      return STORAGE_SPECIFIC_CONFIGS[storageType];
    }, 'getStorageSpecificConfig', undefined);
  }

  /**
   * 向后兼容的方法 - 获取箱子配置
   */
  public getChestConfig(chestType: string): StorageConfig | undefined {
    return this.getStorageConfig(chestType);
  }

  /**
   * 向后兼容的方法 - 获取可用的箱子类型
   */
  public getAvailableChestTypes(): string[] {
    return this.getSolidStorageTypes();
  }

  /**
   * 获取存储容量（格子数或液体容量）
   */
  public getStorageCapacity(storageType: string): number {
    return this.safe(() => {
      const config = STORAGE_SPECIFIC_CONFIGS[storageType];
      if (!config) return 0;
      
      if (config.category === 'solid' && config.additionalStacks) {
        // 固体存储：返回格子数
        return config.additionalStacks;
      } else if (config.category === 'liquid' && config.fluidCapacity) {
        // 液体存储：返回容量
        return config.fluidCapacity;
      }
      
      return 0;
    }, 'getStorageCapacity', 0);
  }

  /**
   * 获取按类别分组的存储类型
   */
  public getStorageTypesByCategory(): Record<string, string[]> {
    return this.safe(() => {
      const result: Record<string, string[]> = {
        solid: [],
        liquid: []
      };
      
      Object.entries(STORAGE_SPECIFIC_CONFIGS).forEach(([type, config]) => {
        if (config.category) {
          result[config.category].push(type);
        }
      });
      
      return result;
    }, 'getStorageTypesByCategory', { solid: [], liquid: [] });
  }

  // ========== 服务信息 ==========

  getServiceInfo() {
    return {
      ...super.getServiceInfo(),
      storageKeys: []
    };
  }

  async healthCheck() {
    const isHealthy = !!this.dataService;
    const storageTypeCount = Object.keys(STORAGE_SPECIFIC_CONFIGS).length;
    return {
      healthy: isHealthy,
      message: isHealthy ? `Service is running with ${storageTypeCount} storage types` : 'Dependencies not loaded'
    };
  }
}

// 导出单例实例以保持向后兼容
export const storageService = StorageService.getInstance();

// 导出获取服务的函数，避免循环依赖
export const getStorageService = () => StorageService.getInstance();