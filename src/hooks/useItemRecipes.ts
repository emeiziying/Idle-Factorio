import { useState, useEffect } from 'react';
import type { Item, Recipe } from '../types/index';
import { DataService } from '../services/DataService';
import { RecipeService } from '../services/RecipeService';
import ManualCraftingValidator from '../utils/manualCraftingValidator';

export const useItemRecipes = (item: Item) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [usedInRecipes, setUsedInRecipes] = useState<Recipe[]>([]);
  const [manualCraftableRecipes, setManualCraftableRecipes] = useState<Recipe[]>([]);
  const [restrictedRecipes, setRestrictedRecipes] = useState<Recipe[]>([]);
  const [producerRecipes, setProducerRecipes] = useState<Recipe[]>([]);
  
  const dataService = DataService.getInstance();
  const validator = ManualCraftingValidator.getInstance();

  useEffect(() => {
    if (item) {
      const itemRecipes = RecipeService.getRecipesThatProduce(item.id);
      const usageRecipes = RecipeService.getRecipesThatUse(item.id);
      
      // 过滤掉producers全部未解锁的配方
      const isProducerUnlocked = (recipe: Recipe) => {
        if (!recipe.producers || recipe.producers.length === 0) return true;
        return recipe.producers.some((pid: string) => dataService.isItemUnlocked(pid));
      };
      
      const filteredRecipes = itemRecipes.filter(isProducerUnlocked);
      const filteredUsageRecipes = usageRecipes.filter(isProducerUnlocked);
      
      setRecipes(filteredRecipes);
      setUsedInRecipes(filteredUsageRecipes);
      
      // 分类配方
      const recipeValidations = filteredRecipes.map(recipe => ({
        recipe,
        validation: validator.validateRecipe(recipe)
      }));
      
      const manualCraftable = recipeValidations
        .filter(({ validation }) => validation.canCraftManually)
        .map(({ recipe }) => recipe);
        
      const restricted = recipeValidations
        .filter(({ validation }) => !validation.canCraftManually && validation.category === 'restricted')
        .map(({ recipe }) => recipe);
        
      const producer = filteredRecipes.filter(recipe => {
        const validation = validator.validateRecipe(recipe);
        return !validation.canCraftManually && validation.category === 'restricted';
      });
      
      setManualCraftableRecipes(manualCraftable);
      setRestrictedRecipes(restricted);
      setProducerRecipes(producer);
    }
  }, [item, dataService]);

  return {
    recipes,
    usedInRecipes,
    manualCraftableRecipes,
    restrictedRecipes,
    producerRecipes
  };
}; 