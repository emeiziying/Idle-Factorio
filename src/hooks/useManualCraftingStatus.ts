import { useMemo } from 'react';
import type { Item, Recipe } from '@/types/index';
import { useRecipeService, useManualCraftingValidator } from '@/hooks/useServices';

export interface ManualCraftingStatus {
  title: string;
  color: string;
  canCraft: boolean;
  hasRecipes: boolean;
}

export const useManualCraftingStatus = (item: Item): ManualCraftingStatus => {
  const recipeService = useRecipeService();
  const validator = useManualCraftingValidator();
  
  return useMemo(() => {
    if (!recipeService || !validator) {
      return {
        title: '加载中...',
        color: '#666666',
        canCraft: false,
        hasRecipes: false,
      };
    }

    const itemRecipes = recipeService.getRecipesThatProduce(item.id);

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
    const recipeValidations = itemRecipes.map((recipe: Recipe) => ({
      recipe,
      validation: validator.validateRecipe(recipe),
    }));

    const manualCraftableRecipes = recipeValidations.filter(
      ({ validation }: { validation: any }) => validation.canCraftManually
    );

    const restrictedRecipes = recipeValidations.filter(
      ({ validation }: { validation: any }) => !validation.canCraftManually && validation.category === 'restricted'
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
  }, [item.id, recipeService, validator]);
};
