/**
 * 服务初始化器（新版本）
 * 使用ServiceFactory和ServiceManager统一管理服务初始化
 */
import { ServiceFactory } from '../base/ServiceFactory';
import { ServiceManager } from './ServiceManager';
import { DataService } from '../core/DataService';
import { RecipeService } from '../core/RecipeService';
import { UserProgressService } from '../state/UserProgressService';
import { TechnologyService } from '../TechnologyService';
import { FuelService } from '../FuelService';
import { PowerService } from '../PowerService';
import { StorageService } from '../StorageService';
import { GameStorageService } from '../GameStorageService';
import { DependencyService } from '../DependencyService';
import { GameConfig } from '../GameConfig';

// 服务配置
const SERVICE_CONFIG = [
  {
    name: 'DataService',
    class: DataService,
    priority: 1 // 最高优先级
  },
  {
    name: 'GameConfig',
    class: GameConfig,
    priority: 2
  },
  {
    name: 'RecipeService',
    class: RecipeService,
    dependencies: ['DataService'],
    priority: 10
  },
  {
    name: 'UserProgressService',
    class: UserProgressService,
    dependencies: ['DataService'],
    priority: 10
  },
  {
    name: 'TechnologyService',
    class: TechnologyService,
    dependencies: ['DataService', 'UserProgressService'],
    priority: 20
  },
  {
    name: 'FuelService',
    class: FuelService,
    dependencies: ['DataService', 'GameConfig'],
    priority: 30
  },
  {
    name: 'PowerService',
    class: PowerService,
    dependencies: ['DataService', 'GameConfig'],
    priority: 30
  },
  {
    name: 'StorageService',
    class: StorageService,
    dependencies: ['DataService'],
    priority: 30
  },
  {
    name: 'GameStorageService',
    class: GameStorageService,
    dependencies: ['DataService'],
    priority: 40
  },
  {
    name: 'DependencyService',
    class: DependencyService,
    dependencies: ['DataService', 'RecipeService'],
    priority: 50
  }
];

export class ServiceInitializer {
  private static instance: ServiceInitializer;
  private serviceManager: ServiceManager;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {
    this.serviceManager = ServiceManager.getInstance();
  }

  static getInstance(): ServiceInitializer {
    if (!ServiceInitializer.instance) {
      ServiceInitializer.instance = new ServiceInitializer();
    }
    return ServiceInitializer.instance;
  }

  /**
   * 初始化所有服务
   */
  async initialize(): Promise<void> {
    // 如果已经初始化，直接返回
    if (this.initialized) {
      return;
    }

    // 如果正在初始化，返回现有的Promise
    if (this.initPromise) {
      return this.initPromise;
    }

    // 开始初始化
    this.initPromise = this.doInitialize();
    
    try {
      await this.initPromise;
      this.initialized = true;
    } finally {
      this.initPromise = null;
    }
  }

  /**
   * 执行初始化
   */
  private async doInitialize(): Promise<void> {
    console.log('[ServiceInitializer] Starting service initialization...');
    
    try {
      // 1. 注册所有服务
      this.registerServices();
      
      // 2. 初始化 DataService 并加载数据
      const dataService = ServiceFactory.create<DataService>('DataService');
      await dataService.loadGameData();
      await dataService.loadI18nData('zh');
      
      // 3. 初始化 RecipeService
      const recipes = dataService.getGameData().recipes;
      RecipeService.initializeRecipes(recipes);
      
      // 4. 初始化其他服务
      const serviceNames = SERVICE_CONFIG
        .filter(config => config.name !== 'DataService') // DataService已经初始化
        .map(config => config.name);
      
      for (const serviceName of serviceNames) {
        await ServiceFactory.initialize(serviceName);
      }
      
      // 5. 执行健康检查
      const healthCheck = await this.serviceManager.healthCheck();
      if (!healthCheck.healthy) {
        console.warn('[ServiceInitializer] Some services are unhealthy:', healthCheck.summary);
      }
      
      console.log('[ServiceInitializer] Service initialization completed successfully');
      console.log(`[ServiceInitializer] ${healthCheck.summary.healthy} healthy, ${healthCheck.summary.unhealthy} unhealthy services`);
      
    } catch (error) {
      console.error('[ServiceInitializer] Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * 注册所有服务
   */
  private registerServices(): void {
    SERVICE_CONFIG.forEach(config => {
      this.serviceManager.registerService(
        config.name,
        config.class as any,
        config.dependencies,
        config.priority
      );
    });
  }

  /**
   * 获取服务状态
   */
  async getServiceStatus(): Promise<any> {
    return this.serviceManager.getAllServiceStatus();
  }

  /**
   * 重置所有服务
   */
  async reset(): Promise<void> {
    this.serviceManager.clearAll();
    this.initialized = false;
    this.initPromise = null;
  }

  /**
   * 获取服务依赖图
   */
  getDependencyGraph(): Record<string, string[]> {
    return this.serviceManager.getDependencyGraph();
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 获取特定服务
   */
  getService<T>(name: string): T {
    if (!this.initialized) {
      throw new Error('Services not initialized. Call initialize() first.');
    }
    return ServiceFactory.create<T>(name);
  }

  /**
   * 导出服务配置
   */
  exportConfiguration(): any {
    const managerConfig = this.serviceManager.exportConfiguration();
    return {
      serviceConfig: SERVICE_CONFIG,
      initialized: this.initialized,
      ...managerConfig
    };
  }
}