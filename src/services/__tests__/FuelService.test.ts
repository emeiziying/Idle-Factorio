/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FuelService } from '../FuelService'
import { DataService } from '../DataService'
import { GameConfig } from '../GameConfig'
import type { FacilityInstance } from '../../types/facilities'
import { FacilityStatus } from '../../types/facilities'
import type { ServiceInstance, MockObject } from '../../types/test-utils'

// Mock dependencies
vi.mock('../DataService')
vi.mock('../GameConfig')
vi.mock('../../utils/logger', () => ({
  warn: vi.fn(),
  error: vi.fn()
}))
vi.mock('../../utils/common', () => ({
  msToSeconds: (ms: number) => ms / 1000
}))

describe('FuelService', () => {
  let fuelService: FuelService
  let mockDataService: MockObject<{ getItem: (id: string) => unknown; getItems: () => unknown[] }>
  let mockGameConfig: MockObject<{ get: (key: string) => unknown }>

  const mockBurnerMachine = {
    id: 'stone-furnace',
    machine: {
      type: 'burner',
      energyUsage: 180000, // 180kW
      fuelCategories: ['chemical'],
      fuelSlots: 1
    }
  }

  const mockElectricMachine = {
    id: 'electric-furnace',
    machine: {
      type: 'electric',
      energyUsage: 180000
    }
  }

  const mockCoalItem = {
    id: 'coal',
    fuel: {
      value: 4000000, // 4MJ
      category: 'chemical'
    }
  }

  const mockWoodItem = {
    id: 'wood',
    fuel: {
      value: 2000000, // 2MJ
      category: 'chemical'
    }
  }

  beforeEach(() => {
    // Clear instance
    ;(FuelService as unknown as ServiceInstance<FuelService>).instance = null
    localStorage.clear()

    // Setup mocks
    mockDataService = {
      getInstance: vi.fn(),
      getItem: vi.fn((itemId: string) => {
        switch (itemId) {
          case 'stone-furnace': return mockBurnerMachine
          case 'electric-furnace': return mockElectricMachine
          case 'coal': return mockCoalItem
          case 'wood': return mockWoodItem
          default: return null
        }
      })
    }

    mockGameConfig = {
      getInstance: vi.fn(),
      getFuelPriority: vi.fn(() => ['coal', 'wood']),
      getFuelCategory: vi.fn((itemId: string) => {
        if (itemId === 'coal' || itemId === 'wood') return 'chemical'
        return null
      }),
      calculateMaxFuelStorage: vi.fn((power: number) => power * 1000)
    }

    vi.mocked(DataService.getInstance).mockReturnValue(mockDataService)
    vi.mocked(GameConfig.getInstance).mockReturnValue(mockGameConfig)

    fuelService = FuelService.getInstance()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = FuelService.getInstance()
      const instance2 = FuelService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('fuel priority management', () => {
    it('should use default priority when no custom priority set', () => {
      const priority = fuelService.getFuelPriority()
      expect(priority).toEqual(['coal', 'wood'])
    })

    it('should save and use custom fuel priority', () => {
      const customPriority = ['wood', 'coal', 'solid-fuel']
      
      fuelService.setFuelPriority(customPriority)
      
      expect(fuelService.getFuelPriority()).toEqual(customPriority)
      expect(localStorage.getItem('fuelPriority')).toBe(JSON.stringify(customPriority))
    })

    it('should load custom priority from localStorage on init', () => {
      const customPriority = ['solid-fuel', 'coal']
      localStorage.setItem('fuelPriority', JSON.stringify(customPriority))
      
      // Create new instance
      ;(FuelService as unknown as ServiceInstance<FuelService>).instance = null
      const newService = FuelService.getInstance()
      
      expect(newService.getFuelPriority()).toEqual(customPriority)
    })
  })

  describe('initializeFuelBuffer', () => {
    it('should initialize fuel buffer for burner machines', () => {
      const buffer = fuelService.initializeFuelBuffer('stone-furnace')
      
      expect(buffer).toBeDefined()
      expect(buffer?.type).toBe('item')
      expect(buffer?.slots).toBe(1)
      expect(buffer?.acceptedCategories).toEqual(['chemical'])
      expect(buffer?.burnRate).toBe(180000)
    })

    it('should return null for electric machines', () => {
      const buffer = fuelService.initializeFuelBuffer('electric-furnace')
      expect(buffer).toBeNull()
    })

    it('should return null for non-existent machines', () => {
      const buffer = fuelService.initializeFuelBuffer('non-existent')
      expect(buffer).toBeNull()
    })

    it('should calculate max capacity correctly', () => {
      mockGameConfig.calculateMaxFuelStorage.mockReturnValue(180000000)
      
      const buffer = fuelService.initializeFuelBuffer('stone-furnace')
      
      expect(buffer?.maxCapacity).toBe(180000000)
      expect(mockGameConfig.calculateMaxFuelStorage).toHaveBeenCalledWith(180000)
    })
  })

  describe('consumeFuel', () => {
    let facility: FacilityInstance

    beforeEach(() => {
      facility = {
        id: 'furnace-1',
        type: 'smelter',
        itemId: 'stone-furnace',
        recipe: 'iron-plate',
        isActive: true,
        efficiency: 1,
        speed: 1,
        status: FacilityStatus.RUNNING,
        fuel: {
          type: 'item',
          items: [{ itemId: 'coal', energy: 4000000 }],
          totalEnergy: 4000000,
          maxCapacity: 180000000,
          slots: 1,
          acceptedCategories: ['chemical'],
          burnRate: 180000
        }
      }
    })

    it('should consume fuel based on delta time', () => {
      const result = fuelService.consumeFuel(facility, 1000) // 1 second
      
      expect(result.success).toBe(true)
      expect(result.energyConsumed).toBe(180000) // 180kW * 1s
      expect(facility.fuel!.totalEnergy).toBe(3820000) // 4MJ - 180kJ
    })

    it('should handle partial fuel consumption', () => {
      facility.fuel!.items[0].energy = 100000 // Only 100kJ left
      facility.fuel!.totalEnergy = 100000
      
      const result = fuelService.consumeFuel(facility, 1000)
      
      expect(result.success).toBe(true)
      expect(result.energyConsumed).toBe(100000)
      expect(facility.fuel!.items).toHaveLength(0)
      expect(facility.fuel!.totalEnergy).toBe(0)
    })

    it('should fail when no fuel available', () => {
      facility.fuel!.items = []
      facility.fuel!.totalEnergy = 0
      
      const result = fuelService.consumeFuel(facility, 1000)
      
      expect(result.success).toBe(false)
      expect(result.reason).toBe('No fuel available')
      expect(facility.status).toBe(FacilityStatus.NO_FUEL)
    })

    it('should not consume fuel when facility is inactive', () => {
      facility.isActive = false
      
      const result = fuelService.consumeFuel(facility, 1000)
      
      expect(result.success).toBe(true)
      expect(result.energyConsumed).toBe(0)
      expect(facility.fuel!.totalEnergy).toBe(4000000)
    })
  })

  describe('addFuel', () => {
    let facility: FacilityInstance

    beforeEach(() => {
      facility = {
        id: 'furnace-1',
        type: 'smelter',
        itemId: 'stone-furnace',
        recipe: 'iron-plate',
        isActive: true,
        efficiency: 1,
        speed: 1,
        fuel: {
          type: 'item',
          items: [],
          totalEnergy: 0,
          maxCapacity: 180000000,
          slots: 1,
          acceptedCategories: ['chemical'],
          burnRate: 180000
        }
      }
    })

    it('should add fuel to empty slots', () => {
      const result = fuelService.addFuel(facility, 'coal', 5)
      
      expect(result.success).toBe(true)
      expect(result.quantityAdded).toBe(5)
      expect(result.quantityRemaining).toBe(0)
      expect(facility.fuel!.items).toHaveLength(1)
      expect(facility.fuel!.totalEnergy).toBe(20000000) // 5 * 4MJ
    })

    it('should respect slot limits', () => {
      // Fill slot with existing fuel
      facility.fuel!.items = [{ itemId: 'coal', energy: 4000000 }]
      facility.fuel!.totalEnergy = 4000000
      
      const result = fuelService.addFuel(facility, 'wood', 3)
      
      expect(result.success).toBe(false)
      expect(result.reason).toBe('No available fuel slots')
    })

    it('should reject wrong fuel category', () => {
      mockGameConfig.getFuelCategory.mockReturnValue('nuclear')
      
      const result = fuelService.addFuel(facility, 'uranium-fuel', 1)
      
      expect(result.success).toBe(false)
      expect(result.reason).toBe('Fuel category not accepted: nuclear')
    })

    it('should reject non-fuel items', () => {
      mockDataService.getItem.mockImplementation((itemId: string) => {
        if (itemId === 'iron-plate') return { id: 'iron-plate' } // No fuel property
        return null
      })
      
      const result = fuelService.addFuel(facility, 'iron-plate', 1)
      
      expect(result.success).toBe(false)
      expect(result.reason).toBe('Item is not a fuel: iron-plate')
    })
  })

  describe('getFuelStatus', () => {
    let facility: FacilityInstance

    beforeEach(() => {
      facility = {
        id: 'furnace-1',
        type: 'smelter',
        itemId: 'stone-furnace',
        fuel: {
          type: 'item',
          items: [{ itemId: 'coal', energy: 2000000 }],
          totalEnergy: 2000000,
          maxCapacity: 180000000,
          slots: 1,
          acceptedCategories: ['chemical'],
          burnRate: 180000
        }
      } as FacilityInstance
    })

    it('should calculate fuel status correctly', () => {
      const status = fuelService.getFuelStatus(facility)
      
      expect(status.totalEnergy).toBe(2000000)
      expect(status.maxEnergy).toBe(180000000)
      expect(status.fillPercentage).toBeCloseTo(1.11, 2)
      expect(status.estimatedRunTime).toBeCloseTo(11.11, 2) // 2MJ / 180kW
      expect(status.isEmpty).toBe(false)
      expect(status.isFull).toBe(false)
    })

    it('should handle empty fuel buffer', () => {
      facility.fuel!.items = []
      facility.fuel!.totalEnergy = 0
      
      const status = fuelService.getFuelStatus(facility)
      
      expect(status.totalEnergy).toBe(0)
      expect(status.fillPercentage).toBe(0)
      expect(status.estimatedRunTime).toBe(0)
      expect(status.isEmpty).toBe(true)
      expect(status.isFull).toBe(false)
    })

    it('should detect full fuel buffer', () => {
      const gameConfig = GameConfig.getInstance()
      const fuelThreshold = gameConfig.getConstants().fuel.fuelBufferFullThreshold
      
      facility.fuel!.totalEnergy = 180000000 * (fuelThreshold / 100)
      
      const status = fuelService.getFuelStatus(facility)
      
      expect(status.isFull).toBe(true)
    })
  })

  describe('autoRefuel', () => {
    let facility: FacilityInstance
    let inventory: Map<string, { amount: number }>

    beforeEach(() => {
      facility = {
        id: 'furnace-1',
        type: 'smelter',
        itemId: 'stone-furnace',
        fuel: {
          type: 'item',
          items: [],
          totalEnergy: 0,
          maxCapacity: 180000000,
          slots: 1,
          acceptedCategories: ['chemical'],
          burnRate: 180000
        }
      } as FacilityInstance

      inventory = new Map([
        ['coal', { amount: 10 }],
        ['wood', { amount: 20 }]
      ])
    })

    it('should auto-refuel from inventory following priority', () => {
      const result = fuelService.autoRefuel(facility, inventory)
      
      expect(result.success).toBe(true)
      expect(result.itemsConsumed).toEqual({ coal: 10 }) // Coal has higher priority
      expect(inventory.get('coal')?.amount).toBe(0)
      expect(facility.fuel!.totalEnergy).toBe(40000000) // 10 * 4MJ
    })

    it('should use lower priority fuel when higher priority unavailable', () => {
      inventory.set('coal', { amount: 0 })
      
      const result = fuelService.autoRefuel(facility, inventory)
      
      expect(result.success).toBe(true)
      expect(result.itemsConsumed).toEqual({ wood: 20 })
      expect(inventory.get('wood')?.amount).toBe(0)
    })

    it('should not refuel when buffer is full', () => {
      facility.fuel!.totalEnergy = 180000000 * 0.95
      
      const result = fuelService.autoRefuel(facility, inventory)
      
      expect(result.success).toBe(true)
      expect(result.itemsConsumed).toEqual({})
      expect(inventory.get('coal')?.amount).toBe(10) // Unchanged
    })

    it('should handle no fuel in inventory', () => {
      inventory.clear()
      
      const result = fuelService.autoRefuel(facility, inventory)
      
      expect(result.success).toBe(false)
      expect(result.itemsConsumed).toEqual({})
    })
  })

  describe('canUseFuel', () => {
    it('should check if facility can use specific fuel', () => {
      const facility = {
        fuel: {
          acceptedCategories: ['chemical']
        }
      } as FacilityInstance

      expect(fuelService.canUseFuel(facility, 'coal')).toBe(true)
      expect(fuelService.canUseFuel(facility, 'wood')).toBe(true)
    })

    it('should reject wrong category fuel', () => {
      const facility = {
        fuel: {
          acceptedCategories: ['chemical']
        }
      } as FacilityInstance

      mockGameConfig.getFuelCategory.mockReturnValue('nuclear')
      
      expect(fuelService.canUseFuel(facility, 'uranium-fuel')).toBe(false)
    })

    it('should reject non-fuel items', () => {
      const facility = {
        fuel: {
          acceptedCategories: ['chemical']
        }
      } as FacilityInstance

      mockGameConfig.getFuelCategory.mockReturnValue(null)
      
      expect(fuelService.canUseFuel(facility, 'iron-plate')).toBe(false)
    })
  })
})