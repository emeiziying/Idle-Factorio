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
// 模拟依赖项
vi.mock('../DataService')
vi.mock('../GameConfig')
vi.mock('../../utils/logger', () => ({
  warn: vi.fn(),
  error: vi.fn()
}))
vi.mock('../../utils/common', () => ({
  msToSeconds: (ms: number) => ms / 1000
}))

// FuelService 测试套件 - 燃料管理服务
describe('FuelService', () => {
  let fuelService: FuelService
  let mockDataService: MockObject<{ getItem: (id: string) => unknown; getItems: () => unknown[] }>
  let mockGameConfig: MockObject<{ get: (key: string) => unknown }>

  // 模拟烧煤机器数据
  const mockBurnerMachine = {
    id: 'stone-furnace',
    machine: {
      type: 'burner',
      energyUsage: 180000, // 180kW
      fuelCategories: ['chemical'],
      fuelSlots: 1
    }
  }

  // 模拟电力机器数据
  const mockElectricMachine = {
    id: 'electric-furnace',
    machine: {
      type: 'electric',
      energyUsage: 180000
    }
  }

  // 模拟煤炭物品
  const mockCoalItem = {
    id: 'coal',
    fuel: {
      value: 4000000, // 4MJ
      category: 'chemical'
    }
  }

  // 模拟木材物品
  const mockWoodItem = {
    id: 'wood',
    fuel: {
      value: 2000000, // 2MJ
      category: 'chemical'
    }
  }

  beforeEach(() => {
    // Clear instance
    // 清除实例
    ;(FuelService as unknown as ServiceInstance<FuelService>).instance = null
    localStorage.clear()

    // Setup mocks
    // 设置模拟对象
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

  // 单例模式测试
  describe('getInstance', () => {
    // 测试：应该返回单例实例
    it('should return singleton instance', () => {
      const instance1 = FuelService.getInstance()
      const instance2 = FuelService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  // 燃料优先级管理测试
  describe('fuel priority management', () => {
    // 测试：未设置自定义优先级时应使用默认优先级
    it('should use default priority when no custom priority set', () => {
      const priority = fuelService.getFuelPriority()
      expect(priority).toEqual(['coal', 'wood'])
    })

    // 测试：应该保存并使用自定义燃料优先级
    it('should save and use custom fuel priority', () => {
      const customPriority = ['wood', 'coal', 'solid-fuel']
      
      fuelService.setFuelPriority(customPriority)
      
      expect(fuelService.getFuelPriority()).toEqual(customPriority)
      expect(localStorage.getItem('fuelPriority')).toBe(JSON.stringify(customPriority))
    })

    // 测试：初始化时应从 localStorage 加载自定义优先级
    it('should load custom priority from localStorage on init', () => {
      const customPriority = ['solid-fuel', 'coal']
      localStorage.setItem('fuelPriority', JSON.stringify(customPriority))
      
      // Create new instance
      // 创建新实例
      ;(FuelService as unknown as ServiceInstance<FuelService>).instance = null
      const newService = FuelService.getInstance()
      
      expect(newService.getFuelPriority()).toEqual(customPriority)
    })
  })

  // 初始化燃料缓冲区测试
  describe('initializeFuelBuffer', () => {
    // 测试：应为烧煤机器初始化燃料缓冲区
    it('should initialize fuel buffer for burner machines', () => {
      const buffer = fuelService.initializeFuelBuffer('stone-furnace')
      
      expect(buffer).toBeDefined()
      expect(buffer?.type).toBe('item')
      expect(buffer?.slots).toBe(1)
      expect(buffer?.acceptedCategories).toEqual(['chemical'])
      expect(buffer?.burnRate).toBe(180000)
    })

    // 测试：电力机器应返回 null
    it('should return null for electric machines', () => {
      const buffer = fuelService.initializeFuelBuffer('electric-furnace')
      expect(buffer).toBeNull()
    })

    // 测试：不存在的机器应返回 null
    it('should return null for non-existent machines', () => {
      const buffer = fuelService.initializeFuelBuffer('non-existent')
      expect(buffer).toBeNull()
    })

    // 测试：应正确计算最大容量
    it('should calculate max capacity correctly', () => {
      mockGameConfig.calculateMaxFuelStorage.mockReturnValue(180000000)
      
      const buffer = fuelService.initializeFuelBuffer('stone-furnace')
      
      expect(buffer?.maxCapacity).toBe(180000000)
      expect(mockGameConfig.calculateMaxFuelStorage).toHaveBeenCalledWith(180000)
    })
  })

  // 消耗燃料测试
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

    // 测试：应基于时间增量消耗燃料
    it('should consume fuel based on delta time', () => {
      const result = fuelService.consumeFuel(facility, 1000) // 1 second // 1秒
      
      expect(result.success).toBe(true)
      expect(result.energyConsumed).toBe(180000) // 180kW * 1s
      expect(facility.fuel!.totalEnergy).toBe(3820000) // 4MJ - 180kJ
    })

    // 测试：应处理部分燃料消耗
    it('should handle partial fuel consumption', () => {
      facility.fuel!.items[0].energy = 100000 // Only 100kJ left // 仅剩 100kJ
      facility.fuel!.totalEnergy = 100000
      
      const result = fuelService.consumeFuel(facility, 1000)
      
      expect(result.success).toBe(true)
      expect(result.energyConsumed).toBe(100000)
      expect(facility.fuel!.items).toHaveLength(0)
      expect(facility.fuel!.totalEnergy).toBe(0)
    })

    // 测试：无燃料可用时应失败
    it('should fail when no fuel available', () => {
      facility.fuel!.items = []
      facility.fuel!.totalEnergy = 0
      
      const result = fuelService.consumeFuel(facility, 1000)
      
      expect(result.success).toBe(false)
      expect(result.reason).toBe('No fuel available')
      expect(facility.status).toBe(FacilityStatus.NO_FUEL)
    })

    // 测试：设施不活跃时不应消耗燃料
    it('should not consume fuel when facility is inactive', () => {
      facility.isActive = false
      
      const result = fuelService.consumeFuel(facility, 1000)
      
      expect(result.success).toBe(true)
      expect(result.energyConsumed).toBe(0)
      expect(facility.fuel!.totalEnergy).toBe(4000000)
    })
  })

  // 添加燃料测试
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

    // 测试：应向空槽位添加燃料
    it('should add fuel to empty slots', () => {
      const result = fuelService.addFuel(facility, 'coal', 5)
      
      expect(result.success).toBe(true)
      expect(result.quantityAdded).toBe(5)
      expect(result.quantityRemaining).toBe(0)
      expect(facility.fuel!.items).toHaveLength(1)
      expect(facility.fuel!.totalEnergy).toBe(20000000) // 5 * 4MJ
    })

    // 测试：应遵守槽位限制
    it('should respect slot limits', () => {
      // Fill slot with existing fuel
      // 用现有燃料填充槽位
      facility.fuel!.items = [{ itemId: 'coal', energy: 4000000 }]
      facility.fuel!.totalEnergy = 4000000
      
      const result = fuelService.addFuel(facility, 'wood', 3)
      
      expect(result.success).toBe(false)
      expect(result.reason).toBe('No available fuel slots')
    })

    // 测试：应拒绝错误的燃料类别
    it('should reject wrong fuel category', () => {
      mockGameConfig.getFuelCategory.mockReturnValue('nuclear')
      
      const result = fuelService.addFuel(facility, 'uranium-fuel', 1)
      
      expect(result.success).toBe(false)
      expect(result.reason).toBe('Fuel category not accepted: nuclear')
    })

    // 测试：应拒绝非燃料物品
    it('should reject non-fuel items', () => {
      mockDataService.getItem.mockImplementation((itemId: string) => {
        if (itemId === 'iron-plate') return { id: 'iron-plate' } // No fuel property // 没有燃料属性
        return null
      })
      
      const result = fuelService.addFuel(facility, 'iron-plate', 1)
      
      expect(result.success).toBe(false)
      expect(result.reason).toBe('Item is not a fuel: iron-plate')
    })
  })

  // 获取燃料状态测试
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

    // 测试：应正确计算燃料状态
    it('should calculate fuel status correctly', () => {
      const status = fuelService.getFuelStatus(facility)
      
      expect(status.totalEnergy).toBe(2000000)
      expect(status.maxEnergy).toBe(180000000)
      expect(status.fillPercentage).toBeCloseTo(1.11, 2)
      expect(status.estimatedRunTime).toBeCloseTo(11.11, 2) // 2MJ / 180kW
      expect(status.isEmpty).toBe(false)
      expect(status.isFull).toBe(false)
    })

    // 测试：应处理空燃料缓冲区
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

    // 测试：应检测满燃料缓冲区
    it('should detect full fuel buffer', () => {
      const gameConfig = GameConfig.getInstance()
      const fuelThreshold = gameConfig.getConstants().fuel.fuelBufferFullThreshold
      
      facility.fuel!.totalEnergy = 180000000 * (fuelThreshold / 100)
      
      const status = fuelService.getFuelStatus(facility)
      
      expect(status.isFull).toBe(true)
    })
  })

  // 自动补充燃料测试
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

    // 测试：应按优先级从库存自动补充燃料
    it('should auto-refuel from inventory following priority', () => {
      const result = fuelService.autoRefuel(facility, inventory)
      
      expect(result.success).toBe(true)
      expect(result.itemsConsumed).toEqual({ coal: 10 }) // Coal has higher priority // 煤炭优先级更高
      expect(inventory.get('coal')?.amount).toBe(0)
      expect(facility.fuel!.totalEnergy).toBe(40000000) // 10 * 4MJ
    })

    // 测试：高优先级燃料不可用时应使用低优先级燃料
    it('should use lower priority fuel when higher priority unavailable', () => {
      inventory.set('coal', { amount: 0 })
      
      const result = fuelService.autoRefuel(facility, inventory)
      
      expect(result.success).toBe(true)
      expect(result.itemsConsumed).toEqual({ wood: 20 })
      expect(inventory.get('wood')?.amount).toBe(0)
    })

    // 测试：缓冲区满时不应补充燃料
    it('should not refuel when buffer is full', () => {
      facility.fuel!.totalEnergy = 180000000 * 0.95
      
      const result = fuelService.autoRefuel(facility, inventory)
      
      expect(result.success).toBe(true)
      expect(result.itemsConsumed).toEqual({})
      expect(inventory.get('coal')?.amount).toBe(10) // Unchanged // 未改变
    })

    // 测试：应处理库存中无燃料的情况
    it('should handle no fuel in inventory', () => {
      inventory.clear()
      
      const result = fuelService.autoRefuel(facility, inventory)
      
      expect(result.success).toBe(false)
      expect(result.itemsConsumed).toEqual({})
    })
  })

  // 检查是否可以使用燃料测试
  describe('canUseFuel', () => {
    // 测试：应检查设施是否可以使用特定燃料
    it('should check if facility can use specific fuel', () => {
      const facility = {
        fuel: {
          acceptedCategories: ['chemical']
        }
      } as FacilityInstance

      expect(fuelService.canUseFuel(facility, 'coal')).toBe(true)
      expect(fuelService.canUseFuel(facility, 'wood')).toBe(true)
    })

    // 测试：应拒绝错误类别的燃料
    it('should reject wrong category fuel', () => {
      const facility = {
        fuel: {
          acceptedCategories: ['chemical']
        }
      } as FacilityInstance

      mockGameConfig.getFuelCategory.mockReturnValue('nuclear')
      
      expect(fuelService.canUseFuel(facility, 'uranium-fuel')).toBe(false)
    })

    // 测试：应拒绝非燃料物品
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