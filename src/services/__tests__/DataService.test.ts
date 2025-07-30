import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DataService } from '../DataService'
import { ServiceLocator, SERVICE_NAMES } from '../ServiceLocator'
import type { GameData } from '../../types/index'
import type { ServiceInstance } from '../../types/test-utils'

// Mock game data
// 模拟游戏数据
const mockGameData: Partial<GameData> = {
  categories: [
    { id: 'intermediate-products', name: 'Intermediate products' },
    { id: 'logistics', name: 'Logistics' }
  ],
  items: [
    { 
      id: 'iron-plate', 
      name: 'Iron plate',
      category: 'intermediate-products',
      stack: 100,
      row: 1
    },
    { 
      id: 'copper-plate', 
      name: 'Copper plate',
      category: 'intermediate-products',
      stack: 100,
      row: 1
    },
    { 
      id: 'transport-belt', 
      name: 'Transport belt',
      category: 'logistics',
      stack: 100,
      row: 2
    }
  ],
  recipes: [
    {
      id: 'iron-plate',
      name: 'Iron plate',
      category: 'smelting',
      time: 3.2,
      in: { 'iron-ore': 1 },
      out: { 'iron-plate': 1 },
      producers: ['stone-furnace', 'steel-furnace', 'electric-furnace']
    },
    {
      id: 'copper-plate',
      name: 'Copper plate',
      category: 'smelting',
      time: 3.2,
      in: { 'copper-ore': 1 },
      out: { 'copper-plate': 1 },
      producers: ['stone-furnace', 'steel-furnace', 'electric-furnace']
    }
  ]
}

// Mock i18n data
// 模拟国际化数据
const mockI18nData = {
  categories: {
    'intermediate-products': '中间产品',
    'logistics': '物流'
  },
  items: {
    'iron-plate': '铁板',
    'copper-plate': '铜板',
    'transport-belt': '传送带'
  },
  recipes: {
    'iron-plate': '铁板',
    'copper-plate': '铜板'
  },
  locations: {}
}

// Mock imports - must be hoisted to avoid circular reference
vi.mock('../../data/spa/data.json', () => ({
  default: {
    categories: [
      { id: 'intermediate-products', name: 'Intermediate products' },
      { id: 'logistics', name: 'Logistics' }
    ],
    items: [
      { 
        id: 'iron-plate', 
        name: 'Iron plate',
        category: 'intermediate-products',
        stack: 100,
        row: 1
      },
      { 
        id: 'copper-plate', 
        name: 'Copper plate',
        category: 'intermediate-products',
        stack: 100,
        row: 1
      },
      { 
        id: 'transport-belt', 
        name: 'Transport belt',
        category: 'logistics',
        stack: 100,
        row: 2
      }
    ],
    recipes: [
      {
        id: 'iron-plate',
        name: 'Iron plate',
        category: 'smelting',
        time: 3.2,
        in: { 'iron-ore': 1 },
        out: { 'iron-plate': 1 },
        producers: ['stone-furnace', 'steel-furnace', 'electric-furnace']
      },
      {
        id: 'copper-plate',
        name: 'Copper plate',
        category: 'smelting',
        time: 3.2,
        in: { 'copper-ore': 1 },
        out: { 'copper-plate': 1 },
        producers: ['stone-furnace', 'steel-furnace', 'electric-furnace']
      }
    ],
    icons: []
  }
}))

vi.mock('../../utils/logger', () => ({
  error: vi.fn()
}))

