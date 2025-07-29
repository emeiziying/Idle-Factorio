// 依赖注入服务
// 管理服务之间的依赖关系和创建顺序

import { ServiceLocator, SERVICE_NAMES } from './ServiceLocator';

export interface DependencyMap {
  [serviceName: string]: string[];
}

export interface ServiceFactory<T = any> {
  create(): T;
  singleton?: boolean;
}

/**
 * 依赖注入和服务创建管理器
 */
export class DependencyService {
  private static instance: DependencyService;
  private factories = new Map<string, ServiceFactory>();
  private dependencies: DependencyMap = {};
  private created = new Set<string>();
  private creating = new Set<string>();

  private constructor() {}

  static getInstance(): DependencyService {
    if (!DependencyService.instance) {
      DependencyService.instance = new DependencyService();
    }
    return DependencyService.instance;
  }

  /**
   * 注册服务工厂
   */
  registerFactory<T>(
    name: string,
    factory: ServiceFactory<T>,
    dependencies: string[] = []
  ): void {
    this.factories.set(name, factory);
    this.dependencies[name] = dependencies;
  }

  /**
   * 创建服务实例
   */
  create<T>(name: string): T {
    if (this.creating.has(name)) {
      throw new Error(`Circular dependency detected when creating ${name}`);
    }

    // 如果是单例且已创建，从ServiceLocator获取
    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`Service factory for ${name} not found`);
    }

    if (factory.singleton !== false && ServiceLocator.has(name)) {
      return ServiceLocator.get<T>(name);
    }

    this.creating.add(name);

    try {
      // 创建依赖
      const deps = this.dependencies[name] || [];
      for (const dep of deps) {
        if (!ServiceLocator.has(dep)) {
          this.create(dep);
        }
      }

      // 创建服务实例
      const instance = factory.create();

      // 如果是单例，注册到ServiceLocator
      if (factory.singleton !== false) {
        ServiceLocator.register(name, instance);
        this.created.add(name);
      }

      return instance;
    } finally {
      this.creating.delete(name);
    }
  }

  /**
   * 批量创建服务
   */
  async createAll(serviceNames?: string[]): Promise<void> {
    const namesToCreate = serviceNames || Array.from(this.factories.keys());
    
    for (const name of namesToCreate) {
      if (!this.created.has(name)) {
        this.create(name);
      }
    }
  }

  /**
   * 获取依赖关系图
   */
  getDependencyGraph(): DependencyMap {
    return { ...this.dependencies };
  }

  /**
   * 获取拓扑排序的创建顺序
   */
  getCreationOrder(): string[] {
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
      
      const deps = this.dependencies[name] || [];
      for (const dep of deps) {
        visit(dep);
      }
      
      temp.delete(name);
      visited.add(name);
      result.push(name);
    };

    for (const name of this.factories.keys()) {
      visit(name);
    }

    return result;
  }

  /**
   * 检查是否存在循环依赖
   */
  hasCircularDependency(): boolean {
    try {
      this.getCreationOrder();
      return false;
    } catch (error) {
      return error instanceof Error && error.message.includes('Circular dependency');
    }
  }

  /**
   * 重置所有状态
   */
  reset(): void {
    this.factories.clear();
    this.dependencies = {};
    this.created.clear();
    this.creating.clear();
    ServiceLocator.clear();
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalFactories: number;
    createdServices: number;
    creatingServices: number;
    dependencyCount: number;
  } {
    return {
      totalFactories: this.factories.size,
      createdServices: this.created.size,
      creatingServices: this.creating.size,
      dependencyCount: Object.keys(this.dependencies).length
    };
  }
}

// 预定义的服务工厂注册
export function setupDefaultFactories(): void {
  const dependencyService = DependencyService.getInstance();
  
  // 这里可以预注册一些基础服务工厂
  // 实际的服务注册应该在各自的模块中进行
}

// 便捷的依赖注入装饰器（如果需要的话）
export function injectable(dependencies: string[] = []) {
  return function<T extends { new(...args: any[]): {} }>(constructor: T) {
    const serviceName = constructor.name;
    const dependencyService = DependencyService.getInstance();
    
    dependencyService.registerFactory(serviceName, {
      create: () => new constructor(),
      singleton: true
    }, dependencies);
    
    return constructor;
  };
}

// 依赖注入的辅助函数
export function inject<T>(serviceName: string): T {
  return DependencyService.getInstance().create<T>(serviceName);
}