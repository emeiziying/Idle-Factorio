import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import useGameStore from '../gameStore'
import type { InventoryItem, CraftingTask } from '../../types/index'

// Mock services
vi.mock('../../services/RecipeService', () => ({
  RecipeService: {
    getInstance: () => ({
      getRecipe: vi.fn(),
      getAllRecipes: vi.fn(() => [])
    })
  }
}))

vi.mock('../../services/DataService', () => ({
  DataService: {
    getInstance: () => ({
      getItem: vi.fn(),
      getAllItems: vi.fn(() => [])
    })
  }
}))

vi.mock('../../services/TechnologyService', () => ({
  TechnologyService: {
    getInstance: () => ({
      getAllTechnologies: vi.fn(() => []),
      isItemUnlocked: vi.fn(() => true),
      startResearch: vi.fn(() => Promise.resolve({ success: true })),
      completeResearch: vi.fn(() => Promise.resolve({ success: true }))
    })
  }
}))

vi.mock('../../services/GameStorageService', () => ({
  gameStorageService: {
    saveGame: vi.fn(),
    loadGame: vi.fn(),
    clearGame: vi.fn(),
    clearGameData: vi.fn()
  }
}))

describe('Game Store', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Reset store state before each test
    const store = useGameStore.getState()
    store.clearGameData()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('inventory management', () => {
    it('should initialize with empty inventory', () => {
      const store = useGameStore.getState()
      expect(store.inventory.size).toBe(0)
    })

    it('should add items to inventory', () => {
      const store = useGameStore.getState()
      
      store.updateInventory('iron-ore', 100)
      
      const ironOre = store.getInventoryItem('iron-ore')
      expect(ironOre.currentAmount).toBe(100)
      expect(store.inventory.get('iron-ore')).toEqual(ironOre)
    })

    it('should update existing items in inventory', () => {
      const store = useGameStore.getState()
      
      store.updateInventory('iron-ore', 100)
      store.updateInventory('iron-ore', 50)
      
      const ironOre = store.getInventoryItem('iron-ore')
      expect(ironOre.currentAmount).toBe(150)
    })

    it('should handle negative amounts (removing items)', () => {
      const store = useGameStore.getState()
      
      store.updateInventory('iron-ore', 100)
      store.updateInventory('iron-ore', -30)
      
      const ironOre = store.getInventoryItem('iron-ore')
      expect(ironOre.currentAmount).toBe(70)
    })

    it('should not allow negative inventory counts', () => {
      const store = useGameStore.getState()
      
      store.updateInventory('iron-ore', 100)
      store.updateInventory('iron-ore', -150)
      
      const ironOre = store.getInventoryItem('iron-ore')
      expect(ironOre.currentAmount).toBe(0)
    })

    it('should batch update multiple items', () => {
      const store = useGameStore.getState()
      
      const updates = [
        { itemId: 'iron-ore', amount: 100 },
        { itemId: 'copper-ore', amount: 50 },
        { itemId: 'coal', amount: 200 }
      ]
      
      store.batchUpdateInventory(updates)
      
      expect(store.getInventoryItem('iron-ore').currentAmount).toBe(100)
      expect(store.getInventoryItem('copper-ore').currentAmount).toBe(50)
      expect(store.getInventoryItem('coal').currentAmount).toBe(200)
    })

    it('should return default item for non-existent items', () => {
      const store = useGameStore.getState()
      
      const nonExistentItem = store.getInventoryItem('non-existent')
      
      expect(nonExistentItem).toHaveProperty('itemId', 'non-existent')
      expect(nonExistentItem).toHaveProperty('currentAmount', 0)
      expect(nonExistentItem).toHaveProperty('maxCapacity')
      expect(nonExistentItem.maxCapacity).toBeGreaterThan(0)
    })
  })

  describe('crafting queue management', () => {
    it('should initialize with empty crafting queue', () => {
      const store = useGameStore.getState()
      expect(store.craftingQueue).toEqual([])
    })

    it('should add crafting tasks to queue', () => {
      const store = useGameStore.getState()
      
      const task: Omit<CraftingTask, 'id'> = {
        recipeId: 'iron-plate',
        quantity: 10,
        priority: 1,
        progress: 0,
        status: 'queued',
        startTime: Date.now()
      }
      
      const success = store.addCraftingTask(task)
      
      expect(success).toBe(true)
      expect(store.craftingQueue).toHaveLength(1)
      expect(store.craftingQueue[0]).toMatchObject(task)
      expect(store.craftingQueue[0].id).toBeDefined()
    })

    it('should respect maximum queue size', () => {
      const store = useGameStore.getState()
      
      // Fill queue to maximum
      for (let i = 0; i < store.maxQueueSize; i++) {
        const task: Omit<CraftingTask, 'id'> = {
          recipeId: `recipe-${i}`,
          quantity: 1,
          priority: 1,
          progress: 0,
          status: 'queued',
          startTime: Date.now()
        }
        store.addCraftingTask(task)
      }
      
      expect(store.craftingQueue).toHaveLength(store.maxQueueSize)
      
      // Try to add one more task
      const extraTask: Omit<CraftingTask, 'id'> = {
        recipeId: 'extra-recipe',
        quantity: 1,
        priority: 1,
        progress: 0,
        status: 'queued',
        startTime: Date.now()
      }
      
      const success = store.addCraftingTask(extraTask)
      
      expect(success).toBe(false)
      expect(store.craftingQueue).toHaveLength(store.maxQueueSize)
    })

    it('should remove crafting tasks from queue', () => {
      const store = useGameStore.getState()
      
      const task: Omit<CraftingTask, 'id'> = {
        recipeId: 'iron-plate',
        quantity: 10,
        priority: 1,
        progress: 0,
        status: 'queued',
        startTime: Date.now()
      }
      
      store.addCraftingTask(task)
      const taskId = store.craftingQueue[0].id
      
      store.removeCraftingTask(taskId)
      
      expect(store.craftingQueue).toEqual([])
    })

    it('should update crafting task progress', () => {
      const store = useGameStore.getState()
      
      const task: Omit<CraftingTask, 'id'> = {
        recipeId: 'iron-plate',
        quantity: 10,
        priority: 1,
        progress: 0,
        status: 'queued',
        startTime: Date.now()
      }
      
      store.addCraftingTask(task)
      const taskId = store.craftingQueue[0].id
      
      store.updateCraftingProgress(taskId, 0.5)
      
      expect(store.craftingQueue[0].progress).toBe(0.5)
    })

    it('should complete crafting tasks', () => {
      const store = useGameStore.getState()
      
      const task: Omit<CraftingTask, 'id'> = {
        recipeId: 'iron-plate',
        quantity: 10,
        priority: 1,
        progress: 1,
        status: 'crafting',
        startTime: Date.now()
      }
      
      store.addCraftingTask(task)
      const taskId = store.craftingQueue[0].id
      
      store.completeCraftingTask(taskId)
      
      expect(store.craftingQueue[0].status).toBe('completed')
    })
  })

  describe('recipe management', () => {
    it('should manage favorite recipes', () => {
      const store = useGameStore.getState()
      
      expect(store.isFavoriteRecipe('iron-plate')).toBe(false)
      
      store.addFavoriteRecipe('iron-plate')
      expect(store.isFavoriteRecipe('iron-plate')).toBe(true)
      
      store.removeFavoriteRecipe('iron-plate')
      expect(store.isFavoriteRecipe('iron-plate')).toBe(false)
    })

    it('should track recent recipes', () => {
      const store = useGameStore.getState()
      
      store.addRecentRecipe('iron-plate')
      store.addRecentRecipe('copper-plate')
      
      expect(store.recentRecipes).toContain('iron-plate')
      expect(store.recentRecipes).toContain('copper-plate')
    })

    it('should limit recent recipes list', () => {
      const store = useGameStore.getState()
      const maxRecent = store.maxRecentRecipes
      
      // Add more recipes than the limit
      for (let i = 0; i < maxRecent + 5; i++) {
        store.addRecentRecipe(`recipe-${i}`)
      }
      
      expect(store.recentRecipes).toHaveLength(maxRecent)
      expect(store.recentRecipes).toContain(`recipe-${maxRecent + 4}`) // Latest recipe
      expect(store.recentRecipes).not.toContain('recipe-0') // Oldest recipe should be removed
    })

    it('should not duplicate recent recipes', () => {
      const store = useGameStore.getState()
      
      store.addRecentRecipe('iron-plate')
      store.addRecentRecipe('copper-plate')
      store.addRecentRecipe('iron-plate') // Duplicate
      
      const ironPlateCount = store.recentRecipes.filter(recipe => recipe === 'iron-plate').length
      expect(ironPlateCount).toBe(1)
      expect(store.recentRecipes[0]).toBe('iron-plate') // Should be moved to front
    })
  })

  describe('technology management', () => {
    it('should initialize with empty unlocked technologies', () => {
      const store = useGameStore.getState()
      expect(store.unlockedTechs.size).toBe(0)
    })

    it('should unlock technologies', () => {
      const store = useGameStore.getState()
      
      store.unlockTechnology('automation')
      
      expect(store.unlockedTechs.has('automation')).toBe(true)
    })

    it('should track research progress', () => {
      const store = useGameStore.getState()
      
      store.startResearch('automation', 1)
      
      expect(store.researchState).toMatchObject({
        technologyId: 'automation',
        priority: 1,
        progress: 0
      })
    })

    it('should complete research', () => {
      const store = useGameStore.getState()
      
      store.startResearch('automation', 1)
      store.completeResearch()
      
      expect(store.researchState).toBeNull()
      expect(store.unlockedTechs.has('automation')).toBe(true)
    })
  })

  describe('game data management', () => {
    it('should clear all game data', async () => {
      const store = useGameStore.getState()
      
      // Add some data
      store.updateInventory('iron-ore', 100)
      store.addFavoriteRecipe('iron-plate')
      store.unlockTechnology('automation')
      
      await store.clearGameData()
      
      expect(store.inventory.size).toBe(0)
      expect(store.favoriteRecipes.size).toBe(0)
      expect(store.unlockedTechs.size).toBe(0)
      expect(store.craftingQueue).toEqual([])
    })

    it('should save game state', () => {
      const store = useGameStore.getState()
      
      store.updateInventory('iron-ore', 100)
      store.saveGame()
      
      // Verify save was called (mocked)
      expect(vi.mocked(require('../../services/GameStorageService').gameStorageService.saveGame)).toHaveBeenCalled()
    })
  })

  describe('statistics tracking', () => {
    it('should track total items produced', () => {
      const store = useGameStore.getState()
      const initialTotal = store.totalItemsProduced
      
      store.updateInventory('iron-plate', 10)
      
      expect(store.totalItemsProduced).toBe(initialTotal + 10)
    })

    it('should track crafted item counts', () => {
      const store = useGameStore.getState()
      
      store.incrementCraftedCount('iron-plate', 5)
      
      expect(store.craftedItemCounts.get('iron-plate')).toBe(5)
      
      store.incrementCraftedCount('iron-plate', 3)
      expect(store.craftedItemCounts.get('iron-plate')).toBe(8)
    })
  })

  describe('error handling', () => {
    it('should handle invalid crafting task removal gracefully', () => {
      const store = useGameStore.getState()
      
      expect(() => {
        store.removeCraftingTask('non-existent-id')
      }).not.toThrow()
    })

    it('should handle invalid crafting progress updates gracefully', () => {
      const store = useGameStore.getState()
      
      expect(() => {
        store.updateCraftingProgress('non-existent-id', 0.5)
      }).not.toThrow()
    })

    it('should handle service failures gracefully', async () => {
      const store = useGameStore.getState()
      
      // Mock service failure
      vi.mocked(require('../../services/GameStorageService').gameStorageService.saveGame)
        .mockRejectedValue(new Error('Save failed'))
      
      await expect(store.forceSaveGame()).rejects.toThrow('Save failed')
    })
  })
})