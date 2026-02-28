// 配方管理切片
import type { SliceCreator, RecipeSlice } from '@/store/types';
import type { Recipe } from '@/types/index';
import { getStoreRecipeQuery } from '@/store/storeRuntimeServices';

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
    const recipeService = getStoreRecipeQuery();
    const recentIds = get().recentRecipes;
    return recentIds
      .map(id => recipeService.getRecipeById(id))
      .filter((recipe): recipe is Recipe => recipe !== undefined);
  },

  getFavoriteRecipes: () => {
    const recipeService = getStoreRecipeQuery();
    const favoriteIds = Array.from(get().favoriteRecipes);
    return favoriteIds
      .map(id => recipeService.getRecipeById(id))
      .filter((recipe): recipe is Recipe => recipe !== undefined);
  },

  getRecommendedRecipes: (itemId: string) => {
    const recipeService = getStoreRecipeQuery();
    // 只返回科技系统已解锁的配方，避免 UI 展示未解锁内容
    const recipes = recipeService.getUnlockedRecipesThatProduce(itemId);
    const mostEfficient = recipeService.getUnlockedMostEfficientRecipe(itemId);

    if (mostEfficient) {
      // 将最高效率配方放在第一位
      return [mostEfficient, ...recipes.filter((r: Recipe) => r.id !== mostEfficient.id)];
    }

    return recipes;
  },

  getRecipeStats: (itemId: string) => {
    const recipeService = getStoreRecipeQuery();
    return recipeService.getRecipeStats(itemId);
  },

  searchRecipes: (query: string) => {
    const recipeService = getStoreRecipeQuery();
    return recipeService.searchRecipes(query);
  },
});
