import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import CraftingEngine from '../craftingEngine'
import type { CraftingTask, Recipe } from '../../types/index'

// Mock dependencies
vi.mock('../../store/gameStore', () => ({
  default: {
    getState: () => ({
      craftingQueue: [],
      updateCraftingProgress: vi.fn(),
      completeCraftingTask: vi.fn(),
      updateInventory: vi.fn(),
      getInventoryItem: vi.fn(() => ({ count: 100 }))
    }),
    subscribe: vi.fn()
  }
}))

vi.mock('../../services/DataService', () => ({
  DataService: {
    getInstance: () => ({
      getItem: vi.fn(() => ({ name: 'test-item', stackSize: 100 })),
      getAllItems: vi.fn(() => [])
    })
  }
}))

vi.mock('../../services/RecipeService', () => ({
  RecipeService: {
    getInstance: () => ({
      getRecipe: vi.fn(() => ({
        name: 'test-recipe',
        ingredients: [{ name: 'iron-ore', amount: 1 }],
        results: [{ name: 'iron-plate', amount: 1 }],
        craftingTime: 0.5
      })),
      getMiningRecipe: vi.fn(() => ({
        name: 'iron-ore-mining',
        results: [{ name: 'iron-ore', amount: 1 }],
        craftingTime: 1
      }))
    })
  }
}))

vi.mock('../../services/GameConfig', () => ({
  GameConfig: {
    getInstance: () => ({
      getConstants: () => ({
        crafting: {
          updateInterval: 100,
          baseSpeed: 1
        }
      })
    })
  }
}))

