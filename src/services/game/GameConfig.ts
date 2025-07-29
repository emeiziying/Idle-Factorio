// 游戏配置常量
export const GAME_CONFIG = {
  // 基础游戏设置
  GAME_SPEED: {
    MIN: 0.1,
    MAX: 10,
    DEFAULT: 1,
    STEP: 0.1
  },

  // 自动保存设置
  AUTO_SAVE: {
    INTERVAL: 30000, // 30秒
    MAX_SAVES: 10
  },

  // UI配置
  UI: {
    ITEMS_PER_ROW: 8,
    MAX_VISIBLE_ROWS: 10,
    TOOLTIP_DELAY: 500
  },

  // 性能配置
  PERFORMANCE: {
    MAX_CONCURRENT_CALCULATIONS: 10,
    CALCULATION_BATCH_SIZE: 100,
    CACHE_TTL: 300000, // 5分钟
    MAX_CACHE_SIZE: 1000
  },

  // 游戏平衡配置
  BALANCE: {
    MANUAL_CRAFTING_SPEED_MULTIPLIER: 0.5,
    BASE_MINING_SPEED: 1,
    BASE_CRAFTING_SPEED: 1,
    EXPERIENCE_MULTIPLIER: 1,
    RESOURCE_SPAWN_RATE: 1
  },

  // 科技配置
  TECHNOLOGY: {
    RESEARCH_SPEED_MULTIPLIER: 1,
    MAX_RESEARCH_QUEUE: 10,
    AUTO_RESEARCH_ENABLED: false
  },

  // 生产配置
  PRODUCTION: {
    MAX_ASSEMBLERS: 1000,
    MAX_MINERS: 500,
    MAX_POWER_PLANTS: 100,
    EFFICIENCY_DECAY_RATE: 0.01
  },

  // 存储配置
  STORAGE: {
    DEFAULT_CHEST_SIZE: 48,
    MAX_STORAGE_SIZE: 240,
    COMPRESSION_ENABLED: true
  },

  // 物流配置
  LOGISTICS: {
    MAX_BELTS: 10000,
    BELT_SPEED_MULTIPLIER: 1,
    INSERTER_SPEED_MULTIPLIER: 1
  },

  // 电力配置
  POWER: {
    TRANSMISSION_EFFICIENCY: 0.95,
    MAX_POWER_LINES: 1000,
    SOLAR_EFFICIENCY: 0.7,
    ACCUMULATOR_EFFICIENCY: 0.8
  },

  // 燃料配置
  FUEL: {
    BURN_EFFICIENCY: 1,
    POLLUTION_MULTIPLIER: 1,
    FUEL_CONSUMPTION_MULTIPLIER: 1
  },

  // 污染配置
  POLLUTION: {
    ENABLED: true,
    SPREAD_RATE: 1,
    DECAY_RATE: 0.01,
    BITER_ATTACK_THRESHOLD: 100
  },

  // 地图配置
  MAP: {
    CHUNK_SIZE: 32,
    RENDER_DISTANCE: 5,
    MAX_MAP_SIZE: 2048
  },

  // 调试配置
  DEBUG: {
    SHOW_FPS: false,
    SHOW_DEBUG_INFO: false,
    LOG_LEVEL: 'info' as 'debug' | 'info' | 'warn' | 'error',
    ENABLE_CHEATS: false
  }
};

