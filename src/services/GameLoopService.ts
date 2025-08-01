// 游戏循环服务 - 基于 requestAnimationFrame 的统一循环管理
import type { 
  GameLoopTask, 
  GameLoopStats, 
  GameLoopConfig 
} from '@/types/gameLoop';
import { PerformanceLevel } from '@/types/gameLoop';

export class GameLoopService {
  private static instance: GameLoopService;
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private tasks: Map<string, GameLoopTask> = new Map();
  
  // 性能统计
  private stats: GameLoopStats = {
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
  };

  // 配置
  private config: GameLoopConfig = {
    targetFPS: 60,
    maxDeltaTime: 100, // 最大 100ms delta，防止大跳跃
    enableStats: true,
    enablePerformanceMode: false,
    backgroundThrottleRatio: 0.1 // 后台时降到 10% 频率
  };

  // 状态
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private isVisible: boolean = true;
  private performanceLevel: PerformanceLevel = PerformanceLevel.HIGH;
  
  // 性能监控
  private frameTimeBuffer: number[] = [];
  private readonly FRAME_TIME_BUFFER_SIZE = 60;
  private slowFrameThreshold: number = 16.67; // 60fps = 16.67ms per frame

  private constructor() {
    this.setupVisibilityHandling();
    this.setupPerformanceMonitoring();
  }

  static getInstance(): GameLoopService {
    if (!GameLoopService.instance) {
      GameLoopService.instance = new GameLoopService();
    }
    return GameLoopService.instance;
  }

  // 启动游戏循环
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.isPaused = false;
    this.lastFrameTime = performance.now();
    this.stats.frameCount = 0;
    
