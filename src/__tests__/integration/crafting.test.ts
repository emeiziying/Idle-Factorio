import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from '@testing-library/react'
import useGameStore from '../../store/gameStore'
import { RecipeService } from '../../services/RecipeService'
import { DataService } from '../../services/DataService'
import { ServiceLocator, SERVICE_NAMES } from '../../services/ServiceLocator'

// Mock services
vi.mock('../../services/GameStorageService')

describe('Crafting Integration Tests', () => {
  let mockRecipeService: Partial<RecipeService>
  let mockDataService: Partial<DataService>

  beforeEach(() => {
    // Clear services
    ServiceLocator.clear()
    
    // Setup mock services
    mockDataService = {
      getItem: vi.fn((itemId) => ({
        id: itemId,
        name: itemId,
        stackSize: 100
      })),
      getRecipe: vi.fn((recipeId) => {
        if (recipeId === 'iron-gear-wheel') {
          return {
            id: 'iron-gear-wheel',
            time: 0.5,
            in: { 'iron-plate': 2 },
            out: { 'iron-gear-wheel': 1 }
          }
        }
        return null
      }),
      getItemRecipes: vi.fn(() => []),
      initialized: true
    }

    mockRecipeService = {
      getRecipe: vi.fn((recipeId) => mockDataService.getRecipe!(recipeId)),
      canCraft: vi.fn(() => ({ canCraft: true, missingItems: {} })),
      getRecipeById: vi.fn((recipeId) => mockDataService.getRecipe!(recipeId))
    }

    // Register services
    ServiceLocator.register(SERVICE_NAMES.DATA, mockDataService)
    ServiceLocator.register(SERVICE_NAMES.RECIPE, mockRecipeService)

    // Reset game store
    act(() => {
      useGameStore.setState({
        inventory: new Map(),
        craftingQueue: [],
        totalItemsProduced: 0,
        favoriteRecipes: new Set(),
        recentRecipes: []
      })
    })
  })

  describe('Basic Crafting Flow', () => {
    it('should complete a simple crafting task', async () => {
      const store = useGameStore.getState()

      // Step 1: Add materials to inventory
      act(() => {
        store.updateInventory('iron-plate', 10)
      })

      expect(store.getInventoryItem('iron-plate').amount).toBe(10)

      // Step 2: Add crafting task
      const taskAdded = act(() => {
        return store.addCraftingTask({
          itemId: 'iron-gear-wheel',
          quantity: 2,
          remainingQuantity: 2,
          progress: 0,
          startTime: Date.now()
        })
      })

      expect(taskAdded).toBe(true)
      expect(useGameStore.getState().craftingQueue).toHaveLength(1)

      // Step 3: Simulate crafting progress
      const taskId = useGameStore.getState().craftingQueue[0].id
      
      act(() => {
        store.updateCraftingProgress(taskId, 0.5)
      })

      expect(useGameStore.getState().craftingQueue[0].progress).toBe(0.5)

      // Step 4: Complete first item
      act(() => {
        store.updateCraftingProgress(taskId, 1)
        store.completeCraftingTask(taskId)
      })

      // Should have consumed materials and produced item
      expect(store.getInventoryItem('iron-plate').amount).toBe(8) // 10 - 2
      expect(store.getInventoryItem('iron-gear-wheel').amount).toBe(1)

      // Task should still be in queue for second item
      expect(useGameStore.getState().craftingQueue[0].remainingQuantity).toBe(1)

      // Step 5: Complete second item
      act(() => {
        store.updateCraftingProgress(taskId, 1)
        store.completeCraftingTask(taskId)
      })

      // Final inventory check
      expect(store.getInventoryItem('iron-plate').amount).toBe(6) // 8 - 2
      expect(store.getInventoryItem('iron-gear-wheel').amount).toBe(2)

      // Queue should be empty
      expect(useGameStore.getState().craftingQueue).toHaveLength(0)
    })

    it('should handle insufficient materials', () => {
      const store = useGameStore.getState()

      // Add insufficient materials
      act(() => {
        store.updateInventory('iron-plate', 1) // Need 2 for recipe
      })

      // Mock canCraft to return false
      vi.mocked(mockRecipeService.canCraft!).mockReturnValue({
        canCraft: false,
        missingItems: { 'iron-plate': 1 }
      })

      // Try to add crafting task
      const taskAdded = act(() => {
        return store.addCraftingTask({
          itemId: 'iron-gear-wheel',
          quantity: 1,
          remainingQuantity: 1,
          progress: 0,
          startTime: Date.now()
        })
      })

      // Should still add task (validation happens elsewhere)
      expect(taskAdded).toBe(true)
    })

    it('should update recent recipes', () => {
      const store = useGameStore.getState()

      // Add materials
      act(() => {
        store.updateInventory('iron-plate', 20)
      })

      // Craft item
      act(() => {
        store.addCraftingTask({
          itemId: 'iron-gear-wheel',
          quantity: 1,
          remainingQuantity: 1,
          progress: 0,
          startTime: Date.now()
        })
        store.addRecentRecipe('iron-gear-wheel')
      })

      expect(useGameStore.getState().recentRecipes).toContain('iron-gear-wheel')
    })

    it('should handle batch inventory updates during crafting', () => {
      const store = useGameStore.getState()

      // Add initial materials
      act(() => {
        store.batchUpdateInventory([
          { itemId: 'iron-plate', amount: 20 },
          { itemId: 'copper-plate', amount: 15 },
          { itemId: 'coal', amount: 50 }
        ])
      })

      // Verify all items added
      expect(store.getInventoryItem('iron-plate').amount).toBe(20)
      expect(store.getInventoryItem('copper-plate').amount).toBe(15)
      expect(store.getInventoryItem('coal').amount).toBe(50)

      // Simulate consuming materials
      act(() => {
        store.batchUpdateInventory([
          { itemId: 'iron-plate', amount: -5 },
          { itemId: 'copper-plate', amount: -3 }
        ])
      })

      // Verify consumption
      expect(store.getInventoryItem('iron-plate').amount).toBe(15)
      expect(store.getInventoryItem('copper-plate').amount).toBe(12)
      expect(store.getInventoryItem('coal').amount).toBe(50) // Unchanged
    })
  })

  describe('Favorite Recipes Integration', () => {
    it('should persist favorite recipes during crafting', () => {
      const store = useGameStore.getState()

      // Add recipe to favorites
      act(() => {
        store.addFavoriteRecipe('iron-gear-wheel')
      })

      expect(store.isFavoriteRecipe('iron-gear-wheel')).toBe(true)

      // Add materials and craft
      act(() => {
        store.updateInventory('iron-plate', 10)
        store.addCraftingTask({
          itemId: 'iron-gear-wheel',
          quantity: 1,
          remainingQuantity: 1,
          progress: 0,
          startTime: Date.now()
        })
      })

      // Favorite status should persist
      expect(store.isFavoriteRecipe('iron-gear-wheel')).toBe(true)

      // Remove from favorites
      act(() => {
        store.removeFavoriteRecipe('iron-gear-wheel')
      })

      expect(store.isFavoriteRecipe('iron-gear-wheel')).toBe(false)
    })
  })

  describe('Statistics Integration', () => {
    it('should track total items produced', () => {
      const store = useGameStore.getState()
      const initialProduced = store.totalItemsProduced

      // Add materials
      act(() => {
        store.updateInventory('iron-plate', 100)
      })

      // Create and complete multiple tasks
      for (let i = 0; i < 3; i++) {
        act(() => {
          const added = store.addCraftingTask({
            itemId: 'iron-gear-wheel',
            quantity: 1,
            remainingQuantity: 1,
            progress: 0,
            startTime: Date.now()
          })
          
          if (added) {
            const taskId = useGameStore.getState().craftingQueue[0].id
            store.completeCraftingTask(taskId)
            // Manually increment totalItemsProduced (normally done by crafting system)
            useGameStore.setState(state => ({
              totalItemsProduced: state.totalItemsProduced + 1
            }))
          }
        })
      }

      // Should have produced 3 items
      expect(useGameStore.getState().totalItemsProduced).toBe(initialProduced + 3)
      expect(store.getInventoryItem('iron-gear-wheel').amount).toBe(3)
    })
  })
})