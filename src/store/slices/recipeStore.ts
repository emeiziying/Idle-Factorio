// 配方管理切片
import type { SliceCreator, RecipeSlice } from '@/store/types';
import type { Recipe } from '@/types/index';
import type { RecipeService } from '@/services/crafting/RecipeService';
import { getService } from '@/services/core/DIServiceInitializer';
import { SERVICE_TOKENS } from '@/services/core/ServiceTokens';

export const createRecipeSlice: SliceCreator<RecipeSlice> = (set, get) => ({
  // 初始状态
  favoriteRecipes: new Set(),
  recentRecipes: [],
  maxRecentRecipes: 10,

  // 配方相关 Actions
  addFavoriteRecipe: (recipeId: string) => {
    set(state => {
      const newFavorites = new Set(state.favoriteRecipes);
      newFavorites.add(recipeId);
      return { favoriteRecipes: newFavorites };
    });
  },

  removeFavoriteRecipe: (recipeId: string) => {
    set(state => {
      const newFavorites = new Set(state.favoriteRecipes);
      newFavorites.delete(recipeId);
      return { favoriteRecipes: newFavorites };
    });
  },

  isFavoriteRecipe: (recipeId: string) => {
    return get().favoriteRecipes.has(recipeId);
  },

  addRecentRecipe: (recipeId: string) => {
    set(state => {
      const newRecent = [recipeId, ...state.recentRecipes.filter(id => id !== recipeId)];
      return {
        recentRecipes: newRecent.slice(0, state.maxRecentRecipes),
      };
    });
  },

  getRecentRecipes: () => {
    const recipeService = getService<RecipeService>(SERVICE_TOKENS.RECIPE_SERVICE);
    const recentIds = get().recentRecipes;
    return recentIds
      .map(id => recipeService.getRecipeById(id))
      .filter((recipe): recipe is Recipe => recipe !== undefined);
  },

  getFavoriteRecipes: () => {
    const recipeService = getService<RecipeService>(SERVICE_TOKENS.RECIPE_SERVICE);
    const favoriteIds = Array.from(get().favoriteRecipes);
    return favoriteIds
      .map(id => recipeService.getRecipeById(id))
      .filter((recipe): recipe is Recipe => recipe !== undefined);
  },

  getRecommendedRecipes: (itemId: string) => {
    const recipeService = getService<RecipeService>(SERVICE_TOKENS.RECIPE_SERVICE);
    const recipes = recipeService.getRecipesThatProduce(itemId);
    const mostEfficient = recipeService.getMostEfficientRecipe(itemId);

    if (mostEfficient) {
      // 将最高效率配方放在第一位
      return [mostEfficient, ...recipes.filter((r: Recipe) => r.id !== mostEfficient.id)];
    }

    return recipes;
  },

  getRecipeStats: (itemId: string) => {
    const recipeService = getService<RecipeService>(SERVICE_TOKENS.RECIPE_SERVICE);
    return recipeService.getRecipeStats(itemId);
  },

  searchRecipes: (query: string) => {
    const recipeService = getService<RecipeService>(SERVICE_TOKENS.RECIPE_SERVICE);
    return recipeService.searchRecipes(query);
  },
});
