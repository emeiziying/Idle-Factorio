// 存储服务 - 合并data.json和特定配置

import type { StorageConfig } from '@/types/index';
import { STORAGE_SPECIFIC_CONFIGS } from '@/data/storageConfigData';
import { getService } from '@/services/core/DIServiceInitializer';
import { SERVICE_TOKENS } from '@/services/core/ServiceTokens';
import type { DataService } from '@/services/core/DataService';

export class StorageService {
  constructor() {
    // 延迟初始化，避免循环依赖
  }

  private getDataService(): DataService | null {
    try {
      return getService<DataService>(SERVICE_TOKENS.DATA_SERVICE);
    } catch {
      return null;
    }
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

// 兼容性函数 - 从 DI 容器获取 StorageService 实例
export const getStorageService = (): StorageService | null => {
  try {
    return getService<StorageService>(SERVICE_TOKENS.STORAGE_SERVICE);
  } catch {
    return null;
  }
};
