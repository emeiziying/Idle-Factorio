import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DataService } from '../DataService'
import { ServiceLocator, SERVICE_NAMES } from '../ServiceLocator'
import type { GameData, Item, Recipe, Category } from '../../types/index'

// Mock game data
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
      stackSize: 100,
      row: 1
    },
    { 
      id: 'copper-plate', 
      name: 'Copper plate',
      category: 'intermediate-products',
      stackSize: 100,
      row: 1
    },
    { 
      id: 'transport-belt', 
      name: 'Transport belt',
      category: 'logistics',
      stackSize: 100,
      row: 2
    }
  ],
  recipes: [
    {
      id: 'iron-plate',
      name: 'Iron plate',
      time: 3.2,
      in: { 'iron-ore': 1 },
      out: { 'iron-plate': 1 },
      producers: ['stone-furnace', 'steel-furnace', 'electric-furnace']
    },
    {
      id: 'copper-plate',
      name: 'Copper plate',
      time: 3.2,
      in: { 'copper-ore': 1 },
      out: { 'copper-plate': 1 },
      producers: ['stone-furnace', 'steel-furnace', 'electric-furnace']
    }
  ]
}

// Mock i18n data
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

// Mock imports
vi.mock('../../data/spa/data.json', () => ({
  default: mockGameData
}))

vi.mock('../../utils/logger', () => ({
  error: vi.fn()
}))

