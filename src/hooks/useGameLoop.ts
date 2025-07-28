import { useEffect, useRef } from 'react';
import useGameStore from '../store/gameStore';
import useGameTimeStore from '../store/gameTimeStore';
import { DataService } from '../services/DataService';
import { RecipeService } from '../services/RecipeService';
import Logger from '../utils/logger';
import { calculateRate } from '../utils/common';

interface ProductionAccumulator {
  [itemId: string]: number; // 累积的生产量（包含小数）
}

// 创建游戏循环专用的日志器
const logger = new Logger();
logger.configure({ prefix: '[Game] [GameLoop]' });

// 全局游戏循环状态，防止在 StrictMode 下重复启动
interface GlobalGameLoopState {
  animationFrameId: number | null;
  lastUpdateTime: number;
  productionAccumulator: ProductionAccumulator;
  isRunning: boolean;
  instanceCount: number;
}

// 使用全局变量确保单例模式
const getGlobalGameLoopState = (): GlobalGameLoopState => {
  const windowWithState = window as Window & { __gameLoopState?: GlobalGameLoopState };
  if (!windowWithState.__gameLoopState) {
    windowWithState.__gameLoopState = {
      animationFrameId: null,
      lastUpdateTime: Date.now(),
      productionAccumulator: {},
      isRunning: false,
      instanceCount: 0
    };
  }
  return windowWithState.__gameLoopState;
};

/**
 * 游戏主循环Hook
 * 负责处理设施的自动化生产、库存更新等定时任务
 */
