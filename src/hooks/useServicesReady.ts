import { useMemo } from 'react';
import { DataService } from '@/services/core/DataService';
import { ServiceLocator, SERVICE_NAMES } from '@/services/core/ServiceLocator';
import type { TechnologyService } from '@/services/technology/TechnologyService';
import type { RecipeService } from '@/services/crafting/RecipeService';

export interface ServicesReadyState {
  isReady: boolean;
  dataLoaded: boolean;
  technologyReady: boolean;
  recipeReady: boolean;
  error?: string;
}

/**
 * 检查关键服务是否就绪的Hook
 * 用于确保UI组件在所有必要服务初始化完成后再渲染
 */
export const useServicesReady = (): ServicesReadyState => {
  return useMemo(() => {
    try {
      // 1. 检查数据服务
      const dataService = DataService.getInstance();
      const dataLoaded = dataService.isDataLoaded();

      if (!dataLoaded) {
        return {
          isReady: false,
          dataLoaded: false,
          technologyReady: false,
          recipeReady: false,
        };
      }

      // 2. 检查科技服务
      const techService = ServiceLocator.has(SERVICE_NAMES.TECHNOLOGY)
        ? ServiceLocator.get<TechnologyService>(SERVICE_NAMES.TECHNOLOGY)
        : null;
      const technologyReady = !techService || techService.isServiceInitialized?.() === true;

      // 3. 检查配方服务
      const recipeService = ServiceLocator.has(SERVICE_NAMES.RECIPE)
        ? ServiceLocator.get<RecipeService>(SERVICE_NAMES.RECIPE)
        : null;
      const recipeReady = !!recipeService; // RecipeService 没有特殊的初始化检查

      const isReady = dataLoaded && technologyReady && recipeReady;

      return {
        isReady,
        dataLoaded,
        technologyReady,
        recipeReady,
      };
    } catch (error) {
      return {
        isReady: false,
        dataLoaded: false,
        technologyReady: false,
        recipeReady: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }, []); // 空依赖数组，因为服务初始化是一次性的
};

/**
 * 检查特定服务组合是否就绪
 */
export const useSpecificServicesReady = (requiredServices: string[]): ServicesReadyState => {
  return useMemo(() => {
    try {
      const dataService = DataService.getInstance();
      const dataLoaded = dataService.isDataLoaded();

      if (!dataLoaded) {
        return {
          isReady: false,
          dataLoaded: false,
          technologyReady: false,
          recipeReady: false,
        };
      }

      let technologyReady = true;
      const recipeReady = true;

      // 检查所需的服务
      for (const serviceName of requiredServices) {
        if (!ServiceLocator.has(serviceName)) {
          return {
            isReady: false,
            dataLoaded,
            technologyReady: false,
            recipeReady: false,
            error: `Service ${serviceName} not available`,
          };
        }

        // 特殊检查科技服务的初始化状态
        if (serviceName === SERVICE_NAMES.TECHNOLOGY) {
          const techService = ServiceLocator.get<TechnologyService>(serviceName);
          technologyReady = techService.isServiceInitialized?.() === true;
          if (!technologyReady) {
            return {
              isReady: false,
              dataLoaded,
              technologyReady: false,
              recipeReady,
            };
          }
        }
      }

      return {
        isReady: true,
        dataLoaded,
        technologyReady,
        recipeReady,
      };
    } catch (error) {
      return {
        isReady: false,
        dataLoaded: false,
        technologyReady: false,
        recipeReady: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }, [requiredServices]);
};