describe('DataService', () => {
  let dataService: DataService
  let mockUserProgressService: any
  let mockTechnologyService: any

  beforeEach(() => {
    // Clear instance
    (DataService as any).instance = null
    ServiceLocator.clear()

    // Mock services
    mockUserProgressService = {
      isItemInAnyMilestone: vi.fn(() => false)
    }

    mockTechnologyService = {
      canCraftItem: vi.fn(() => true)
    }

    ServiceLocator.register(SERVICE_NAMES.USER_PROGRESS, mockUserProgressService)
    ServiceLocator.register(SERVICE_NAMES.TECHNOLOGY, mockTechnologyService)

    dataService = DataService.getInstance()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = DataService.getInstance()
      const instance2 = DataService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('loadGameData', () => {
    it('should load game data successfully', async () => {
      const data = await dataService.loadGameData()
      
      expect(data).toBeDefined()
      expect(data.categories).toHaveLength(2)
      expect(data.items).toHaveLength(3)
      expect(data.recipes).toHaveLength(2)
    })

    it('should cache loaded data', async () => {
      const data1 = await dataService.loadGameData()
      const data2 = await dataService.loadGameData()
      
      expect(data1).toBe(data2)
    })

    it('should handle concurrent load requests', async () => {
      const promise1 = dataService.loadGameData()
      const promise2 = dataService.loadGameData()
      
      const [data1, data2] = await Promise.all([promise1, promise2])
      
      expect(data1).toBe(data2)
    })
  })

  describe('loadI18n', () => {
    beforeEach(() => {
      // Mock dynamic import
      vi.doMock('../../data/spa/i18n/zh.json', () => ({
        default: mockI18nData
      }))
    })

    it('should load i18n data for supported language', async () => {
      await dataService.loadI18n('zh')
      
      expect(dataService.getLocalizedCategoryName('intermediate-products')).toBe('中间产品')
      expect(dataService.getLocalizedItemName('iron-plate')).toBe('铁板')
    })

    it('should fallback to English for unsupported language', async () => {
      await dataService.loadGameData()
      await dataService.loadI18n('unsupported')
      
      expect(dataService.getLocalizedItemName('iron-plate')).toBe('Iron plate')
    })

    it('should handle concurrent i18n load requests', async () => {
      const promise1 = dataService.loadI18n('zh')
      const promise2 = dataService.loadI18n('zh')
      
      await Promise.all([promise1, promise2])
      
      expect(dataService.getLocalizedItemName('iron-plate')).toBe('铁板')
    })
  })

  describe('getCategories', () => {
    it('should return all categories', async () => {
      await dataService.loadGameData()
      const categories = dataService.getCategories()
      
      expect(categories).toHaveLength(2)
      expect(categories[0].id).toBe('intermediate-products')
      expect(categories[1].id).toBe('logistics')
    })

    it('should return empty array when data not loaded', () => {
      const categories = dataService.getCategories()
      expect(categories).toEqual([])
    })
  })

  describe('getItemsByCategory', () => {
    beforeEach(async () => {
      await dataService.loadGameData()
    })

    it('should return items for specific category', () => {
      const items = dataService.getItemsByCategory('intermediate-products')
      
      expect(items).toHaveLength(2)
      expect(items.map(i => i.id)).toContain('iron-plate')
      expect(items.map(i => i.id)).toContain('copper-plate')
    })

    it('should return empty array for non-existent category', () => {
      const items = dataService.getItemsByCategory('non-existent')
      expect(items).toEqual([])
    })

    it('should filter unlocked items when includeUnlocked is false', () => {
      vi.mocked(mockTechnologyService.canCraftItem).mockImplementation((itemId) => {
        return itemId === 'iron-plate'
      })

      const items = dataService.getItemsByCategory('intermediate-products', false)
      
      expect(items).toHaveLength(1)
      expect(items[0].id).toBe('iron-plate')
    })
  })

  describe('getItem', () => {
    beforeEach(async () => {
      await dataService.loadGameData()
    })

    it('should return item by id', () => {
      const item = dataService.getItem('iron-plate')
      
      expect(item).toBeDefined()
      expect(item?.name).toBe('Iron plate')
      expect(item?.category).toBe('intermediate-products')
    })

    it('should return undefined for non-existent item', () => {
      const item = dataService.getItem('non-existent')
      expect(item).toBeUndefined()
    })
  })

  describe('getRecipe', () => {
    beforeEach(async () => {
      await dataService.loadGameData()
    })

    it('should return recipe by id', () => {
      const recipe = dataService.getRecipe('iron-plate')
      
      expect(recipe).toBeDefined()
      expect(recipe?.time).toBe(3.2)
      expect(recipe?.in).toEqual({ 'iron-ore': 1 })
      expect(recipe?.out).toEqual({ 'iron-plate': 1 })
    })

    it('should return undefined for non-existent recipe', () => {
      const recipe = dataService.getRecipe('non-existent')
      expect(recipe).toBeUndefined()
    })
  })

  describe('getItemRecipes', () => {
    beforeEach(async () => {
      await dataService.loadGameData()
    })

    it('should return recipes that produce the item', () => {
      const recipes = dataService.getItemRecipes('iron-plate')
      
      expect(recipes).toHaveLength(1)
      expect(recipes[0].id).toBe('iron-plate')
    })

    it('should return empty array for items with no recipes', () => {
      const recipes = dataService.getItemRecipes('transport-belt')
      expect(recipes).toEqual([])
    })
  })

  describe('isItemUnlocked', () => {
    beforeEach(async () => {
      await dataService.loadGameData()
    })

    it('should return true when technology service says item can be crafted', () => {
      vi.mocked(mockTechnologyService.canCraftItem).mockReturnValue(true)
      
      expect(dataService.isItemUnlocked('iron-plate')).toBe(true)
    })

    it('should return false when technology service says item cannot be crafted', () => {
      vi.mocked(mockTechnologyService.canCraftItem).mockReturnValue(false)
      
      expect(dataService.isItemUnlocked('iron-plate')).toBe(false)
    })

    it('should cache unlock status', () => {
      vi.mocked(mockTechnologyService.canCraftItem).mockReturnValue(true)
      
      // First call
      dataService.isItemUnlocked('iron-plate')
      
      // Second call should use cache
      dataService.isItemUnlocked('iron-plate')
      
      expect(mockTechnologyService.canCraftItem).toHaveBeenCalledTimes(1)
    })
  })

  describe('getItemsByRow', () => {
    beforeEach(async () => {
      await dataService.loadGameData()
    })

    it('should return items grouped by row for category', () => {
      const itemsByRow = dataService.getItemsByRow('intermediate-products')
      
      expect(itemsByRow.size).toBe(1)
      expect(itemsByRow.has(1)).toBe(true)
      expect(itemsByRow.get(1)).toHaveLength(2)
    })

    it('should cache results', () => {
      const result1 = dataService.getItemsByRow('intermediate-products')
      const result2 = dataService.getItemsByRow('intermediate-products')
      
      expect(result1).toBe(result2)
    })

    it('should filter by unlock status', () => {
      vi.mocked(mockTechnologyService.canCraftItem).mockImplementation((itemId) => {
        return itemId === 'iron-plate'
      })

      const itemsByRow = dataService.getItemsByRow('intermediate-products', false)
      
      expect(itemsByRow.get(1)).toHaveLength(1)
      expect(itemsByRow.get(1)?.[0].id).toBe('iron-plate')
    })
  })

  describe('localization', () => {
    beforeEach(async () => {
      await dataService.loadGameData()
      vi.doMock('../../data/spa/i18n/zh.json', () => ({
        default: mockI18nData
      }))
      await dataService.loadI18n('zh')
    })

    it('should return localized category name', () => {
      expect(dataService.getLocalizedCategoryName('intermediate-products')).toBe('中间产品')
    })

    it('should fallback to English for missing translations', () => {
      expect(dataService.getLocalizedCategoryName('unknown-category')).toBe('unknown-category')
    })

    it('should return localized item name', () => {
      expect(dataService.getLocalizedItemName('iron-plate')).toBe('铁板')
    })

    it('should return localized recipe name', () => {
      expect(dataService.getLocalizedRecipeName('iron-plate')).toBe('铁板')
    })
  })

  describe('cache management', () => {
    beforeEach(async () => {
      await dataService.loadGameData()
    })

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

  describe('error handling', () => {
    it('should handle missing game data gracefully', () => {
      expect(() => dataService.getCategories()).not.toThrow()
      expect(() => dataService.getItem('test')).not.toThrow()
      expect(() => dataService.getRecipe('test')).not.toThrow()
    })

    it('should return appropriate defaults when data is not loaded', () => {
      expect(dataService.getCategories()).toEqual([])
      expect(dataService.getItem('test')).toBeUndefined()
      expect(dataService.getRecipe('test')).toBeUndefined()
      expect(dataService.getItemsByCategory('test')).toEqual([])
    })
  })
})