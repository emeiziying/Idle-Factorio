/**
 * 服务工厂
 * 统一管理服务的创建、单例和依赖注入
 */
import { ServiceLocator } from '../ServiceLocator';
import { StorageManager } from './StorageManager';

// 服务装饰器元数据
const serviceMetadata = new Map<string, ServiceMetadata>();

interface ServiceMetadata {
  name: string;
  dependencies: string[];
  singleton: boolean;
  lazy: boolean;
  autoRegister: boolean;
}

interface ServiceConstructor<T = any> {
  new (...args: any[]): T;
}

interface ServiceOptions {
  singleton?: boolean;
  lazy?: boolean;
  dependencies?: string[];
  autoRegister?: boolean;
}

/**
 * 服务装饰器
 * 用于标记服务类并配置其行为
 */
export function Service(options: ServiceOptions = {}) {
  return function <T extends ServiceConstructor>(constructor: T) {
    const metadata: ServiceMetadata = {
      name: constructor.name,
      dependencies: options.dependencies || [],
      singleton: options.singleton ?? true,
      lazy: options.lazy ?? true,
      autoRegister: options.autoRegister ?? true
    };
    
    serviceMetadata.set(constructor.name, metadata);
    
    // 如果需要自动注册
    if (metadata.autoRegister) {
      ServiceFactory.register(constructor.name, constructor as any);
    }
    
    return constructor;
  };
}

/**
 * 依赖注入装饰器
 * 用于自动注入服务依赖
 */
export function Inject(serviceName: string) {
  return function (target: any, propertyKey: string | symbol) {
    // 创建 getter 来延迟获取服务
    const descriptor = {
      get() {
        return ServiceLocator.get(serviceName);
      },
      enumerable: true,
      configurable: true
    };
    
    Object.defineProperty(target, propertyKey, descriptor);
  };
}

/**
 * 服务工厂类
 */
export class ServiceFactory {
  private static instances = new Map<string, any>();
  private static constructors = new Map<string, ServiceConstructor>();
  private static initializers = new Map<string, () => Promise<void>>();

  /**
   * 注册服务
   */
  static register<T>(name: string, constructor: ServiceConstructor<T>): void {
    this.constructors.set(name, constructor);
  }

  /**
   * 注册服务初始化器
   */
  static registerInitializer(name: string, initializer: () => Promise<void>): void {
    this.initializers.set(name, initializer);
  }

  /**
   * 创建或获取服务实例
   */
  static create<T>(name: string): T {
    const metadata = serviceMetadata.get(name);
    
    // 如果是单例模式，检查是否已存在
    if (metadata?.singleton && this.instances.has(name)) {
      return this.instances.get(name);
    }
    
    // 获取构造函数
    const constructor = this.constructors.get(name);
    if (!constructor) {
      throw new Error(`Service ${name} not registered`);
    }
    
    // 创建实例
    const instance = this.createInstance(constructor, metadata);
    
    // 如果是单例，缓存实例
    if (metadata?.singleton) {
      this.instances.set(name, instance);
      ServiceLocator.register(name, instance);
    }
    
    return instance as T;
  }

  /**
   * 创建服务实例
   */
  private static createInstance(constructor: ServiceConstructor, metadata?: ServiceMetadata): any {
    // 创建基础实例
    const instance = new constructor();
    
    // 注入依赖
    if (metadata?.dependencies) {
      this.injectDependencies(instance, metadata.dependencies);
    }
    
    // 注入通用服务
    this.injectCommonServices(instance);
    
    return instance;
  }

  /**
   * 注入依赖
   */
  private static injectDependencies(instance: any, dependencies: string[]): void {
    dependencies.forEach(dep => {
      const depInstance = this.create(dep);
      const propertyName = this.toCamelCase(dep);
      instance[propertyName] = depInstance;
    });
  }

  /**
   * 注入通用服务
   */
  private static injectCommonServices(instance: any): void {
    // 注入存储管理器
    if (!instance.storageManager) {
      instance.storageManager = StorageManager.getInstance();
    }
    
    // 注入日志
    if (!instance.logger) {
      instance.logger = console;
    }
  }

  /**
   * 批量创建服务
   */
  static createAll(serviceNames: string[]): Map<string, any> {
    const instances = new Map<string, any>();
    
    serviceNames.forEach(name => {
      try {
        instances.set(name, this.create(name));
      } catch (error) {
        console.error(`Failed to create service ${name}:`, error);
      }
    });
    
    return instances;
  }

  /**
   * 初始化服务
   */
  static async initialize(name: string): Promise<void> {
    const instance = this.create(name);
    const initializer = this.initializers.get(name);
    
    if (initializer) {
      await initializer.call(instance);
    }
    
    // 如果实例有 initialize 方法
    if (instance && typeof (instance as any).initialize === 'function') {
      await (instance as any).initialize();
    }
  }

  /**
   * 批量初始化服务
   */
  static async initializeAll(serviceNames: string[]): Promise<void> {
    // 按依赖顺序排序
    const sorted = this.sortByDependencies(serviceNames);
    
    // 依次初始化
    for (const name of sorted) {
      await this.initialize(name);
    }
  }

  /**
   * 按依赖关系排序服务
   */
  private static sortByDependencies(serviceNames: string[]): string[] {
    const sorted: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const visit = (name: string) => {
      if (visited.has(name)) return;
      if (visiting.has(name)) {
        throw new Error(`Circular dependency detected: ${name}`);
      }
      
      visiting.add(name);
      
      const metadata = serviceMetadata.get(name);
      if (metadata?.dependencies) {
        metadata.dependencies.forEach(dep => {
          if (serviceNames.includes(dep)) {
            visit(dep);
          }
        });
      }
      
      visiting.delete(name);
      visited.add(name);
      sorted.push(name);
    };
    
    serviceNames.forEach(visit);
    return sorted;
  }

  /**
   * 重置工厂（用于测试）
   */
  static reset(): void {
    this.instances.clear();
    this.constructors.clear();
    this.initializers.clear();
    ServiceLocator.clear();
  }

  /**
   * 获取服务元数据
   */
  static getMetadata(name: string): ServiceMetadata | undefined {
    return serviceMetadata.get(name);
  }

  /**
   * 获取所有注册的服务
   */
  static getRegisteredServices(): string[] {
    return Array.from(this.constructors.keys());
  }

  /**
   * 将服务名转换为驼峰命名
   */
  private static toCamelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }
}