export const useGameLoop = () => {
  // 使用useRef存储globalState引用，避免依赖项问题
  const globalStateRef = useRef(getGlobalGameLoopState());
  globalStateRef.current.instanceCount++;
  const dataService = DataService.getInstance();
  
  // 使用useRef存储函数引用，避免依赖项问题
  const startGameLoopRef = useRef<(() => void) | null>(null);
  const stopGameLoopRef = useRef<(() => void) | null>(null);

  // 计算设施的生产效率
  const calculateFacilityProduction = (facilityId: string, count: number = 1) => {
    const facilityItem = dataService.getItem(facilityId);
    if (!facilityItem || !facilityItem.machine) {
      logger.warn(`设施 ${facilityId} 没有找到或没有机器属性`);
      return { inputRate: new Map(), outputRate: new Map(), recipe: null };
    }

    // 找到该设施能生产的配方
    const allRecipes = RecipeService.getAllRecipes();
    const applicableRecipes = allRecipes.filter(recipe => 
      recipe.producers && recipe.producers.includes(facilityId)
    );

    const inputRate = new Map<string, number>();
    const outputRate = new Map<string, number>();

    // 暂时选择第一个适用的配方（未来可以根据需求优化）
    const recipe = applicableRecipes[0];
    if (!recipe || !recipe.time) {
      logger.warn(`设施 ${facilityId} 没有找到有效配方`);
      return { inputRate, outputRate, recipe: null };
    }


    const machineRecord = facilityItem.machine as Record<string, unknown>;
    const machineSpeed = typeof machineRecord?.speed === 'number' ? machineRecord.speed : 1.0;
    const efficiency = 1.0; // 基础效率，未来可以根据设施状态调整
    
    // 计算输入需求速率
    if (recipe.in) {
      Object.entries(recipe.in).forEach(([itemId, amount]) => {
        const rate = calculateRate(amount, recipe.time, machineSpeed, efficiency, count);
        inputRate.set(itemId, rate);
      });
    }

    // 计算输出生产速率
    if (recipe.out) {
      Object.entries(recipe.out).forEach(([itemId, amount]) => {
        const rate = calculateRate(amount, recipe.time, machineSpeed, efficiency, count);
        outputRate.set(itemId, rate);
      });
    }


    return { inputRate, outputRate, recipe };
  };


  // 启动游戏循环
  const startGameLoop = () => {
    if (globalStateRef.current.isRunning) {
      return;
    }

    globalStateRef.current.isRunning = true;
    globalStateRef.current.lastUpdateTime = Date.now();
    
    const gameLoop = () => {
      // 直接从store获取最新状态，避免依赖React hooks
      const store = useGameStore.getState();
      const timeStore = useGameTimeStore.getState();
      const currentTime = Date.now();
      const deltaTime = currentTime - globalStateRef.current.lastUpdateTime;
      const deltaTimeInSeconds = deltaTime / 1000;
      
      // 更新游戏时间（使用独立的store，不触发主store的persist）
      timeStore.setGameTime(timeStore.gameTime + deltaTime);

      // 按设施类型分组统计
      const facilityGroups = new Map<string, number>();
      store.facilities.forEach(facility => {
        const count = facilityGroups.get(facility.facilityId) || 0;
        facilityGroups.set(facility.facilityId, count + facility.count);
      });


      // 处理每种设施类型的生产
      for (const [facilityId, totalCount] of facilityGroups) {
        const { inputRate, outputRate, recipe } = calculateFacilityProduction(facilityId, totalCount);
        
        // 检查是否有足够的输入材料
        let hasEnoughInputs = true;
        for (const [itemId, rate] of inputRate) {
          const requiredAmount = rate * deltaTimeInSeconds;
          const availableAmount = store.getInventoryItem(itemId).currentAmount;
          
          if (availableAmount < requiredAmount) {
            hasEnoughInputs = false;
            break;
          }
        }
        
        if (hasEnoughInputs) {
          // 消耗输入材料
          for (const [itemId, rate] of inputRate) {
            const consumeAmount = rate * deltaTimeInSeconds;
            store.updateInventory(itemId, -consumeAmount);
          }
          
          // 生产输出物品
          for (const [itemId, rate] of outputRate) {
            const produceAmount = rate * deltaTimeInSeconds;
            
            // 使用全局累积器处理小数生产
            const currentAccumulator = globalStateRef.current.productionAccumulator[itemId] || 0;
            const newAccumulator = currentAccumulator + produceAmount;
            
            // 只有当累积量达到1个或以上时才添加到库存
            const wholeUnits = Math.floor(newAccumulator);
            if (wholeUnits > 0) {
              store.updateInventory(itemId, wholeUnits);
              // 追踪制造的物品（用于研究触发器）
              store.trackCraftedItem(itemId, wholeUnits);
              // 如果是采矿配方，同时追踪挖掘的实体
              if (recipe && recipe.flags?.includes('mining')) {
                store.trackMinedEntity(itemId, wholeUnits);
              }
              globalStateRef.current.productionAccumulator[itemId] = newAccumulator - wholeUnits;
            } else {
              globalStateRef.current.productionAccumulator[itemId] = newAccumulator;
            }
          }
        }
        // 如果材料不足，设施暂停生产（可以在未来添加状态显示）
      }

      globalStateRef.current.lastUpdateTime = currentTime;
      globalStateRef.current.animationFrameId = requestAnimationFrame(gameLoop);
    };
    
    globalStateRef.current.animationFrameId = requestAnimationFrame(gameLoop);
  };

  // 停止游戏循环
  const stopGameLoop = () => {
    if (globalStateRef.current.animationFrameId) {
      cancelAnimationFrame(globalStateRef.current.animationFrameId);
      globalStateRef.current.animationFrameId = null;
      globalStateRef.current.isRunning = false;
    }
  };

  // 重置游戏循环
  const resetGameLoop = () => {
    stopGameLoop();
    globalStateRef.current.productionAccumulator = {};
    globalStateRef.current.lastUpdateTime = Date.now();
  };

  // 存储函数引用到ref中
  startGameLoopRef.current = startGameLoop;
  stopGameLoopRef.current = stopGameLoop;

  // 组件挂载时自动启动游戏循环
  useEffect(() => {
    const globalState = globalStateRef.current;
    startGameLoopRef.current!();
    
    // 组件卸载时清理
    return () => {
      // 只有当没有其他实例时才停止游戏循环
      globalState.instanceCount--;
      if (globalState.instanceCount === 0) {
        stopGameLoopRef.current!();
      }
    };
  }, []); // 空依赖数组，只在挂载时执行一次

  return {
    startGameLoop,
    stopGameLoop,
    resetGameLoop,
    isRunning: globalStateRef.current.isRunning
  };
}; 