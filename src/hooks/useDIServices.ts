/**
 * 基于依赖注入的服务获取 Hooks
 * 替代原有的 useServices，使用 DI 容器获取服务实例
 *
 * 注意：所有服务均为 DI 容器管理的单例，getService() 本身是 O(1) 的 Map 查找，
 * 无需 useMemo 包裹——useMemo 对单例引用没有性能收益，反而增加 React 内存开销。
 */

import { getService } from '@/services/core/DIServiceInitializer';
import { SERVICE_TOKENS } from '@/services/core/ServiceTokens';

// 服务类型导入
import type { DataService } from '@/services/core/DataService';
import type { UserProgressService } from '@/services/game/UserProgressService';
import type { RecipeService } from '@/services/crafting/RecipeService';
import type { TechnologyService } from '@/services/technology/TechnologyService';
import type { TechUnlockService } from '@/services/technology/TechUnlockService';
import type { FuelService } from '@/services/crafting/FuelService';
import type { PowerService } from '@/services/game/PowerService';
import type { StorageService } from '@/services/storage/StorageService';
import type { ManualCraftingValidator } from '@/utils/manualCraftingValidator';
import type { GameLoopService } from '@/services/game/GameLoopService';
import type { GameConfig } from '@/services/core/GameConfig';
import type { DependencyService } from '@/services/crafting/DependencyService';

export const useDataService = (): DataService =>
  getService<DataService>(SERVICE_TOKENS.DATA_SERVICE);

export const useUserProgressService = (): UserProgressService =>
  getService<UserProgressService>(SERVICE_TOKENS.USER_PROGRESS_SERVICE);

export const useRecipeService = (): RecipeService =>
  getService<RecipeService>(SERVICE_TOKENS.RECIPE_SERVICE);

export const useTechnologyService = (): TechnologyService =>
  getService<TechnologyService>(SERVICE_TOKENS.TECHNOLOGY_SERVICE);

export const useTechUnlockService = (): TechUnlockService =>
  getService<TechUnlockService>(SERVICE_TOKENS.TECH_UNLOCK_SERVICE);

export const useFuelService = (): FuelService =>
  getService<FuelService>(SERVICE_TOKENS.FUEL_SERVICE);

export const usePowerService = (): PowerService =>
  getService<PowerService>(SERVICE_TOKENS.POWER_SERVICE);

export const useStorageService = (): StorageService =>
  getService<StorageService>(SERVICE_TOKENS.STORAGE_SERVICE);

export const useManualCraftingValidator = (): ManualCraftingValidator =>
  getService<ManualCraftingValidator>(SERVICE_TOKENS.MANUAL_CRAFTING_VALIDATOR);

export const useGameLoopService = (): GameLoopService =>
  getService<GameLoopService>(SERVICE_TOKENS.GAME_LOOP_SERVICE);

export const useGameConfig = (): GameConfig => getService<GameConfig>(SERVICE_TOKENS.GAME_CONFIG);

export const useDependencyService = (): DependencyService =>
  getService<DependencyService>(SERVICE_TOKENS.DEPENDENCY_SERVICE);

/**
 * 通用的服务获取 Hook
 */
export const useService = <T>(token: string): T => getService<T>(token);

/**
 * 获取多个常用服务的 Hook
 */
export const useCommonServices = () => ({
  dataService: getService<DataService>(SERVICE_TOKENS.DATA_SERVICE),
  recipeService: getService<RecipeService>(SERVICE_TOKENS.RECIPE_SERVICE),
  technologyService: getService<TechnologyService>(SERVICE_TOKENS.TECHNOLOGY_SERVICE),
  userProgressService: getService<UserProgressService>(SERVICE_TOKENS.USER_PROGRESS_SERVICE),
});
