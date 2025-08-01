// 游戏循环状态管理切片
import type { SliceCreator } from '@/store/types';
import type { GameLoopStats, GameLoopConfig, PerformanceLevel } from '@/types/gameLoop';
import type { GameLoopService } from '@/services/game/GameLoopService';
import { getService } from '@/services/core/DIServiceInitializer';
import { SERVICE_TOKENS } from '@/services/core/ServiceTokens';

// 游戏循环切片状态接口
export interface GameLoopSlice {
  // 状态
  isGameLoopRunning: boolean;
  isGameLoopPaused: boolean;
  gameLoopStats: GameLoopStats;
  gameLoopConfig: GameLoopConfig;
  performanceLevel: PerformanceLevel;

  // Actions
  startGameLoop: () => void;
  stopGameLoop: () => void;
  pauseGameLoop: () => void;
  resumeGameLoop: () => void;
  updateGameLoopConfig: (config: Partial<GameLoopConfig>) => void;
  setPerformanceLevel: (level: PerformanceLevel) => void;
  getGameLoopStats: () => GameLoopStats;

  // 内部更新方法（由 GameLoopService 调用）
  _updateGameLoopState: () => void;
}

export const createGameLoopSlice: SliceCreator<GameLoopSlice> = set => {
  // 延迟获取服务，避免在DI初始化前访问
  const getGameLoopService = () => getService<GameLoopService>(SERVICE_TOKENS.GAME_LOOP_SERVICE);

  return {
    // 初始状态
    isGameLoopRunning: false,
    isGameLoopPaused: false,
    gameLoopStats: {
      fps: 0,
      deltaTime: 0,
      totalTime: 0,
      frameCount: 0,
      averageDeltaTime: 0,
      tasksExecuted: 0,
      performance: {
        frameTime: 0,
        averageFrameTime: 0,
        slowFrames: 0,
      },
    },
    gameLoopConfig: {
      targetFPS: 60,
      maxDeltaTime: 100,
      enableStats: true,
      enablePerformanceMode: true,
      backgroundThrottleRatio: 0.1,
    },
    performanceLevel: 'high' as PerformanceLevel,

    // Actions
    startGameLoop: () => {
      getGameLoopService().start();
      set(() => ({
        isGameLoopRunning: true,
        isGameLoopPaused: false,
      }));
    },

    stopGameLoop: () => {
      getGameLoopService().stop();
      set(() => ({
        isGameLoopRunning: false,
        isGameLoopPaused: false,
      }));
    },

    pauseGameLoop: () => {
      getGameLoopService().pause();
      set(() => ({
        isGameLoopPaused: true,
      }));
    },

    resumeGameLoop: () => {
      getGameLoopService().resume();
      set(() => ({
        isGameLoopPaused: false,
      }));
    },

    updateGameLoopConfig: (newConfig: Partial<GameLoopConfig>) => {
      getGameLoopService().updateConfig(newConfig);
      set(state => ({
        gameLoopConfig: { ...state.gameLoopConfig, ...newConfig },
      }));
    },

    setPerformanceLevel: (level: PerformanceLevel) => {
      getGameLoopService().setPerformanceLevel(level);
      set(() => ({
        performanceLevel: level,
      }));
    },

    getGameLoopStats: () => {
      return getGameLoopService().getStats();
    },

    // 内部更新方法 - 定期同步 GameLoopService 的状态
    _updateGameLoopState: () => {
      const stats = getGameLoopService().getStats();
      const config = getGameLoopService().getConfig();
      const isRunning = getGameLoopService().isRunningState();
      const isPaused = getGameLoopService().isPausedState();

      set(() => ({
        isGameLoopRunning: isRunning,
        isGameLoopPaused: isPaused,
        gameLoopStats: stats,
        gameLoopConfig: config,
      }));
    },
  };
};
