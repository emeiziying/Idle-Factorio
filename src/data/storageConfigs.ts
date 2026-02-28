// 存储配置辅助函数

import type { StorageConfig } from '@/types/index';
import { getStorageConfigQuery } from '@/data/storageConfigRuntime';

// 重新导出存储配置数据
export { STORAGE_SPECIFIC_CONFIGS } from './storageConfigData';

// 获取完整的存储配置（使用StorageService）
export const getStorageConfig = (storageType: string): StorageConfig | undefined => {
  const service = getStorageConfigQuery();
  return service.getStorageConfig(storageType);
};

// 获取所有可用的存储类型
export const getAvailableStorageTypes = (): string[] => {
  const service = getStorageConfigQuery();
  return service.getAvailableStorageTypes();
};

// 获取固体存储类型
export const getSolidStorageTypes = (): string[] => {
  const service = getStorageConfigQuery();
  return service.getSolidStorageTypes();
};

// 获取液体存储类型
export const getLiquidStorageTypes = (): string[] => {
  const service = getStorageConfigQuery();
  return service.getLiquidStorageTypes();
};

// 向后兼容的函数
export const getChestConfig = (chestType: string): StorageConfig | undefined => {
  const service = getStorageConfigQuery();
  return service.getChestConfig(chestType);
};

export const getAvailableChestTypes = (): string[] => {
  const service = getStorageConfigQuery();
  return service.getAvailableChestTypes();
};
