/**
 * 服务注册表
 * 统一管理服务依赖和生命周期
 */
import { ServiceLocator } from '../ServiceLocator';
import { BaseService } from './BaseService';

export interface ServiceMetadata {
  name: string;
  dependencies: string[];
  priority: number; // 初始化优先级，数字越小优先级越高
  singleton: boolean;
}

export interface InitializableService extends BaseService {
  initialize?(): Promise<void>;
}

export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services = new Map<string, ServiceMetadata>();
  private initialized = new Set<string>();

  private constructor() {}

  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * 注册服务
   */
  register(
    name: string,
    serviceClass: typeof BaseService & { getInstance(): InitializableService },
    dependencies: string[] = [],
    priority: number = 100
  ): void {
    this.services.set(name, {
      name,
      dependencies,
      priority,
      singleton: true
    });

    // 注册到ServiceLocator
    ServiceLocator.register(name, serviceClass.getInstance());
  }

  /**
   * 按依赖顺序初始化所有服务
   */
  async initializeAll(): Promise<void> {
    const sortedServices = this.getTopologicalSort();
    
    for (const serviceName of sortedServices) {
      await this.initializeService(serviceName);
    }
  }

  /**
   * 初始化单个服务
   */
  async initializeService(name: string): Promise<void> {
    if (this.initialized.has(name)) {
      return;
    }

    const metadata = this.services.get(name);
    if (!metadata) {
      throw new Error(`Service ${name} not registered`);
    }

    // 初始化依赖
    for (const dependency of metadata.dependencies) {
      await this.initializeService(dependency);
    }

    // 获取服务实例并初始化
    const service = ServiceLocator.get<InitializableService>(name);
    if (service && service.initialize) {
      await service.initialize();
    }

    this.initialized.add(name);
  }

  /**
   * 获取拓扑排序的服务列表
   */
  private getTopologicalSort(): string[] {
    const visited = new Set<string>();
    const temp = new Set<string>();
    const result: string[] = [];

    const visit = (name: string): void => {
      if (temp.has(name)) {
        throw new Error(`Circular dependency detected: ${name}`);
      }
      if (visited.has(name)) {
        return;
      }

      temp.add(name);
      
      const metadata = this.services.get(name);
      if (metadata) {
        for (const dependency of metadata.dependencies) {
          visit(dependency);
        }
      }
      
      temp.delete(name);
      visited.add(name);
      result.push(name);
    };

    // 按优先级排序
    const sortedServices = Array.from(this.services.keys())
      .sort((a, b) => {
        const aMeta = this.services.get(a)!;
        const bMeta = this.services.get(b)!;
        return aMeta.priority - bMeta.priority;
      });

    for (const name of sortedServices) {
      visit(name);
    }

    return result;
  }

  /**
   * 检查服务是否已初始化
   */
  isInitialized(name: string): boolean {
    return this.initialized.has(name);
  }

  /**
   * 获取服务依赖图
   */
  getDependencyGraph(): Record<string, string[]> {
    const graph: Record<string, string[]> = {};
    
    for (const [name, metadata] of this.services.entries()) {
      graph[name] = metadata.dependencies;
    }
    
    return graph;
  }

  /**
   * 清理所有服务
   */
  clear(): void {
    this.services.clear();
    this.initialized.clear();
    ServiceLocator.clear();
  }

  /**
   * 获取服务统计信息
   */
  getStats(): {
    totalServices: number;
    initializedServices: number;
    dependencyGraph: Record<string, string[]>;
  } {
    return {
      totalServices: this.services.size,
      initializedServices: this.initialized.size,
      dependencyGraph: this.getDependencyGraph()
    };
  }
} 