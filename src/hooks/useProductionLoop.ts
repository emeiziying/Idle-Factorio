// 生产循环 Hook - 管理设施生产和燃料消耗

import { useEffect, useCallback, useRef } from 'react';
import useGameStore from '../store/gameStore';
import { FuelService } from '../services/FuelService';
import { DataService } from '../services/DataService';
import { RecipeService } from '../services/RecipeService';
import { PowerService } from '../services/PowerService';
import type { FacilityInstance } from '../types/facilities';

interface UseProductionLoopOptions {
  updateInterval?: number; // 更新间隔（毫秒）
  enabled?: boolean; // 是否启用
}

export const useProductionLoop = (options: UseProductionLoopOptions = {}) => {
  const {
    updateInterval = 1000, // 默认每秒更新
    enabled = true
  } = options;
  
  const { 
    facilities, 
    updateFacility,
    updateInventory,
    getInventoryItem,
    updateFuelConsumption,
    autoRefuelFacilities
  } = useGameStore();
  
  const lastUpdateRef = useRef<number>(Date.now());
  const fuelService = FuelService.getInstance();
  const dataService = DataService.getInstance();
  const recipeService = RecipeService.getInstance();
  const powerService = PowerService.getInstance();
  
  // 更新单个设施的生产
  const updateFacilityProduction = useCallback((facility: FacilityInstance, deltaTime: number) => {
    if (facility.status !== 'running' || !facility.production) {
      return;
    }
    
    const { currentRecipeId, progress } = facility.production;
    if (!currentRecipeId) return;
    
    const recipe = recipeService.getRecipeById(currentRecipeId);
    if (!recipe) return;
    
    // 计算生产进度
    const progressIncrement = (deltaTime / recipe.time) * facility.efficiency;
    const newProgress = progress + progressIncrement;
    
    if (newProgress >= 1.0) {
      // 生产完成
      // 检查输出空间
      let canProduce = true;
      for (const [itemId, quantity] of Object.entries(recipe.out)) {
        const inventory = getInventoryItem(itemId);
        if (inventory.currentAmount + quantity > inventory.maxCapacity) {
          canProduce = false;
          break;
        }
      }
      
      if (canProduce) {
        // 消耗输入材料
        for (const [itemId, quantity] of Object.entries(recipe.in)) {
          updateInventory(itemId, -quantity);
        }
        
        // 添加产出
        for (const [itemId, quantity] of Object.entries(recipe.out)) {
          updateInventory(itemId, quantity);
        }
        
        // 重置进度
        updateFacility(facility.id, {
          production: {
            ...facility.production,
            progress: newProgress - 1.0 // 保留超出的进度
          }
        });
      } else {
        // 输出已满，停止生产
        updateFacility(facility.id, {
          status: 'output_full'
        });
      }
    } else {
      // 更新进度
      updateFacility(facility.id, {
        production: {
          ...facility.production,
          progress: newProgress
        }
      });
    }
  }, [updateFacility, updateInventory, getInventoryItem, recipeService]);
  
  // 主更新循环
  const updateProduction = useCallback(() => {
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastUpdateRef.current) / 1000; // 转换为秒
    lastUpdateRef.current = currentTime;
    
    // 1. 计算电力平衡
    const powerBalance = powerService.calculatePowerBalance(facilities);
    
    // 2. 根据电力平衡更新设施效率
    const updatedFacilities = facilities.map(facility => 
      powerService.updateFacilityPowerStatus(facility, powerBalance)
    );
    
    // 批量更新设施状态（如果有变化）
    updatedFacilities.forEach((updatedFacility, index) => {
      const originalFacility = facilities[index];
      if (
        originalFacility.efficiency !== updatedFacility.efficiency ||
        originalFacility.status !== updatedFacility.status
      ) {
        updateFacility(updatedFacility.id, {
          efficiency: updatedFacility.efficiency,
          status: updatedFacility.status
        });
      }
    });
    
    // 3. 更新燃料消耗
    updateFuelConsumption(deltaTime);
    
    // 4. 尝试自动补充燃料
    autoRefuelFacilities();
    
    // 5. 更新生产进度
    facilities.forEach(facility => {
      // 检查设施状态
      if (facility.status === 'no_fuel' && facility.fuelBuffer) {
        // 检查是否有燃料了
        const status = fuelService.getFuelStatus(facility.fuelBuffer);
        if (!status.isEmpty) {
          updateFacility(facility.id, { status: 'running' });
        }
      }
      
      // 更新生产
      if (facility.status === 'running') {
        updateFacilityProduction(facility, deltaTime);
      }
    });
  }, [facilities, updateFuelConsumption, autoRefuelFacilities, updateFacility, fuelService, updateFacilityProduction, powerService]);
  
  // 设置定时器
  useEffect(() => {
    if (!enabled) return;
    
    const interval = setInterval(updateProduction, updateInterval);
    
    return () => {
      clearInterval(interval);
    };
  }, [enabled, updateInterval, updateProduction]);
  
  return {
    updateProduction,
    isRunning: enabled
  };
};

export default useProductionLoop;