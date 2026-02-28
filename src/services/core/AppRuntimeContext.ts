import type { FuelService } from '@/services/crafting/FuelService';
import type { RecipeService } from '@/services/crafting/RecipeService';
import type { DataService } from '@/services/core/DataService';
import type { GameLoopService } from '@/services/game/GameLoopService';
import type { GameStorageService } from '@/services/storage/GameStorageService';
import type { StorageService } from '@/services/storage/StorageService';
import type { FacilityInstance } from '@/types/facilities';
import type { CraftingTask, InventoryItem } from '@/types/index';
import type { TechnologyService } from '@/services/technology/TechnologyService';

export type StorageConfigQuery = Pick<
  StorageService,
  | 'getStorageConfig'
  | 'getAvailableStorageTypes'
  | 'getSolidStorageTypes'
  | 'getLiquidStorageTypes'
  | 'getChestConfig'
  | 'getAvailableChestTypes'
>;

export type InventoryDataQuery = Pick<DataService, 'getItem'>;

type StoreDataQuery = Pick<DataService, 'getRecipe' | 'getItemsByRow'>;
type StoreFuelService = Pick<
  FuelService,
  | 'initializeFuelBuffer'
  | 'addFuel'
  | 'smartFuelDistribution'
  | 'updateFuelConsumption'
  | 'getFuelPriority'
  | 'isFuelCompatible'
>;
type StoreGameLoopService = Pick<
  GameLoopService,
  | 'enableTask'
  | 'disableTask'
  | 'start'
  | 'stop'
  | 'pause'
  | 'resume'
  | 'updateConfig'
  | 'setPerformanceLevel'
  | 'getStats'
  | 'getConfig'
  | 'isRunningState'
  | 'isPausedState'
>;
type StoreGameStorage = Pick<
  GameStorageService,
  'clearGameData' | 'saveGame' | 'loadGame' | 'forceSaveGame'
>;
type StoreRecipeQuery = Pick<
  RecipeService,
  | 'getRecipeById'
  | 'getUnlockedRecipesThatProduce'
  | 'getUnlockedMostEfficientRecipe'
  | 'getRecipeStats'
  | 'searchRecipes'
  | 'getAllRecipes'
>;
type StoreTechnologyService = Pick<
  TechnologyService,
  | 'setInventoryOperations'
  | 'hydrateState'
  | 'getAllTechnologies'
  | 'getTechTreeState'
  | 'getTechCategories'
  | 'startResearch'
  | 'getCurrentResearch'
  | 'getResearchQueue'
  | 'completeResearch'
  | 'addToResearchQueue'
  | 'removeFromResearchQueue'
  | 'reorderResearchQueue'
  | 'setAutoResearch'
  | 'isTechAvailable'
  | 'updateResearchProgress'
>;

export interface StoreRuntimeServices {
  dataQuery: StoreDataQuery;
  fuelService: StoreFuelService;
  gameLoopService: StoreGameLoopService;
  gameStorage: StoreGameStorage;
  recipeQuery: StoreRecipeQuery;
  technologyService: StoreTechnologyService;
}

export interface GameStoreAdapter {
  getCraftingQueueLength: () => number;
  hasFacilitiesWithStatus: (statuses: string[]) => boolean;
  hasActiveResearch: () => boolean;
  getCraftingQueue: () => CraftingTask[];
  updateCraftingProgress: (taskId: string, progress: number, startTime?: number) => void;
  updateInventory: (itemId: string, amount: number) => void;
  completeCraftingTask: (taskId: string) => void;
  trackMinedEntity: (itemId: string, count: number) => void;
  getFacilities: () => FacilityInstance[];
  getInventoryItem: (itemId: string) => InventoryItem;
  updateFacility: (id: string, updates: Partial<FacilityInstance>) => void;
  batchUpdateInventory: (updates: Array<{ itemId: string; amount: number }>) => void;
  updateFuelConsumption: (deltaTime: number) => void;
  updateResearchProgress: (deltaTime: number) => void;
  updateGameLoopState?: () => void;
  saveGame: () => void;
}

export interface GameLoopRuntimePorts {
  recipeQuery: Pick<RecipeService, 'getRecipeById'>;
}

interface AppRuntimeContextState {
  storageConfigQuery: StorageConfigQuery | null;
  inventoryDataQuery: InventoryDataQuery | null;
  storeRuntimeServices: StoreRuntimeServices | null;
  gameStoreAdapter: GameStoreAdapter | null;
  gameLoopRuntimePorts: GameLoopRuntimePorts | null;
}

const createDefaultState = (): AppRuntimeContextState => ({
  storageConfigQuery: null,
  inventoryDataQuery: null,
  storeRuntimeServices: null,
  gameStoreAdapter: null,
  gameLoopRuntimePorts: null,
});

let runtimeContext: AppRuntimeContextState = createDefaultState();

export const updateAppRuntimeContext = (
  partial: Partial<AppRuntimeContextState>
): AppRuntimeContextState => {
  runtimeContext = {
    ...runtimeContext,
    ...partial,
  };
  return runtimeContext;
};

export const resetAppRuntimeContext = (): void => {
  runtimeContext = createDefaultState();
};

const getRequiredRuntimeValue = <T>(value: T | null, message: string): T => {
  if (!value) {
    throw new Error(message);
  }

  return value;
};

export const getStorageConfigQuery = (): StorageConfigQuery =>
  getRequiredRuntimeValue(
    runtimeContext.storageConfigQuery,
    '[storageConfigs] Storage config query not initialized. Initialize DI services before using storage config helpers.'
  );

export const getInventoryDataQuery = (): InventoryDataQuery =>
  getRequiredRuntimeValue(
    runtimeContext.inventoryDataQuery,
    '[inventoryStore] Inventory data query not initialized. Initialize DI services before accessing inventory metadata.'
  );

export const getStoreRuntimeServices = (): StoreRuntimeServices =>
  getRequiredRuntimeValue(
    runtimeContext.storeRuntimeServices,
    '[store] Runtime services not initialized. Initialize DI services before using store service ports.'
  );

export const getGameStoreAdapter = (): GameStoreAdapter =>
  getRequiredRuntimeValue(
    runtimeContext.gameStoreAdapter,
    '[GameLoopTaskFactory] Store adapter not set. Call setAdapter() before creating tasks.'
  );

export const getGameLoopRuntimePorts = (): GameLoopRuntimePorts =>
  getRequiredRuntimeValue(
    runtimeContext.gameLoopRuntimePorts,
    '[GameLoopTaskFactory] Runtime ports not set. Call setRuntimePorts() before creating tasks.'
  );
