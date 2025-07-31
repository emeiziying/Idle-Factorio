// 统一游戏循环管理器 - 使用 requestAnimationFrame 替代多个 setInterval

type LoopCallback = (deltaTime: number, currentTime: number) => void;

interface LoopTask {
  id: string;
  callback: LoopCallback;
  interval: number; // 更新间隔（毫秒）
  lastUpdate: number; // 上次更新时间
  enabled: boolean;
}

class GameLoopManager {
  private static instance: GameLoopManager;
  private tasks: Map<string, LoopTask> = new Map();
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;

  private constructor() {}

  static getInstance(): GameLoopManager {
    if (!GameLoopManager.instance) {
      GameLoopManager.instance = new GameLoopManager();
    }
    return GameLoopManager.instance;
  }

  // 注册一个循环任务
  register(id: string, callback: LoopCallback, interval: number = 16): void {
    const currentTime = performance.now();
    this.tasks.set(id, {
      id,
      callback,
      interval,
      lastUpdate: currentTime,
      enabled: true,
    });

    // 如果循环未运行，启动它
    if (!this.isRunning) {
      this.start();
    }
  }

  // 取消注册任务
  unregister(id: string): void {
    this.tasks.delete(id);

    // 如果没有任务了，停止循环
    if (this.tasks.size === 0) {
      this.stop();
    }
  }

  // 启用/禁用任务
  setEnabled(id: string, enabled: boolean): void {
    const task = this.tasks.get(id);
    if (task) {
      task.enabled = enabled;
    }
  }

  // 更新任务间隔
  setInterval(id: string, interval: number): void {
    const task = this.tasks.get(id);
    if (task) {
      task.interval = interval;
    }
  }

  // 启动游戏循环
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.loop();
  }

  // 停止游戏循环
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // 主循环
  private loop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();

    // 执行所有启用的任务
    for (const task of this.tasks.values()) {
      if (!task.enabled) continue;

      const timeSinceLastUpdate = currentTime - task.lastUpdate;
      
      // 检查是否到了更新时间
      if (timeSinceLastUpdate >= task.interval) {
        try {
          // 计算实际的 deltaTime（秒）
          const deltaTime = timeSinceLastUpdate / 1000;
          task.callback(deltaTime, currentTime);
          task.lastUpdate = currentTime;
        } catch (error) {
          console.error(`Game loop task ${task.id} error:`, error);
        }
      }
    }

    // 请求下一帧
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  // 获取任务信息
  getTaskInfo(id: string): LoopTask | undefined {
    return this.tasks.get(id);
  }

  // 获取所有任务
  getAllTasks(): LoopTask[] {
    return Array.from(this.tasks.values());
  }

  // 清理所有任务
  clear(): void {
    this.tasks.clear();
    this.stop();
  }
}

export default GameLoopManager;

// HMR 支持 - 在热重载时正确清理和恢复游戏循环
if (import.meta.hot) {
  // 保存当前的任务状态
  import.meta.hot.dispose(() => {
    const instance = GameLoopManager.getInstance();
    const tasks = instance.getAllTasks();
    
    // 保存任务信息到 HMR 数据中
    import.meta.hot!.data.tasks = tasks.map(task => ({
      id: task.id,
      interval: task.interval,
      enabled: task.enabled,
      // 注意：callback 函数无法序列化，需要在 accept 中重新注册
    }));
    
    // 停止当前循环
    instance.stop();
    instance.clear();
    
    console.log('[HMR] GameLoopManager: Saved tasks and stopped loop', import.meta.hot!.data.tasks);
  });
  
  // 恢复任务状态
  import.meta.hot.accept(() => {
    console.log('[HMR] GameLoopManager: Module accepted, restoring state');
    
    // 注意：由于单例模式，新模块的实例会自动创建
    // 但我们需要通知依赖此模块的其他模块重新注册它们的任务
    
    // 保存的任务信息仅用于调试，实际的任务需要由各个系统重新注册
    if (import.meta.hot!.data.tasks) {
      console.log('[HMR] GameLoopManager: Previous tasks:', import.meta.hot!.data.tasks);
    }
  });
}