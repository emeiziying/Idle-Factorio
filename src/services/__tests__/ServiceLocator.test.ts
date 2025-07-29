import { describe, it, expect, beforeEach } from 'vitest'
import { ServiceLocator, SERVICE_NAMES } from '../ServiceLocator'

describe('ServiceLocator', () => {
  beforeEach(() => {
    // Clear all services before each test
    ServiceLocator.clear()
  })

  describe('register', () => {
    it('should register a service', () => {
      const mockService = { name: 'TestService' }
      
      ServiceLocator.register('TestService', mockService)
      
      expect(ServiceLocator.has('TestService')).toBe(true)
    })

    it('should register multiple services', () => {
      const service1 = { name: 'Service1' }
      const service2 = { name: 'Service2' }
      
      ServiceLocator.register('Service1', service1)
      ServiceLocator.register('Service2', service2)
      
      expect(ServiceLocator.has('Service1')).toBe(true)
      expect(ServiceLocator.has('Service2')).toBe(true)
    })

    it('should overwrite existing service', () => {
      const originalService = { version: 1 }
      const newService = { version: 2 }
      
      ServiceLocator.register('TestService', originalService)
      ServiceLocator.register('TestService', newService)
      
      const retrieved = ServiceLocator.get<typeof newService>('TestService')
      expect(retrieved.version).toBe(2)
    })
  })

  describe('get', () => {
    it('should retrieve registered service', () => {
      const mockService = { name: 'TestService', data: 'test' }
      
      ServiceLocator.register('TestService', mockService)
      const retrieved = ServiceLocator.get<typeof mockService>('TestService')
      
      expect(retrieved).toBe(mockService)
      expect(retrieved.data).toBe('test')
    })

    it('should throw error for unregistered service', () => {
      expect(() => {
        ServiceLocator.get('UnknownService')
      }).toThrow('Service UnknownService not found. Make sure it\'s registered.')
    })

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

  describe('has', () => {
    it('should return true for registered services', () => {
      ServiceLocator.register('TestService', {})
      
      expect(ServiceLocator.has('TestService')).toBe(true)
    })

    it('should return false for unregistered services', () => {
      expect(ServiceLocator.has('UnknownService')).toBe(false)
    })

    it('should work with SERVICE_NAMES constants', () => {
      ServiceLocator.register(SERVICE_NAMES.DATA, {})
      
      expect(ServiceLocator.has(SERVICE_NAMES.DATA)).toBe(true)
      expect(ServiceLocator.has(SERVICE_NAMES.RECIPE)).toBe(false)
    })
  })

  describe('clear', () => {
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

    it('should allow registering after clear', () => {
      ServiceLocator.register('Service1', { version: 1 })
      ServiceLocator.clear()
      ServiceLocator.register('Service1', { version: 2 })
      
      const service = ServiceLocator.get<{ version: number }>('Service1')
      expect(service.version).toBe(2)
    })
  })

  describe('SERVICE_NAMES', () => {
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

  describe('edge cases', () => {
    it('should handle null services', () => {
      ServiceLocator.register('NullService', null)
      
      expect(ServiceLocator.has('NullService')).toBe(true)
      expect(ServiceLocator.get('NullService')).toBeNull()
    })

    it('should handle undefined services', () => {
      ServiceLocator.register('UndefinedService', undefined)
      
      expect(ServiceLocator.has('UndefinedService')).toBe(true)
      expect(ServiceLocator.get('UndefinedService')).toBeUndefined()
    })

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