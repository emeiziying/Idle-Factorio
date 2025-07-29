// 存储配置辅助函数

import type { StorageConfig } from '../types/index';
import { ServiceLocator, SERVICE_NAMES } from '../services/ServiceLocator';
import { StorageService } from '../services/game/StorageService';

// 重新导出存储配置数据
export { STORAGE_SPECIFIC_CONFIGS } from './storageConfigData';

// 获取StorageService实例
const getStorageService = (): StorageService | null => {
  try {
    if (ServiceLocator.has(SERVICE_NAMES.STORAGE)) {
      return ServiceLocator.get<StorageService>(SERVICE_NAMES.STORAGE) as StorageService;
    }
    return StorageService.getInstance() as StorageService;
  } catch {
    return null;
  }
};

// 获取完整的存储配置（使用StorageService）
export const getStorageConfig = (storageType: string): StorageConfig | undefined => {
  const service = getStorageService();
  return service ? service.getStorageConfig(storageType) : undefined;
};

// 获取所有可用的存储类型
export const getAvailableStorageTypes = (): string[] => {
  const service = getStorageService();
  return service ? service.getAllStorageConfigs().map(config => config.itemId) : [];
};

// 获取固体存储类型
export const getSolidStorageTypes = (): string[] => {
  const service = getStorageService();
  return service ? service.getStorageConfigsByCategory('solid').map(config => config.itemId) : [];
};

// 获取液体存储类型
export const getLiquidStorageTypes = (): string[] => {
  const service = getStorageService();
  return service ? service.getStorageConfigsByCategory('liquid').map(config => config.itemId) : [];
};

// 向后兼容的函数
export const getChestConfig = (chestType: string): StorageConfig | undefined => {
  const service = getStorageService();
  return service ? service.getStorageConfig(chestType) : undefined;
};

export const getAvailableChestTypes = (): string[] => {
  const service = getStorageService();
  return service ? service.getAllStorageConfigs().map(config => config.itemId) : [];
};

// 导出 getStorageService 供组件使用
export { getStorageService }; 