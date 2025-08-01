/**
 * 服务获取相关的自定义 Hooks
 * 提供统一的服务实例获取方式，避免重复代码
 */

import { useMemo } from 'react';
import { ServiceLocator, SERVICE_NAMES } from '../services/core/ServiceLocator';
import { DataService } from '../services/core/DataService';
import { RecipeService } from '../services/crafting/RecipeService';
import { TechnologyService } from '../services/crafting/TechnologyService';
import { FuelService } from '../services/crafting/FuelService';
import { PowerService } from '../services/game/PowerService';
import { StorageService } from '../services/storage/StorageService';
import { UserProgressService } from '../services/game/UserProgressService';
import type { GameStateProvider } from '../services/interfaces';

/**
 * 获取 DataService 实例
 */
export const useDataService = (): DataService => {
  return useMemo(() => {
    if (ServiceLocator.has(SERVICE_NAMES.DATA)) {
      return ServiceLocator.get<DataService>(SERVICE_NAMES.DATA);
    }
    // 如果服务未注册，返回单例实例（向后兼容）
    return DataService.getInstance();
  }, []);
};

/**
 * 获取 RecipeService 实例
 */
export const useRecipeService = (): RecipeService => {
  return useMemo(() => {
    if (ServiceLocator.has(SERVICE_NAMES.RECIPE)) {
      return ServiceLocator.get<RecipeService>(SERVICE_NAMES.RECIPE);
    }
    return RecipeService.getInstance();
  }, []);
};

/**
 * 获取 TechnologyService 实例
 */
export const useTechnologyService = (): TechnologyService => {
  return useMemo(() => {
    if (ServiceLocator.has(SERVICE_NAMES.TECHNOLOGY)) {
      return ServiceLocator.get<TechnologyService>(SERVICE_NAMES.TECHNOLOGY);
    }
    return TechnologyService.getInstance();
  }, []);
};

/**
 * 获取 FuelService 实例
 */
export const useFuelService = (): FuelService => {
  return useMemo(() => {
    if (ServiceLocator.has(SERVICE_NAMES.FUEL)) {
      return ServiceLocator.get<FuelService>(SERVICE_NAMES.FUEL);
    }
    return FuelService.getInstance();
  }, []);
};

/**
 * 获取 PowerService 实例
 */
export const usePowerService = (): PowerService => {
  return useMemo(() => {
    if (ServiceLocator.has(SERVICE_NAMES.POWER)) {
      return ServiceLocator.get<PowerService>(SERVICE_NAMES.POWER);
    }
    return PowerService.getInstance();
  }, []);
};

/**
 * 获取 StorageService 实例
 */
export const useStorageService = (): StorageService => {
  return useMemo(() => {
    if (ServiceLocator.has(SERVICE_NAMES.STORAGE)) {
      return ServiceLocator.get<StorageService>(SERVICE_NAMES.STORAGE);
    }
    return StorageService.getInstance();
  }, []);
};

/**
 * 获取 UserProgressService 实例
 */
export const useUserProgressService = (): UserProgressService => {
  return useMemo(() => {
    if (ServiceLocator.has(SERVICE_NAMES.USER_PROGRESS)) {
      return ServiceLocator.get<UserProgressService>(SERVICE_NAMES.USER_PROGRESS);
    }
    return UserProgressService.getInstance();
  }, []);
};

/**
 * 获取 GameStateProvider 实例
 */
export const useGameStateProvider = (): GameStateProvider | null => {
  return useMemo(() => {
    if (ServiceLocator.has(SERVICE_NAMES.GAME_STATE)) {
      return ServiceLocator.get<GameStateProvider>(SERVICE_NAMES.GAME_STATE);
    }
    return null;
  }, []);
};

/**
 * 通用的服务获取 Hook
 * @param serviceName 服务名称
 * @returns 服务实例
 */
export const useService = <T>(serviceName: string): T | null => {
  return useMemo(() => {
    if (ServiceLocator.has(serviceName)) {
      return ServiceLocator.get<T>(serviceName);
    }
    return null;
  }, [serviceName]);
};

/**
 * 获取多个服务的 Hook
 * @returns 常用服务的集合
 */
export const useCommonServices = () => {
  const dataService = useDataService();
  const recipeService = useRecipeService();
  const technologyService = useTechnologyService();

  return useMemo(
    () => ({
      dataService,
      recipeService,
      technologyService,
    }),
    [dataService, recipeService, technologyService]
  );
};
