/**
 * 基础服务抽象类
 * 提供通用的单例模式、依赖注入和错误处理机制
 */
import { ServiceLocator } from '../ServiceLocator';
import { DataService } from '../DataService';
import { StorageManager } from './StorageManager';

export abstract class BaseService {
  private static instances = new Map<string, BaseService>();
  protected dataService?: DataService;
  protected storageManager: StorageManager;
  protected logger?: Console;
  
  // 服务元数据
  protected serviceName: string;
  protected dependencies: string[] = [];

  protected constructor() {
    this.serviceName = this.constructor.name;
    this.storageManager = StorageManager.getInstance();
    // 延迟初始化依赖
  }

  /**
   * 获取服务实例（单例模式）
   */
  static getInstance<T extends BaseService>(this: new () => T): T {
    const serviceName = this.name;
    
    if (!BaseService.instances.has(serviceName)) {
      const instance = new this();
      BaseService.instances.set(serviceName, instance);
      
      // 自动注册到ServiceLocator
      ServiceLocator.register(serviceName, instance);
      
      // 初始化依赖
      instance.initializeDependencies();
    }
    
    return BaseService.instances.get(serviceName) as T;
  }

  /**
   * 初始化服务依赖
   */
  protected initializeDependencies(): void {
    try {
      // 延迟获取DataService，避免循环依赖
      if (ServiceLocator.has('DataService')) {
        this.dataService = ServiceLocator.get<DataService>('DataService');
      }
      
      // 初始化其他声明的依赖
      this.dependencies.forEach(dep => {
        if (ServiceLocator.has(dep)) {
          (this as any)[this.toCamelCase(dep)] = ServiceLocator.get(dep);
        }
      });
    } catch (error) {
      console.warn(`Failed to initialize dependencies for ${this.constructor.name}:`, error);
    }
  }

  /**
   * 统一的错误处理方法
   */
  protected handleError(error: unknown, context: string): void {
    console.error(`[${this.constructor.name}] Error in ${context}:`, error);
    // 可以在这里添加错误上报逻辑
  }

  /**
   * 安全的异步操作包装器
   */
  protected async safeAsync<T>(
    operation: () => Promise<T>,
    context: string,
    fallback?: T
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error, context);
      if (fallback !== undefined) {
        return fallback;
      }
      throw error;
    }
  }

  /**
   * 安全的同步操作包装器
   */
  protected safe<T>(
    operation: () => T,
    context: string,
    fallback?: T
  ): T {
    try {
      return operation();
    } catch (error) {
      this.handleError(error, context);
      if (fallback !== undefined) {
        return fallback;
      }
      throw error;
    }
  }

  /**
   * 获取存储键名
   */
  protected getStorageKey(suffix?: string): string {
    const key = this.serviceName.toLowerCase();
    return suffix ? `${key}_${suffix}` : key;
  }

  /**
   * 从存储加载数据
   */
  protected loadFromStorage<T>(key?: string): T | null {
    const storageKey = key || this.getStorageKey();
    return this.storageManager.get<T>(storageKey);
  }

  /**
   * 保存数据到存储
   */
  protected saveToStorage<T>(data: T, key?: string): boolean {
    const storageKey = key || this.getStorageKey();
    return this.storageManager.set(storageKey, data);
  }

  /**
   * 从存储删除数据
   */
  protected removeFromStorage(key?: string): void {
    const storageKey = key || this.getStorageKey();
    this.storageManager.remove(storageKey);
  }

  /**
   * 批量依赖注入
   */
  protected injectDependencies(deps: Record<string, string>): void {
    Object.entries(deps).forEach(([property, serviceName]) => {
      if (ServiceLocator.has(serviceName)) {
        (this as any)[property] = ServiceLocator.get(serviceName);
      } else {
        console.warn(`[${this.serviceName}] Dependency ${serviceName} not found`);
      }
    });
  }

  /**
   * 将服务名转换为驼峰命名
   */
  private toCamelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  /**
   * 清理服务实例（主要用于测试）
   */
  static clearInstance(): void {
    const serviceName = this.name;
    BaseService.instances.delete(serviceName);
    ServiceLocator.clear();
  }

  /**
   * 清理所有服务实例（主要用于测试）
   */
  static clearAllInstances(): void {
    BaseService.instances.clear();
    ServiceLocator.clear();
  }

  /**
   * 获取服务状态信息
   */
  getServiceInfo(): {
    name: string;
    dependencies: string[];
    initialized: boolean;
    storageKeys: string[];
  } {
    return {
      name: this.serviceName,
      dependencies: this.dependencies,
      initialized: true,
      storageKeys: [] // 子类可以重写提供更多信息
    };
  }

  /**
   * 服务健康检查
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    message?: string;
  }> {
    return {
      healthy: true,
      message: 'Service is running'
    };
  }
} 