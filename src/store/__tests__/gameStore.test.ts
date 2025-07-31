/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from '@testing-library/react'
import useGameStore from '@/store/gameStore'
import type { CraftingTask } from '@/types/index'

// 模拟服务
vi.mock('@/services/game-logic/TechnologyService')
vi.mock('@/services/storage/GameStorageService', () => ({
  GameStorageService: {
    getInstance: vi.fn(() => ({
      saveGame: vi.fn().mockResolvedValue(undefined),
      loadGame: vi.fn().mockResolvedValue(null),
      forceSaveGame: vi.fn().mockResolvedValue(undefined),
      clearGameData: vi.fn().mockResolvedValue(undefined)
    }))
  }
}))

// 模拟 DataService
const mockDataService = {
  getInstance: vi.fn(() => mockDataService),
  getItem: vi.fn((itemId: string) => ({
    id: itemId,
    name: itemId,
    stack: 100,
    category: 'intermediate-products'
  }))
}

// 模拟 FuelService
const mockFuelService = {
  getInstance: vi.fn(() => mockFuelService),
  initializeFuelBuffer: vi.fn(() => null)
}

// 模拟 RecipeService
const mockRecipeService = {
  getInstance: vi.fn(() => mockRecipeService),
  getRecipeById: vi.fn(() => null),
  getAllRecipes: vi.fn(() => [])
}

// 设置模拟实现
vi.mock('@/services/data/DataService', () => ({
  DataService: {
    getInstance: vi.fn(() => mockDataService)
  }
}))

vi.mock('@/services/systems/FuelService', () => ({
  FuelService: {
    getInstance: vi.fn(() => mockFuelService)
  }
}))

vi.mock('@/services/data/RecipeService', () => ({
  RecipeService: {
    getInstance: vi.fn(() => mockRecipeService),
    getRecipeById: vi.fn(() => null),
    getAllRecipes: vi.fn(() => [])
  }
}))

// 模拟设置已完成，无需额外配置

// 模拟 window.location.reload
Object.defineProperty(window, 'location', {
  value: {
    ...window.location,
    reload: vi.fn()
  },
  writable: true
})

