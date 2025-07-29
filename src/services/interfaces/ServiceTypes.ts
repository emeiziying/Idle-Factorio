import type { Recipe, Item } from '../../types';

// 临时类型定义
export interface FacilityInstance {
  id: string;
  facilityId: string;
  count: number;
  efficiency: number;
  status: string;
  [key: string]: unknown;
}

export interface PowerBalance {
  generation: number;
  consumption: number;
  status: 'surplus' | 'balanced' | 'deficit';
  satisfactionRatio: number;
  consumptionDemand: number;
}

// DataService 接口
export interface IDataService {
  getItem(id: string): Item | undefined;
  getItemById(id: string): Item | undefined;
  getAllItems(): Item[];
  getRecipe(id: string): Recipe | undefined;
  getRecipeById(id: string): Recipe | undefined;
  getItemName(itemId: string): string;
  getI18nName(item: Item): string;
  getCategoryI18nName(categoryId: string): string;
  getLocalizedItemName(itemId: string): string;
  isItemUnlocked(itemId: string): boolean;
  clearUnlockCache(): void;
}

// PowerService 接口
export interface IPowerService {
  calculatePowerBalance(facilities: FacilityInstance[]): PowerBalance;
  updateFacilityPowerStatus(facility: FacilityInstance, powerBalance: PowerBalance): FacilityInstance;
  getFacilityPowerGeneration(facility: FacilityInstance): number;
  getPowerPriorityRecommendations(facilities: FacilityInstance[], powerBalance: PowerBalance): Array<{ facilityId: string; type: string; reason: string; priority: string }>;
  getFacilityPowerInfo(facility: FacilityInstance, powerBalance: PowerBalance): { efficiency: number; [key: string]: unknown };
  updateFacilityEfficiency(facilityId: string, efficiency: number): void;
  isConsumer(facility: FacilityInstance): boolean;
  getFacilityPowerDemand(facility: FacilityInstance): number;
  getPowerStats(): { generation: number; consumption: number; efficiency: number };
}

// TechnologyService 接口
export interface ITechnologyService {
  isItemUnlocked(itemId: string): boolean;
  isRecipeUnlocked(recipeId: string): boolean;
  initialize(): Promise<void>;
  isServiceInitialized(): boolean;
  setInventoryOperations(inventoryOps: unknown): void;
  getAllTechnologies(): unknown[];
  getTechTreeState(): { unlockedTechs: unknown[] };
  getTechCategories(): unknown[];
  startResearch(techId: string): Promise<{ success: boolean }>;
  getCurrentResearch(): unknown;
  getResearchQueue(): unknown[];
  completeResearch(techId: string): void;
  addToResearchQueue(techId: string, priority: unknown): { success: boolean };
  removeFromResearchQueue(techId: string): boolean;
  reorderResearchQueue(techId: string, newPosition: number): boolean;
  setAutoResearch(enabled: boolean): void;
  isTechAvailable(techId: string): boolean;
  updateResearchProgress(deltaTime: number): void;
}

// GameStorageService 接口
export interface IGameStorageService {
  clearGameData(): Promise<void>;
  saveGame(state: unknown): Promise<void>;
  forceSaveGame(state: unknown): Promise<void>;
  loadGame(): Promise<unknown>;
}

// StorageService 接口
export interface IStorageService {
  getStorageConfig(storageType: string): { itemId: string; category: string; capacity: number } | undefined;
  getAllStorageConfigs(): Array<{ itemId: string; category: string; capacity: number }>;
  getStorageConfigsByCategory(category: string): Array<{ itemId: string; category: string; capacity: number }>;
  isStorageUnlocked(storageType: string): boolean;
  calculateStorageCapacity(storageType: string, count: number): number;
  getStorageStats(storageType: string): { capacity: number; usage: number; efficiency: number };
  recommendStorageType(itemType: string): string | null;
  getStorageUpgradeSuggestions(currentStorage: unknown): unknown[];
  validateStorageConfig(config: unknown): boolean;
  searchStorageConfigs(query: string): unknown[];
}

// RecipeService 接口
export interface IRecipeService {
  getAllRecipes(): Recipe[];
  getRecipesThatProduce(itemId: string): Recipe[];
  getRecipesThatUse(itemId: string): Recipe[];
  getRecipeById(id: string): Recipe | undefined;
  getMostEfficientRecipe(itemId: string): Recipe | undefined;
  getRecipeStats(itemId: string): { totalRecipes: number; manualRecipes: number; automatedRecipes: number; mostEfficientRecipe?: Recipe };
  searchRecipes(query: string): Recipe[];
}

// 通用服务类型映射
export type ServiceTypeMap = {
  'DataService': IDataService;
  'PowerService': IPowerService;
  'TechnologyService': ITechnologyService;
  'GameStorageService': IGameStorageService;
  'StorageService': IStorageService;
  'RecipeService': IRecipeService;
};