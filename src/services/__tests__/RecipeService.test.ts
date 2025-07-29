import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RecipeService } from '../RecipeService'
import { ServiceLocator, SERVICE_NAMES } from '../ServiceLocator'
import type { Recipe } from '../../types'
import type { DataService } from '../DataService'
import type { IManualCraftingValidator } from '../interfaces/IManualCraftingValidator'

// Mock custom recipes
vi.mock('../../data/customRecipes', () => ({
  CUSTOM_RECIPES: [
    {
      id: 'custom-recipe-1',
      name: 'Custom Recipe 1',
      time: 1,
      in: { 'custom-input': 1 },
      out: { 'custom-output': 1 }
    }
  ]
}))

// Mock logger
vi.mock('../../utils/logger', () => ({
  error: vi.fn(),
  warn: vi.fn()
}))

describe('RecipeService', () => {
  let recipeService: RecipeService
  let mockDataService: Partial<DataService>
  let mockCraftingValidator: Partial<IManualCraftingValidator>
  let mockGameStore: any

  const mockRecipes: Recipe[] = [
    {
      id: 'iron-plate',
      name: 'Iron plate',
      time: 3.2,
      in: { 'iron-ore': 1 },
      out: { 'iron-plate': 1 },
      producers: ['stone-furnace', 'steel-furnace', 'electric-furnace']
    },
    {
      id: 'iron-gear-wheel',
      name: 'Iron gear wheel',
      time: 0.5,
      in: { 'iron-plate': 2 },
      out: { 'iron-gear-wheel': 1 },
      producers: ['assembling-machine-1', 'assembling-machine-2', 'assembling-machine-3']
    },
    {
      id: 'copper-cable',
      name: 'Copper cable',
      time: 0.5,
      in: { 'copper-plate': 1 },
      out: { 'copper-cable': 2 },
      producers: ['assembling-machine-1', 'assembling-machine-2', 'assembling-machine-3']
    },
    {
      id: 'electronic-circuit',
      name: 'Electronic circuit',
      time: 0.5,
      in: { 'iron-plate': 1, 'copper-cable': 3 },
      out: { 'electronic-circuit': 1 },
      producers: ['assembling-machine-1', 'assembling-machine-2', 'assembling-machine-3']
    }
  ]

  beforeEach(() => {
    // Clear service locator
    ServiceLocator.clear()
    
    // Clear static state
    ;(RecipeService as any).instance = null
    ;(RecipeService as any).allRecipes = []
    ;(RecipeService as any).recipesByItem.clear()

    // Mock services
    mockDataService = {
      getItem: vi.fn((itemId) => ({
        id: itemId,
        name: itemId,
        stackSize: 100
      })),
      getRecipe: vi.fn((recipeId) => 
        mockRecipes.find(r => r.id === recipeId) || null
      ),
      getItemRecipes: vi.fn((itemId) => 
        mockRecipes.filter(r => r.out[itemId])
      )
    }

    mockCraftingValidator = {
      canManualCraft: vi.fn(() => ({ canCraft: true, reason: null })),
      getIncompatibleProducers: vi.fn(() => [])
    }

    mockGameStore = {
      getState: vi.fn(() => ({
        inventory: new Map([
          ['iron-ore', { amount: 100 }],
          ['iron-plate', { amount: 50 }],
          ['copper-plate', { amount: 30 }],
          ['copper-cable', { amount: 20 }]
        ]),
        getInventoryItem: vi.fn((itemId: string) => {
          const item = mockGameStore.getState().inventory.get(itemId)
          return item || { amount: 0 }
        })
      }))
    }

    // Register services
    ServiceLocator.register(SERVICE_NAMES.DATA, mockDataService)
    ServiceLocator.register(SERVICE_NAMES.MANUAL_CRAFTING_VALIDATOR, mockCraftingValidator)
    ServiceLocator.register(SERVICE_NAMES.GAME_STATE, mockGameStore)

    // Initialize recipes
    RecipeService.initializeRecipes(mockRecipes)
    
    recipeService = RecipeService.getInstance()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = RecipeService.getInstance()
      const instance2 = RecipeService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('initializeRecipes', () => {
    it('should merge data.json recipes with custom recipes', () => {
      const allRecipes = RecipeService.getAllRecipes()
      
      expect(allRecipes).toHaveLength(5) // 4 mock + 1 custom
      expect(allRecipes.find(r => r.id === 'custom-recipe-1')).toBeDefined()
      expect(allRecipes.find(r => r.id === 'iron-plate')).toBeDefined()
    })

    it('should build recipe index correctly', () => {
      const ironPlateRecipes = RecipeService.getRecipesByItem('iron-plate')
      
      // Should include recipes that produce and use iron-plate
      expect(ironPlateRecipes).toContainEqual(
        expect.objectContaining({ id: 'iron-plate' })
      )
      expect(ironPlateRecipes).toContainEqual(
        expect.objectContaining({ id: 'iron-gear-wheel' })
      )
      expect(ironPlateRecipes).toContainEqual(
        expect.objectContaining({ id: 'electronic-circuit' })
      )
    })
  })

  describe('getAllRecipes', () => {
    it('should return all recipes', () => {
      const recipes = RecipeService.getAllRecipes()
      expect(recipes).toHaveLength(5)
    })

    it('should return a copy of recipes array', () => {
      const recipes1 = RecipeService.getAllRecipes()
      const recipes2 = RecipeService.getAllRecipes()
      
      expect(recipes1).not.toBe(recipes2)
      expect(recipes1).toEqual(recipes2)
    })
  })

  describe('getRecipesByItem', () => {
    it('should return recipes related to an item', () => {
      const recipes = RecipeService.getRecipesByItem('iron-plate')
      
      expect(recipes.length).toBeGreaterThan(0)
      expect(recipes.some(r => r.id === 'iron-plate')).toBe(true)
      expect(recipes.some(r => r.id === 'iron-gear-wheel')).toBe(true)
    })

    it('should return empty array for unknown item', () => {
      const recipes = RecipeService.getRecipesByItem('unknown-item')
      expect(recipes).toEqual([])
    })
  })

  describe('getRecipesThatProduce', () => {
    it('should return recipes that produce specific item', () => {
      const recipes = RecipeService.getRecipesThatProduce('iron-plate')
      
      expect(recipes).toHaveLength(1)
      expect(recipes[0].id).toBe('iron-plate')
    })

    it('should return empty array for items with no producers', () => {
      const recipes = RecipeService.getRecipesThatProduce('non-existent')
      expect(recipes).toEqual([])
    })
  })

  describe('getRecipesThatUse', () => {
    it('should return recipes that use specific item', () => {
      const recipes = RecipeService.getRecipesThatUse('iron-plate')
      
      expect(recipes).toHaveLength(2)
      expect(recipes.map(r => r.id)).toContain('iron-gear-wheel')
      expect(recipes.map(r => r.id)).toContain('electronic-circuit')
    })

    it('should return empty array for unused items', () => {
      const recipes = RecipeService.getRecipesThatUse('iron-gear-wheel')
      expect(recipes).toEqual([])
    })
  })

  describe('getRecipeById', () => {
    it('should return recipe by id', () => {
      const recipe = recipeService.getRecipeById('iron-plate')
      
      expect(recipe).toBeDefined()
      expect(recipe?.name).toBe('Iron plate')
    })

    it('should return null for non-existent recipe', () => {
      const recipe = recipeService.getRecipeById('non-existent')
      expect(recipe).toBeNull()
    })
  })

  describe('canCraft', () => {
    it('should check if recipe can be crafted with current inventory', () => {
      const result = recipeService.canCraft('iron-plate')
      
      expect(result.canCraft).toBe(true)
      expect(result.missingItems).toEqual({})
    })

    it('should return missing items when cannot craft', () => {
      // Mock low inventory
      mockGameStore.getState.mockReturnValue({
        inventory: new Map([
          ['iron-plate', { amount: 1 }] // Need 2 for iron-gear-wheel
        ]),
        getInventoryItem: vi.fn(() => ({ amount: 1 }))
      })

      const result = recipeService.canCraft('iron-gear-wheel')
      
      expect(result.canCraft).toBe(false)
      expect(result.missingItems).toEqual({ 'iron-plate': 1 })
    })

    it('should scale missing items by quantity', () => {
      const result = recipeService.canCraft('iron-plate', 200) // Need 200 iron-ore
      
      expect(result.canCraft).toBe(false)
      expect(result.missingItems).toEqual({ 'iron-ore': 100 }) // Have 100, need 200
    })
  })

  describe('craftRecipe', () => {
    it('should craft recipe and update inventory', () => {
      const updateInventory = vi.fn()
      const batchUpdateInventory = vi.fn()
      mockGameStore.getState.mockReturnValue({
        inventory: new Map([['iron-ore', { amount: 100 }]]),
        getInventoryItem: vi.fn(() => ({ amount: 100 })),
        updateInventory,
        batchUpdateInventory
      })

      const result = recipeService.craftRecipe('iron-plate', 1)
      
      expect(result.success).toBe(true)
      expect(result.produced).toEqual({ 'iron-plate': 1 })
      expect(batchUpdateInventory).toHaveBeenCalledWith([
        { itemId: 'iron-ore', amount: -1 },
        { itemId: 'iron-plate', amount: 1 }
      ])
    })

    it('should fail when insufficient materials', () => {
      mockGameStore.getState.mockReturnValue({
        inventory: new Map(),
        getInventoryItem: vi.fn(() => ({ amount: 0 }))
      })

      const result = recipeService.craftRecipe('iron-plate', 1)
      
      expect(result.success).toBe(false)
      expect(result.missingItems).toEqual({ 'iron-ore': 1 })
    })

    it('should handle multi-output recipes', () => {
      const batchUpdateInventory = vi.fn()
      mockGameStore.getState.mockReturnValue({
        inventory: new Map([['copper-plate', { amount: 100 }]]),
        getInventoryItem: vi.fn(() => ({ amount: 100 })),
        batchUpdateInventory
      })

      const result = recipeService.craftRecipe('copper-cable', 1)
      
      expect(result.success).toBe(true)
      expect(result.produced).toEqual({ 'copper-cable': 2 })
    })
  })

  describe('getAvailableRecipes', () => {
    it('should return recipes that can be crafted', () => {
      const recipes = recipeService.getAvailableRecipes()
      
      expect(recipes).toContainEqual(
        expect.objectContaining({ id: 'iron-plate' })
      )
    })

    it('should exclude recipes with missing materials', () => {
      mockGameStore.getState.mockReturnValue({
        inventory: new Map(), // Empty inventory
        getInventoryItem: vi.fn(() => ({ amount: 0 }))
      })

      const recipes = recipeService.getAvailableRecipes()
      
      expect(recipes).toHaveLength(0)
    })

    it('should exclude non-manual craftable recipes', () => {
      vi.mocked(mockCraftingValidator.canManualCraft!).mockReturnValue({
        canCraft: false,
        reason: 'requires-machine'
      })

      const recipes = recipeService.getAvailableRecipes()
      
      expect(recipes).toHaveLength(0)
    })
  })

  describe('getProducersForRecipe', () => {
    it('should return producers for recipe', () => {
      const producers = recipeService.getProducersForRecipe('iron-plate')
      
      expect(producers).toEqual(['stone-furnace', 'steel-furnace', 'electric-furnace'])
    })

    it('should return empty array for unknown recipe', () => {
      const producers = recipeService.getProducersForRecipe('unknown')
      
      expect(producers).toEqual([])
    })

    it('should filter incompatible producers', () => {
      vi.mocked(mockCraftingValidator.getIncompatibleProducers!).mockReturnValue(['stone-furnace'])
      
      const producers = recipeService.getProducersForRecipe('iron-plate')
      
      expect(producers).toEqual(['steel-furnace', 'electric-furnace'])
    })
  })

  describe('calculateRecipeTime', () => {
    it('should calculate base recipe time', () => {
      const time = recipeService.calculateRecipeTime('iron-plate')
      expect(time).toBe(3.2)
    })

    it('should apply machine speed modifier', () => {
      const time = recipeService.calculateRecipeTime('iron-plate', 'electric-furnace', 2)
      expect(time).toBe(1.6) // 3.2 / 2
    })

    it('should return 0 for unknown recipe', () => {
      const time = recipeService.calculateRecipeTime('unknown')
      expect(time).toBe(0)
    })
  })

  describe('getRecipeAnalysis', () => {
    it('should return comprehensive recipe analysis', () => {
      const analysis = recipeService.getRecipeAnalysis('iron-gear-wheel')
      
      expect(analysis).toBeDefined()
      expect(analysis?.recipe.id).toBe('iron-gear-wheel')
      expect(analysis?.canCraft).toBe(true)
      expect(analysis?.availableCount).toBe(25) // 50 iron-plates / 2 per craft
      expect(analysis?.producers).toContain('assembling-machine-1')
      expect(analysis?.isManualCraftable).toBe(true)
    })

    it('should return null for unknown recipe', () => {
      const analysis = recipeService.getRecipeAnalysis('unknown')
      expect(analysis).toBeNull()
    })

    it('should include fastest recipe information', () => {
      const analysis = recipeService.getRecipeAnalysis('iron-plate')
      
      expect(analysis?.fastestRecipe).toBeDefined()
      expect(analysis?.fastestRecipe?.id).toBe('iron-plate')
    })
  })

  describe('searchRecipes', () => {
    it('should search recipes by name', () => {
      const results = recipeService.searchRecipes('iron')
      
      expect(results.length).toBeGreaterThan(0)
      expect(results.every(r => r.name.toLowerCase().includes('iron'))).toBe(true)
    })

    it('should search recipes by item id', () => {
      const results = recipeService.searchRecipes('copper-cable')
      
      expect(results).toContainEqual(
        expect.objectContaining({ id: 'copper-cable' })
      )
    })

    it('should return empty array for no matches', () => {
      const results = recipeService.searchRecipes('xyz123')
      expect(results).toEqual([])
    })

    it('should be case insensitive', () => {
      const results1 = recipeService.searchRecipes('IRON')
      const results2 = recipeService.searchRecipes('iron')
      
      expect(results1).toEqual(results2)
    })
  })

  describe('getRecipeCategories', () => {
    it('should return unique categories from recipes', () => {
      // Add category to mock recipes
      const recipesWithCategories = mockRecipes.map(r => ({
        ...r,
        category: r.producers?.includes('furnace') ? 'smelting' : 'crafting'
      }))
      RecipeService.initializeRecipes(recipesWithCategories)

      const categories = recipeService.getRecipeCategories()
      
      expect(categories).toContain('smelting')
      expect(categories).toContain('crafting')
    })

    it('should filter out null/undefined categories', () => {
      const categories = recipeService.getRecipeCategories()
      
      expect(categories.every(c => c != null)).toBe(true)
    })
  })
})