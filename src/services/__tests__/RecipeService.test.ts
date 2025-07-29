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
      const instance = RecipeService.getInstance()
      
      // Test finding recipes by output item
      const ironPlateRecipes = instance.getRecipesByItem('iron-plate')
      expect(ironPlateRecipes).toHaveLength(1)
      expect(ironPlateRecipes[0].id).toBe('iron-plate-recipe')
      
      // Test finding recipes by input item
      const recipesUsingIronOre = instance.getRecipesByItem('iron-ore')
      expect(recipesUsingIronOre.some(r => r.id === 'iron-plate-recipe')).toBe(true)
    })

    it('should handle multiple outputs correctly', () => {
      const instance = RecipeService.getInstance()
      
      const itemARecipes = instance.getRecipesByItem('item-a')
      const itemBRecipes = instance.getRecipesByItem('item-b')
      
      expect(itemARecipes).toHaveLength(1)
      expect(itemBRecipes).toHaveLength(1)
      expect(itemARecipes[0].id).toBe('multi-output-recipe')
      expect(itemBRecipes[0].id).toBe('multi-output-recipe')
    })

    it('should avoid duplicate recipes in index', () => {
      const instance = RecipeService.getInstance()
      
      // A recipe that uses iron-plate as input shouldn't appear twice
      const ironPlateRecipes = instance.getRecipesByItem('iron-plate')
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
      const instance = RecipeService.getInstance()
      
      const recipes = instance.getRecipesByItem('iron-plate')
      
      expect(recipes.length).toBeGreaterThan(0)
      expect(recipes.every(r => 
        Object.keys(r.out).includes('iron-plate') || 
        Object.keys(r.in).includes('iron-plate')
      )).toBe(true)
    })

    it('should return empty array for non-existent items', () => {
      const instance = RecipeService.getInstance()
      
      const recipes = instance.getRecipesByItem('non-existent-item')
      
      expect(recipes).toHaveLength(0)
      expect(Array.isArray(recipes)).toBe(true)
    })

    it('should return recipes that produce the item', () => {
      const instance = RecipeService.getInstance()
      
      const recipes = instance.getRecipesByItem('iron-gear-wheel')
      
      expect(recipes).toHaveLength(1)
      expect(recipes[0].out['iron-gear-wheel']).toBe(1)
    })

    it('should return recipes that consume the item', () => {
      const instance = RecipeService.getInstance()
      
      const recipes = instance.getRecipesByItem('iron-ore')
      
      expect(recipes.some(r => Object.keys(r.in).includes('iron-ore'))).toBe(true)
    })
  })

  describe('getRecipe', () => {
    it('should return recipe by ID', () => {
      const instance = RecipeService.getInstance()
      
      const recipe = instance.getRecipe('iron-plate-recipe')
      
      expect(recipe).toBeDefined()
      expect(recipe?.id).toBe('iron-plate-recipe')
      expect(recipe?.name).toBe('Iron Plate')
    })

    it('should return undefined for non-existent recipe', () => {
      const instance = RecipeService.getInstance()
      
      const recipe = instance.getRecipe('non-existent-recipe')
      
      expect(recipe).toBeUndefined()
    })

    it('should handle empty string ID', () => {
      const instance = RecipeService.getInstance()
      
      const recipe = instance.getRecipe('')
      
      expect(recipe).toBeUndefined()
    })
  })

  describe('getRecipesByCategory', () => {
    it('should return recipes by category', () => {
      const instance = RecipeService.getInstance()
      
      const smeltingRecipes = instance.getRecipesByCategory('smelting')
      
      expect(smeltingRecipes).toHaveLength(1)
      expect(smeltingRecipes[0].category).toBe('smelting')
    })

    it('should return empty array for non-existent category', () => {
      const instance = RecipeService.getInstance()
      
      const recipes = instance.getRecipesByCategory('non-existent-category')
      
      expect(recipes).toHaveLength(0)
    })

    it('should handle multiple recipes in same category', () => {
      // Add another crafting recipe for testing
      const additionalRecipe: Recipe = {
        id: 'another-crafting-recipe',
        name: 'Another Crafting',
        out: { 'test-item': 1 },
        in: { 'input-item': 1 },
        time: 1,
        category: 'crafting'
      }
      
      ;(RecipeService as any).allRecipes.push(additionalRecipe)
      
      const instance = RecipeService.getInstance()
      const craftingRecipes = instance.getRecipesByCategory('crafting')
      
      expect(craftingRecipes.length).toBeGreaterThan(1)
      expect(craftingRecipes.every(r => r.category === 'crafting')).toBe(true)
    })
  })

  describe('getProductionRecipes', () => {
    it('should return recipes that produce the item', () => {
      const instance = RecipeService.getInstance()
      
      const recipes = instance.getProductionRecipes('iron-plate')
      
      expect(recipes).toHaveLength(1)
      expect(recipes[0].out['iron-plate']).toBe(1)
    })

    it('should not return recipes that only consume the item', () => {
      const instance = RecipeService.getInstance()
      
      const recipes = instance.getProductionRecipes('iron-ore')
      
      // iron-ore should not have production recipes in our test data
      expect(recipes).toHaveLength(0)
    })

    it('should handle items with multiple production recipes', () => {
      // Add another recipe that produces iron-plate
      const alternativeRecipe: Recipe = {
        id: 'alternative-iron-plate',
        name: 'Alternative Iron Plate',
        out: { 'iron-plate': 2 },
        in: { 'iron-ore': 2, 'coal': 1 },
        time: 5,
        category: 'advanced-smelting'
      }
      
      ;(RecipeService as any).allRecipes.push(alternativeRecipe)
      ;(RecipeService as any).buildRecipeIndex()
      
      const instance = RecipeService.getInstance()
      const recipes = instance.getProductionRecipes('iron-plate')
      
      expect(recipes.length).toBeGreaterThan(1)
      expect(recipes.every(r => Object.keys(r.out).includes('iron-plate'))).toBe(true)
    })
  })

  describe('getConsumptionRecipes', () => {
    it('should return recipes that consume the item', () => {
      const instance = RecipeService.getInstance()
      
      const recipes = instance.getConsumptionRecipes('iron-plate')
      
      expect(recipes.length).toBeGreaterThan(0)
      expect(recipes.every(r => Object.keys(r.in).includes('iron-plate'))).toBe(true)
    })

    it('should not return recipes that only produce the item', () => {
      const instance = RecipeService.getInstance()
      
      const recipes = instance.getConsumptionRecipes('iron-gear-wheel')
      
      // iron-gear-wheel should not have consumption recipes in our test data
      expect(recipes).toHaveLength(0)
    })

    it('should handle items used in multiple recipes', () => {
      // Add another recipe that uses iron-plate
      const anotherRecipe: Recipe = {
        id: 'another-iron-plate-user',
        name: 'Another Iron Plate User',
        out: { 'complex-item': 1 },
        in: { 'iron-plate': 3, 'copper-plate': 2 },
        time: 2,
        category: 'crafting'
      }
      
      ;(RecipeService as any).allRecipes.push(anotherRecipe)
      ;(RecipeService as any).buildRecipeIndex()
      
      const instance = RecipeService.getInstance()
      const recipes = instance.getConsumptionRecipes('iron-plate')
      
      expect(recipes.length).toBeGreaterThan(1)
      expect(recipes.every(r => Object.keys(r.in).includes('iron-plate'))).toBe(true)
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
      
      const instance = RecipeService.getInstance()
      const recipe = instance.getRecipe('empty-recipe')
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
      
      const instance = RecipeService.getInstance()
      const recipes = instance.getProductionRecipes('mass-item')
      expect(recipes[0].out['mass-item']).toBe(1000000)
    })

    it('should maintain consistent results across multiple calls', () => {
      const instance = RecipeService.getInstance()
      
      const recipes1 = instance.getRecipesByItem('iron-plate')
      const recipes2 = instance.getRecipesByItem('iron-plate')
      
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
      const instance = RecipeService.getInstance()
      
      expect(() => {
        instance.getRecipe(null as any)
      }).not.toThrow()
      
      expect(() => {
        instance.getRecipesByItem(undefined as any)
      }).not.toThrow()
      
      expect(() => {
        instance.getRecipesByCategory(null as any)
      }).not.toThrow()
    })

    it('should handle initialization with invalid recipes', () => {
      const invalidRecipes = [
        null,
        undefined,
        { id: null, name: 'Invalid' },
        { name: 'No ID' }
      ] as any[]
      
      expect(() => {
        RecipeService.initializeRecipes(invalidRecipes)
      }).not.toThrow()
    })

    it('should maintain state after errors', () => {
      const instance = RecipeService.getInstance()
      
      // Attempt invalid operations
      instance.getRecipe(null as any)
      instance.getRecipesByItem(undefined as any)
      
      // Should still work normally
      const validRecipe = instance.getRecipe('iron-plate-recipe')
      expect(validRecipe).toBeDefined()
    })
  })
})