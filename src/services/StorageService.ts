// 存储服务 - 合并data.json和特定配置

import type { StorageConfig } from '../types/index';
import { STORAGE_SPECIFIC_CONFIGS } from '../data/storageConfigData';
import { ServiceLocator, SERVICE_NAMES } from './ServiceLocator';
import type { DataService } from './DataService';

export class StorageService {
  private static instance: StorageService;

  private constructor() {
    // 延迟初始化，避免循环依赖
  }

  private getDataService(): DataService | null {
    if (ServiceLocator.has(SERVICE_NAMES.DATA)) {
      return ServiceLocator.get<DataService>(SERVICE_NAMES.DATA);
    }
    return null;
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // 获取完整的存储配置（合并data.json和特定配置）
  public getStorageConfig(storageType: string): StorageConfig | undefined {
    const specificConfig = STORAGE_SPECIFIC_CONFIGS[storageType];
    if (!specificConfig) return undefined;

    const dataService = this.getDataService();
    if (!dataService) return undefined;

    // 从data.json获取基础信息
    const item = dataService.getItem(storageType);
    const recipe = dataService.getRecipe(storageType);

    if (!item || !recipe) return undefined;

    return {
      itemId: storageType,
      name: this.getDataService()?.getLocalizedItemName(storageType) || storageType,
      category: specificConfig.category!,
      additionalStacks: specificConfig.additionalStacks,
      fluidCapacity: specificConfig.fluidCapacity,
      recipe: recipe.in,
      craftingTime: recipe.time,
      description: specificConfig.description || '',
      dimensions: specificConfig.dimensions,
      requiredTechnology: specificConfig.requiredTechnology,
    };
  }

  // 获取所有可用的存储类型
  public getAvailableStorageTypes(): string[] {
    return Object.keys(STORAGE_SPECIFIC_CONFIGS);
  }

  // 获取固体存储类型
  public getSolidStorageTypes(): string[] {
    return Object.keys(STORAGE_SPECIFIC_CONFIGS).filter(
      key => STORAGE_SPECIFIC_CONFIGS[key].category === 'solid'
    );
  }

  // 获取液体存储类型
  public getLiquidStorageTypes(): string[] {
    return Object.keys(STORAGE_SPECIFIC_CONFIGS).filter(
      key => STORAGE_SPECIFIC_CONFIGS[key].category === 'liquid'
    );
  }

  // 检查是否为存储设备
  public isStorageDevice(itemId: string): boolean {
    return itemId in STORAGE_SPECIFIC_CONFIGS;
  }

  // 获取存储设备的特定配置
  public getStorageSpecificConfig(storageType: string): Partial<StorageConfig> | undefined {
    return STORAGE_SPECIFIC_CONFIGS[storageType];
  }

  // 向后兼容的方法
  public getChestConfig(chestType: string): StorageConfig | undefined {
    return this.getStorageConfig(chestType);
  }

  public getAvailableChestTypes(): string[] {
    return this.getSolidStorageTypes();
  }
}

// 导出单例实例获取函数，避免循环依赖
export const getStorageService = () => StorageService.getInstance();
