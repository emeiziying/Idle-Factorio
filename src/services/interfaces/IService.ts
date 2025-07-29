/**
 * 服务接口定义
 * 定义了各种服务模式的标准接口
 */

// ========== 基础接口 ==========

/**
 * 基础服务接口
 */
export interface IService {
  readonly serviceName: string;
  readonly dependencies?: string[];
  
  initialize?(): Promise<void>;
  destroy?(): Promise<void>;
  
  getServiceInfo?(): ServiceInfo;
  healthCheck?(): Promise<HealthCheckResult>;
}

/**
 * 服务信息
 */
export interface ServiceInfo {
  name: string;
  version?: string;
  dependencies?: string[];
  initialized?: boolean;
  storageKeys?: string[];
  description?: string;
}

/**
 * 健康检查结果
 */
export interface HealthCheckResult {
  healthy: boolean;
  message: string;
  details?: Record<string, unknown>;
}

// ========== 服务能力接口 ==========

/**
 * 可配置服务
 */
export interface IConfigurable<TConfig = Record<string, unknown>> {
  configure(config: Partial<TConfig>): void;
  getConfiguration(): TConfig;
  resetConfiguration(): void;
}

/**
 * 可观察服务
 */
export interface IObservable<TEvent = unknown> {
  subscribe(event: string, handler: (data: TEvent) => void): () => void;
  unsubscribe(event: string, handler: (data: TEvent) => void): void;
  emit(event: string, data: TEvent): void;
}

/**
 * 可缓存服务
 */
export interface ICacheable {
  clearCache(): void;
  getCacheSize(): number;
  getCacheKeys(): string[];
  warmCache?(): Promise<void>;
}

/**
 * 可持久化服务
 */
export interface IPersistable {
  save(): Promise<void>;
  load(): Promise<void>;
  reset(): Promise<void>;
  getStorageKey(): string;
}

// ========== 专门服务接口 ==========

/**
 * 数据服务接口
 */
export interface IDataService extends IService, ICacheable {
  getItem(itemId: string): unknown | null;
  getRecipe(recipeId: string): unknown | null;
  getTechnology(techId: string): unknown | null;
  getLocalizedName(key: string, language?: string): string;
  isDataLoaded(): boolean;
}

/**
 * 状态管理服务接口
 */
export interface IStateService<TState = Record<string, unknown>> extends IService, IPersistable {
  getState(): TState;
  setState(state: Partial<TState>): void;
  resetState(): void;
  subscribeToChanges(handler: (state: TState) => void): () => void;
}

/**
 * 计算服务接口
 */
export interface IComputeService extends IService {
  compute<TInput = unknown, TOutput = unknown>(input: TInput): TOutput;
  computeAsync<TInput = unknown, TOutput = unknown>(input: TInput): Promise<TOutput>;
  batchCompute<TInput = unknown, TOutput = unknown>(inputs: TInput[]): TOutput[];
}

/**
 * 验证服务接口
 */
export interface IValidationService<TData = unknown> extends IService {
  validate(data: TData): ValidationResult;
  validateAsync(data: TData): Promise<ValidationResult>;
  getValidationRules(): ValidationRule[];
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
}

/**
 * 验证错误
 */
export interface ValidationError {
  field?: string;
  message: string;
  code?: string;
}

/**
 * 验证警告
 */
export interface ValidationWarning {
  field?: string;
  message: string;
  code?: string;
}

/**
 * 验证规则
 */
export interface ValidationRule {
  field: string;
  rules: Array<(value: unknown) => boolean | string>;
}

// ========== 工厂和管理接口 ==========

/**
 * 服务工厂接口
 */
export interface IServiceFactory {
  register<T extends IService>(name: string, constructor: new (...args: unknown[]) => T): void;
  create<T extends IService>(name: string): T;
  createAll(names: string[]): Map<string, IService>;
  has(name: string): boolean;
  reset(): void;
}

/**
 * 服务管理器接口
 */
export interface IServiceManager {
  registerService(
    name: string,
    constructor: new (...args: unknown[]) => IService,
    dependencies?: string[],
    priority?: number
  ): void;
  
  initializeService(name: string): Promise<void>;
  initializeAll(): Promise<void>;
  
  getService<T extends IService>(name: string): T | null;
  hasService(name: string): boolean;
  
  healthCheck(): Promise<ManagerHealthCheck>;
  exportConfiguration(): ManagerConfiguration;
}

/**
 * 管理器健康检查结果
 */
export interface ManagerHealthCheck {
  healthy: boolean;
  services: Record<string, HealthCheckResult>;
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
  };
}

/**
 * 管理器配置
 */
export interface ManagerConfiguration {
  services: Array<{
    name: string;
    dependencies: string[];
    priority: number;
    initialized: boolean;
  }>;
  initializationOrder: string[];
}

// ========== 高级模式接口 ==========

/**
 * 插件式服务
 */
export interface IPluggableService extends IService {
  registerPlugin(name: string, plugin: IServicePlugin): void;
  unregisterPlugin(name: string): void;
  getPlugin(name: string): IServicePlugin | null;
  getPlugins(): Map<string, IServicePlugin>;
}

/**
 * 服务插件接口
 */
export interface IServicePlugin {
  name: string;
  version?: string;
  
  onInstall?(service: IService): void;
  onUninstall?(service: IService): void;
  
  enhance?<T extends IService>(service: T): T;
  intercept?(method: string, args: unknown[], next: (...args: unknown[]) => unknown): unknown;
}

/**
 * 可扩展服务
 */
export interface IExtensibleService extends IService {
  extend<T>(name: string, extension: T): void;
  getExtension<T>(name: string): T | null;
  hasExtension(name: string): boolean;
  removeExtension(name: string): void;
}

/**
 * 服务代理接口
 */
export interface IServiceProxy<T extends IService> {
  getTarget(): T;
  invoke<K extends keyof T>(method: K, ...args: Parameters<T[K] extends (...args: infer P) => unknown ? (...args: P) => unknown : never>): ReturnType<T[K] extends (...args: unknown[]) => infer R ? (...args: unknown[]) => R : never>;
  addInterceptor(interceptor: MethodInterceptor): void;
  removeInterceptor(interceptor: MethodInterceptor): void;
}

/**
 * 方法拦截器
 */
export interface MethodInterceptor {
  before?(method: string, args: unknown[]): void;
  after?(method: string, args: unknown[], result: unknown): void;
  error?(method: string, args: unknown[], error: Error): void;
}

// ========== 类型导出 ==========

export type ServiceConstructor<T extends IService = IService> = new (...args: unknown[]) => T;
export type ServiceDecorator = <T extends ServiceConstructor>(constructor: T) => T;
export type PropertyDecorator = (target: object, propertyKey: string | symbol) => void;
export type MethodDecorator = (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => PropertyDescriptor;