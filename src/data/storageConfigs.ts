// 存储配置辅助函数

import type { StorageConfig } from '@/types/index';
import { getService } from '@/services/core/DIServiceInitializer';
import { SERVICE_TOKENS } from '@/services/core/ServiceTokens';
import type { StorageService } from '@/services/storage/StorageService';

// 重新导出存储配置数据
export { STORAGE_SPECIFIC_CONFIGS } from './storageConfigData';

// 获取StorageService实例
const getStorageService = (): StorageService => {
  return getService<StorageService>(SERVICE_TOKENS.STORAGE_SERVICE);
};

// 获取完整的存储配置（使用StorageService）
export const getStorageConfig = (storageType: string): StorageConfig | undefined => {
  const service = getStorageService();
  return service.getStorageConfig(storageType);
};

// 获取所有可用的存储类型
export const getAvailableStorageTypes = (): string[] => {
  const service = getStorageService();
  return service.getAvailableStorageTypes();
};

// 获取固体存储类型
export const getSolidStorageTypes = (): string[] => {
  const service = getStorageService();
  return service.getSolidStorageTypes();
};

// 获取液体存储类型
export const getLiquidStorageTypes = (): string[] => {
  const service = getStorageService();
  return service.getLiquidStorageTypes();
};

// 向后兼容的函数
export const getChestConfig = (chestType: string): StorageConfig | undefined => {
  const service = getStorageService();
  return service.getChestConfig(chestType);
};

export const getAvailableChestTypes = (): string[] => {
  const service = getStorageService();
  return service.getAvailableChestTypes();
};
