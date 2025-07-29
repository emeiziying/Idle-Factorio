import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DataService } from '../DataService'
import { ServiceLocator } from '../ServiceLocator'
import type { GameData, Item, Recipe, Category } from '../../types/index'

// Mock game data
const mockGameData: GameData = {
  categories: [
    { name: 'test-category', displayName: 'Test Category', priority: 1 }
  ],
  items: [
    {
      name: 'test-item-1',
      displayName: 'Test Item 1',
      category: 'test-category',
      stackSize: 100,
      row: 1
    },
    {
      name: 'test-item-2',
      displayName: 'Test Item 2',
      category: 'test-category',
      stackSize: 50,
      row: 1,
      unlockedBy: 'test-tech'
    }
  ],
  recipes: [
    {
      name: 'test-recipe',
      displayName: 'Test Recipe',
      category: 'test-category',
      ingredients: [{ name: 'test-item-1', amount: 2 }],
      results: [{ name: 'test-item-2', amount: 1 }],
      craftingTime: 1
    }
  ]
}

const mockI18nData = {
  categories: { 'test-category': '测试分类' },
  items: { 'test-item-1': '测试物品1', 'test-item-2': '测试物品2' },
  recipes: { 'test-recipe': '测试配方' },
  locations: {}
}

// Mock imports
vi.mock('../../data/spa/data.json', () => ({
  default: mockGameData
}))

// Mock services
const mockUserProgressService = {
  getUnlockedTechnologies: vi.fn(() => new Set(['test-tech']))
}

const mockTechnologyService = {
  isItemUnlocked: vi.fn((itemId: string) => itemId === 'test-item-1' || itemId === 'test-item-2')
}

// Mock dynamic import for i18n
global.fetch = vi.fn()

