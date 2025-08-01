import { useMemo } from 'react';
import type { Item } from '../types/index';
import { RecipeService } from '../services/crafting/RecipeService';
import ManualCraftingValidator from '../utils/manualCraftingValidator';

export interface ManualCraftingStatus {
  title: string;
  color: string;
  canCraft: boolean;
  hasRecipes: boolean;
}

export const useManualCraftingStatus = (item: Item): ManualCraftingStatus => {
  return useMemo(() => {
    const itemRecipes = RecipeService.getRecipesThatProduce(item.id);
    const validator = ManualCraftingValidator.getInstance();

    // 如果没有配方（原材料）
    if (itemRecipes.length === 0) {
      return {
        title: '手动合成',
        color: 'text.primary',
        canCraft: true,
        hasRecipes: false,
      };
    }

    // 检查配方验证状态
    const recipeValidations = itemRecipes.map(recipe => ({
      recipe,
      validation: validator.validateRecipe(recipe),
    }));

    const manualCraftableRecipes = recipeValidations.filter(
      ({ validation }) => validation.canCraftManually
    );

    const restrictedRecipes = recipeValidations.filter(
      ({ validation }) => !validation.canCraftManually && validation.category === 'restricted'
    );

    // 如果有可手动制作的配方
    if (manualCraftableRecipes.length > 0) {
      return {
        title: '手动合成',
        color: 'text.primary',
        canCraft: true,
        hasRecipes: true,
      };
    }

    // 如果需要生产设备
    if (restrictedRecipes.length > 0) {
      return {
        title: '需要生产设备',
        color: 'warning.main',
        canCraft: false,
        hasRecipes: true,
      };
    }

    // 默认情况
    return {
      title: '手动合成',
      color: 'text.primary',
      canCraft: false,
      hasRecipes: false,
    };
  }, [item.id]);
};
