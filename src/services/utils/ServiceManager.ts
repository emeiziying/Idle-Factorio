/**
 * 服务管理器
 * 统一管理所有服务的注册、初始化和健康检查
 */
import { ServiceLocator } from '../ServiceLocator';
import { ServiceRegistry } from '../base/ServiceRegistry';
import { BaseService } from '../base/BaseService';
import type { ServiceInfo } from '../interfaces/IService';

interface ServiceStatus {
  name: string;
  registered: boolean;
  initialized: boolean;
  healthy: boolean;
  message?: string;
  dependencies: string[];
}

export class ServiceManager {
  private static instance: ServiceManager;
  private registry: ServiceRegistry;
  private serviceMap = new Map<string, BaseService>();

  private constructor() {
    this.registry = ServiceRegistry.getInstance();
  }

  static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  /**
   * 注册服务
   */
  registerService(
    name: string,
    serviceClass: typeof BaseService & { getInstance(): BaseService },
    dependencies: string[] = [],
    priority: number = 100
  ): void {
    this.registry.register(name, serviceClass, dependencies, priority);
    const instance = serviceClass.getInstance();
    this.serviceMap.set(name, instance);
  }

  /**
   * 批量注册服务
   */
  registerServices(services: Array<{
    name: string;
    class: typeof BaseService & { getInstance(): BaseService };
    dependencies?: string[];
    priority?: number;
  }>): void {
    services.forEach(service => {
      this.registerService(
        service.name,
        service.class,
        service.dependencies,
        service.priority
      );
    });
  }

  /**
   * 初始化所有服务
   */
  async initializeAll(): Promise<void> {
    await this.registry.initializeAll();
  }

  /**
   * 获取服务状态
   */
  async getServiceStatus(name: string): Promise<ServiceStatus> {
    const service = this.serviceMap.get(name);
    const isRegistered = ServiceLocator.has(name);
    const isInitialized = this.registry.isInitialized(name);
    
    let health = { healthy: false, message: 'Service not found' };
    if (service && 'healthCheck' in service) {
      const result = await service.healthCheck();
      health = { healthy: result.healthy, message: result.message || 'No message' };
    }

    return {
      name,
      registered: isRegistered,
      initialized: isInitialized,
      healthy: health.healthy,
      message: health.message,
      dependencies: this.registry.getDependencyGraph()[name] || []
    };
  }

  /**
   * 获取所有服务状态
   */
  async getAllServiceStatus(): Promise<ServiceStatus[]> {
    const statuses: ServiceStatus[] = [];
    
    for (const [name] of this.serviceMap) {
      const status = await this.getServiceStatus(name);
      statuses.push(status);
    }
    
    return statuses;
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    services: ServiceStatus[];
    summary: {
      total: number;
      healthy: number;
      unhealthy: number;
      uninitialized: number;
    };
  }> {
    const statuses = await this.getAllServiceStatus();
    const healthy = statuses.filter(s => s.healthy).length;
    const unhealthy = statuses.filter(s => !s.healthy && s.initialized).length;
    const uninitialized = statuses.filter(s => !s.initialized).length;
    
    return {
      healthy: unhealthy === 0 && uninitialized === 0,
      services: statuses,
      summary: {
        total: statuses.length,
        healthy,
        unhealthy,
        uninitialized
      }
    };
  }

  /**
   * 重启服务
   */
  async restartService(name: string): Promise<void> {
    // 清除实例
    const serviceClass = this.serviceMap.get(name)?.constructor as typeof BaseService;
    if (serviceClass) {
      serviceClass.clearInstance();
      this.serviceMap.delete(name);
    }
    
    // 重新初始化
    await this.registry.initializeService(name);
    
    // 重新获取实例
    const newInstance = ServiceLocator.get<BaseService>(name);
    if (newInstance) {
      this.serviceMap.set(name, newInstance);
    }
  }

  /**
   * 获取服务依赖图
   */
  getDependencyGraph(): Record<string, string[]> {
    return this.registry.getDependencyGraph();
  }

  /**
   * 导出服务配置
   */
  exportConfiguration(): {
    services: Array<{
      name: string;
      dependencies: string[];
      info: ServiceInfo;
    }>;
    dependencyGraph: Record<string, string[]>;
  } {
    const services = Array.from(this.serviceMap.entries()).map(([name, service]) => ({
      name,
      dependencies: this.registry.getDependencyGraph()[name] || [],
      info: service.getServiceInfo ? service.getServiceInfo() : { name: '', version: undefined, dependencies: [], initialized: false, storageKeys: [], description: undefined }
    }));
    
    return {
      services,
      dependencyGraph: this.getDependencyGraph()
    };
  }

  /**
   * 清理所有服务
   */
  clearAll(): void {
    BaseService.clearAllInstances();
    this.serviceMap.clear();
    this.registry.clear();
  }
}