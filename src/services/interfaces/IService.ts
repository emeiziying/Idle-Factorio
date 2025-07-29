/**
 * 服务接口定义
 * 为常见服务模式提供标准接口
 */

/**
 * 基础服务接口
 */
export interface IService {
  /**
   * 服务名称
   */
  readonly serviceName: string;
  
  /**
   * 初始化服务
   */
  initialize?(): Promise<void>;
  
  /**
   * 销毁服务
   */
  destroy?(): Promise<void>;
  
  /**
   * 健康检查
   */
  healthCheck?(): Promise<{
    healthy: boolean;
    message?: string;
  }>;
}

/**
 * 可持久化服务接口
 */
export interface IPersistableService extends IService {
  /**
   * 保存状态
   */
  save(): Promise<void>;
  
  /**
   * 加载状态
   */
  load(): Promise<void>;
  
  /**
   * 清除保存的状态
   */
  clear(): Promise<void>;
}

/**
 * 可观察服务接口
 */
export interface IObservableService extends IService {
  /**
   * 订阅变化
   */
  subscribe(callback: (data: any) => void): () => void;
  
  /**
   * 通知变化
   */
  notify(data: any): void;
}

/**
 * 状态管理服务接口
 */
export interface IStateService<T> extends IService {
  /**
   * 获取当前状态
   */
  getState(): T;
  
  /**
   * 设置状态
   */
  setState(state: Partial<T>): void;
  
  /**
   * 重置状态
   */
  resetState(): void;
  
  /**
   * 订阅状态变化
   */
  subscribe(callback: (state: T) => void): () => void;
}

/**
 * 数据访问服务接口
 */
export interface IDataService<T, K = string> extends IService {
  /**
   * 获取单个数据
   */
  get(id: K): T | undefined;
  
  /**
   * 获取所有数据
   */
  getAll(): T[];
  
  /**
   * 查询数据
   */
  query(predicate: (item: T) => boolean): T[];
  
  /**
   * 添加数据
   */
  add?(item: T): void;
  
  /**
   * 更新数据
   */
  update?(id: K, item: Partial<T>): void;
  
  /**
   * 删除数据
   */
  remove?(id: K): void;
}

/**
 * 计算服务接口
 */
export interface ICalculationService extends IService {
  /**
   * 执行计算
   */
  calculate(input: any): any;
  
  /**
   * 验证输入
   */
  validate?(input: any): boolean;
}

/**
 * 配置服务接口
 */
export interface IConfigService<T = any> extends IService {
  /**
   * 获取配置
   */
  getConfig<K extends keyof T>(key: K): T[K];
  
  /**
   * 设置配置
   */
  setConfig<K extends keyof T>(key: K, value: T[K]): void;
  
  /**
   * 获取所有配置
   */
  getAllConfig(): T;
  
  /**
   * 重置配置
   */
  resetConfig(): void;
}

/**
 * 验证服务接口
 */
export interface IValidationService extends IService {
  /**
   * 验证数据
   */
  validate(data: any, rules?: any): ValidationResult;
  
  /**
   * 批量验证
   */
  validateBatch?(data: any[], rules?: any): ValidationResult[];
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * 缓存服务接口
 */
export interface ICacheService extends IService {
  /**
   * 获取缓存
   */
  get<T>(key: string): T | undefined;
  
  /**
   * 设置缓存
   */
  set<T>(key: string, value: T, ttl?: number): void;
  
  /**
   * 删除缓存
   */
  remove(key: string): void;
  
  /**
   * 清除所有缓存
   */
  clear(): void;
  
  /**
   * 检查缓存是否存在
   */
  has(key: string): boolean;
}

/**
 * 事件服务接口
 */
export interface IEventService extends IService {
  /**
   * 发送事件
   */
  emit(event: string, data?: any): void;
  
  /**
   * 监听事件
   */
  on(event: string, handler: (data: any) => void): () => void;
  
  /**
   * 监听一次
   */
  once(event: string, handler: (data: any) => void): void;
  
  /**
   * 移除监听
   */
  off(event: string, handler?: (data: any) => void): void;
}

/**
 * 队列服务接口
 */
export interface IQueueService<T> extends IService {
  /**
   * 入队
   */
  enqueue(item: T): void;
  
  /**
   * 出队
   */
  dequeue(): T | undefined;
  
  /**
   * 查看队首
   */
  peek(): T | undefined;
  
  /**
   * 获取队列大小
   */
  size(): number;
  
  /**
   * 清空队列
   */
  clear(): void;
}

/**
 * 调度服务接口
 */
export interface ISchedulerService extends IService {
  /**
   * 调度任务
   */
  schedule(task: () => void, delay: number): number;
  
  /**
   * 取消任务
   */
  cancel(taskId: number): void;
  
  /**
   * 调度周期任务
   */
  scheduleInterval(task: () => void, interval: number): number;
  
  /**
   * 清除所有任务
   */
  clearAll(): void;
}