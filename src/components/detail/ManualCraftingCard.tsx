import CraftingButtons from '@/components/detail/CraftingButtons';
import RecipeFlowDisplay from '@/components/detail/RecipeFlowDisplay';
import { useRecipeService } from '@/hooks/useDIServices';
import { useManualCraftingStatus } from '@/hooks/useManualCraftingStatus';
import useGameStore from '@/store/gameStore';
import type { Item, Recipe } from '@/types/index';
import { Box, Typography } from '@mui/material';
import React from 'react';

interface ManualCraftingCardProps {
  item: Item;
  onManualCraft: (itemId: string, quantity: number, recipe?: Recipe) => void;
  onItemSelect?: (item: Item) => void;
}

const ManualCraftingCard: React.FC<ManualCraftingCardProps> = ({
  item,
  onManualCraft,
  onItemSelect,
}) => {
  const { getInventoryItem } = useGameStore();
  const recipeService = useRecipeService();
  const manualCraftingStatus = useManualCraftingStatus(item);

  // 获取手动制作信息
  const manualCraftingInfo = recipeService.getManualCraftingInfo(item.id);
  const recipe = manualCraftingInfo?.recipe;

  // 如果不能手动制作，不显示组件
  if (!manualCraftingStatus.canCraft || !recipe) {
    return null;
  }

  // 检查材料是否充足
  const hasInputMaterials = Object.keys(recipe.in).length > 0;
  const isMiningRecipe = recipe.flags?.includes('mining');

  let canCraft = true;
  if (hasInputMaterials && !isMiningRecipe) {
    canCraft = Object.entries(recipe.in).every(([itemId, required]) => {
      const available = getInventoryItem(itemId).currentAmount;
      return available >= required;
    });
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ pb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography
          variant="subtitle2"
          gutterBottom
          sx={{
            fontSize: '0.9rem',
            fontWeight: 600,
            color: manualCraftingStatus.color,
            mb: 1.5,
          }}
        >
          {manualCraftingStatus.title}
        </Typography>

        <Box sx={{ mb: 1.5 }}>
          <RecipeFlowDisplay
            recipe={recipe}
            themeColor="primary.main"
            showTime={true}
            iconSize={32}
            onItemSelect={onItemSelect}
            customTime={recipe.time}
          />
        </Box>

        <CraftingButtons
          onCraft={quantity => onManualCraft(item.id, quantity, recipe)}
          disabled={!canCraft}
          variant={canCraft ? 'contained' : 'outlined'}
        />
      </Box>
    </Box>
  );
};

export default ManualCraftingCard;
