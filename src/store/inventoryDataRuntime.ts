import {
  getInventoryDataQuery as getRuntimeInventoryDataQuery,
  updateAppRuntimeContext,
  type InventoryDataQuery,
} from '@/services/core/AppRuntimeContext';

export const setInventoryDataQuery = (query: InventoryDataQuery): void => {
  updateAppRuntimeContext({ inventoryDataQuery: query });
};

export const resetInventoryDataQuery = (): void => {
  updateAppRuntimeContext({ inventoryDataQuery: null });
};

export const getInventoryDataQuery = (): InventoryDataQuery => getRuntimeInventoryDataQuery();

export type { InventoryDataQuery };
