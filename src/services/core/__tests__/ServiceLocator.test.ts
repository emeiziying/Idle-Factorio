import { describe, it, expect, beforeEach } from 'vitest'
import { ServiceLocator, SERVICE_NAMES } from '@/services/core/ServiceLocator'

// ServiceLocator 测试套件 - 服务定位器模式
describe('ServiceLocator', () => {
  beforeEach(() => {
    // Clear all services before each test
    // 每个测试前清除所有服务
    ServiceLocator.clear()
  })

  // 服务注册测试
  describe('register', () => {
    // 测试：应该注册一个服务
    it('should register a service', () => {
      const mockService = { name: 'TestService' }
      
      ServiceLocator.register('TestService', mockService)
      
      expect(ServiceLocator.has('TestService')).toBe(true)
    })

    // 测试：应该注册多个服务
    it('should register multiple services', () => {
      const service1 = { name: 'Service1' }
      const service2 = { name: 'Service2' }
      
      ServiceLocator.register('Service1', service1)
      ServiceLocator.register('Service2', service2)
      
      expect(ServiceLocator.has('Service1')).toBe(true)
      expect(ServiceLocator.has('Service2')).toBe(true)
    })

    // 测试：应该覆盖已存在的服务
    it('should overwrite existing service', () => {
      const originalService = { version: 1 }
      const newService = { version: 2 }
      
      ServiceLocator.register('TestService', originalService)
      ServiceLocator.register('TestService', newService)
      
      const retrieved = ServiceLocator.get<typeof newService>('TestService')
      expect(retrieved.version).toBe(2)
    })
  })

  // 获取服务测试
  describe('get', () => {
    // 测试：应该获取已注册的服务
    it('should retrieve registered service', () => {
      const mockService = { name: 'TestService', data: 'test' }
      
      ServiceLocator.register('TestService', mockService)
      const retrieved = ServiceLocator.get<typeof mockService>('TestService')
      
      expect(retrieved).toBe(mockService)
      expect(retrieved.data).toBe('test')
    })

    // 测试：获取未注册的服务应抛出错误
    it('should throw error for unregistered service', () => {
      expect(() => {
        ServiceLocator.get('UnknownService')
      }).toThrow('Service UnknownService not found. Make sure it\'s registered.')
    })

    // 测试：应该保持服务类型
    it('should maintain service types', () => {
      class TestService {
        getValue() { return 42 }
      }
      
      const instance = new TestService()
      ServiceLocator.register('TestService', instance)
      
      const retrieved = ServiceLocator.get<TestService>('TestService')
      expect(retrieved.getValue()).toBe(42)
    })
  })

  // 检查服务是否存在测试
  describe('has', () => {
    // 测试：已注册的服务应返回 true
    it('should return true for registered services', () => {
      ServiceLocator.register('TestService', {})
      
      expect(ServiceLocator.has('TestService')).toBe(true)
    })

    // 测试：未注册的服务应返回 false
    it('should return false for unregistered services', () => {
      expect(ServiceLocator.has('UnknownService')).toBe(false)
    })

    // 测试：应该与 SERVICE_NAMES 常量配合使用
    it('should work with SERVICE_NAMES constants', () => {
      ServiceLocator.register(SERVICE_NAMES.DATA, {})
      
      expect(ServiceLocator.has(SERVICE_NAMES.DATA)).toBe(true)
      expect(ServiceLocator.has(SERVICE_NAMES.RECIPE)).toBe(false)
    })
  })

  // 清除所有服务测试
  describe('clear', () => {
    // 测试：应该移除所有已注册的服务
    it('should remove all registered services', () => {
      ServiceLocator.register('Service1', {})
      ServiceLocator.register('Service2', {})
      ServiceLocator.register('Service3', {})
      
      expect(ServiceLocator.has('Service1')).toBe(true)
      expect(ServiceLocator.has('Service2')).toBe(true)
      expect(ServiceLocator.has('Service3')).toBe(true)
      
      ServiceLocator.clear()
      
      expect(ServiceLocator.has('Service1')).toBe(false)
      expect(ServiceLocator.has('Service2')).toBe(false)
      expect(ServiceLocator.has('Service3')).toBe(false)
    })

    // 测试：清除后应该允许重新注册
    it('should allow registering after clear', () => {
      ServiceLocator.register('Service1', { version: 1 })
      ServiceLocator.clear()
      ServiceLocator.register('Service1', { version: 2 })
      
      const service = ServiceLocator.get<{ version: number }>('Service1')
      expect(service.version).toBe(2)
    })
  })

  // 服务名称常量测试
  describe('SERVICE_NAMES', () => {
    // 测试：应该包含所有预期的服务名称
    it('should contain all expected service names', () => {
      expect(SERVICE_NAMES).toEqual({
        DATA: 'DataService',
        RECIPE: 'RecipeService',
        TECHNOLOGY: 'TechnologyService',
        USER_PROGRESS: 'UserProgressService',
        FUEL: 'FuelService',
        POWER: 'PowerService',
        STORAGE: 'StorageService',
        GAME_STATE: 'GameStateProvider',
        MANUAL_CRAFTING_VALIDATOR: 'ManualCraftingValidator',
      })
    })

    // 测试：应该与服务注册配合使用
    it('should work with service registration', () => {
      const dataService = { getData: () => 'data' }
      const recipeService = { getRecipe: () => 'recipe' }
      
      ServiceLocator.register(SERVICE_NAMES.DATA, dataService)
      ServiceLocator.register(SERVICE_NAMES.RECIPE, recipeService)
      
      const retrievedData = ServiceLocator.get<typeof dataService>(SERVICE_NAMES.DATA)
      const retrievedRecipe = ServiceLocator.get<typeof recipeService>(SERVICE_NAMES.RECIPE)
      
      expect(retrievedData.getData()).toBe('data')
      expect(retrievedRecipe.getRecipe()).toBe('recipe')
    })
  })

  // 边界情况测试
  describe('edge cases', () => {
    // 测试：应该处理 null 服务
    it('should handle null services', () => {
      ServiceLocator.register('NullService', null)
      
      expect(ServiceLocator.has('NullService')).toBe(true)
      expect(ServiceLocator.get('NullService')).toBeNull()
    })

    // 测试：应该处理 undefined 服务
    it('should handle undefined services', () => {
      ServiceLocator.register('UndefinedService', undefined)
      
      expect(ServiceLocator.has('UndefinedService')).toBe(true)
      expect(ServiceLocator.get('UndefinedService')).toBeUndefined()
    })

    // 测试：应该处理原始值
    it('should handle primitive values', () => {
      ServiceLocator.register('NumberService', 42)
      ServiceLocator.register('StringService', 'hello')
      ServiceLocator.register('BooleanService', true)
      
      expect(ServiceLocator.get<number>('NumberService')).toBe(42)
      expect(ServiceLocator.get<string>('StringService')).toBe('hello')
      expect(ServiceLocator.get<boolean>('BooleanService')).toBe(true)
    })
  })
})