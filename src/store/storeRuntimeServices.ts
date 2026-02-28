import {
  getStoreRuntimeServices as getRuntimeStoreRuntimeServices,
  updateAppRuntimeContext,
  type StoreRuntimeServices,
} from '@/services/core/AppRuntimeContext';

type StoreDataQuery = StoreRuntimeServices['dataQuery'];
type StoreFuelService = StoreRuntimeServices['fuelService'];
type StoreGameLoopService = StoreRuntimeServices['gameLoopService'];
type StoreGameStorage = StoreRuntimeServices['gameStorage'];
type StoreRecipeQuery = StoreRuntimeServices['recipeQuery'];
type StoreTechnologyService = StoreRuntimeServices['technologyService'];

export const setStoreRuntimeServices = (services: StoreRuntimeServices): void => {
  updateAppRuntimeContext({ storeRuntimeServices: services });
};

export const resetStoreRuntimeServices = (): void => {
  updateAppRuntimeContext({ storeRuntimeServices: null });
};

const getStoreRuntimeServices = (): StoreRuntimeServices => getRuntimeStoreRuntimeServices();

export const getStoreDataQuery = (): StoreDataQuery => getStoreRuntimeServices().dataQuery;
export const getStoreFuelService = (): StoreFuelService => getStoreRuntimeServices().fuelService;
export const getStoreGameLoopService = (): StoreGameLoopService =>
  getStoreRuntimeServices().gameLoopService;
export const getStoreGameStorage = (): StoreGameStorage => getStoreRuntimeServices().gameStorage;
export const getStoreRecipeQuery = (): StoreRecipeQuery => getStoreRuntimeServices().recipeQuery;
export const getStoreTechnologyService = (): StoreTechnologyService =>
  getStoreRuntimeServices().technologyService;

export type { StoreRuntimeServices };
