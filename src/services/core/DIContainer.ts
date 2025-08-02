/**
 * 依赖注入容器
 * 负责服务的注册、解析和生命周期管理
 */

type Constructor<T = Record<string, unknown>> = new (...args: unknown[]) => T;
type Factory<T> = () => T;
type AsyncFactory<T> = () => Promise<T>;

interface ServiceDefinition<T> {
  factory: Factory<T> | AsyncFactory<T>;
  singleton?: boolean;
  dependencies?: string[];
}

export class DIContainer {
  private static instance: DIContainer;
  private services = new Map<string, ServiceDefinition<unknown>>();
  private instances = new Map<string, unknown>();
  private resolving = new Set<string>(); // 防止循环依赖

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  /**
   * 注册服务类（自动依赖注入）
   */
  register<T>(
    token: string,
    constructor: Constructor<T>,
    options?: {
      singleton?: boolean;
      dependencies?: string[];
    }
  ): void {
    this.services.set(token, {
      factory: () => {
        const deps = options?.dependencies || [];
        const resolvedDeps = deps.map(dep => this.resolve(dep));
        return new constructor(...resolvedDeps);
      },
      singleton: options?.singleton ?? true,
      dependencies: options?.dependencies,
    });
  }

  /**
   * 注册服务工厂函数
   */
  registerFactory<T>(
    token: string,
    factory: Factory<T> | AsyncFactory<T>,
    options?: {
      singleton?: boolean;
      dependencies?: string[];
    }
  ): void {
    this.services.set(token, {
      factory,
      singleton: options?.singleton ?? true,
      dependencies: options?.dependencies,
    });
  }

  /**
   * 注册服务实例
   */
  registerInstance<T>(token: string, instance: T): void {
    this.instances.set(token, instance);
  }

  /**
   * 解析服务实例
   */
  resolve<T>(token: string): T {
    // 检查是否已有实例
    if (this.instances.has(token)) {
      return this.instances.get(token) as T;
    }

    // 检查循环依赖
    if (this.resolving.has(token)) {
      throw new Error(
        `Circular dependency detected: ${Array.from(this.resolving).join(' -> ')} -> ${token}`
      );
    }

    const serviceDefinition = this.services.get(token);
    if (!serviceDefinition) {
      throw new Error(`Service '${token}' not registered`);
    }

    this.resolving.add(token);

    try {
      const instance = serviceDefinition.factory();

      // 如果是单例，缓存实例
      if (serviceDefinition.singleton) {
        this.instances.set(token, instance);
      }

      return instance as T;
    } finally {
      this.resolving.delete(token);
    }
  }

  /**
   * 异步解析服务实例
   */
  async resolveAsync<T>(token: string): Promise<T> {
    // 检查是否已有实例
    if (this.instances.has(token)) {
      return this.instances.get(token) as T;
    }

    // 检查循环依赖
    if (this.resolving.has(token)) {
      throw new Error(
        `Circular dependency detected: ${Array.from(this.resolving).join(' -> ')} -> ${token}`
      );
    }

    const serviceDefinition = this.services.get(token);
    if (!serviceDefinition) {
      throw new Error(`Service '${token}' not registered`);
    }

    this.resolving.add(token);

    try {
      const instance = await serviceDefinition.factory();

      // 如果是单例，缓存实例
      if (serviceDefinition.singleton) {
        this.instances.set(token, instance);
      }

      return instance as T;
    } finally {
      this.resolving.delete(token);
    }
  }

  /**
   * 检查服务是否已注册
   */
  has(token: string): boolean {
    return this.services.has(token) || this.instances.has(token);
  }

  /**
   * 清除所有服务（主要用于测试）
   */
  clear(): void {
    this.services.clear();
    this.instances.clear();
    this.resolving.clear();
  }

  /**
   * 获取服务依赖图（用于调试）
   */
  getDependencyGraph(): Record<string, string[]> {
    const graph: Record<string, string[]> = {};

    for (const [token, definition] of this.services) {
      graph[token] = definition.dependencies || [];
    }

    return graph;
  }
}

// 导出默认实例
export const container = DIContainer.getInstance();
