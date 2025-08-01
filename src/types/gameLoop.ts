// 游戏循环系统类型定义

export interface GameLoopTask {
  id: string;
  name: string;
  priority: number; // 优先级，数字越小优先级越高
  fixedTimeStep?: number; // 固定时间步长(ms)，用于不需要每帧更新的任务
  lastExecutionTime: number;
  update: (deltaTime: number, totalTime: number) => void;
  enabled: boolean;
}

export interface GameLoopStats {
  fps: number;
  deltaTime: number;
  totalTime: number;
  frameCount: number;
  averageDeltaTime: number;
  tasksExecuted: number;
  performance: {
    frameTime: number; // 当前帧耗时
    averageFrameTime: number; // 平均帧耗时
    slowFrames: number; // 慢帧计数
  };
}

export interface GameLoopConfig {
  targetFPS: number;
  maxDeltaTime: number; // 最大 delta 时间，防止大跳跃
  enableStats: boolean;
  enablePerformanceMode: boolean; // 性能模式，降低更新频率
  backgroundThrottleRatio: number; // 后台节流比例
}

export interface GameLoopState {
  isRunning: boolean;
  isPaused: boolean;
  isVisible: boolean; // 页面是否可见
  config: GameLoopConfig;
  stats: GameLoopStats;
  tasks: Map<string, GameLoopTask>;
}

// 任务类型常量
export const GameLoopTaskType = {
  CRAFTING: 'crafting',
  FACILITIES: 'facilities',
  FUEL_CONSUMPTION: 'fuel-consumption',
  RESEARCH: 'research',
  STATISTICS: 'statistics',
  AUTO_SAVE: 'auto-save',
  UI_UPDATES: 'ui-updates',
} as const;

export type GameLoopTaskType = (typeof GameLoopTaskType)[keyof typeof GameLoopTaskType];

// 性能等级常量
export const PerformanceLevel = {
  HIGH: 'high', // 60 FPS
  MEDIUM: 'medium', // 30 FPS
  LOW: 'low', // 15 FPS
  BACKGROUND: 'background', // 1 FPS
} as const;

export type PerformanceLevel = (typeof PerformanceLevel)[keyof typeof PerformanceLevel];
