import React from 'react';
import {
  Box,
  Typography,
  Alert
} from '@mui/material';
import type { Item, Recipe } from '../../types/index';
import { RecipeService } from '../../services/core/RecipeService';
import ManualCraftingValidator from '../../utils/manualCraftingValidator';
import UnifiedRecipeCard from './UnifiedRecipeCard';

interface ManualCraftingFlowCardProps {
  item: Item;
  onManualCraft: (itemId: string, quantity: number, recipe?: Recipe) => void;
}

const ManualCraftingFlowCard: React.FC<ManualCraftingFlowCardProps> = ({ item, onManualCraft }) => {
  const validator = ManualCraftingValidator.getInstance();

  const itemRecipes = RecipeService.getRecipesThatProduce(item.id);
  
  // 使用验证器检查哪些配方可以手动制作
  const recipeValidations = itemRecipes.map(recipe => ({
    recipe,
    validation: validator.validateRecipe(recipe)
  }));
  
  const manualCraftableRecipes = recipeValidations
    .filter(({ validation }) => validation.canCraftManually)
    .map(({ recipe }) => recipe);

  const restrictedRecipes = recipeValidations
    .filter(({ validation }) => !validation.canCraftManually && validation.category === 'restricted')
    .map(({ recipe }) => recipe);

  // 如果有可手动制作的配方，显示第一个
  if (manualCraftableRecipes.length > 0) {
    const recipe = manualCraftableRecipes[0];
    
    return (
      <UnifiedRecipeCard
        recipe={recipe}
        variant="manual"
        title="手动合成"
        onCraft={(recipe, quantity) => onManualCraft(item.id, quantity, recipe)}
      />
    );
  }

  // 如果没有可手动制作的配方，但有需要特定生产者的配方，显示提示
  if (restrictedRecipes.length > 0) {
    const recipe = restrictedRecipes[0];
    const validation = validator.validateRecipe(recipe);
    
    return (
      <Box sx={{ mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle2" fontWeight="bold" color="warning.main">
            需要生产设备
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {recipe.time}秒
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            {validation.reason}
          </Typography>
          {recipe.producers && recipe.producers.length > 0 && (
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
              需要设备: {recipe.producers.join(', ')}
            </Typography>
          )}
        </Alert>

        {/* 使用统一组件显示配方，但禁用制作 */}
        <UnifiedRecipeCard
          recipe={recipe}
          variant="manual"
          title="手动合成"
          onCraft={(recipe, quantity) => onManualCraft(item.id, quantity, recipe)}
          disabled={true}
        />

        {/* 提示：需要在设施模块中生产 */}
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            请在设施模块中配置相应的生产设备来制作此物品。
          </Typography>
        </Box>
      </Box>
    );
  }

  // 如果没有任何配方，显示默认信息
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" color="text.secondary">
        此物品没有可用的制作配方。
      </Typography>
    </Box>
  );
};

export default ManualCraftingFlowCard; 