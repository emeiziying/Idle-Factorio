import { useEffect, useRef } from 'react';
import useGameStore from '../store/gameStore';
import { DataService } from '../services/DataService';
import { RecipeService } from '../services/RecipeService';

interface ProductionAccumulator {
  [itemId: string]: number; // 累积的生产量（包含小数）
}

/**
 * 游戏主循环Hook
 * 负责处理设施的自动化生产、库存更新等定时任务
 */
export const useGameLoop = () => {
  const {
    facilities,
    updateInventory,
    getInventoryItem,
    setGameTime,
    gameTime
  } = useGameStore();
  
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const productionAccumulatorRef = useRef<ProductionAccumulator>({});
  const gameLoopRef = useRef<number | null>(null);
  
  const dataService = DataService.getInstance();

  // 计算设施的生产效率
  const calculateFacilityProduction = (facilityId: string, count: number = 1) => {
    const facilityItem = dataService.getItem(facilityId);
    if (!facilityItem || !facilityItem.machine) {
      console.warn(`设施 ${facilityId} 没有找到或没有机器属性`);
      return { inputRate: new Map(), outputRate: new Map() };
    }

    // 找到该设施能生产的配方
    const allRecipes = RecipeService.getAllRecipes();
    const applicableRecipes = allRecipes.filter(recipe => 
      recipe.producers && recipe.producers.includes(facilityId)
    );

    console.log(`设施 ${facilityId} 可用配方数量:`, applicableRecipes.length);
    if (applicableRecipes.length > 0) {
      console.log(`设施 ${facilityId} 可用配方:`, applicableRecipes.map(r => `${r.id} (${Object.keys(r.out).join(', ')})`));
    }

    const inputRate = new Map<string, number>();
    const outputRate = new Map<string, number>();

    // 暂时选择第一个适用的配方（未来可以根据需求优化）
    const recipe = applicableRecipes[0];
    if (!recipe || !recipe.time) {
      console.warn(`设施 ${facilityId} 没有找到有效配方`);
      return { inputRate, outputRate };
    }

    console.log(`设施 ${facilityId} 选择配方:`, recipe.id, '输出:', recipe.out);

    const machineRecord = facilityItem.machine as Record<string, unknown>;
    const machineSpeed = typeof machineRecord?.speed === 'number' ? machineRecord.speed : 1.0;
    const efficiency = 1.0; // 基础效率，未来可以根据设施状态调整
    
    // 计算输入需求速率
    if (recipe.in) {
      Object.entries(recipe.in).forEach(([itemId, amount]) => {
        const rate = (amount / recipe.time) * machineSpeed * efficiency * count;
        inputRate.set(itemId, rate);
      });
    }

    // 计算输出生产速率
    if (recipe.out) {
      Object.entries(recipe.out).forEach(([itemId, amount]) => {
        const rate = (amount / recipe.time) * machineSpeed * efficiency * count;
        outputRate.set(itemId, rate);
      });
    }

    console.log(`设施 ${facilityId} x${count} 输入需求:`, Array.from(inputRate.entries()));
    console.log(`设施 ${facilityId} x${count} 输出产量:`, Array.from(outputRate.entries()));

    return { inputRate, outputRate };
  };

  // 检查设施是否有足够的输入材料
  const checkInputAvailability = (inputRate: Map<string, number>, deltaTimeInSeconds: number): boolean => {
    for (const [itemId, rate] of inputRate) {
      const requiredAmount = rate * deltaTimeInSeconds;
      const availableAmount = getInventoryItem(itemId).currentAmount;
      
      if (availableAmount < requiredAmount) {
        console.log(`材料不足: ${itemId} 需要 ${requiredAmount.toFixed(3)}, 可用 ${availableAmount}`);
        return false; // 材料不足
      }
    }
    return true;
  };

  // 消耗输入材料
  const consumeInputs = (inputRate: Map<string, number>, deltaTimeInSeconds: number) => {
    for (const [itemId, rate] of inputRate) {
      const consumeAmount = rate * deltaTimeInSeconds;
      updateInventory(itemId, -consumeAmount);
    }
  };

  // 生产输出物品
  const produceOutputs = (outputRate: Map<string, number>, deltaTimeInSeconds: number) => {
    for (const [itemId, rate] of outputRate) {
      const produceAmount = rate * deltaTimeInSeconds;
      
      // 使用累积器处理小数生产
      const currentAccumulator = productionAccumulatorRef.current[itemId] || 0;
      const newAccumulator = currentAccumulator + produceAmount;
      
      // 只有当累积量达到1个或以上时才添加到库存
      const wholeUnits = Math.floor(newAccumulator);
      if (wholeUnits > 0) {
        updateInventory(itemId, wholeUnits);
        productionAccumulatorRef.current[itemId] = newAccumulator - wholeUnits;
      } else {
        productionAccumulatorRef.current[itemId] = newAccumulator;
      }
    }
  };

  // 游戏循环更新函数
  const updateGameLoop = () => {
    const currentTime = Date.now();
    const deltaTime = currentTime - lastUpdateTimeRef.current;
    const deltaTimeInSeconds = deltaTime / 1000;
    
    // 更新游戏时间
    setGameTime(gameTime + deltaTime);

    // 按设施类型分组统计
    const facilityGroups = new Map<string, number>();
    facilities.forEach(facility => {
      const count = facilityGroups.get(facility.facilityId) || 0;
      facilityGroups.set(facility.facilityId, count + facility.count);
    });

    if (facilityGroups.size > 0) {
      console.log('当前运行的设施:', Array.from(facilityGroups.entries()));
    } else if (facilities.length > 0) {
      console.log('有设施但没有分组:', facilities);
    }

    // 处理每种设施类型的生产
    for (const [facilityId, totalCount] of facilityGroups) {
      const { inputRate, outputRate } = calculateFacilityProduction(facilityId, totalCount);
      
      // 检查是否有足够的输入材料
      if (checkInputAvailability(inputRate, deltaTimeInSeconds)) {
        // 消耗输入材料
        consumeInputs(inputRate, deltaTimeInSeconds);
        
        // 生产输出物品
        produceOutputs(outputRate, deltaTimeInSeconds);
      }
      // 如果材料不足，设施暂停生产（可以在未来添加状态显示）
    }

    lastUpdateTimeRef.current = currentTime;
  };

  // 启动游戏循环
  const startGameLoop = () => {
    if (gameLoopRef.current) {
      console.log('游戏循环已经在运行中');
      return; // 已经在运行
    }

    console.log('正在启动游戏循环...');
    lastUpdateTimeRef.current = Date.now();
    
    const gameLoop = () => {
      updateGameLoop();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    console.log('游戏循环已启动，ID:', gameLoopRef.current);
  };

  // 停止游戏循环
  const stopGameLoop = () => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  };

  // 重置游戏循环
  const resetGameLoop = () => {
    stopGameLoop();
    productionAccumulatorRef.current = {};
    lastUpdateTimeRef.current = Date.now();
  };

  // 组件挂载时自动启动游戏循环
  useEffect(() => {
    console.log('游戏循环启动');
    startGameLoop();
    
    // 组件卸载时清理
    return () => {
      console.log('游戏循环停止');
      stopGameLoop();
    };
  }, []);

  // 当设施列表变化时重置游戏循环状态
  useEffect(() => {
    lastUpdateTimeRef.current = Date.now();
  }, [facilities]);

  return {
    startGameLoop,
    stopGameLoop,
    resetGameLoop,
    isRunning: gameLoopRef.current !== null
  };
}; 