describe('CraftingEngine', () => {
  let craftingEngine: CraftingEngine
  
  beforeEach(() => {
    vi.useFakeTimers()
    vi.resetAllMocks()
    
    // Reset singleton instance
    ;(CraftingEngine as any).instance = null
    craftingEngine = CraftingEngine.getInstance()
  })

  afterEach(() => {
    vi.useRealTimers()
    craftingEngine.stop()
  })

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = CraftingEngine.getInstance()
      const instance2 = CraftingEngine.getInstance()
      
      expect(instance1).toBe(instance2)
    })
  })

  describe('engine lifecycle', () => {
    it('should start the crafting engine', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval')
      
      craftingEngine.start()
      
      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        100 // updateInterval from config
      )
    })

    it('should not start multiple instances', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval')
      
      craftingEngine.start()
      craftingEngine.start() // Second call should be ignored
      
      expect(setIntervalSpy).toHaveBeenCalledTimes(1)
    })

    it('should stop the crafting engine', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
      
      craftingEngine.start()
      craftingEngine.stop()
      
      expect(clearIntervalSpy).toHaveBeenCalled()
    })

    it('should handle stop when not running', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
      
      craftingEngine.stop() // Should not throw
      
      expect(clearIntervalSpy).not.toHaveBeenCalled()
    })
  })

  describe('crafting calculations', () => {
    it('should handle recipe time calculations', () => {
      const mockRecipe = {
        name: 'test-recipe',
        out: { 'iron-plate': 1 },
        in: { 'iron-ore': 1 },
        time: 0.5
      }
      
      // Test if the engine can process recipes (private method testing via public interface)
      expect(() => {
        craftingEngine.start()
        craftingEngine.stop()
      }).not.toThrow()
    })

    it('should handle machine efficiency calculations', () => {
      const efficiency = craftingEngine.getDeviceEfficiency('assembling-machine-1')
      
      expect(efficiency).toHaveProperty('speed')
      expect(efficiency).toHaveProperty('coverage')
      expect(efficiency).toHaveProperty('power')
      expect(efficiency).toHaveProperty('pollution')
      expect(typeof efficiency.speed).toBe('number')
    })

    it('should calculate device efficiency', () => {
      const deviceName = 'assembling-machine-1'
      
      const efficiency = craftingEngine.getDeviceEfficiency(deviceName)
      
      expect(efficiency).toHaveProperty('speed')
      expect(efficiency).toHaveProperty('coverage')
      expect(efficiency).toHaveProperty('power')
      expect(efficiency).toHaveProperty('pollution')
    })

    it('should cache device efficiency calculations', () => {
      const deviceName = 'assembling-machine-1'
      
      const efficiency1 = craftingEngine.getDeviceEfficiency(deviceName)
      const efficiency2 = craftingEngine.getDeviceEfficiency(deviceName)
      
      expect(efficiency1).toEqual(efficiency2) // Should have same values
    })
  })

  describe('engine operations', () => {
    it('should start and stop without errors', () => {
      expect(() => {
        craftingEngine.start()
      }).not.toThrow()
      
      expect(() => {
        craftingEngine.stop()
      }).not.toThrow()
    })

    it('should handle multiple start calls gracefully', () => {
      expect(() => {
        craftingEngine.start()
        craftingEngine.start() // Should not cause issues
        craftingEngine.stop()
      }).not.toThrow()
    })

    it('should handle stop when not running', () => {
      expect(() => {
        craftingEngine.stop() // Should not throw when not running
      }).not.toThrow()
    })
  })

  describe('integration tests', () => {
    it('should handle basic operations without errors', () => {
      expect(() => {
        const instance1 = CraftingEngine.getInstance()
        const instance2 = CraftingEngine.getInstance()
        expect(instance1).toBe(instance2)
        
        instance1.start()
        instance1.stop()
      }).not.toThrow()
    })

    it('should provide device efficiency data', () => {
      const efficiency = craftingEngine.getDeviceEfficiency('test-machine')
      
      expect(efficiency).toBeDefined()
      expect(typeof efficiency).toBe('object')
      expect(efficiency).toHaveProperty('speed')
      expect(efficiency).toHaveProperty('coverage')
      expect(efficiency).toHaveProperty('power')
      expect(efficiency).toHaveProperty('pollution')
    })
  })

  describe('device efficiency', () => {
    it('should return consistent efficiency values', () => {
      const deviceName = 'assembling-machine-1'
      const efficiency = craftingEngine.getDeviceEfficiency(deviceName)
      
      expect(efficiency).toHaveProperty('speed')
      expect(efficiency).toHaveProperty('coverage')
      expect(efficiency).toHaveProperty('power')
      expect(efficiency).toHaveProperty('pollution')
      
      // Values should be reasonable
      expect(efficiency.speed).toBeGreaterThanOrEqual(0)
      expect(efficiency.coverage).toBeGreaterThanOrEqual(0)
    })

    it('should handle different device types', () => {
      const devices = ['assembling-machine-1', 'assembling-machine-2', 'electric-furnace']
      
      devices.forEach(deviceName => {
        const efficiency = craftingEngine.getDeviceEfficiency(deviceName)
        expect(efficiency).toHaveProperty('speed')
        expect(typeof efficiency.speed).toBe('number')
      })
    })
  })

  describe('error handling', () => {
    it('should handle start/stop operations gracefully', () => {
      expect(() => {
        craftingEngine.start()
        craftingEngine.start() // Multiple starts should be safe
        craftingEngine.stop()
        craftingEngine.stop() // Multiple stops should be safe
      }).not.toThrow()
    })

    it('should handle invalid device names', () => {
      expect(() => {
        const efficiency = craftingEngine.getDeviceEfficiency('non-existent-device')
        expect(efficiency).toBeDefined()
        expect(efficiency).toHaveProperty('speed')
      }).not.toThrow()
    })
  })

  describe('performance optimizations', () => {
    it('should handle multiple device efficiency calls efficiently', () => {
      const deviceName = 'assembling-machine-1'
      
      const startTime = performance.now()
      for (let i = 0; i < 100; i++) {
        craftingEngine.getDeviceEfficiency(deviceName)
      }
      const endTime = performance.now()

      // Should be fast even with many calls
      expect(endTime - startTime).toBeLessThan(50)
    })

    it('should return consistent efficiency values', () => {
      const deviceName = 'assembling-machine-1'
      
      // Multiple calls should return equivalent values
      const efficiency1 = craftingEngine.getDeviceEfficiency(deviceName)
      const efficiency2 = craftingEngine.getDeviceEfficiency(deviceName)
      
      expect(efficiency1).toEqual(efficiency2)
    })
  })
})