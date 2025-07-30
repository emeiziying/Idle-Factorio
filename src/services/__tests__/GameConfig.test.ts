import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { GameConfig } from '../GameConfig'
import { DataService } from '../DataService'
import type { Item } from '../../types'

// 模拟 DataService
vi.mock('../DataService', () => ({
  DataService: {
    getInstance: vi.fn()
  }
}))

// GameConfig 测试套件 - 游戏配置管理服务
describe('GameConfig', () => {
  let gameConfig: GameConfig
  let mockDataService: { getItem: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    // 清除已存在的实例
    ;(GameConfig as unknown as { instance: GameConfig | null }).instance = null

    // 创建模拟的 DataService
    mockDataService = {
      getItem: vi.fn()
    }

    // 设置 DataService 模拟
    vi.mocked(DataService.getInstance).mockReturnValue(mockDataService as unknown as DataService)

    gameConfig = GameConfig.getInstance()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // 单例模式测试
  describe('getInstance', () => {
    // 测试：应该返回单例实例
    it('should return singleton instance', () => {
      const instance1 = GameConfig.getInstance()
      const instance2 = GameConfig.getInstance()
      
      expect(instance1).toBe(instance2)
    })
  })

  // 获取常量配置测试
  describe('getConstants', () => {
    // 测试：应该返回具有正确结构的游戏常量
    it('should return game constants with correct structure', () => {
      const constants = gameConfig.getConstants()
      
      expect(constants).toHaveProperty('crafting')
      expect(constants).toHaveProperty('fuel')
      expect(constants).toHaveProperty('power')
      expect(constants).toHaveProperty('storage')
      expect(constants).toHaveProperty('ui')
    })

    // 测试：应该有正确的制作常量
    it('should have correct crafting constants', () => {
      const constants = gameConfig.getConstants()
      
      expect(constants.crafting).toEqual({
        minCraftingTime: 0.1,
        updateInterval: 100,
        maxProductivityBonus: 0.5
      })
    })

    // 测试：应该有正确的燃料常量
    it('should have correct fuel constants', () => {
      const constants = gameConfig.getConstants()
      
      expect(constants.fuel).toEqual({
        defaultFuelSlots: 1,
        fuelBufferFullThreshold: 95,
        autoRefuelCheckInterval: 5000
      })
    })

    // 测试：应该有正确的电力常量
    it('should have correct power constants', () => {
      const constants = gameConfig.getConstants()
      
      expect(constants.power).toEqual({
        surplusThreshold: 110,
        balancedThreshold: 95,
        solarPanelDayRatio: 0.7
      })
    })

    // 测试：应该有正确的存储常量
    it('should have correct storage constants', () => {
      const constants = gameConfig.getConstants()
      
      expect(constants.storage).toEqual({
        defaultStackSize: 50,
        maxInventorySlots: 1000,
        storageOptimizationThreshold: 100
      })
    })

    // 测试：应该有正确的 UI 常量
    it('should have correct UI constants', () => {
      const constants = gameConfig.getConstants()
      
      expect(constants.ui).toEqual({
        autoSaveInterval: 10000,
        debounceDelay: 2000,
        maxRecentRecipes: 10
      })
    })
  })

  // 获取燃料优先级测试
  describe('getFuelPriority', () => {
    // 测试：应该返回默认的燃料优先级列表
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

  // 获取燃料类别测试
  describe('getFuelCategory', () => {
    // 测试：应该从物品数据返回燃料类别
    it('should return fuel category from item data', () => {
      vi.mocked(mockDataService.getItem).mockReturnValue({
        id: 'coal',
        fuel: {
          value: 4000000,
          category: 'chemical'
        }
      } as Item)

      const category = gameConfig.getFuelCategory('coal')
      expect(category).toBe('chemical')
    })

    // 测试：核燃料物品应返回 nuclear
    it('should return nuclear for nuclear items', () => {
      vi.mocked(mockDataService.getItem).mockReturnValue({
        id: 'nuclear-fuel',
        fuel: {
          value: 1210000000
        }
      } as Item)

      const category = gameConfig.getFuelCategory('nuclear-fuel')
      expect(category).toBe('nuclear')
    })

    // 测试：铀物品应返回 nuclear
    it('should return nuclear for uranium items', () => {
      vi.mocked(mockDataService.getItem).mockReturnValue({
        id: 'uranium-fuel-cell',
        fuel: {
          value: 8000000000
        }
      } as Item)

      const category = gameConfig.getFuelCategory('uranium-fuel-cell')
      expect(category).toBe('nuclear')
    })

    // 测试：有燃料值的物品默认应返回 chemical
    it('should return chemical by default for items with fuel value', () => {
      vi.mocked(mockDataService.getItem).mockReturnValue({
        id: 'wood',
        fuel: {
          value: 2000000
        }
      } as Item)

      const category = gameConfig.getFuelCategory('wood')
      expect(category).toBe('chemical')
    })

    // 测试：非燃料物品应返回 null
    it('should return null for non-fuel items', () => {
      vi.mocked(mockDataService.getItem).mockReturnValue({
        id: 'iron-plate'
      } as Item)

      const category = gameConfig.getFuelCategory('iron-plate')
      expect(category).toBeNull()
    })

    // 测试：物品未找到时应返回 null
    it('should return null when item not found', () => {
      vi.mocked(mockDataService.getItem).mockReturnValue(undefined)

      const category = gameConfig.getFuelCategory('unknown-item')
      expect(category).toBeNull()
    })
  })

  // 判断是否为燃烧机器测试
  describe('isBurnerMachine', () => {
    // 测试：燃烧机器应返回 true
    it('should return true for burner machines', () => {
      vi.mocked(mockDataService.getItem).mockReturnValue({
        id: 'burner-mining-drill',
        machine: {
          type: 'burner'
        }
      } as Item)

      expect(gameConfig.isBurnerMachine('burner-mining-drill')).toBe(true)
    })

    // 测试：电力机器应返回 false
    it('should return false for electric machines', () => {
      vi.mocked(mockDataService.getItem).mockReturnValue({
        id: 'electric-mining-drill',
        machine: {
          type: 'electric'
        }
      } as Item)

      expect(gameConfig.isBurnerMachine('electric-mining-drill')).toBe(false)
    })

    // 测试：非机器物品应返回 false
    it('should return false for non-machine items', () => {
      vi.mocked(mockDataService.getItem).mockReturnValue({
        id: 'iron-plate'
      } as Item)

      expect(gameConfig.isBurnerMachine('iron-plate')).toBe(false)
    })

    // 测试：物品未找到时应返回 false
    it('should return false when item not found', () => {
      vi.mocked(mockDataService.getItem).mockReturnValue(undefined)

      expect(gameConfig.isBurnerMachine('unknown-item')).toBe(false)
    })
  })

  // 获取机器燃料类别测试
  describe('getMachineFuelCategories', () => {
    // 测试：应该返回机器的燃料类别
    it('should return fuel categories for machines', () => {
      vi.mocked(mockDataService.getItem).mockReturnValue({
        id: 'boiler',
        machine: {
          fuelCategories: ['chemical']
        }
      } as Item)

      const categories = gameConfig.getMachineFuelCategories('boiler')
      expect(categories).toEqual(['chemical'])
    })

    // 测试：应该返回多个燃料类别
    it('should return multiple fuel categories', () => {
      vi.mocked(mockDataService.getItem).mockReturnValue({
        id: 'locomotive',
        machine: {
          fuelCategories: ['chemical', 'nuclear']
        }
      } as Item)

      const categories = gameConfig.getMachineFuelCategories('locomotive')
      expect(categories).toEqual(['chemical', 'nuclear'])
    })

    // 测试：没有燃料类别的机器应返回空数组
    it('should return empty array for machines without fuel categories', () => {
      vi.mocked(mockDataService.getItem).mockReturnValue({
        id: 'electric-furnace',
        machine: {}
      } as Item)

      const categories = gameConfig.getMachineFuelCategories('electric-furnace')
      expect(categories).toEqual([])
    })

    // 测试：非机器物品应返回空数组
    it('should return empty array for non-machine items', () => {
      vi.mocked(mockDataService.getItem).mockReturnValue({
        id: 'iron-plate'
      } as Item)

      const categories = gameConfig.getMachineFuelCategories('iron-plate')
      expect(categories).toEqual([])
    })
  })

  // 计算最大燃料存储测试
  describe('calculateMaxFuelStorage', () => {
    // 测试：应该基于能耗计算燃料存储
    it('should calculate fuel storage based on power consumption', () => {
      const powerConsumption = 180000 // 180kW
      const constants = gameConfig.getConstants()
      const storageTimeConstant = constants.fuel.autoRefuelCheckInterval / 1000 * 200
      
      const maxStorage = gameConfig.calculateMaxFuelStorage(powerConsumption)
      
      expect(maxStorage).toBe(powerConsumption * storageTimeConstant)
      expect(maxStorage).toBe(180000000) // 180MW
    })

    // 测试：应该处理零能耗
    it('should handle zero power consumption', () => {
      const maxStorage = gameConfig.calculateMaxFuelStorage(0)
      expect(maxStorage).toBe(0)
    })
  })

  // 更新常量测试
  describe('updateConstants', () => {
    // 测试：应该部分更新常量
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
      
      // 其他常量应保持不变
      // 其他常量应保持不变
      expect(updatedConstants.fuel).toEqual(originalConstants.fuel)
      expect(updatedConstants.power).toEqual(originalConstants.power)
    })

    // 测试：应该更新嵌套属性
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