// 集中导出所有服务相关的接口

// 基础服务接口
export interface IBaseService {
  initialize?(): Promise<void>;
}

// 缓存相关接口
export interface ICacheOptions {
  ttl?: number;
  maxSize?: number;
  enableLRU?: boolean;
}

export interface ICacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
}

// 服务注册相关接口
export interface IServiceMetadata {
  name: string;
  dependencies: string[];
  priority: number;
  singleton: boolean;
}

export interface IInitializableService {
  initialize?(): Promise<void>;
}

// 数据服务相关接口
export interface II18nData {
  categories: Record<string, string>;
  items: Record<string, string>;
  recipes: Record<string, string>;
  locations: Record<string, string>;
  technologies?: Record<string, string>;
}

// 手动制作验证器接口
export type { IManualCraftingValidator } from './IManualCraftingValidator';

// 具体服务接口类型
export {
  type IDataService,
  type IPowerService,
  type ITechnologyService,
  type IGameStorageService,
  type IStorageService as IStorageGameService,
  type IRecipeService,
  type ServiceTypeMap
} from './ServiceTypes';

// 依赖注入相关接口
export interface IDependencyMap {
  [serviceName: string]: string[];
}

export interface IServiceFactory<T = unknown> {
  create(): T;
  singleton?: boolean;
}

// 游戏状态相关接口
export interface IGameState {
  [key: string]: unknown;
}

export interface IGameStateAdapter {
  getState(): IGameState;
  setState(state: Partial<IGameState>): void;
  subscribe(callback: (state: IGameState) => void): () => void;
}

// 存储服务接口
export interface IStorageService {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
  has(key: string): boolean;
}

// 用户进度接口
export interface IUserProgress {
  level: number;
  experience: number;
  unlockedTechnologies: string[];
  completedAchievements: string[];
  settings: Record<string, unknown>;
}

// 服务统计接口
export interface IServiceStats {
  name: string;
  initialized: boolean;
  dependencies: string[];
  cacheStats?: {
    size: number;
    hitRate: number;
    totalHits: number;
    totalMisses: number;
  };
}

// 配方服务接口
export interface IRecipeCalculationResult {
  inputs: Record<string, number>;
  outputs: Record<string, number>;
  time: number;
  power?: number;
}

// 燃料服务接口
export interface IFuelInfo {
  id: string;
  value: number;
  category: string;
  pollution?: number;
}

// 电力服务接口
export interface IPowerInfo {
  production: number;
  consumption: number;
  efficiency: number;
  sources: string[];
}

// 科技服务接口
export interface ITechnologyInfo {
  id: string;
  name: string;
  description?: string;
  prerequisites: string[];
  cost: Record<string, number>;
  time: number;
  unlocks: {
    recipes?: string[];
    items?: string[];
    buildings?: string[];
  };
}