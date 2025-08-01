import { useState, useEffect, useMemo } from 'react';
import type { Item, Recipe } from '@/types/index';
import { DataService } from '@/services/core/DataService';
import { RecipeService } from '@/services/crafting/RecipeService';
import ManualCraftingValidator from '@/utils/manualCraftingValidator';

export const useItemRecipes = (item: Item) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [usedInRecipes, setUsedInRecipes] = useState<Recipe[]>([]);
  const [manualCraftableRecipes, setManualCraftableRecipes] = useState<Recipe[]>([]);
  const [restrictedRecipes, setRestrictedRecipes] = useState<Recipe[]>([]);
  const [producerRecipes, setProducerRecipes] = useState<Recipe[]>([]);

  const dataService = DataService.getInstance();
  const validator = ManualCraftingValidator.getInstance();

  // 性能优化：使用useMemo缓存昂贵的计算
  const { recipes: memoizedRecipes, usedInRecipes: memoizedUsedInRecipes } = useMemo(() => {
    if (!item) {
      return { recipes: [], usedInRecipes: [] };
    }

    const itemRecipes = RecipeService.getRecipesThatProduce(item.id);
    const usageRecipes = RecipeService.getRecipesThatUse(item.id);

    // 恢复解锁过滤，但优化性能
    const isProducerUnlocked = (recipe: Recipe) => {
      if (!recipe.producers || recipe.producers.length === 0) return true;
      return recipe.producers.some((pid: string) => dataService.isItemUnlocked(pid));
    };

    const isOutputUnlocked = (recipe: Recipe) => {
      return Object.keys(recipe.out).every(itemId => dataService.isItemUnlocked(itemId));
    };

    const filteredRecipes = itemRecipes.filter(isProducerUnlocked);
    const filteredUsageRecipes = usageRecipes.filter(
      recipe => isProducerUnlocked(recipe) && isOutputUnlocked(recipe)
    );

    return {
      recipes: filteredRecipes,
      usedInRecipes: filteredUsageRecipes,
    };
  }, [item, dataService]); // 包含dataService依赖

  // 进一步优化：分类配方计算也使用useMemo
  const { manualCraftable, restricted, producer } = useMemo(() => {
    if (!memoizedRecipes.length) {
      return { manualCraftable: [], restricted: [], producer: [] };
    }

    // 性能优化：减少重复的验证调用
    const recipeValidations = memoizedRecipes.map(recipe => ({
      recipe,
      validation: validator.validateRecipe(recipe),
    }));

    const manualCraftable = recipeValidations
      .filter(({ validation }) => validation.canCraftManually)
      .map(({ recipe }) => recipe);

    const restricted = recipeValidations
      .filter(
        ({ validation }) => !validation.canCraftManually && validation.category === 'restricted'
      )
      .map(({ recipe }) => recipe);

    const producer = recipeValidations
      .filter(
        ({ recipe, validation }) =>
          !validation.canCraftManually && recipe.producers && recipe.producers.length > 0
      )
      .map(({ recipe }) => recipe);

    return { manualCraftable, restricted, producer };
  }, [memoizedRecipes, validator]);

  useEffect(() => {
    setRecipes(memoizedRecipes);
    setUsedInRecipes(memoizedUsedInRecipes);
    setManualCraftableRecipes(manualCraftable);
    setRestrictedRecipes(restricted);
    setProducerRecipes(producer);
  }, [memoizedRecipes, memoizedUsedInRecipes, manualCraftable, restricted, producer]);

  return {
    recipes,
    usedInRecipes,
    manualCraftableRecipes,
    restrictedRecipes,
    producerRecipes,
    hasFacilityRecipes: producerRecipes.length > 0,
  };
};
