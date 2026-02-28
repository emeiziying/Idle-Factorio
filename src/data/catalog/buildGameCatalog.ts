import type { Category, GameData, Item, Recipe } from '@/types';

import type { GameCatalog } from '@/data/catalog/GameCatalog';

export const buildGameCatalog = (data: GameData): GameCatalog => {
  const itemsById = new Map<string, Item>();
  const recipesById = new Map<string, Recipe>();
  const recipesByOutput = new Map<string, Recipe[]>();
  const categoriesById = new Map<string, Category>();

  data.items.forEach(item => {
    itemsById.set(item.id, item);
  });

  data.recipes.forEach(recipe => {
    recipesById.set(recipe.id, recipe);
    Object.keys(recipe.out || {}).forEach(itemId => {
      const recipes = recipesByOutput.get(itemId) || [];
      recipes.push(recipe);
      recipesByOutput.set(itemId, recipes);
    });
  });

  data.categories.forEach(category => {
    categoriesById.set(category.id, category);
  });

  return {
    data,
    itemsById,
    recipesById,
    recipesByOutput,
    categoriesById,
  };
};
