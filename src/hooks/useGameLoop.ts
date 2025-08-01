import { useRef, useEffect } from 'react';
import useGameTimeStore from '@/store/gameTimeStore';

interface ProductionAccumulator {
  [itemId: string]: number; // 累积的生产量（包含小数）
}

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
      instanceCount: 0,
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

  // 使用useRef存储函数引用，避免依赖项问题
  const startGameLoopRef = useRef<(() => void) | null>(null);
  const stopGameLoopRef = useRef<(() => void) | null>(null);

  // 启动游戏循环
  const startGameLoop = () => {
    if (globalStateRef.current.isRunning) {
      return;
    }

    globalStateRef.current.isRunning = true;
    globalStateRef.current.lastUpdateTime = Date.now();

    const gameLoop = () => {
      // 直接从store获取最新状态，避免依赖React hooks
      const timeStore = useGameTimeStore.getState();
      const currentTime = Date.now();
      const deltaTime = currentTime - globalStateRef.current.lastUpdateTime;

      // 更新游戏时间（使用独立的store，不触发主store的persist）
      timeStore.setGameTime(timeStore.gameTime + deltaTime);

      // 注意：设施生产逻辑已移至 useProductionLoop，避免重复生产
      // 这里只保留游戏时间更新等基础功能

      // TODO: 如果需要其他全局游戏逻辑，可以在这里添加
      // 例如：全局事件处理、成就检查等

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
    isRunning: globalStateRef.current.isRunning,
  };
};
