/**
 * 基础服务抽象类
 * 提供通用的单例模式、依赖注入和错误处理机制
 */
import { ServiceLocator } from '../utils/ServiceLocator';
import type { DataService } from '../core/DataService';

export abstract class BaseService {
  private static instances = new Map<string, BaseService>();
  protected dataService?: DataService;
  protected logger?: Console;

  protected constructor() {
    // 延迟初始化依赖
  }

  /**
   * 获取服务实例（单例模式）
   */
  static getInstance<T extends BaseService>(this: typeof BaseService): T {
    const serviceName = this.name;
    
    if (!BaseService.instances.has(serviceName)) {
      // 使用 (this as any) 来绕过 protected 构造函数的限制
      const instance = new this();
      BaseService.instances.set(serviceName, instance);
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
   * 清理服务实例（主要用于测试）
   */
  static clearInstance(): void {
    const serviceName = this.name;
    BaseService.instances.delete(serviceName);
  }

  /**
   * 清理所有服务实例（主要用于测试）
   */
  static clearAllInstances(): void {
    BaseService.instances.clear();
  }
} 