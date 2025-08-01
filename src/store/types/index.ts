// Store 类型定义
import type { StateCreator } from 'zustand';
import type {
  InventoryItem,
  CraftingTask,
  CraftingChain,
  Recipe,
  DeployedContainer,
  OperationResult,
} from '../../types/index';
import type { FacilityInstance } from '@/types/facilities';
import type {
  Technology,
  TechResearchState,
  ResearchQueueItem,
  TechCategory,
  ResearchPriority,
} from '../../types/technology';
import type { GameLoopSlice } from '@/store/slices/gameLoopStore';

// 库存管理切片状态
export interface InventorySlice {
  // 状态
  inventory: Map<string, InventoryItem>;
  deployedContainers: DeployedContainer[];

  // Actions
  updateInventory: (itemId: string, amount: number) => void;
  batchUpdateInventory: (updates: Array<{ itemId: string; amount: number }>) => void;
  getInventoryItem: (itemId: string) => InventoryItem;
  recalculateItemCapacity: (itemId: string) => void;
  _repairInventoryState: () => void;

  // 存储容器相关
  deployChestForStorage: (chestType: string, targetItemId: string) => OperationResult;
  craftChest: (chestType: string, quantity?: number) => OperationResult;
  canCraftChest: (chestType: string, quantity?: number) => boolean;
  getDeployedContainersForItem: (itemId: string) => DeployedContainer[];
  removeDeployedContainer: (containerId: string) => void;
}

// 制作队列切片状态
export interface CraftingSlice {
  // 状态
  craftingQueue: CraftingTask[];
  craftingChains: CraftingChain[];
  maxQueueSize: number;

  // Actions
  addCraftingTask: (task: Omit<CraftingTask, 'id'>) => boolean;
  addCraftingChain: (chain: Omit<CraftingChain, 'id'>) => string;
  removeCraftingTask: (taskId: string) => void;
  updateCraftingProgress: (taskId: string, progress: number) => void;
  completeCraftingTask: (taskId: string) => void;
}

// 配方管理切片状态
export interface RecipeSlice {
  // 状态
  favoriteRecipes: Set<string>;
  recentRecipes: string[];
  maxRecentRecipes: number;

  // Actions
  addFavoriteRecipe: (recipeId: string) => void;
  removeFavoriteRecipe: (recipeId: string) => void;
  isFavoriteRecipe: (recipeId: string) => boolean;
  addRecentRecipe: (recipeId: string) => void;
  getRecentRecipes: () => Recipe[];
  getFavoriteRecipes: () => Recipe[];
  getRecommendedRecipes: (itemId: string) => Recipe[];
  getRecipeStats: (itemId: string) => {
    totalRecipes: number;
    manualRecipes: number;
    automatedRecipes: number;
    miningRecipes: number;
    recyclingRecipes: number;
    mostEfficientRecipe?: Recipe;
  };
  searchRecipes: (query: string) => Recipe[];
}

// 设施管理切片状态
export interface FacilitySlice {
  // 状态
  facilities: FacilityInstance[];

  // Actions
  addFacility: (facility: FacilityInstance) => void;
  updateFacility: (facilityId: string, updates: Partial<FacilityInstance>) => void;
  removeFacility: (facilityId: string) => void;
  _repairFacilityState: () => void;

  // 燃料系统
  refuelFacility: (facilityId: string, fuelItemId: string, quantity: number) => boolean;
  autoRefuelFacilities: () => void;
  updateFuelConsumption: (deltaTime: number) => void;
}

// 科技系统切片状态
export interface TechnologySlice {
  // 状态
  technologies: Map<string, Technology>;
  researchState: TechResearchState | null;
  researchQueue: ResearchQueueItem[];
  unlockedTechs: Set<string>;
  autoResearch: boolean;
  techCategories: TechCategory[];

  // 研究触发器追踪
  craftedItemCounts: Map<string, number>;
  builtEntityCounts: Map<string, number>;
  minedEntityCounts: Map<string, number>;

  // Actions
  initializeTechnologyService: () => Promise<void>;
  startResearch: (techId: string) => Promise<boolean>;
  completeResearch: (techId: string) => void;
  addToResearchQueue: (techId: string, priority?: ResearchPriority) => boolean;
  removeFromResearchQueue: (techId: string) => void;
  reorderResearchQueue: (techId: string, newPosition: number) => boolean;
  setAutoResearch: (enabled: boolean) => void;
  getTechnology: (techId: string) => Technology | undefined;
  isTechUnlocked: (techId: string) => boolean;
  isTechAvailable: (techId: string) => boolean;
  updateResearchProgress: (deltaTime: number) => void;
  _repairUnlockedTechsState: () => void;

  // 研究触发器相关
  trackCraftedItem: (itemId: string, count: number) => void;
  trackBuiltEntity: (entityId: string, count: number) => void;
  trackMinedEntity: (entityId: string, count: number) => void;
  checkResearchTriggers: () => void;
}

// 游戏元数据切片状态
export interface GameMetaSlice {
  // 状态
  lastSaveTime: number;
  totalItemsProduced: number;
  saveKey: string;

  // Actions
  saveGame: () => void;
  forceSaveGame: () => Promise<void>;
  loadGameData: () => Promise<void>;
  clearGameData: () => Promise<void>;
}

// 完整的游戏状态（所有切片的联合）
export interface GameState
  extends InventorySlice,
    CraftingSlice,
    RecipeSlice,
    FacilitySlice,
    TechnologySlice,
    GameMetaSlice,
    GameLoopSlice {}

// Zustand StateCreator 类型别名
export type SliceCreator<T> = StateCreator<
  GameState,
  [['zustand/subscribeWithSelector', never]],
  [],
  T
>;
