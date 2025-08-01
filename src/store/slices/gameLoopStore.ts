// 游戏循环状态管理切片
import type { SliceCreator } from '@/store/types';
import type { GameLoopStats, GameLoopConfig, PerformanceLevel } from '@/types/gameLoop';
import { GameLoopService } from '@/services/GameLoopService';

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

export const createGameLoopSlice: SliceCreator<GameLoopSlice> = (set) => {
  const gameLoopService = GameLoopService.getInstance();
  
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
        slowFrames: 0
      }
    },
    gameLoopConfig: {
      targetFPS: 60,
      maxDeltaTime: 100,
      enableStats: true,
      enablePerformanceMode: true,
      backgroundThrottleRatio: 0.1
    },
    performanceLevel: 'high' as PerformanceLevel,

    // Actions
    startGameLoop: () => {
      gameLoopService.start();
      set(() => ({
        isGameLoopRunning: true,
        isGameLoopPaused: false
      }));
    },

    stopGameLoop: () => {
      gameLoopService.stop();
      set(() => ({
        isGameLoopRunning: false,
        isGameLoopPaused: false
      }));
    },

    pauseGameLoop: () => {
      gameLoopService.pause();
      set(() => ({
        isGameLoopPaused: true
      }));
    },

    resumeGameLoop: () => {
      gameLoopService.resume();
      set(() => ({
        isGameLoopPaused: false
      }));
    },

    updateGameLoopConfig: (newConfig: Partial<GameLoopConfig>) => {
      gameLoopService.updateConfig(newConfig);
      set((state) => ({
        gameLoopConfig: { ...state.gameLoopConfig, ...newConfig }
      }));
    },

    setPerformanceLevel: (level: PerformanceLevel) => {
      gameLoopService.setPerformanceLevel(level);
      set(() => ({
        performanceLevel: level
      }));
    },

    getGameLoopStats: () => {
      return gameLoopService.getStats();
    },

    // 内部更新方法 - 定期同步 GameLoopService 的状态
    _updateGameLoopState: () => {
      const stats = gameLoopService.getStats();
      const config = gameLoopService.getConfig();
      const isRunning = gameLoopService.isRunningState();
      const isPaused = gameLoopService.isPausedState();

      set(() => ({
        isGameLoopRunning: isRunning,
        isGameLoopPaused: isPaused,
        gameLoopStats: stats,
        gameLoopConfig: config
      }));
    }
  };
};