describe('DataService', () => {
  let dataService: DataService
  
  beforeEach(() => {
    vi.resetAllMocks()
    
    // Reset singleton instance
    ;(DataService as any).instance = null
    
    // Mock ServiceLocator
    vi.spyOn(ServiceLocator, 'getService').mockImplementation((serviceName) => {
      switch (serviceName) {
        case 'UserProgressService':
          return mockUserProgressService
        case 'TechnologyService':
          return mockTechnologyService
        default:
          return null
      }
    })
    
    // Mock fetch for i18n data
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockI18nData)
    })
    
    dataService = DataService.getInstance()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = DataService.getInstance()
      const instance2 = DataService.getInstance()
      
      expect(instance1).toBe(instance2)
    })
  })

  describe('loadGameData', () => {
    it('should load and return game data', async () => {
      const data = await dataService.loadGameData()
      
      expect(data).toEqual(mockGameData)
    })

    it('should return cached data on subsequent calls', async () => {
      const data1 = await dataService.loadGameData()
      const data2 = await dataService.loadGameData()
      
      expect(data1).toBe(data2)
      expect(data1).toEqual(mockGameData)
    })

    it('should handle loading failures gracefully', async () => {
      // Reset instance to test failure
      ;(DataService as any).instance = null
      
      // Mock import failure
      vi.doMock('../../data/spa/data.json', () => {
        throw new Error('Failed to load data')
      })
      
      const failingService = DataService.getInstance()
      
      await expect(failingService.loadGameData()).rejects.toThrow('Failed to load data')
    })
  })

  describe('loadI18nData', () => {
    it('should load i18n data successfully', async () => {
      const i18nData = await dataService.loadI18nData('zh')
      
      expect(i18nData).toEqual(mockI18nData)
      expect(global.fetch).toHaveBeenCalledWith('/data/i18n/zh.json')
    })

    it('should cache i18n data', async () => {
      const data1 = await dataService.loadI18nData('zh')
      const data2 = await dataService.loadI18nData('zh')
      
      expect(data1).toBe(data2)
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('should handle network failures', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
      
      await expect(dataService.loadI18nData('zh')).rejects.toThrow('Network error')
    })

    it('should handle invalid JSON responses', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      })
      
      await expect(dataService.loadI18nData('zh')).rejects.toThrow('Invalid JSON')
    })

    it('should handle HTTP errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })
      
      await expect(dataService.loadI18nData('zh')).rejects.toThrow('HTTP error! status: 404')
    })
  })

  describe('data access methods', () => {
    beforeEach(async () => {
      await dataService.loadGameData()
    })

    describe('getAllCategories', () => {
      it('should return all categories', () => {
        const categories = dataService.getAllCategories()
        
        expect(categories).toEqual(mockGameData.categories)
      })

      it('should return empty array when no data loaded', () => {
        ;(dataService as any).gameData = null
        
        const categories = dataService.getAllCategories()
        
        expect(categories).toEqual([])
      })
    })

    describe('getAllItems', () => {
      it('should return all items', () => {
        const items = dataService.getAllItems()
        
        expect(items).toEqual(mockGameData.items)
      })

      it('should return empty array when no data loaded', () => {
        ;(dataService as any).gameData = null
        
        const items = dataService.getAllItems()
        
        expect(items).toEqual([])
      })
    })

    describe('getItem', () => {
      it('should return correct item by name', () => {
        const item = dataService.getItem('test-item-1')
        
        expect(item).toEqual(mockGameData.items[0])
      })

      it('should return null for non-existent item', () => {
        const item = dataService.getItem('non-existent')
        
        expect(item).toBeNull()
      })

      it('should return null when no data loaded', () => {
        ;(dataService as any).gameData = null
        
        const item = dataService.getItem('test-item-1')
        
        expect(item).toBeNull()
      })
    })

    describe('getAllRecipes', () => {
      it('should return all recipes', () => {
        const recipes = dataService.getAllRecipes()
        
        expect(recipes).toEqual(mockGameData.recipes)
      })

      it('should return empty array when no data loaded', () => {
        ;(dataService as any).gameData = null
        
        const recipes = dataService.getAllRecipes()
        
        expect(recipes).toEqual([])
      })
    })

    describe('getRecipe', () => {
      it('should return correct recipe by name', () => {
        const recipe = dataService.getRecipe('test-recipe')
        
        expect(recipe).toEqual(mockGameData.recipes[0])
      })

      it('should return null for non-existent recipe', () => {
        const recipe = dataService.getRecipe('non-existent')
        
        expect(recipe).toBeNull()
      })
    })
  })

  describe('filtering methods', () => {
    beforeEach(async () => {
      await dataService.loadGameData()
    })

    describe('getItemsByCategory', () => {
      it('should return items filtered by category', () => {
        const items = dataService.getItemsByCategory('test-category')
        
        expect(items).toEqual(mockGameData.items)
      })

      it('should return empty array for non-existent category', () => {
        const items = dataService.getItemsByCategory('non-existent')
        
        expect(items).toEqual([])
      })
    })

    describe('getRecipesByCategory', () => {
      it('should return recipes filtered by category', () => {
        const recipes = dataService.getRecipesByCategory('test-category')
        
        expect(recipes).toEqual(mockGameData.recipes)
      })

      it('should return empty array for non-existent category', () => {
        const recipes = dataService.getRecipesByCategory('non-existent')
        
        expect(recipes).toEqual([])
      })
    })
  })

  describe('caching functionality', () => {
    beforeEach(async () => {
      await dataService.loadGameData()
    })

    describe('clearUnlockCache', () => {
      it('should clear unlock cache', () => {
        // Access some items to populate cache
        dataService.getUnlockedItems()
        
        // Clear cache
        dataService.clearUnlockCache()
        
        // Cache should be cleared (no easy way to test this directly, 
        // but we can verify it doesn't throw)
        expect(() => dataService.clearUnlockCache()).not.toThrow()
      })
    })

    describe('getUnlockedItems', () => {
      it('should return only unlocked items', () => {
        const unlockedItems = dataService.getUnlockedItems()
        
        expect(unlockedItems).toHaveLength(2) // Both items should be unlocked
        expect(unlockedItems.map(item => item.name)).toEqual(['test-item-1', 'test-item-2'])
      })

      it('should cache results', () => {
        const items1 = dataService.getUnlockedItems()
        const items2 = dataService.getUnlockedItems()
        
        // Should be same reference (cached)
        expect(items1).toBe(items2)
      })
    })
  })

  describe('error handling', () => {
    it('should handle service locator failures gracefully', () => {
      vi.spyOn(ServiceLocator, 'getService').mockReturnValue(null)
      
      // Should not throw even if services are not available
      expect(() => dataService.getUnlockedItems()).not.toThrow()
    })

    it('should handle technology service failures', () => {
      mockTechnologyService.isItemUnlocked.mockImplementation(() => {
        throw new Error('Service error')
      })
      
      // Should handle errors gracefully
      expect(() => dataService.getUnlockedItems()).not.toThrow()
    })
  })

  describe('performance optimizations', () => {
    beforeEach(async () => {
      await dataService.loadGameData()
    })

    it('should use cached results for repeated calls', () => {
      const items1 = dataService.getItemsByRow('test-category', 1)
      const items2 = dataService.getItemsByRow('test-category', 1)
      
      expect(items1).toBe(items2) // Should be same reference
    })

    it('should invalidate cache when needed', () => {
      const items1 = dataService.getItemsByRow('test-category', 1)
      
      dataService.clearUnlockCache()
      
      const items2 = dataService.getItemsByRow('test-category', 1)
      
      // After cache clear, should be different references
      expect(items1).not.toBe(items2)
      expect(items1).toEqual(items2) // But same content
    })
  })
})