import { describe, it, expect, beforeEach } from 'vitest';
import { DIContainer } from '@/services/core/DIContainer';
import { SERVICE_TOKENS } from '@/services/core/ServiceTokens';

// DIContainer 测试套件 - 依赖注入容器模式
describe('DIContainer', () => {
  let container: DIContainer;

  beforeEach(() => {
    container = new DIContainer();
  });

  // 测试：应该能够注册和解析服务
  it('should register and resolve a service', () => {
    class TestService {
      getValue() {
        return 'test value';
      }
    }

    container.register('TestService', TestService);
    const service = container.resolve<TestService>('TestService');

    expect(service).toBeInstanceOf(TestService);
    expect(service.getValue()).toBe('test value');
  });

  // 测试：应该支持单例模式
  it('should support singleton pattern by default', () => {
    let constructorCallCount = 0;

    class SingletonService {
      constructor() {
        constructorCallCount++;
      }
    }

    container.register('SingletonService', SingletonService);
    
    const instance1 = container.resolve<SingletonService>('SingletonService');
    const instance2 = container.resolve<SingletonService>('SingletonService');

    expect(instance1).toBe(instance2);
    expect(constructorCallCount).toBe(1);
  });

  // 测试：应该支持非单例模式
  it('should support non-singleton pattern when specified', () => {
    let constructorCallCount = 0;

    class TransientService {
      constructor() {
        constructorCallCount++;
      }
    }

    container.register('TransientService', TransientService, { singleton: false });
    
    const instance1 = container.resolve<TransientService>('TransientService');
    const instance2 = container.resolve<TransientService>('TransientService');

    expect(instance1).not.toBe(instance2);
    expect(constructorCallCount).toBe(2);
  });

  // 测试：应该支持依赖注入
  it('should support dependency injection', () => {
    class DependencyA {
      getValue() {
        return 'A';
      }
    }

    class DependencyB {
      getValue() {
        return 'B';
      }
    }

    class ServiceWithDependencies {
      constructor(
        private depA: DependencyA,
        private depB: DependencyB
      ) {}

      getCombinedValue() {
        return this.depA.getValue() + this.depB.getValue();
      }
    }

    container.register('DependencyA', DependencyA);
    container.register('DependencyB', DependencyB);
    container.register('ServiceWithDependencies', ServiceWithDependencies, {
      dependencies: ['DependencyA', 'DependencyB']
    });

    const service = container.resolve<ServiceWithDependencies>('ServiceWithDependencies');
    expect(service.getCombinedValue()).toBe('AB');
  });

  // 测试：应该检测循环依赖
  it('should detect circular dependencies', () => {
    class ServiceA {
      constructor(public serviceB: any) {}
    }

    class ServiceB {
      constructor(public serviceA: any) {}
    }

    container.register('ServiceA', ServiceA, { dependencies: ['ServiceB'] });
    container.register('ServiceB', ServiceB, { dependencies: ['ServiceA'] });

    expect(() => container.resolve('ServiceA')).toThrow(/Circular dependency detected/);
  });

  // 测试：应该支持工厂函数
  it('should support factory functions', () => {
    const factory = () => ({
      value: 'factory created'
    });

    container.registerFactory('FactoryService', factory);
    const service = container.resolve<{ value: string }>('FactoryService');

    expect(service.value).toBe('factory created');
  });

  // 测试：应该支持实例注册
  it('should support instance registration', () => {
    const instance = { value: 'pre-created instance' };

    container.registerInstance('InstanceService', instance);
    const resolved = container.resolve<typeof instance>('InstanceService');

    expect(resolved).toBe(instance);
    expect(resolved.value).toBe('pre-created instance');
  });

  // 测试：应该能够检查服务是否已注册
  it('should check if service is registered', () => {
    expect(container.has('UnregisteredService')).toBe(false);

    container.register('RegisteredService', class {});
    expect(container.has('RegisteredService')).toBe(true);
  });

  // 测试：解析未注册的服务应该抛出错误
  it('should throw error when resolving unregistered service', () => {
    expect(() => container.resolve('UnregisteredService')).toThrow(/Service 'UnregisteredService' not registered/);
  });

  // 测试：应该能够清空所有服务
  it('should clear all services', () => {
    container.register('Service1', class {});
    container.register('Service2', class {});
    container.registerInstance('Service3', {});

    expect(container.has('Service1')).toBe(true);
    expect(container.has('Service2')).toBe(true);
    expect(container.has('Service3')).toBe(true);

    container.clear();

    expect(container.has('Service1')).toBe(false);
    expect(container.has('Service2')).toBe(false);
    expect(container.has('Service3')).toBe(false);
  });

  // 测试：应该与 SERVICE_TOKENS 常量配合使用
  it('should work with SERVICE_TOKENS constants', () => {
    class DataService {
      getData() {
        return 'data';
      }
    }

    class RecipeService {
      getRecipe() {
        return 'recipe';
      }
    }

    container.register(SERVICE_TOKENS.DATA_SERVICE, DataService);
    container.register(SERVICE_TOKENS.RECIPE_SERVICE, RecipeService);

    const dataService = container.resolve<DataService>(SERVICE_TOKENS.DATA_SERVICE);
    const recipeService = container.resolve<RecipeService>(SERVICE_TOKENS.RECIPE_SERVICE);

    expect(dataService.getData()).toBe('data');
    expect(recipeService.getRecipe()).toBe('recipe');
  });

  // 测试：应该支持异步工厂函数
  it('should support async factory functions', async () => {
    const asyncFactory = async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { value: 'async created' };
    };

    container.registerFactory('AsyncService', asyncFactory);
    const service = await container.resolveAsync<{ value: string }>('AsyncService');

    expect(service.value).toBe('async created');
  });

  // 测试：应该获取依赖关系图
  it('should get dependency graph', () => {
    container.register('ServiceA', class {}, { dependencies: ['ServiceB', 'ServiceC'] });
    container.register('ServiceB', class {}, { dependencies: ['ServiceD'] });
    container.register('ServiceC', class {});
    container.register('ServiceD', class {});

    const graph = container.getDependencyGraph();

    expect(graph).toEqual({
      ServiceA: ['ServiceB', 'ServiceC'],
      ServiceB: ['ServiceD'],
      ServiceC: [],
      ServiceD: []
    });
  });

  // 测试：单例模式应该是默认行为
  it('should use singleton pattern by default', () => {
    let instanceCount = 0;
    
    class CountingService {
      public id: number;
      
      constructor() {
        this.id = ++instanceCount;
      }
    }

    container.register('CountingService', CountingService);
    
    const instance1 = container.resolve<CountingService>('CountingService');
    const instance2 = container.resolve<CountingService>('CountingService');
    
    expect(instance1.id).toBe(1);
    expect(instance2.id).toBe(1);
    expect(instance1).toBe(instance2);
  });

  // 测试：应该处理复杂的依赖链
  it('should handle complex dependency chains', () => {
    class ServiceA {
      getValue() { return 'A'; }
    }

    class ServiceB {
      constructor(private serviceA: ServiceA) {}
      getValue() { return this.serviceA.getValue() + 'B'; }
    }

    class ServiceC {
      constructor(private serviceB: ServiceB) {}
      getValue() { return this.serviceB.getValue() + 'C'; }
    }

    class ServiceD {
      constructor(
        private serviceC: ServiceC,
        private serviceA: ServiceA
      ) {}
      getValue() { return this.serviceC.getValue() + 'D' + this.serviceA.getValue(); }
    }

    container.register('ServiceA', ServiceA);
    container.register('ServiceB', ServiceB, { dependencies: ['ServiceA'] });
    container.register('ServiceC', ServiceC, { dependencies: ['ServiceB'] });
    container.register('ServiceD', ServiceD, { dependencies: ['ServiceC', 'ServiceA'] });

    const serviceD = container.resolve<ServiceD>('ServiceD');
    expect(serviceD.getValue()).toBe('ABCDA');
  });
});