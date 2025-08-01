// 配方管理切片
import type { SliceCreator, RecipeSlice } from '../types';
import type { Recipe } from '../../types/index';
import { RecipeService } from '../../services/RecipeService';

export const createRecipeSlice: SliceCreator<RecipeSlice> = (set, get) => ({
  // 初始状态
  favoriteRecipes: new Set(),
  recentRecipes: [],
  maxRecentRecipes: 10,

  // 配方相关 Actions
  addFavoriteRecipe: (recipeId: string) => {
    set((state) => {
      const newFavorites = new Set(state.favoriteRecipes);
      newFavorites.add(recipeId);
      return { favoriteRecipes: newFavorites };
    });
  },

  removeFavoriteRecipe: (recipeId: string) => {
    set((state) => {
      const newFavorites = new Set(state.favoriteRecipes);
      newFavorites.delete(recipeId);
      return { favoriteRecipes: newFavorites };
    });
  },

  isFavoriteRecipe: (recipeId: string) => {
    return get().favoriteRecipes.has(recipeId);
  },

  addRecentRecipe: (recipeId: string) => {
    set((state) => {
      const newRecent = [recipeId, ...state.recentRecipes.filter(id => id !== recipeId)];
      return {
        recentRecipes: newRecent.slice(0, state.maxRecentRecipes)
      };
    });
  },

  getRecentRecipes: () => {
    const recentIds = get().recentRecipes;
    return recentIds
      .map(id => RecipeService.getRecipeById(id))
      .filter((recipe): recipe is Recipe => recipe !== undefined);
  },

  getFavoriteRecipes: () => {
    const favoriteIds = Array.from(get().favoriteRecipes);
    return favoriteIds
      .map(id => RecipeService.getRecipeById(id))
      .filter((recipe): recipe is Recipe => recipe !== undefined);
  },

  getRecommendedRecipes: (itemId: string) => {
    const recipes = RecipeService.getRecipesThatProduce(itemId);
    const mostEfficient = RecipeService.getMostEfficientRecipe(itemId);
    
    if (mostEfficient) {
      // 将最高效率配方放在第一位
      return [
        mostEfficient,
        ...recipes.filter(r => r.id !== mostEfficient.id)
      ];
    }
    
    return recipes;
  },

  getRecipeStats: (itemId: string) => {
    return RecipeService.getRecipeStats(itemId);
  },

  searchRecipes: (query: string) => {
    return RecipeService.searchRecipes(query);
  },
});