// DataService 测试套件 - 游戏数据管理服务
describe('DataService', () => {
  let dataService: DataService
  let mockUserProgressService: { isItemInAnyMilestone: ReturnType<typeof vi.fn> }
  let mockTechnologyService: { 
    getData: ReturnType<typeof vi.fn>; 
    canCraftItem: ReturnType<typeof vi.fn>;
    isItemUnlocked: ReturnType<typeof vi.fn>;
    isRecipeUnlocked: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    // Clear instance
    // 清除实例
    ;(DataService as unknown as ServiceInstance<DataService>).instance = null
    ServiceLocator.clear()

    // Mock services
    // 模拟服务
    mockUserProgressService = {
      isItemInAnyMilestone: vi.fn(() => false)
    }

    mockTechnologyService = {
      getData: vi.fn(() => ({})),
      canCraftItem: vi.fn(() => true),
      isItemUnlocked: vi.fn(() => false),
      isRecipeUnlocked: vi.fn(() => false)
    }

    ServiceLocator.register(SERVICE_NAMES.USER_PROGRESS, mockUserProgressService)
    ServiceLocator.register(SERVICE_NAMES.TECHNOLOGY, mockTechnologyService)
    
    // Mock RecipeService with proper recipes
    // 使用适当的配方模拟 RecipeService
    const mockRecipeService = {
      getRecipeById: vi.fn((id: string) => {
        if (id === 'iron-plate') {
          return {
            id: 'iron-plate',
            name: 'Iron plate',
            category: 'smelting',
            time: 3.2,
            in: { 'iron-ore': 1 },
            out: { 'iron-plate': 1 },
            producers: ['stone-furnace', 'steel-furnace', 'electric-furnace']
          }
        }
        return undefined
      }),
      getRecipesThatProduce: vi.fn((itemId: string) => {
        // Return recipes for items that have them, empty for raw materials
        // 为有配方的物品返回配方，原材料返回空数组
        if (itemId === 'iron-plate') {
          return [{
            id: 'iron-plate',
            name: 'Iron plate',
            category: 'smelting',
            time: 3.2,
            in: { 'iron-ore': 1 },
            out: { 'iron-plate': 1 },
            producers: ['stone-furnace', 'steel-furnace', 'electric-furnace'],
            flags: ['locked'] // Make it require technology unlock for test control // 设置为需要科技解锁以便测试控制
          }]
        }
        if (itemId === 'copper-plate') {
          return [{
            id: 'copper-plate',
            name: 'Copper plate',
            category: 'smelting',
            time: 3.2,
            in: { 'copper-ore': 1 },
            out: { 'copper-plate': 1 },
            producers: ['stone-furnace', 'steel-furnace', 'electric-furnace'],
            flags: ['locked'] // Make it require technology unlock for test control // 设置为需要科技解锁以便测试控制
          }]
        }
        if (itemId === 'transport-belt') {
          return [{
            id: 'transport-belt',
            name: 'Transport belt',
            category: 'crafting',
            time: 0.5,
            in: { 'iron-plate': 1, 'iron-gear-wheel': 1 },
            out: { 'transport-belt': 2 },
            producers: ['assembling-machine-1', 'assembling-machine-2', 'assembling-machine-3'],
            flags: ['locked'] // Requires research // 需要研究
          }]
        }
        return [] // Raw materials like iron-ore, copper-ore have no recipes // 原材料如铁矿石、铜矿石没有配方
      }),
      getRecipesThatUse: vi.fn(() => []),
      getRecipeStats: vi.fn(() => null),
      getMostEfficientRecipe: vi.fn(() => undefined)
    }
    ServiceLocator.register(SERVICE_NAMES.RECIPE, mockRecipeService)

    dataService = DataService.getInstance()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // 单例模式测试
  describe('getInstance', () => {
    // 测试：应该返回单例实例
    it('should return singleton instance', () => {
      const instance1 = DataService.getInstance()
      const instance2 = DataService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  // 游戏数据加载测试
  describe('loadGameData', () => {
    // 测试：应该成功加载游戏数据
    it('should load game data successfully', async () => {
      const data = await dataService.loadGameData()
      
      expect(data).toBeDefined()
      expect(data.categories).toHaveLength(2)
      expect(data.items).toHaveLength(3)
      expect(data.recipes).toHaveLength(2)
    })

    // 测试：应该缓存已加载的数据
    it('should cache loaded data', async () => {
      const data1 = await dataService.loadGameData()
      const data2 = await dataService.loadGameData()
      
      expect(data1).toBe(data2)
    })

    // 测试：应该处理并发加载请求
    it('should handle concurrent load requests', async () => {
      const promise1 = dataService.loadGameData()
      const promise2 = dataService.loadGameData()
      
      const [data1, data2] = await Promise.all([promise1, promise2])
      
      expect(data1).toBe(data2)
    })
  })

  // 国际化数据加载测试
  describe('loadI18n', () => {
    beforeEach(() => {
      // Mock dynamic import
      // 模拟动态导入
      vi.doMock('../../data/spa/i18n/zh.json', () => ({
        default: mockI18nData
      }))
    })

    // 测试：应该为支持的语言加载 i18n 数据
    it('should load i18n data for supported language', async () => {
      await dataService.loadI18nData('zh')
      
      expect(dataService.getLocalizedCategoryName('intermediate-products')).toBe('中间产品')
      expect(dataService.getLocalizedItemName('iron-plate')).toBe('铁板')
    })

    // 测试：不支持的语言应该回退到英语
    it('should fallback to English for unsupported language', async () => {
      await dataService.loadGameData()
      await dataService.loadI18nData('unsupported')
      
      // Should fallback to original ID when i18n fails
      // i18n 失败时应该回退到原始 ID
      expect(dataService.getLocalizedItemName('iron-plate')).toBe('iron-plate')
    })

    // 测试：应该处理并发的 i18n 加载请求
    it('should handle concurrent i18n load requests', async () => {
      const promise1 = dataService.loadI18nData('zh')
      const promise2 = dataService.loadI18nData('zh')
      
      await Promise.all([promise1, promise2])
      
      expect(dataService.getLocalizedItemName('iron-plate')).toBe('铁板')
    })
  })

  // 分类相关方法测试
  describe('getAllCategories', () => {
    // 测试：应该返回所有分类
    it('should return all categories', async () => {
      await dataService.loadGameData()
      const categories = dataService.getAllCategories()
      
      expect(categories).toHaveLength(2)
      expect(categories[0].id).toBe('intermediate-products')
      expect(categories[1].id).toBe('logistics')
    })

    // 测试：数据未加载时应返回空数组
    it('should return empty array when data not loaded', () => {
      const categories = dataService.getAllCategories()
      expect(categories).toEqual([])
    })
  })

  // 按分类获取物品测试
  describe('getItemsByCategory', () => {
    beforeEach(async () => {
      await dataService.loadGameData()
    })

    // 测试：应该返回特定分类的物品
    it('should return items for specific category', () => {
      const items = dataService.getItemsByCategory('intermediate-products')
      
      expect(items).toHaveLength(2)
      expect(items.map(i => i.id)).toContain('iron-plate')
      expect(items.map(i => i.id)).toContain('copper-plate')
    })

    // 测试：不存在的分类应返回空数组
    it('should return empty array for non-existent category', () => {
      const items = dataService.getItemsByCategory('non-existent')
      expect(items).toEqual([])
    })

    // 测试：当 includeUnlocked 为 false 时应过滤未解锁物品
    it('should filter unlocked items when includeUnlocked is false', () => {
      vi.mocked(mockTechnologyService.canCraftItem).mockImplementation((itemId: string) => {
        return itemId === 'iron-plate'
      })

      const items = dataService.getItemsByCategory('intermediate-products')
      
      expect(items).toHaveLength(1)
      expect(items[0].id).toBe('iron-plate')
    })
  })

  // 获取物品详情测试
  describe('getItem', () => {
    beforeEach(async () => {
      await dataService.loadGameData()
    })

    // 测试：应该根据 ID 返回物品
    it('should return item by id', () => {
      const item = dataService.getItem('iron-plate')
      
      expect(item).toBeDefined()
      expect(item?.name).toBe('Iron plate')
      expect(item?.category).toBe('intermediate-products')
    })

    // 测试：不存在的物品应返回 undefined
    it('should return undefined for non-existent item', () => {
      const item = dataService.getItem('non-existent')
      expect(item).toBeUndefined()
    })
  })

  // 获取配方详情测试
  describe('getRecipe', () => {
    beforeEach(async () => {
      await dataService.loadGameData()
    })

    // 测试：应该根据 ID 返回配方
    it('should return recipe by id', () => {
      const recipe = dataService.getRecipe('iron-plate')
      
      expect(recipe).toBeDefined()
      expect(recipe?.time).toBe(3.2)
      expect(recipe?.in).toEqual({ 'iron-ore': 1 })
      expect(recipe?.out).toEqual({ 'iron-plate': 1 })
    })

    // 测试：不存在的配方应返回 undefined
    it('should return undefined for non-existent recipe', () => {
      const recipe = dataService.getRecipe('non-existent')
      expect(recipe).toBeUndefined()
    })
  })



  // 物品解锁状态检查
  describe('isItemUnlocked', () => {
    beforeEach(async () => {
      await dataService.loadGameData()
    })

    // 测试：当技术服务说物品可以制作时返回 true
    it('should return true when technology service says item can be crafted', () => {
      vi.mocked(mockTechnologyService.canCraftItem).mockReturnValue(true)
      
      expect(dataService.isItemUnlocked('iron-plate')).toBe(true)
    })

    // 测试：当技术服务说物品不能制作时返回 false
    it('should return false when technology service says item cannot be crafted', () => {
      vi.mocked(mockTechnologyService.canCraftItem).mockReturnValue(false)
      
      expect(dataService.isItemUnlocked('iron-plate')).toBe(false)
    })

    // 测试：解锁状态应该被缓存
    it('should cache unlock status', () => {
      vi.mocked(mockTechnologyService.canCraftItem).mockReturnValue(true)
      
      // First call
      dataService.isItemUnlocked('iron-plate')
      
      // Second call should use cache
      dataService.isItemUnlocked('iron-plate')
      
      expect(mockTechnologyService.canCraftItem).toHaveBeenCalledTimes(1)
    })
  })

  // 按行获取物品测试
  describe('getItemsByRow', () => {
    beforeEach(async () => {
      await dataService.loadGameData()
    })

    // 测试：应该根据分类返回分组的物品
    it('should return items grouped by row for category', () => {
      const itemsByRow = dataService.getItemsByRow('intermediate-products')
      
      expect(itemsByRow.size).toBe(1)
      expect(itemsByRow.has(1)).toBe(true)
      expect(itemsByRow.get(1)).toHaveLength(2)
    })

    // 测试：结果应该被缓存
    it('should cache results', () => {
      const result1 = dataService.getItemsByRow('intermediate-products')
      const result2 = dataService.getItemsByRow('intermediate-products')
      
      expect(result1).toBe(result2)
    })

    // 测试：应该过滤未解锁物品
    it('should filter by unlock status', () => {
      vi.mocked(mockTechnologyService.canCraftItem).mockImplementation((itemId: string) => {
        return itemId === 'iron-plate'
      })

      const itemsByRow = dataService.getItemsByRow('intermediate-products')
      
      expect(itemsByRow.get(1)).toHaveLength(1)
      expect(itemsByRow.get(1)?.[0].id).toBe('iron-plate')
    })
  })

  // 本地化测试
  describe('localization', () => {
    beforeEach(async () => {
      await dataService.loadGameData()
      vi.doMock('../../data/spa/i18n/zh.json', () => ({
        default: mockI18nData
      }))
      await dataService.loadI18nData('zh')
    })

    // 测试：应该返回本地化的分类名称
    it('should return localized category name', () => {
      expect(dataService.getLocalizedCategoryName('intermediate-products')).toBe('中间产品')
    })

    // 测试：缺失的翻译应该回退到英语
    it('should fallback to English for missing translations', () => {
      expect(dataService.getLocalizedCategoryName('unknown-category')).toBe('unknown-category')
    })

    // 测试：应该返回本地化的物品名称
    it('should return localized item name', () => {
      expect(dataService.getLocalizedItemName('iron-plate')).toBe('铁板')
    })

    // 测试：应该返回本地化的配方名称
    it('should return localized recipe name', () => {
      expect(dataService.getLocalizedRecipeName('iron-plate')).toBe('铁板')
    })
  })

  // 缓存管理测试
  describe('cache management', () => {
    beforeEach(async () => {
      await dataService.loadGameData()
    })

    // 测试：应该清除解锁缓存
    it('should clear unlock cache when requested', () => {
      vi.mocked(mockTechnologyService.canCraftItem).mockReturnValue(true)
      
      // First call - should hit service
      dataService.isItemUnlocked('iron-plate')
      expect(mockTechnologyService.canCraftItem).toHaveBeenCalledTimes(1)
      
      // Second call - should use cache
      dataService.isItemUnlocked('iron-plate')
      expect(mockTechnologyService.canCraftItem).toHaveBeenCalledTimes(1)
      
      // Clear cache
      dataService.clearUnlockCache()
      
      // Third call - should hit service again
      dataService.isItemUnlocked('iron-plate')
      expect(mockTechnologyService.canCraftItem).toHaveBeenCalledTimes(2)
    })
  })

  // 错误处理测试
  describe('error handling', () => {
    it('should handle missing game data gracefully', () => {
      expect(() => dataService.getAllCategories()).not.toThrow()
      expect(() => dataService.getItem('test')).not.toThrow()
      expect(() => dataService.getRecipe('test')).not.toThrow()
    })

    it('should return appropriate defaults when data is not loaded', () => {
      expect(dataService.getAllCategories()).toEqual([])
      expect(dataService.getItem('test')).toBeUndefined()
      expect(dataService.getRecipe('test')).toBeUndefined()
      expect(dataService.getItemsByCategory('test')).toEqual([])
    })
  })

  // ========== 补充缺失的测试用例 ==========
  // ========== 补充的测试用例 ==========

  // 数据加载状态检查
  describe('isDataLoaded 数据加载状态检查', () => {
    // 测试：数据未加载时应返回 false
    it('数据未加载时应返回false', () => {
      // 数据服务刚创建时，数据未加载
      expect(dataService.isDataLoaded()).toBe(false)
    })

    // 测试：数据加载后应返回 true
    it('数据加载后应返回true', async () => {
      // 加载数据后检查状态
      await dataService.loadGameData()
      expect(dataService.isDataLoaded()).toBe(true)
    })
  })

  // 获取所有物品测试
  describe('getAllItems 获取所有物品测试', () => {
    // 测试：应返回所有物品列表
    it('应返回所有物品列表', async () => {
      await dataService.loadGameData()
      const allItems = dataService.getAllItems()
      
      // 验证返回所有物品
      expect(allItems).toHaveLength(3)
      expect(allItems.map(item => item.id)).toContain('iron-plate')
      expect(allItems.map(item => item.id)).toContain('copper-plate')
      expect(allItems.map(item => item.id)).toContain('transport-belt')
    })

    // 测试：数据未加载时应返回空数组
    it('数据未加载时应返回空数组', () => {
      const allItems = dataService.getAllItems()
      expect(allItems).toEqual([])
    })
  })

  // 获取已解锁物品测试
  describe('getUnlockedItems 获取已解锁物品测试', () => {
    beforeEach(async () => {
      await dataService.loadGameData()
    })

    // 测试：应返回所有已解锁的物品
    it('应返回所有已解锁的物品', () => {
      // 设置部分物品已解锁
      vi.mocked(mockTechnologyService.canCraftItem).mockImplementation((itemId: string) => {
        return ['iron-plate', 'copper-plate'].includes(itemId)
      })

      const unlockedItems = dataService.getUnlockedItems()
      
      // 验证只返回已解锁物品
      expect(unlockedItems).toHaveLength(2)
      expect(unlockedItems.map(item => item.id)).toContain('iron-plate')
      expect(unlockedItems.map(item => item.id)).toContain('copper-plate')
      expect(unlockedItems.map(item => item.id)).not.toContain('transport-belt')
    })

    // 测试：无物品解锁时应返回空数组
    it('无物品解锁时应返回空数组', () => {
      vi.mocked(mockTechnologyService.canCraftItem).mockReturnValue(false)

      const unlockedItems = dataService.getUnlockedItems()
      expect(unlockedItems).toEqual([])
    })
  })

  // 获取分类下所有物品测试
  describe('getAllItemsByCategory 获取分类下所有物品测试', () => {
    beforeEach(async () => {
      await dataService.loadGameData()
    })

    // 测试：应返回分类下的所有物品（包括未解锁）
    it('应返回分类下的所有物品（包括未解锁）', () => {
      // 设置部分物品未解锁
      vi.mocked(mockTechnologyService.canCraftItem).mockImplementation((itemId: string) => {
        return itemId === 'iron-plate' // 只有铁板解锁
      })

      const allCategoryItems = dataService.getAllItemsByCategory('intermediate-products')
      
      // 验证返回分类下的所有物品，不管是否解锁
      expect(allCategoryItems).toHaveLength(2)
      expect(allCategoryItems.map(item => item.id)).toContain('iron-plate')
      expect(allCategoryItems.map(item => item.id)).toContain('copper-plate')
    })

    // 测试：不存在的分类应返回空数组
    it('不存在的分类应返回空数组', () => {
      const items = dataService.getAllItemsByCategory('non-existent')
      expect(items).toEqual([])
    })
  })

  // 获取分类信息测试
  describe('getCategory 获取分类信息测试', () => {
    beforeEach(async () => {
      await dataService.loadGameData()
    })

    // 测试：应根据 ID 返回分类信息
    it('应根据ID返回分类信息', () => {
      const category = dataService.getCategory('intermediate-products')
      
      expect(category).toBeDefined()
      expect(category?.id).toBe('intermediate-products')
      expect(category?.name).toBe('Intermediate products')
    })

    // 测试：不存在的分类应返回 undefined
    it('不存在的分类应返回undefined', () => {
      const category = dataService.getCategory('non-existent')
      expect(category).toBeUndefined()
    })

    // 测试：数据未加载时应返回 undefined
    it('数据未加载时应返回undefined', () => {
      const freshService = DataService.getInstance()
      const category = freshService.getCategory('test')
      expect(category).toBeUndefined()
    })
  })

  // 物品解锁测试
  describe('unlockItem 物品解锁测试', () => {
    beforeEach(async () => {
      await dataService.loadGameData()
    })

    // 测试：应调用用户进度服务解锁物品
    it('应调用用户进度服务解锁物品', () => {
      // 模拟用户进度服务
      const mockUnlockItem = vi.fn()
      const mockUserProgress = {
        unlockItem: mockUnlockItem,
        isItemInAnyMilestone: vi.fn(() => false)
      }
      
      ServiceLocator.register(SERVICE_NAMES.USER_PROGRESS, mockUserProgress)
      
      // 调用解锁物品
      dataService.unlockItem('iron-plate')
      
      // 验证调用了用户进度服务
      expect(mockUnlockItem).toHaveBeenCalledWith('iron-plate')
    })

    // 测试：用户进度服务不存在时应正常处理
    it('用户进度服务不存在时应正常处理', () => {
      ServiceLocator.clear()
      
      // 应该不抛出错误
      expect(() => dataService.unlockItem('iron-plate')).not.toThrow()
    })
  })

  // 获取行显示名称测试
  describe('getRowDisplayName 获取行显示名称测试', () => {
    it('应返回中间产品分类的行名称', () => {
      expect(dataService.getRowDisplayName('intermediate-products', 0)).toBe('原材料')
      expect(dataService.getRowDisplayName('intermediate-products', 1)).toBe('基础材料')
      expect(dataService.getRowDisplayName('intermediate-products', 2)).toBe('组件')
    })

    it('应返回物流分类的行名称', () => {
      expect(dataService.getRowDisplayName('logistics', 0)).toBe('存储')
      expect(dataService.getRowDisplayName('logistics', 1)).toBe('传送带')
      expect(dataService.getRowDisplayName('logistics', 2)).toBe('机械臂')
    })

    it('应返回生产分类的行名称', () => {
      expect(dataService.getRowDisplayName('production', 0)).toBe('工具')
      expect(dataService.getRowDisplayName('production', 1)).toBe('电力生产')
      expect(dataService.getRowDisplayName('production', 2)).toBe('资源开采')
    })

    it('应返回战斗分类的行名称', () => {
      expect(dataService.getRowDisplayName('combat', 0)).toBe('武器')
      expect(dataService.getRowDisplayName('combat', 1)).toBe('弹药')
      expect(dataService.getRowDisplayName('combat', 2)).toBe('防御')
    })

    it('未知分类或行号应返回默认名称', () => {
      expect(dataService.getRowDisplayName('unknown-category', 5)).toBe('第6组')
      expect(dataService.getRowDisplayName('intermediate-products', 99)).toBe('第100组')
    })
  })

  // 科技本地化名称测试
  describe('getLocalizedTechnologyName 科技本地化名称测试', () => {
    beforeEach(async () => {
      await dataService.loadGameData()
      
      // 模拟包含科技翻译的i18n数据
      const techI18nData = {
        ...mockI18nData,
        technologies: {
          'automation': '自动化',
          'logistics': '物流学'
        }
      }
      
      vi.doMock('../../data/spa/i18n/zh.json', () => ({
        default: techI18nData
      }))
      await dataService.loadI18nData('zh')
    })

    // 测试：应返回科技的本地化名称
    it('应返回科技的本地化名称', () => {
      expect(dataService.getLocalizedTechnologyName('automation')).toBe('自动化')
      expect(dataService.getLocalizedTechnologyName('logistics')).toBe('物流学')
    })

    // 测试：应处理规范化的科技ID
    it('应处理规范化的科技ID', () => {
      // 测试空格和大小写处理
      expect(dataService.getLocalizedTechnologyName('Auto mation')).toBe('自动化')
      expect(dataService.getLocalizedTechnologyName('LOGISTICS')).toBe('物流学')
    })

    // 测试：应从items字段回退查找
    it('应从items字段回退查找', () => {
      // 测试在technologies字段找不到时从items字段查找
      expect(dataService.getLocalizedTechnologyName('iron-plate')).toBe('铁板')
    })

    // 测试：应从recipes字段回退查找
    it('应从recipes字段回退查找', () => {
      // 测试最终从recipes字段查找
      expect(dataService.getLocalizedTechnologyName('copper-plate')).toBe('铜板')
    })

    // 测试：找不到翻译时应返回原始ID
    it('找不到翻译时应返回原始ID', () => {
      expect(dataService.getLocalizedTechnologyName('unknown-tech')).toBe('unknown-tech')
    })

    // 测试：i18n数据未加载时应返回原始ID
    it('i18n数据未加载时应返回原始ID', () => {
      const freshService = DataService.getInstance()
      expect(freshService.getLocalizedTechnologyName('automation')).toBe('automation')
    })
  })

  // 位置本地化名称测试
  describe('getLocalizedLocationName 位置本地化名称测试', () => {
    beforeEach(async () => {
      await dataService.loadGameData()
      
      const locationI18nData = {
        ...mockI18nData,
        locations: {
          'nauvis': '诺维斯',
          'vulcanus': '火山星'
        }
      }
      
      vi.doMock('../../data/spa/i18n/zh.json', () => ({
        default: locationI18nData
      }))
      await dataService.loadI18nData('zh')
    })

    // 测试：应返回位置的本地化名称
    it('应返回位置的本地化名称', () => {
      expect(dataService.getLocalizedLocationName('nauvis')).toBe('诺维斯')
      expect(dataService.getLocalizedLocationName('vulcanus')).toBe('火山星')
    })

    // 测试：找不到翻译时应返回原始ID
    it('找不到翻译时应返回原始ID', () => {
      expect(dataService.getLocalizedLocationName('unknown-location')).toBe('unknown-location')
    })
  })

  // 图标和详情相关方法测试
  describe('图标和详情相关方法测试', () => {
    beforeEach(async () => {
      await dataService.loadGameData()
      
      // 添加图标数据到mock
      const gameDataWithIcons = {
        ...mockGameData,
        icons: [
          { id: 'iron-plate', icon: 'iron-plate.png' },
          { id: 'copper-plate', icon: 'copper-plate.png', iconText: 'Cu' }
        ]
      }
      
      vi.doMock('../../data/spa/data.json', () => ({
        default: gameDataWithIcons
      }))
      
      // 重新加载数据以包含图标
      ;(DataService as unknown as ServiceInstance<DataService>).instance = null
      dataService = DataService.getInstance()
      await dataService.loadGameData()
    })

    // 获取图标数据测试
    describe('getIconData 获取图标数据测试', () => {
      // 测试：应返回物品的图标信息
      it('应返回物品的图标信息', () => {
        const iconData = dataService.getIconData('iron-plate')
        
        expect(iconData).toBeDefined()
        expect(iconData?.id).toBe('iron-plate')
        expect(iconData?.position).toBeDefined()
        expect(iconData?.color).toBeDefined()
      })

      // 测试：不存在的物品应返回 null
      it('不存在的物品应返回null', () => {
        const iconData = dataService.getIconData('non-existent')
        expect(iconData).toBeNull()
      })

      // 测试：数据未加载时应返回 null
      it('数据未加载时应返回null', () => {
        const freshService = DataService.getInstance()
        const iconData = freshService.getIconData('iron-plate')
        expect(iconData).toBeNull()
      })
    })

    // 获取图标信息测试
    describe('getIconInfo 获取图标信息测试', () => {
      // 测试：应返回物品的图标信息
      it('应返回物品的图标信息', () => {
        const iconInfo = dataService.getIconInfo('copper-plate')
        
        expect(iconInfo).toBeDefined()
        expect(iconInfo.iconId).toBe('copper-plate')
        expect(iconInfo.iconText).toBe('Cu')
      })

      // 测试：无iconText的物品应只返回iconId
      it('无iconText的物品应只返回iconId', () => {
        const iconInfo = dataService.getIconInfo('iron-plate')
        
        expect(iconInfo).toBeDefined()
        expect(iconInfo.iconId).toBe('iron-plate')
        expect(iconInfo.iconText).toBeUndefined()
      })
    })

    // 获取所有图标测试
    describe('getAllIcons 获取所有图标测试', () => {
      // 测试：应返回所有图标数据
      it('应返回所有图标数据', () => {
        const allIcons = dataService.getAllIcons()
        
        expect(allIcons).toHaveLength(2)
        expect(allIcons[0].id).toBe('iron-plate')
        expect(allIcons[1].id).toBe('copper-plate')
      })

      // 测试：数据未加载时应返回空数组
      it('数据未加载时应返回空数组', () => {
        const freshService = DataService.getInstance()
        const allIcons = freshService.getAllIcons()
        expect(allIcons).toEqual([])
      })
    })

    // 获取物品详情测试
    describe('getItemDetails 获取物品详情测试', () => {
      // 测试：应返回物品的详细信息
      it('应返回物品的详细信息', () => {
        const itemDetails = dataService.getItemDetails('iron-plate')
        
        expect(itemDetails).toBeDefined()
        expect(itemDetails?.item.id).toBe('iron-plate')
        expect(itemDetails?.recipes).toBeDefined()
        expect(itemDetails?.usedInRecipes).toBeDefined()
      })

      // 测试：不存在的物品应返回 null
      it('不存在的物品应返回null', () => {
        const itemDetails = dataService.getItemDetails('non-existent')
        expect(itemDetails).toBeNull()
      })
    })
  })

  // 科技数据相关方法测试
  describe('科技数据相关方法测试', () => {
    beforeEach(async () => {
      // 添加科技数据到mock
      const gameDataWithTech = {
        ...mockGameData,
        recipes: [
          ...mockGameData.recipes!,
          {
            id: 'automation',
            name: 'Automation',
            category: 'technology',
            time: 10,
            in: { 'automation-science-pack': 10 },
            out: {}
          }
        ]
      }
      
      vi.doMock('../../data/spa/data.json', () => ({
        default: gameDataWithTech
      }))
      
      ;(DataService as unknown as ServiceInstance<DataService>).instance = null
      dataService = DataService.getInstance()
      await dataService.loadGameData()
    })

    // 获取原始游戏数据测试
    describe('getRawGameData 获取原始游戏数据测试', () => {
      // 测试：应返回完整的游戏数据
      it('应返回完整的游戏数据', () => {
        const rawData = dataService.getRawGameData()
        
        expect(rawData).toBeDefined()
        expect(rawData?.categories).toBeDefined()
        expect(rawData?.items).toBeDefined()
        expect(rawData?.recipes).toBeDefined()
      })

      // 测试：数据未加载时应返回 null
      it('数据未加载时应返回null', () => {
        const freshService = DataService.getInstance()
        const rawData = freshService.getRawGameData()
        expect(rawData).toBeNull()
      })
    })

    // 获取科技数据测试
    describe('getTechnologies 获取科技数据测试', () => {
      // 测试：应返回所有科技配方
      it('应返回所有科技配方', () => {
        const technologies = dataService.getTechnologies()
        
        expect(technologies).toHaveLength(1)
        expect(technologies[0].id).toBe('automation')
        expect(technologies[0].category).toBe('technology')
      })

      // 测试：数据未加载时应返回空数组
      it('数据未加载时应返回空数组', () => {
        const freshService = DataService.getInstance()
        const technologies = freshService.getTechnologies()
        expect(technologies).toEqual([])
      })
    })

    // 获取科技分类测试
    describe('getTechCategories 获取科技分类测试', () => {
      // 测试：应返回科技分类数据
      it('应返回科技分类数据', () => {
        const techCategories = dataService.getTechCategories()
        
        expect(techCategories).toHaveLength(2)
        expect(techCategories[0].id).toBe('intermediate-products')
        expect(techCategories[1].id).toBe('logistics')
      })
    })
  })

  // 辅助方法测试
  describe('辅助方法测试', () => {
    beforeEach(async () => {
      await dataService.loadGameData()
    })

    // 获取物品名称测试
    describe('getItemName 获取物品名称', () => {
      // 测试：应返回物品的名称
      it('应返回物品的名称', () => {
        expect(dataService.getItemName('iron-plate')).toBe('Iron plate')
        expect(dataService.getItemName('copper-plate')).toBe('Copper plate')
      })

      // 测试：不存在的物品应返回 ID
      it('不存在的物品应返回ID', () => {
        expect(dataService.getItemName('non-existent')).toBe('non-existent')
      })
    })

    // 获取国际化名称测试
    describe('getI18nName 获取国际化名称', () => {
      beforeEach(async () => {
        vi.doMock('../../data/spa/i18n/zh.json', () => ({
          default: mockI18nData
        }))
        await dataService.loadI18nData('zh')
      })

      // 测试：应返回物品的国际化名称
      it('应返回物品的国际化名称', () => {
        const ironPlateItem = dataService.getItem('iron-plate')!
        expect(dataService.getI18nName(ironPlateItem)).toBe('铁板')
      })
    })

    // 获取分类国际化名称测试
    describe('getCategoryI18nName 获取分类国际化名称', () => {
      beforeEach(async () => {
        vi.doMock('../../data/spa/i18n/zh.json', () => ({
          default: mockI18nData
        }))
        await dataService.loadI18nData('zh')
      })

      // 测试：应返回分类的国际化名称
      it('应返回分类的国际化名称', () => {
        expect(dataService.getCategoryI18nName('intermediate-products')).toBe('中间产品')
        expect(dataService.getCategoryI18nName('logistics')).toBe('物流')
      })
    })
  })

  // 高级缓存测试
  describe('高级缓存测试', () => {
    beforeEach(async () => {
      await dataService.loadGameData()
    })

    // 测试：应在数据重新加载时清理缓存
    it('应在数据重新加载时清理缓存', async () => {
      // Mock technology service to allow items to be unlocked
      vi.mocked(mockTechnologyService.isItemUnlocked).mockReturnValue(true)
      
      // First call should establish cache
      const result1 = dataService.getItemsByRow('intermediate-products')
      expect(result1.size).toBeGreaterThan(0)
      
      // Reload data should clear cache - test by ensuring getItemsByRow still works
      await dataService.loadGameData()
      const result2 = dataService.getItemsByRow('intermediate-products')
      expect(result2.size).toBeGreaterThan(0)
    })

    // 测试：缓存版本应该在清理时递增
    it('缓存版本应该在清理时递增', () => {
      // Test cache clearing by checking that subsequent calls are made to the service
      vi.mocked(mockTechnologyService.isItemUnlocked).mockReturnValue(true)
      
      // First call
      dataService.isItemUnlocked('iron-plate')
      expect(mockTechnologyService.isItemUnlocked).toHaveBeenCalledTimes(1)
      
      // Second call should use cache
      dataService.isItemUnlocked('iron-plate') 
      expect(mockTechnologyService.isItemUnlocked).toHaveBeenCalledTimes(1)
      
      // Clear cache
      dataService.clearUnlockCache()
      
      // Third call should hit service again
      dataService.isItemUnlocked('iron-plate')
      expect(mockTechnologyService.isItemUnlocked).toHaveBeenCalledTimes(2)
    })
  })
})