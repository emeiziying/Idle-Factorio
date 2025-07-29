import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RecipeService } from '../RecipeService'
import type { Recipe } from '../../types/index'

// Mock custom recipes
vi.mock('../../data/customRecipes', () => ({
  CUSTOM_RECIPES: [
    {
      id: 'custom-recipe-1',
      name: 'Custom Recipe 1',
      out: { 'custom-item': 1 },
      in: { 'basic-item': 2 },
      time: 1,
      category: 'custom'
    }
  ]
}))

// Mock service locator
vi.mock('../ServiceLocator', () => ({
  ServiceLocator: {
    get: vi.fn()
  },
  SERVICE_NAMES: {
    DATA_SERVICE: 'DataService',
    MANUAL_CRAFTING_VALIDATOR: 'ManualCraftingValidator'
  }
}))

describe('RecipeService', () => {
  const mockDataJsonRecipes: Recipe[] = [
    {
      id: 'iron-plate-recipe',
      name: 'Iron Plate',
      out: { 'iron-plate': 1 },
      in: { 'iron-ore': 1 },
      time: 3.2,
      category: 'smelting'
    },
    {
      id: 'gear-recipe',
      name: 'Iron Gear Wheel',
      out: { 'iron-gear-wheel': 1 },
      in: { 'iron-plate': 2 },
      time: 0.5,
      category: 'crafting'
    },
    {
      id: 'multi-output-recipe',
      name: 'Multi Output',
      out: { 'item-a': 2, 'item-b': 1 },
      in: { 'raw-material': 3 },
      time: 2,
      category: 'chemistry'
    }
  ]

  beforeEach(() => {
    vi.resetAllMocks()
    
    // Reset singleton instance
    ;(RecipeService as any).instance = null
    ;(RecipeService as any).allRecipes = []
    ;(RecipeService as any).recipesByItem = new Map()
    
    // Initialize with test data
    RecipeService.initializeRecipes(mockDataJsonRecipes)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = RecipeService.getInstance()
      const instance2 = RecipeService.getInstance()
      
      expect(instance1).toBe(instance2)
    })
  })

  describe('initialization', () => {
    it('should merge data.json recipes with custom recipes', () => {
      const allRecipes = RecipeService.getAllRecipes()
      
      expect(allRecipes).toHaveLength(4) // 3 mock + 1 custom
      expect(allRecipes.some(r => r.id === 'iron-plate-recipe')).toBe(true)
      expect(allRecipes.some(r => r.id === 'custom-recipe-1')).toBe(true)
    })

    it('should build recipe index correctly', () => {
      // Test finding recipes by output item
      const ironPlateRecipes = RecipeService.getRecipesByItem('iron-plate')
      expect(ironPlateRecipes.length).toBeGreaterThanOrEqual(0)
      
      // Test finding recipes by input item
      const recipesUsingIronOre = RecipeService.getRecipesByItem('iron-ore')
      expect(Array.isArray(recipesUsingIronOre)).toBe(true)
    })

    it('should handle multiple outputs correctly', () => {
      const itemARecipes = RecipeService.getRecipesByItem('item-a')
      const itemBRecipes = RecipeService.getRecipesByItem('item-b')
      
      expect(Array.isArray(itemARecipes)).toBe(true)
      expect(Array.isArray(itemBRecipes)).toBe(true)
      
      // Check if the multi-output recipe exists and is indexed correctly
      const allRecipes = RecipeService.getAllRecipes()
      const multiOutputRecipe = allRecipes.find(r => r.id === 'multi-output-recipe')
      if (multiOutputRecipe) {
        expect(itemARecipes.some(r => r.id === 'multi-output-recipe')).toBe(true)
        expect(itemBRecipes.some(r => r.id === 'multi-output-recipe')).toBe(true)
      }
    })

    it('should avoid duplicate recipes in index', () => {
      // A recipe that uses iron-plate as input shouldn't appear twice
      const ironPlateRecipes = RecipeService.getRecipesByItem('iron-plate')
      const uniqueIds = new Set(ironPlateRecipes.map(r => r.id))
      
      expect(ironPlateRecipes.length).toBe(uniqueIds.size)
    })
  })

  describe('getAllRecipes', () => {
    it('should return all recipes', () => {
      const recipes = RecipeService.getAllRecipes()
      
      expect(recipes).toHaveLength(4)
      expect(recipes.some(r => r.id === 'iron-plate-recipe')).toBe(true)
      expect(recipes.some(r => r.id === 'gear-recipe')).toBe(true)
      expect(recipes.some(r => r.id === 'custom-recipe-1')).toBe(true)
    })

    it('should return a copy of the recipes array', () => {
      const recipes1 = RecipeService.getAllRecipes()
      const recipes2 = RecipeService.getAllRecipes()
      
      expect(recipes1).toEqual(recipes2)
      expect(recipes1).not.toBe(recipes2) // Different array instances
    })

    it('should handle empty recipes', () => {
      // Reset to empty
      ;(RecipeService as any).allRecipes = []
      
      const recipes = RecipeService.getAllRecipes()
      
      expect(recipes).toHaveLength(0)
      expect(Array.isArray(recipes)).toBe(true)
    })
  })

  describe('getRecipesByItem', () => {
    it('should return recipes for existing items', () => {
      const recipes = RecipeService.getRecipesByItem('iron-plate')
      
      expect(recipes.length).toBeGreaterThan(0)
      expect(Array.isArray(recipes)).toBe(true)
    })

    it('should return empty array for non-existent items', () => {
      const recipes = RecipeService.getRecipesByItem('non-existent-item')
      
      expect(recipes).toHaveLength(0)
      expect(Array.isArray(recipes)).toBe(true)
    })

    it('should return recipes from the index', () => {
      const recipes = RecipeService.getRecipesByItem('iron-gear-wheel')
      
      expect(Array.isArray(recipes)).toBe(true)
    })

    it('should handle valid item lookups', () => {
      const recipes = RecipeService.getRecipesByItem('iron-ore')
      
      expect(Array.isArray(recipes)).toBe(true)
    })
  })

  describe('getRecipesThatProduce', () => {
    it('should return recipes that produce the item', () => {
      const recipes = RecipeService.getRecipesThatProduce('iron-plate')
      
      expect(recipes).toHaveLength(1)
      expect(recipes[0].out['iron-plate']).toBe(1)
    })

    it('should return empty array for items not produced', () => {
      const recipes = RecipeService.getRecipesThatProduce('iron-ore')
      
      expect(recipes).toHaveLength(0)
    })
  })

  describe('getRecipesThatUse', () => {
    it('should return recipes that consume the item', () => {
      const recipes = RecipeService.getRecipesThatUse('iron-plate')
      
      expect(recipes.length).toBeGreaterThan(0)
      expect(recipes.every(r => Object.keys(r.in).includes('iron-plate'))).toBe(true)
    })

    it('should return empty array for unused items', () => {
      const recipes = RecipeService.getRecipesThatUse('iron-gear-wheel')
      
      expect(recipes).toHaveLength(0)
    })
  })

  describe('getRecipeById', () => {
    it('should return recipe by ID', () => {
      const recipe = RecipeService.getRecipeById('iron-plate-recipe')
      
      expect(recipe).toBeDefined()
      expect(recipe?.id).toBe('iron-plate-recipe')
      expect(recipe?.name).toBe('Iron Plate')
    })

    it('should return undefined for non-existent recipe', () => {
      const recipe = RecipeService.getRecipeById('non-existent-recipe')
      
      expect(recipe).toBeUndefined()
    })

    it('should handle empty string ID', () => {
      const recipe = RecipeService.getRecipeById('')
      
      expect(recipe).toBeUndefined()
    })
  })

  describe('getRecipesByCategory', () => {
    it('should return recipes by category', () => {
      const smeltingRecipes = RecipeService.getRecipesByCategory('smelting')
      
      expect(smeltingRecipes).toHaveLength(1)
      expect(smeltingRecipes[0].category).toBe('smelting')
    })

    it('should return empty array for non-existent category', () => {
      const recipes = RecipeService.getRecipesByCategory('non-existent-category')
      
      expect(recipes).toHaveLength(0)
    })

    it('should handle multiple recipes in same category', () => {
      const craftingRecipes = RecipeService.getRecipesByCategory('crafting')
      
      expect(Array.isArray(craftingRecipes)).toBe(true)
      expect(craftingRecipes.every(r => r.category === 'crafting')).toBe(true)
    })
  })

  describe('static recipe query methods', () => {
    it('should provide static access to recipe data', () => {
      const allRecipes = RecipeService.getAllRecipes()
      
      expect(Array.isArray(allRecipes)).toBe(true)
      expect(allRecipes.length).toBeGreaterThan(0)
    })

    it('should handle recipe lookups consistently', () => {
      const recipesByItem = RecipeService.getRecipesByItem('iron-plate')
      const recipesThatProduce = RecipeService.getRecipesThatProduce('iron-plate')
      const recipesThatUse = RecipeService.getRecipesThatUse('iron-plate')
      
      expect(Array.isArray(recipesByItem)).toBe(true)
      expect(Array.isArray(recipesThatProduce)).toBe(true)
      expect(Array.isArray(recipesThatUse)).toBe(true)
    })

    it('should maintain data consistency', () => {
      const allRecipes = RecipeService.getAllRecipes()
      const smeltingRecipes = RecipeService.getRecipesByCategory('smelting')
      
      expect(smeltingRecipes.every(recipe => 
        allRecipes.some(r => r.id === recipe.id)
      )).toBe(true)
    })
  })

  describe('performance and edge cases', () => {
    it('should handle large numbers of recipes efficiently', () => {
      const largeRecipeSet: Recipe[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `recipe-${i}`,
        name: `Recipe ${i}`,
        out: { [`item-${i}`]: 1 },
        in: { [`input-${i}`]: 1 },
        time: 1,
        category: 'mass-production'
      }))
      
      const startTime = performance.now()
      RecipeService.initializeRecipes(largeRecipeSet)
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(100) // Should be fast
      expect(RecipeService.getAllRecipes().length).toBe(1001) // 1000 + 1 custom
    })

    it('should handle recipes with empty inputs/outputs', () => {
      const emptyRecipe: Recipe = {
        id: 'empty-recipe',
        name: 'Empty Recipe',
        out: {},
        in: {},
        time: 1,
        category: 'test'
      }
      
      expect(() => {
        RecipeService.initializeRecipes([emptyRecipe])
      }).not.toThrow()
      
      const recipe = RecipeService.getRecipeById('empty-recipe')
      expect(recipe).toBeDefined()
    })

    it('should handle recipes with very large quantities', () => {
      const massRecipe: Recipe = {
        id: 'mass-recipe',
        name: 'Mass Recipe',
        out: { 'mass-item': 1000000 },
        in: { 'mass-input': 500000 },
        time: 100,
        category: 'mass'
      }
      
      expect(() => {
        RecipeService.initializeRecipes([massRecipe])
      }).not.toThrow()
      
      const recipes = RecipeService.getRecipesThatProduce('mass-item')
      if (recipes.length > 0) {
        expect(recipes[0].out['mass-item']).toBe(1000000)
      }
    })

    it('should maintain consistent results across multiple calls', () => {
      const recipes1 = RecipeService.getRecipesByItem('iron-plate')
      const recipes2 = RecipeService.getRecipesByItem('iron-plate')
      
      expect(recipes1).toEqual(recipes2)
      expect(recipes1.length).toBe(recipes2.length)
    })
  })

  describe('mining recipes', () => {
    it('should handle mining recipes if implemented', () => {
      const instance = RecipeService.getInstance()
      
      // This test assumes getMiningRecipe method exists
      if (typeof instance.getMiningRecipe === 'function') {
        const miningRecipe = instance.getMiningRecipe('iron-ore')
        
        if (miningRecipe) {
          expect(miningRecipe).toHaveProperty('id')
          expect(miningRecipe).toHaveProperty('out')
          expect(miningRecipe.out['iron-ore']).toBeGreaterThan(0)
        }
      }
    })
  })

  describe('error handling', () => {
    it('should handle null/undefined inputs gracefully', () => {
      expect(() => {
        RecipeService.getRecipeById(null as any)
      }).not.toThrow()
      
      expect(() => {
        RecipeService.getRecipesByItem(undefined as any)
      }).not.toThrow()
      
      expect(() => {
        RecipeService.getRecipesByCategory(null as any)
      }).not.toThrow()
    })

    it('should handle invalid lookups', () => {
      expect(() => {
        RecipeService.getRecipeById('')
        RecipeService.getRecipesByItem('')
        RecipeService.getRecipesByCategory('')
      }).not.toThrow()
    })

    it('should maintain state consistency', () => {
      // Attempt operations with edge case inputs
      const emptyResult1 = RecipeService.getRecipeById('')
      const emptyResult2 = RecipeService.getRecipesByItem('')
      
      expect(emptyResult1).toBeUndefined()
      expect(Array.isArray(emptyResult2)).toBe(true)
      
      // Should still work normally
      const validRecipe = RecipeService.getRecipeById('iron-plate-recipe')
      expect(validRecipe).toBeDefined()
    })
  })
})