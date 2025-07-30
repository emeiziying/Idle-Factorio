/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GameConfig } from '../GameConfig'
import { DataService } from '../DataService'

// Mock DataService
vi.mock('../DataService', () => ({
  DataService: {
    getInstance: vi.fn()
  }
}))

describe('GameConfig', () => {
  let gameConfig: GameConfig
  let mockDataService: { getItem: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    // Clear any existing instance
    (GameConfig as any).instance = null

    // Create mock DataService
    mockDataService = {
      getItem: vi.fn()
    }

    // Setup DataService mock
    vi.mocked(DataService.getInstance).mockReturnValue(mockDataService as unknown as DataService)

    gameConfig = GameConfig.getInstance()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = GameConfig.getInstance()
      const instance2 = GameConfig.getInstance()
      
      expect(instance1).toBe(instance2)
    })
  })

  describe('getConstants', () => {
    it('should return game constants with correct structure', () => {
      const constants = gameConfig.getConstants()
      
      expect(constants).toHaveProperty('crafting')
      expect(constants).toHaveProperty('fuel')
      expect(constants).toHaveProperty('power')
      expect(constants).toHaveProperty('storage')
      expect(constants).toHaveProperty('ui')
    })

    it('should have correct crafting constants', () => {
      const constants = gameConfig.getConstants()
      
      expect(constants.crafting).toEqual({
        minCraftingTime: 0.1,
        updateInterval: 100,
        maxProductivityBonus: 0.5
      })
    })

    it('should have correct fuel constants', () => {
      const constants = gameConfig.getConstants()
      
      expect(constants.fuel).toEqual({
        defaultFuelSlots: 1,
        fuelBufferFullThreshold: 95,
        autoRefuelCheckInterval: 5000
      })
    })

    it('should have correct power constants', () => {
      const constants = gameConfig.getConstants()
      
      expect(constants.power).toEqual({
        surplusThreshold: 110,
        balancedThreshold: 95,
        solarPanelDayRatio: 0.7
      })
    })

    it('should have correct storage constants', () => {
      const constants = gameConfig.getConstants()
      
      expect(constants.storage).toEqual({
        defaultStackSize: 50,
        maxInventorySlots: 1000,
        storageOptimizationThreshold: 100
      })
    })

    it('should have correct UI constants', () => {
      const constants = gameConfig.getConstants()
      
      expect(constants.ui).toEqual({
        autoSaveInterval: 10000,
        debounceDelay: 2000,
        maxRecentRecipes: 10
      })
    })
  })

  describe('getFuelPriority', () => {
    it('should return default fuel priority list', () => {
      const priority = gameConfig.getFuelPriority()
      
      expect(priority).toEqual([
        'coal',
        'solid-fuel',
        'rocket-fuel',
        'nuclear-fuel',
        'wood'
      ])
    })
  })

  describe('getFuelCategory', () => {
    it('should return fuel category from item data', () => {
      vi.mocked(mockDataService.getItem).mockReturnValue({
        id: 'coal',
        fuel: {
          value: 4000000,
          category: 'chemical'
        }
      } as any)

      const category = gameConfig.getFuelCategory('coal')
      expect(category).toBe('chemical')
    })

    it('should return nuclear for nuclear items', () => {
      vi.mocked(mockDataService.getItem).mockReturnValue({
        id: 'nuclear-fuel',
        fuel: {
          value: 1210000000
        }
      } as any)

      const category = gameConfig.getFuelCategory('nuclear-fuel')
      expect(category).toBe('nuclear')
    })

    it('should return nuclear for uranium items', () => {
      vi.mocked(mockDataService.getItem).mockReturnValue({
        id: 'uranium-fuel-cell',
        fuel: {
          value: 8000000000
        }
      } as any)

      const category = gameConfig.getFuelCategory('uranium-fuel-cell')
      expect(category).toBe('nuclear')
    })

    it('should return chemical by default for items with fuel value', () => {
      vi.mocked(mockDataService.getItem).mockReturnValue({
        id: 'wood',
        fuel: {
          value: 2000000
        }
      } as any)

      const category = gameConfig.getFuelCategory('wood')
      expect(category).toBe('chemical')
    })

    it('should return null for non-fuel items', () => {
      vi.mocked(mockDataService.getItem).mockReturnValue({
        id: 'iron-plate'
      } as any)

      const category = gameConfig.getFuelCategory('iron-plate')
      expect(category).toBeNull()
    })

    it('should return null when item not found', () => {
      vi.mocked(mockDataService.getItem).mockReturnValue(undefined)

      const category = gameConfig.getFuelCategory('unknown-item')
      expect(category).toBeNull()
    })
  })

  describe('isBurnerMachine', () => {
    it('should return true for burner machines', () => {
      vi.mocked(mockDataService.getItem).mockReturnValue({
        id: 'burner-mining-drill',
        machine: {
          type: 'burner'
        }
      } as any)

      expect(gameConfig.isBurnerMachine('burner-mining-drill')).toBe(true)
    })

    it('should return false for electric machines', () => {
      vi.mocked(mockDataService.getItem).mockReturnValue({
        id: 'electric-mining-drill',
        machine: {
          type: 'electric'
        }
      } as any)

      expect(gameConfig.isBurnerMachine('electric-mining-drill')).toBe(false)
    })

    it('should return false for non-machine items', () => {
      vi.mocked(mockDataService.getItem).mockReturnValue({
        id: 'iron-plate'
      } as any)

      expect(gameConfig.isBurnerMachine('iron-plate')).toBe(false)
    })

    it('should return false when item not found', () => {
      vi.mocked(mockDataService.getItem).mockReturnValue(undefined)

      expect(gameConfig.isBurnerMachine('unknown-item')).toBe(false)
    })
  })

  describe('getMachineFuelCategories', () => {
    it('should return fuel categories for machines', () => {
      vi.mocked(mockDataService.getItem).mockReturnValue({
        id: 'boiler',
        machine: {
          fuelCategories: ['chemical']
        }
      } as any)

      const categories = gameConfig.getMachineFuelCategories('boiler')
      expect(categories).toEqual(['chemical'])
    })

    it('should return multiple fuel categories', () => {
      vi.mocked(mockDataService.getItem).mockReturnValue({
        id: 'locomotive',
        machine: {
          fuelCategories: ['chemical', 'nuclear']
        }
      } as any)

      const categories = gameConfig.getMachineFuelCategories('locomotive')
      expect(categories).toEqual(['chemical', 'nuclear'])
    })

    it('should return empty array for machines without fuel categories', () => {
      vi.mocked(mockDataService.getItem).mockReturnValue({
        id: 'electric-furnace',
        machine: {}
      } as any)

      const categories = gameConfig.getMachineFuelCategories('electric-furnace')
      expect(categories).toEqual([])
    })

    it('should return empty array for non-machine items', () => {
      vi.mocked(mockDataService.getItem).mockReturnValue({
        id: 'iron-plate'
      } as any)

      const categories = gameConfig.getMachineFuelCategories('iron-plate')
      expect(categories).toEqual([])
    })
  })

  describe('calculateMaxFuelStorage', () => {
    it('should calculate fuel storage based on power consumption', () => {
      const powerConsumption = 180000 // 180kW
      const constants = gameConfig.getConstants()
      const storageTimeConstant = constants.fuel.autoRefuelCheckInterval / 1000 * 200
      
      const maxStorage = gameConfig.calculateMaxFuelStorage(powerConsumption)
      
      expect(maxStorage).toBe(powerConsumption * storageTimeConstant)
      expect(maxStorage).toBe(180000000) // 180MW
    })

    it('should handle zero power consumption', () => {
      const maxStorage = gameConfig.calculateMaxFuelStorage(0)
      expect(maxStorage).toBe(0)
    })
  })

  describe('updateConstants', () => {
    it('should update constants partially', () => {
      const originalConstants = gameConfig.getConstants()
      
      gameConfig.updateConstants({
        crafting: {
          minCraftingTime: 0.5,
          updateInterval: 200,
          maxProductivityBonus: 0.75
        }
      })
      
      const updatedConstants = gameConfig.getConstants()
      
      expect(updatedConstants.crafting).toEqual({
        minCraftingTime: 0.5,
        updateInterval: 200,
        maxProductivityBonus: 0.75
      })
      
      // Other constants should remain unchanged
      expect(updatedConstants.fuel).toEqual(originalConstants.fuel)
      expect(updatedConstants.power).toEqual(originalConstants.power)
    })

    it('should update nested properties', () => {
      gameConfig.updateConstants({
        ui: {
          autoSaveInterval: 30000,
          debounceDelay: 2000,
          maxRecentRecipes: 20
        }
      })
      
      const updatedConstants = gameConfig.getConstants()
      
      expect(updatedConstants.ui.autoSaveInterval).toBe(30000)
      expect(updatedConstants.ui.maxRecentRecipes).toBe(20)
    })
  })
})