    console.log('[GameLoop] 启动游戏循环');
    this.loop();
  }

  // 停止游戏循环
  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    console.log('[GameLoop] 停止游戏循环');
  }

  // 暂停/恢复游戏循环
  pause(): void {
    this.isPaused = true;
    console.log('[GameLoop] 暂停游戏循环');
  }

  resume(): void {
    if (this.isPaused) {
      this.isPaused = false;
      this.lastFrameTime = performance.now(); // 重置时间，避免大跳跃
      console.log('[GameLoop] 恢复游戏循环');
    }
  }

  // 主循环
  private loop(): void {
    if (!this.isRunning) return;

    const frameStartTime = performance.now();
    const deltaTime = Math.min(frameStartTime - this.lastFrameTime, this.config.maxDeltaTime);
    
    this.lastFrameTime = frameStartTime;
    this.stats.totalTime += deltaTime;
    this.stats.deltaTime = deltaTime;
    this.stats.frameCount++;

    // 只有在非暂停状态下才执行任务
    if (!this.isPaused) {
      this.executeTasks(deltaTime, this.stats.totalTime);
    }

    // 更新性能统计
    if (this.config.enableStats) {
      this.updateStats(frameStartTime);
    }

    // 根据页面可见性和性能等级调整下一帧的调度
    this.scheduleNextFrame();
  }

  // 执行所有任务
  private executeTasks(deltaTime: number, totalTime: number): void {
    let tasksExecuted = 0;

    // 按优先级排序执行任务
    const sortedTasks = Array.from(this.tasks.values())
      .filter(task => task.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const task of sortedTasks) {
      try {
        // 检查固定时间步长任务是否需要执行
        if (task.fixedTimeStep) {
          const timeSinceLastExecution = totalTime - task.lastExecutionTime;
          if (timeSinceLastExecution < task.fixedTimeStep) {
            continue; // 跳过这个任务
          }
          task.lastExecutionTime = totalTime;
        }

        task.update(deltaTime, totalTime);
        tasksExecuted++;
      } catch (error) {
        console.error(`[GameLoop] 任务执行错误: ${task.name}`, error);
      }
    }

    this.stats.tasksExecuted = tasksExecuted;
  }

  // 更新性能统计
  private updateStats(frameStartTime: number): void {
    const frameEndTime = performance.now();
    const frameTime = frameEndTime - frameStartTime;
    
    this.stats.performance.frameTime = frameTime;
    
    // 维护帧时间缓冲区
    this.frameTimeBuffer.push(frameTime);
    if (this.frameTimeBuffer.length > this.FRAME_TIME_BUFFER_SIZE) {
      this.frameTimeBuffer.shift();
    }

    // 计算平均帧时间
    if (this.frameTimeBuffer.length > 0) {
      const sum = this.frameTimeBuffer.reduce((a, b) => a + b, 0);
      this.stats.performance.averageFrameTime = sum / this.frameTimeBuffer.length;
    }

    // 检测慢帧
    if (frameTime > this.slowFrameThreshold) {
      this.stats.performance.slowFrames++;
    }

    // 计算 FPS
    if (this.stats.deltaTime > 0) {
      this.stats.fps = Math.round(1000 / this.stats.deltaTime);
    }

    // 计算平均 delta time
    if (this.stats.frameCount > 0) {
      this.stats.averageDeltaTime = this.stats.totalTime / this.stats.frameCount;
    }

    // 根据性能自动调整性能等级
    this.adjustPerformanceLevel();
  }

  // 调度下一帧
  private scheduleNextFrame(): void {
    if (!this.isRunning) return;

    // 根据页面可见性和性能等级决定调度方式
    if (!this.isVisible) {
      // 页面不可见时，使用 setTimeout 降低频率
      const throttledInterval = (1000 / this.config.targetFPS) / this.config.backgroundThrottleRatio;
      setTimeout(() => this.loop(), throttledInterval);
    } else if (this.performanceLevel === PerformanceLevel.LOW) {
      // 低性能模式，降低到 15 FPS
      setTimeout(() => this.loop(), 1000 / 15);
    } else if (this.performanceLevel === PerformanceLevel.MEDIUM) {
      // 中等性能模式，降低到 30 FPS
      setTimeout(() => this.loop(), 1000 / 30);
    } else {
      // 正常情况使用 requestAnimationFrame
      this.animationFrameId = requestAnimationFrame(() => this.loop());
    }
  }

  // 自动调整性能等级
  private adjustPerformanceLevel(): void {
    if (!this.config.enablePerformanceMode) return;

    const avgFrameTime = this.stats.performance.averageFrameTime;
    const targetFrameTime = 1000 / this.config.targetFPS;

    if (avgFrameTime > targetFrameTime * 2) {
      this.setPerformanceLevel(PerformanceLevel.LOW);
    } else if (avgFrameTime > targetFrameTime * 1.5) {
      this.setPerformanceLevel(PerformanceLevel.MEDIUM);
    } else if (avgFrameTime < targetFrameTime * 0.8) {
      this.setPerformanceLevel(PerformanceLevel.HIGH);
    }
  }

  // 设置性能等级
  setPerformanceLevel(level: PerformanceLevel): void {
    if (this.performanceLevel !== level) {
      this.performanceLevel = level;
      console.log(`[GameLoop] 性能等级调整为: ${level}`);
    }
  }

  // 设置页面可见性处理
  private setupVisibilityHandling(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.isVisible = !document.hidden;
        
        if (this.isVisible) {
          // 页面变为可见时，重置时间避免大跳跃
          this.lastFrameTime = performance.now();
          console.log('[GameLoop] 页面可见，恢复正常频率');
        } else {
          console.log('[GameLoop] 页面隐藏，降低更新频率');
        }
      });
    }
  }

  // 设置性能监控
  private setupPerformanceMonitoring(): void {
    // 每5秒重置慢帧计数
    setInterval(() => {
      this.stats.performance.slowFrames = 0;
    }, 5000);
  }

  // 任务管理方法
  addTask(task: GameLoopTask): void {
    task.lastExecutionTime = 0;
    this.tasks.set(task.id, task);
    console.log(`[GameLoop] 添加任务: ${task.name}`);
  }

  removeTask(taskId: string): void {
    if (this.tasks.delete(taskId)) {
      console.log(`[GameLoop] 移除任务: ${taskId}`);
    }
  }

  enableTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.enabled = true;
    }
  }

  disableTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.enabled = false;
    }
  }

  // 获取状态和统计信息
  getStats(): GameLoopStats {
    return { ...this.stats };
  }

  getConfig(): GameLoopConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<GameLoopConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('[GameLoop] 配置已更新', this.config);
  }

  isRunningState(): boolean {
    return this.isRunning;
  }

  isPausedState(): boolean {
    return this.isPaused;
  }

  // 调试方法
  debugInfo(): void {
    console.log('[GameLoop] 调试信息:', {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      isVisible: this.isVisible,
      performanceLevel: this.performanceLevel,
      tasksCount: this.tasks.size,
      stats: this.stats,
      config: this.config
    });
  }
}