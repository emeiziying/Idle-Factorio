/**
 * 手动制作验证器接口
 * 用于解耦 RecipeService 和 ManualCraftingValidator 之间的循环依赖
 */

import type { Recipe } from '@/types/index';

export interface ManualCraftingValidation {
  canCraftManually: boolean;
  category: string;
  reason: string;
  message?: string;
}

export interface RecipeValidation {
  canCraftManually: boolean;
  category: string;
  reason: string;
  message?: string;
}

export interface IManualCraftingValidator {
  validateManualCrafting(itemId: string): ManualCraftingValidation;
  validateRecipe(recipe: Recipe): RecipeValidation;
  isEntityMiningRecipe(recipe: Recipe): boolean;
}
