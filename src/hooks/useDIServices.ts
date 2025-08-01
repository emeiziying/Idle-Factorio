/**
 * 基于依赖注入的服务获取 Hooks
 * 替代原有的 useServices，使用 DI 容器获取服务实例
 */

import { useMemo } from 'react';
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

/**
 * 获取 DataService 实例
 */
export const useDataService = (): DataService => {
  return useMemo(() => {
    return getService<DataService>(SERVICE_TOKENS.DATA_SERVICE);
  }, []);
};

/**
 * 获取 UserProgressService 实例
 */
export const useUserProgressService = (): UserProgressService => {
  return useMemo(() => {
    return getService<UserProgressService>(SERVICE_TOKENS.USER_PROGRESS_SERVICE);
  }, []);
};

/**
 * 获取 RecipeService 实例
 */
export const useRecipeService = (): RecipeService => {
  return useMemo(() => {
    return getService<RecipeService>(SERVICE_TOKENS.RECIPE_SERVICE);
  }, []);
};

/**
 * 获取 TechnologyService 实例
 */
export const useTechnologyService = (): TechnologyService => {
  return useMemo(() => {
    return getService<TechnologyService>(SERVICE_TOKENS.TECHNOLOGY_SERVICE);
  }, []);
};

/**
 * 获取 TechUnlockService 实例
 */
export const useTechUnlockService = (): TechUnlockService => {
  return useMemo(() => {
    return getService<TechUnlockService>(SERVICE_TOKENS.TECH_UNLOCK_SERVICE);
  }, []);
};

/**
 * 获取 FuelService 实例
 */
export const useFuelService = (): FuelService => {
  return useMemo(() => {
    return getService<FuelService>(SERVICE_TOKENS.FUEL_SERVICE);
  }, []);
};

/**
 * 获取 PowerService 实例
 */
export const usePowerService = (): PowerService => {
  return useMemo(() => {
    return getService<PowerService>(SERVICE_TOKENS.POWER_SERVICE);
  }, []);
};

/**
 * 获取 StorageService 实例
 */
export const useStorageService = (): StorageService => {
  return useMemo(() => {
    return getService<StorageService>(SERVICE_TOKENS.STORAGE_SERVICE);
  }, []);
};

/**
 * 获取 ManualCraftingValidator 实例
 */
export const useManualCraftingValidator = (): ManualCraftingValidator => {
  return useMemo(() => {
    return getService<ManualCraftingValidator>(SERVICE_TOKENS.MANUAL_CRAFTING_VALIDATOR);
  }, []);
};

/**
 * 获取 GameLoopService 实例
 */
export const useGameLoopService = (): GameLoopService => {
  return useMemo(() => {
    return getService<GameLoopService>(SERVICE_TOKENS.GAME_LOOP_SERVICE);
  }, []);
};

/**
 * 通用的服务获取 Hook
 */
export const useService = <T>(token: string): T => {
  return useMemo(() => {
    return getService<T>(token);
  }, [token]);
};

/**
 * 获取多个常用服务的 Hook
 */
export const useCommonServices = () => {
  const dataService = useDataService();
  const recipeService = useRecipeService();
  const technologyService = useTechnologyService();
  const userProgressService = useUserProgressService();

  return useMemo(
    () => ({
      dataService,
      recipeService,
      technologyService,
      userProgressService,
    }),
    [dataService, recipeService, technologyService, userProgressService]
  );
};
