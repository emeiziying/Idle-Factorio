/**
 * HMR 工具使用示例
 * 这个文件展示了如何在不同场景下使用 HMR 工具
 */

import { setupHMR, setupSingletonHMR, setupGameLoopHMR } from './hmr';

// ===== 示例 1: 基础模块 =====
class DataManager {
  private data: Map<string, any> = new Map();
  
  set(key: string, value: any): void {
    this.data.set(key, value);
  }
  
  get(key: string): any {
    return this.data.get(key);
  }
  
  clear(): void {
    this.data.clear();
  }
}

const dataManager = new DataManager();

// 设置 HMR
setupHMR({
  moduleName: 'DataManager',
}, {
  getState: () => {
    // 将 Map 转换为普通对象以便序列化
    const state: Record<string, any> = {};
    dataManager.data.forEach((value, key) => {
      state[key] = value;
    });
    return state;
  },
  restoreState: (state) => {
    // 从普通对象恢复 Map
    dataManager.clear();
    Object.entries(state).forEach(([key, value]) => {
      dataManager.set(key, value);
    });
  },
  onDispose: () => {
    console.log('DataManager: Cleaning up before HMR');
  }
});

// ===== 示例 2: 单例服务 =====
class ConfigService {
  private static instance: ConfigService;
  private config: Record<string, any> = {};
  private initialized = false;
  
  private constructor() {}
  
  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }
  
  initialize(config: Record<string, any>): void {
    this.config = config;
    this.initialized = true;
  }
  
  get(key: string): any {
    return this.config[key];
  }
}

// 设置单例 HMR
setupSingletonHMR({
  moduleName: 'ConfigService',
  getInstance: () => ConfigService.getInstance(),
  preserveProperties: ['config', 'initialized']
});

// ===== 示例 3: 游戏循环 =====
class AnimationLoop {
  private running = false;
  private frameId: number | null = null;
  private frameCount = 0;
  private callbacks: Set<(deltaTime: number) => void> = new Set();
  
  start(): void {
    if (this.running) return;
    this.running = true;
    this.loop();
  }
  
  stop(): void {
    this.running = false;
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }
  
  isRunning(): boolean {
    return this.running;
  }
  
  addCallback(callback: (deltaTime: number) => void): void {
    this.callbacks.add(callback);
  }
  
  removeCallback(callback: (deltaTime: number) => void): void {
    this.callbacks.delete(callback);
  }
  
  private loop = (): void => {
    if (!this.running) return;
    
    this.frameCount++;
    const deltaTime = 16; // 假设 60fps
    
    // 执行所有回调
    this.callbacks.forEach(callback => {
      try {
        callback(deltaTime);
      } catch (error) {
        console.error('Animation callback error:', error);
      }
    });
    
    this.frameId = requestAnimationFrame(this.loop);
  };
}

const animationLoop = new AnimationLoop();

// 设置游戏循环 HMR
setupGameLoopHMR({
  moduleName: 'AnimationLoop',
  isRunning: () => animationLoop.isRunning(),
  start: () => animationLoop.start(),
  stop: () => animationLoop.stop(),
  getExtraState: () => ({
    frameCount: animationLoop['frameCount'],
    // 注意：回调函数无法序列化，需要重新注册
  }),
  restoreExtraState: (state) => {
    animationLoop['frameCount'] = state.frameCount || 0;
  }
});

// ===== 示例 4: 复杂状态管理 =====
interface GameState {
  score: number;
  level: number;
  player: {
    x: number;
    y: number;
    health: number;
  };
}

class GameStateManager {
  private state: GameState = {
    score: 0,
    level: 1,
    player: { x: 0, y: 0, health: 100 }
  };
  
  private listeners: Array<(state: GameState) => void> = [];
  
  updateScore(delta: number): void {
    this.state.score += delta;
    this.notifyListeners();
  }
  
  updatePlayerPosition(x: number, y: number): void {
    this.state.player.x = x;
    this.state.player.y = y;
    this.notifyListeners();
  }
  
  subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }
  
  getState(): GameState {
    return { ...this.state };
  }
  
  setState(state: GameState): void {
    this.state = { ...state };
    this.notifyListeners();
  }
}

const gameStateManager = new GameStateManager();

// 设置带有深度状态的 HMR
setupHMR({
  moduleName: 'GameStateManager',
  autoRestore: true
}, {
  getState: () => ({
    gameState: gameStateManager.getState(),
    listenerCount: gameStateManager['listeners'].length
  }),
  restoreState: (state) => {
    if (state.gameState) {
      gameStateManager.setState(state.gameState);
    }
    console.log(`Restored game state, ${state.listenerCount} listeners need to re-subscribe`);
  }
});

// 导出示例实例供其他模块使用
export { dataManager, ConfigService, animationLoop, gameStateManager };