// 配置验证函数
export function validateGameConfig(config: Record<string, unknown>): boolean {
  try {
    // 检查必要的配置项
    const requiredKeys = ['GAME_SPEED', 'AUTO_SAVE', 'UI', 'PERFORMANCE'];
    for (const key of requiredKeys) {
      if (!config[key]) {
        console.error(`Missing required config: ${key}`);
        return false;
      }
    }

    // 检查数值范围
    const gameSpeed = config.GAME_SPEED as any;
    if (gameSpeed && gameSpeed.MIN >= gameSpeed.MAX) {
      console.error('Invalid game speed range');
      return false;
    }

    const autoSave = config.AUTO_SAVE as any;
    if (autoSave && autoSave.INTERVAL < 1000) {
      console.error('Auto save interval too short');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Config validation error:', error);
    return false;
  }
}

// 获取配置值的辅助函数
export function getConfigValue<T>(path: string, defaultValue: T): T {
  try {
    const keys = path.split('.');
    let value: unknown = GAME_CONFIG;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = (value as Record<string, unknown>)[key];
      } else {
        return defaultValue;
      }
    }
    
    return value as T;
  } catch {
    return defaultValue;
  }
}

// 动态配置类型
export interface DynamicConfig {
  gameSpeed: number;
  autoSaveEnabled: boolean;
  autoSaveInterval: number;
  showDebugInfo: boolean;
  logLevel: string;
  researchSpeedMultiplier: number;
  productionSpeedMultiplier: number;
}

// 默认动态配置
export const DEFAULT_DYNAMIC_CONFIG: DynamicConfig = {
  gameSpeed: GAME_CONFIG.GAME_SPEED.DEFAULT,
  autoSaveEnabled: true,
  autoSaveInterval: GAME_CONFIG.AUTO_SAVE.INTERVAL,
  showDebugInfo: GAME_CONFIG.DEBUG.SHOW_DEBUG_INFO,
  logLevel: GAME_CONFIG.DEBUG.LOG_LEVEL,
  researchSpeedMultiplier: GAME_CONFIG.TECHNOLOGY.RESEARCH_SPEED_MULTIPLIER,
  productionSpeedMultiplier: GAME_CONFIG.BALANCE.BASE_CRAFTING_SPEED
};

// 配置管理器
export class ConfigManager {
  private static instance: ConfigManager;
  private dynamicConfig: DynamicConfig;
  private listeners: Map<string, ((value: unknown) => void)[]> = new Map();

  private constructor() {
    this.dynamicConfig = { ...DEFAULT_DYNAMIC_CONFIG };
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  getDynamicConfig(): DynamicConfig {
    return { ...this.dynamicConfig };
  }

  setConfigValue<K extends keyof DynamicConfig>(key: K, value: DynamicConfig[K]): void {
    this.dynamicConfig[key] = value;

    // 触发监听器
    this.notifyListeners(key, value);
  }

  getConfigValue<K extends keyof DynamicConfig>(key: K): DynamicConfig[K] {
    return this.dynamicConfig[key];
  }

  subscribe<K extends keyof DynamicConfig>(
    key: K, 
    callback: (value: DynamicConfig[K]) => void
  ): () => void {
    if (!this.listeners.has(key as string)) {
      this.listeners.set(key as string, []);
    }
    
    const listeners = this.listeners.get(key as string)!;
    listeners.push(callback as (value: unknown) => void);

    // 返回取消订阅函数
    return () => {
      const index = listeners.indexOf(callback as (value: unknown) => void);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(key: string, value: unknown): void {
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.forEach(callback => callback(value));
    }
  }

  // 重置为默认配置
  resetToDefaults(): void {
    this.dynamicConfig = { ...DEFAULT_DYNAMIC_CONFIG };

    // 通知所有监听器
    for (const key in this.dynamicConfig) {
      this.notifyListeners(key, this.dynamicConfig[key as keyof DynamicConfig]);
    }
  }

  // 从localStorage加载配置
  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('gameConfig');
      if (stored) {
        const parsedConfig = JSON.parse(stored);
        this.dynamicConfig = { ...DEFAULT_DYNAMIC_CONFIG, ...parsedConfig };
      }
    } catch (error) {
      console.warn('Failed to load config from storage:', error);
    }
  }

  // 保存配置到localStorage
  saveToStorage(): void {
    try {
      localStorage.setItem('gameConfig', JSON.stringify(this.dynamicConfig));
    } catch (error) {
      console.warn('Failed to save config to storage:', error);
    }
  }
}