// gameStore 测试套件 - 游戏状态管理
describe('gameStore', () => {
  beforeEach(() => {
    // 重置 store 到初始状态
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

  // 库存管理测试
  describe('inventory management', () => {
    // 更新库存测试
    describe('updateInventory', () => {
      // 测试：应该添加新物品到库存
      it('should add new item to inventory', () => {
        const { updateInventory, getInventoryItem } = useGameStore.getState()
        
        act(() => {
          updateInventory('iron-plate', 10)
        })
        
        const item = getInventoryItem('iron-plate')
        expect(item.currentAmount).toBe(10)
        expect(item.itemId).toBe('iron-plate')
      })

      // 测试：应该更新现有物品数量
      it('should update existing item amount', () => {
        const { updateInventory, getInventoryItem } = useGameStore.getState()
        
        act(() => {
          updateInventory('iron-plate', 10)
          updateInventory('iron-plate', 5)
        })
        
        const item = getInventoryItem('iron-plate')
        expect(item.currentAmount).toBe(15)
      })

      // 测试：应该处理负数数量
      it('should handle negative amounts', () => {
        const { updateInventory, getInventoryItem } = useGameStore.getState()
        
        act(() => {
          updateInventory('iron-plate', 20)
          updateInventory('iron-plate', -5)
        })
        
        const item = getInventoryItem('iron-plate')
        expect(item.currentAmount).toBe(15)
      })

      // 测试：数量为零时应移除物品
      it('should remove item when amount reaches zero', () => {
        const { updateInventory } = useGameStore.getState()
        
        act(() => {
          updateInventory('iron-plate', 10)
          updateInventory('iron-plate', -10)
        })
        
        expect(useGameStore.getState().inventory.has('iron-plate')).toBe(false)
      })
    })

    // 批量更新库存测试
    describe('batchUpdateInventory', () => {
      // 测试：应该一次更新多个物品
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

    // 获取库存物品测试
    describe('getInventoryItem', () => {
      // 测试：应该返回现有物品
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

      // 测试：不存在的物品应返回空物品
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

  // 制作队列测试
  describe('crafting queue', () => {
    // 添加制作任务测试
    describe('addCraftingTask', () => {
      // 测试：应该添加制作任务到队列
      it('should add crafting task to queue', () => {
        const { addCraftingTask } = useGameStore.getState()
        
        const task: Omit<CraftingTask, 'id'> = {
          itemId: 'iron-gear-wheel',
          quantity: 10,
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

      // 测试：应该遵守最大队列大小
      it('should respect max queue size', () => {
        const { addCraftingTask } = useGameStore.getState()
        
        // Set max queue size to 2
        // 设置最大队列大小为 2
        act(() => {
          useGameStore.setState({ maxQueueSize: 2 })
        })
        
        const task: Omit<CraftingTask, 'id'> = {
          itemId: 'item',
          quantity: 1,
          progress: 0,
          startTime: Date.now()
        }
        
        act(() => {
          expect(addCraftingTask(task)).toBe(true)
          expect(addCraftingTask(task)).toBe(true)
          expect(addCraftingTask(task)).toBe(false) // Should fail // 应该失败
        })
        
        expect(useGameStore.getState().craftingQueue).toHaveLength(2)
      })
    })

    // 移除制作任务测试
    describe('removeCraftingTask', () => {
      // 测试：应该从队列中移除任务
      it('should remove task from queue', () => {
        const { addCraftingTask, removeCraftingTask } = useGameStore.getState()
        
        let taskId: string = ''
        act(() => {
          addCraftingTask({
            recipeId: 'iron-plate',
            itemId: 'iron-plate',
            quantity: 1,
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

    // 更新制作进度测试
    describe('updateCraftingProgress', () => {
      // 测试：应该更新任务进度
      it('should update task progress', () => {
        const { addCraftingTask, updateCraftingProgress } = useGameStore.getState()
        
        let taskId: string = ''
        act(() => {
          addCraftingTask({
            recipeId: 'iron-plate',
            itemId: 'iron-plate',
            quantity: 1,
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

  // 收藏配方测试
  describe('favorite recipes', () => {
    // 添加收藏配方测试
    describe('addFavoriteRecipe', () => {
      // 测试：应该添加配方到收藏
      it('should add recipe to favorites', () => {
        const { addFavoriteRecipe, isFavoriteRecipe } = useGameStore.getState()
        
        act(() => {
          addFavoriteRecipe('iron-gear-wheel')
        })
        
        expect(isFavoriteRecipe('iron-gear-wheel')).toBe(true)
      })
    })

    // 移除收藏配方测试
    describe('removeFavoriteRecipe', () => {
      // 测试：应该从收藏中移除配方
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

  // 最近配方测试
  describe('recent recipes', () => {
    // 添加最近配方测试
    describe('addRecentRecipe', () => {
      // 测试：应该添加配方到最近列表
      it('should add recipe to recent list', () => {
        const { addRecentRecipe } = useGameStore.getState()
        
        act(() => {
          addRecentRecipe('iron-plate')
        })
        
        const recentRecipes = useGameStore.getState().recentRecipes
        expect(recentRecipes).toContain('iron-plate')
      })

      // 测试：应该将现有配方移到前面
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

      // 测试：应该遵守最大最近配方限制
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

  // 设施管理测试
  describe('facilities', () => {
    // 添加设施测试
    describe('addFacility', () => {
      // 测试：应该添加设施到列表
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

    // 更新设施测试
    describe('updateFacility', () => {
      // 测试：应该更新设施属性
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

    // 移除设施测试
    describe('removeFacility', () => {
      // 测试：应该从列表中移除设施
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

  // 游戏数据持久化测试
  describe('game data persistence', () => {
    // 清除游戏数据测试
    describe('clearGameData', () => {
      // 测试：应该重置所有游戏状态
      it('should reset all game state', async () => {
        const { updateInventory, addFavoriteRecipe, clearGameData } = useGameStore.getState()
        
        // Add some data
        // 添加一些数据
        act(() => {
          updateInventory('iron-plate', 100)
          addFavoriteRecipe('iron-gear-wheel')
        })
        
        // Clear data
        // 清除数据
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