import {
  getStorageConfigQuery as getRuntimeStorageConfigQuery,
  updateAppRuntimeContext,
  type StorageConfigQuery,
} from '@/services/core/AppRuntimeContext';

export const setStorageConfigQuery = (query: StorageConfigQuery): void => {
  updateAppRuntimeContext({ storageConfigQuery: query });
};

export const resetStorageConfigQuery = (): void => {
  updateAppRuntimeContext({ storageConfigQuery: null });
};

export const getStorageConfigQuery = (): StorageConfigQuery => getRuntimeStorageConfigQuery();

export type { StorageConfigQuery };
