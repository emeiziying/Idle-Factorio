/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from '@testing-library/react'
import useGameStore from '../gameStore'
import type { CraftingTask } from '../../types/index'

// Mock services
vi.mock('../../services/RecipeService')
vi.mock('../../services/DataService')
vi.mock('../../services/TechnologyService')
vi.mock('../../services/FuelService')
vi.mock('../../services/GameStorageService')

describe('gameStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    act(() => {
      useGameStore.setState({
        inventory: new Map(),
        craftingQueue: [],
        craftingChains: [],
        maxQueueSize: 10,
        facilities: [],
        deployedContainers: [],
        totalItemsProduced: 0,
        favoriteRecipes: new Set(),
        recentRecipes: [],
        maxRecentRecipes: 10,
        technologies: new Map(),
        researchState: null,
        researchQueue: [],
        unlockedTechs: new Set(),
        autoResearch: false,
        techCategories: [],
        craftedItemCounts: new Map(),
        builtEntityCounts: new Map(),
        minedEntityCounts: new Map(),
      })
    })
  })

  describe('inventory management', () => {
    describe('updateInventory', () => {
      it('should add new item to inventory', () => {
        const { updateInventory, getInventoryItem } = useGameStore.getState()
        
        act(() => {
          updateInventory('iron-plate', 10)
        })
        
        const item = getInventoryItem('iron-plate')
        expect(item.currentAmount).toBe(10)
        expect(item.itemId).toBe('iron-plate')
      })

      it('should update existing item amount', () => {
        const { updateInventory, getInventoryItem } = useGameStore.getState()
        
        act(() => {
          updateInventory('iron-plate', 10)
          updateInventory('iron-plate', 5)
        })
        
        const item = getInventoryItem('iron-plate')
        expect(item.currentAmount).toBe(15)
      })

      it('should handle negative amounts', () => {
        const { updateInventory, getInventoryItem } = useGameStore.getState()
        
        act(() => {
          updateInventory('iron-plate', 20)
          updateInventory('iron-plate', -5)
        })
        
        const item = getInventoryItem('iron-plate')
        expect(item.currentAmount).toBe(15)
      })

      it('should remove item when amount reaches zero', () => {
        const { updateInventory } = useGameStore.getState()
        
        act(() => {
          updateInventory('iron-plate', 10)
          updateInventory('iron-plate', -10)
        })
        
        expect(useGameStore.getState().inventory.has('iron-plate')).toBe(false)
      })
    })

    describe('batchUpdateInventory', () => {
      it('should update multiple items at once', () => {
        const { batchUpdateInventory, getInventoryItem } = useGameStore.getState()
        
        act(() => {
          batchUpdateInventory([
            { itemId: 'iron-plate', amount: 10 },
            { itemId: 'copper-plate', amount: 20 },
            { itemId: 'steel-plate', amount: 5 }
          ])
        })
        
        expect(getInventoryItem('iron-plate').currentAmount).toBe(10)
        expect(getInventoryItem('copper-plate').currentAmount).toBe(20)
        expect(getInventoryItem('steel-plate').currentAmount).toBe(5)
      })
    })

    describe('getInventoryItem', () => {
      it('should return existing item', () => {
        const { updateInventory, getInventoryItem } = useGameStore.getState()
        
        act(() => {
          updateInventory('iron-plate', 10)
        })
        
        const item = getInventoryItem('iron-plate')
        expect(item).toEqual({
          itemId: 'iron-plate',
          currentAmount: 10,
          stackSize: 100,
          baseStacks: 1,
          additionalStacks: 0,
          totalStacks: 1,
          maxCapacity: 100,
          productionRate: 0,
          consumptionRate: 0,
          status: 'normal'
        })
      })

      it('should return empty item for non-existent items', () => {
        const { getInventoryItem } = useGameStore.getState()
        
        const item = getInventoryItem('non-existent')
        expect(item).toEqual({
          itemId: 'non-existent',
          currentAmount: 0,
          stackSize: 100,
          baseStacks: 1,
          additionalStacks: 0,
          totalStacks: 1,
          maxCapacity: 100,
          productionRate: 0,
          consumptionRate: 0,
          status: 'normal'
        })
      })
    })
  })

  describe('crafting queue', () => {
    describe('addCraftingTask', () => {
      it('should add crafting task to queue', () => {
        const { addCraftingTask } = useGameStore.getState()
        
        const task: Omit<CraftingTask, 'id'> = {
          itemId: 'iron-gear-wheel',
          quantity: 10,
          remainingQuantity: 10,
          progress: 0,
          startTime: Date.now()
        }
        
        act(() => {
          const success = addCraftingTask(task)
          expect(success).toBe(true)
        })
        
        const queue = useGameStore.getState().craftingQueue
        expect(queue).toHaveLength(1)
        expect(queue[0].itemId).toBe('iron-gear-wheel')
        expect(queue[0].id).toBeDefined()
      })

      it('should respect max queue size', () => {
        const { addCraftingTask } = useGameStore.getState()
        
        // Set max queue size to 2
        act(() => {
          useGameStore.setState({ maxQueueSize: 2 })
        })
        
        const task: Omit<CraftingTask, 'id'> = {
          itemId: 'item',
          quantity: 1,
          remainingQuantity: 1,
          progress: 0,
          startTime: Date.now()
        }
        
        act(() => {
          expect(addCraftingTask(task)).toBe(true)
          expect(addCraftingTask(task)).toBe(true)
          expect(addCraftingTask(task)).toBe(false) // Should fail
        })
        
        expect(useGameStore.getState().craftingQueue).toHaveLength(2)
      })
    })

    describe('removeCraftingTask', () => {
      it('should remove task from queue', () => {
        const { addCraftingTask, removeCraftingTask } = useGameStore.getState()
        
        let taskId: string = ''
        act(() => {
          addCraftingTask({
            itemId: 'item',
            quantity: 1,
            remainingQuantity: 1,
            progress: 0,
            startTime: Date.now()
          })
          taskId = useGameStore.getState().craftingQueue[0].id
        })
        
        act(() => {
          removeCraftingTask(taskId)
        })
        
        expect(useGameStore.getState().craftingQueue).toHaveLength(0)
      })
    })

    describe('updateCraftingProgress', () => {
      it('should update task progress', () => {
        const { addCraftingTask, updateCraftingProgress } = useGameStore.getState()
        
        let taskId: string = ''
        act(() => {
          addCraftingTask({
            itemId: 'item',
            quantity: 1,
            remainingQuantity: 1,
            progress: 0,
            startTime: Date.now()
          })
          taskId = useGameStore.getState().craftingQueue[0].id
        })
        
        act(() => {
          updateCraftingProgress(taskId, 0.5)
        })
        
        const task = useGameStore.getState().craftingQueue[0]
        expect(task.progress).toBe(0.5)
      })
    })
  })

  describe('favorite recipes', () => {
    describe('addFavoriteRecipe', () => {
      it('should add recipe to favorites', () => {
        const { addFavoriteRecipe, isFavoriteRecipe } = useGameStore.getState()
        
        act(() => {
          addFavoriteRecipe('iron-gear-wheel')
        })
        
        expect(isFavoriteRecipe('iron-gear-wheel')).toBe(true)
      })
    })

    describe('removeFavoriteRecipe', () => {
      it('should remove recipe from favorites', () => {
        const { addFavoriteRecipe, removeFavoriteRecipe, isFavoriteRecipe } = useGameStore.getState()
        
        act(() => {
          addFavoriteRecipe('iron-gear-wheel')
        })
        
        expect(isFavoriteRecipe('iron-gear-wheel')).toBe(true)
        
        act(() => {
          removeFavoriteRecipe('iron-gear-wheel')
        })
        
        expect(isFavoriteRecipe('iron-gear-wheel')).toBe(false)
      })
    })
  })

  describe('recent recipes', () => {
    describe('addRecentRecipe', () => {
      it('should add recipe to recent list', () => {
        const { addRecentRecipe } = useGameStore.getState()
        
        act(() => {
          addRecentRecipe('iron-plate')
        })
        
        const recentRecipes = useGameStore.getState().recentRecipes
        expect(recentRecipes).toContain('iron-plate')
      })

      it('should move existing recipe to front', () => {
        const { addRecentRecipe } = useGameStore.getState()
        
        act(() => {
          addRecentRecipe('iron-plate')
          addRecentRecipe('copper-plate')
          addRecentRecipe('iron-plate')
        })
        
        const recentRecipes = useGameStore.getState().recentRecipes
        expect(recentRecipes[0]).toBe('iron-plate')
        expect(recentRecipes[1]).toBe('copper-plate')
        expect(recentRecipes).toHaveLength(2)
      })

      it('should respect max recent recipes limit', () => {
        const { addRecentRecipe } = useGameStore.getState()
        
        act(() => {
          useGameStore.setState({ maxRecentRecipes: 3 })
        })
        
        act(() => {
          addRecentRecipe('recipe1')
          addRecentRecipe('recipe2')
          addRecentRecipe('recipe3')
          addRecentRecipe('recipe4')
        })
        
        const recentRecipes = useGameStore.getState().recentRecipes
        expect(recentRecipes).toHaveLength(3)
        expect(recentRecipes).toEqual(['recipe4', 'recipe3', 'recipe2'])
      })
    })
  })

  describe('facilities', () => {
    describe('addFacility', () => {
      it('should add facility to list', () => {
        const { addFacility } = useGameStore.getState()
        
        const facility = {
          id: 'furnace-1',
          type: 'furnace',
          itemId: 'stone-furnace',
          recipe: null,
          isActive: false,
          efficiency: 1,
          speed: 1,
          fuel: {
            type: 'item',
            current: 0,
            maximum: 100,
            burnRate: 1
          }
        }
        
        act(() => {
          addFacility(facility)
        })
        
        const facilities = useGameStore.getState().facilities
        expect(facilities).toHaveLength(1)
        expect(facilities[0]).toEqual(facility)
      })
    })

    describe('updateFacility', () => {
      it('should update facility properties', () => {
        const { addFacility, updateFacility } = useGameStore.getState()
        
        const facility = {
          id: 'furnace-1',
          type: 'furnace' as const,
          itemId: 'stone-furnace',
          recipe: null,
          isActive: false,
          efficiency: 1,
          speed: 1
        }
        
        act(() => {
          addFacility(facility)
        })
        
        act(() => {
          updateFacility('furnace-1', { isActive: true, recipe: 'iron-plate' })
        })
        
        const updated = useGameStore.getState().facilities[0]
        expect(updated.isActive).toBe(true)
        expect(updated.recipe).toBe('iron-plate')
      })
    })

    describe('removeFacility', () => {
      it('should remove facility from list', () => {
        const { addFacility, removeFacility } = useGameStore.getState()
        
        const facility = {
          id: 'furnace-1',
          type: 'furnace' as const,
          itemId: 'stone-furnace',
          recipe: null,
          isActive: false,
          efficiency: 1,
          speed: 1
        }
        
        act(() => {
          addFacility(facility)
        })
        
        expect(useGameStore.getState().facilities).toHaveLength(1)
        
        act(() => {
          removeFacility('furnace-1')
        })
        
        expect(useGameStore.getState().facilities).toHaveLength(0)
      })
    })
  })

  describe('game data persistence', () => {
    describe('clearGameData', () => {
      it('should reset all game state', async () => {
        const { updateInventory, addFavoriteRecipe, clearGameData } = useGameStore.getState()
        
        // Add some data
        act(() => {
          updateInventory('iron-plate', 100)
          addFavoriteRecipe('iron-gear-wheel')
        })
        
        // Clear data
        await act(async () => {
          await clearGameData()
        })
        
        const state = useGameStore.getState()
        expect(state.inventory.size).toBe(0)
        expect(state.favoriteRecipes.size).toBe(0)
        expect(state.totalItemsProduced).toBe(0)
      })
    })
  })
})