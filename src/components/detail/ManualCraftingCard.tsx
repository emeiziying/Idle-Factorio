import CraftingButtons from '@/components/detail/CraftingButtons';
import RecipeFlowDisplay from '@/components/detail/RecipeFlowDisplay';
import { useRecipeService, useDependencyService } from '@/hooks/useDIServices';
import { useCrafting } from '@/hooks/useCrafting';
import { useManualCraftingStatus } from '@/hooks/useManualCraftingStatus';
import useGameStore from '@/store/gameStore';
import type { Item } from '@/types/index';
import { Box, Typography } from '@mui/material';
import React, { useMemo } from 'react';

interface ManualCraftingCardProps {
  item: Item;
  onItemSelect?: (item: Item) => void;
}

const ManualCraftingCard: React.FC<ManualCraftingCardProps> = ({
  item,
  onItemSelect,
}) => {
  const { getInventoryItem, inventory } = useGameStore();
  const recipeService = useRecipeService();
  const dependencyService = useDependencyService();
  const { handleManualCraft } = useCrafting();
  const manualCraftingStatus = useManualCraftingStatus(item);

  // 获取手动制作信息
  const manualCraftingInfo = recipeService.getManualCraftingInfo(item.id);
  const recipe = manualCraftingInfo?.recipe;

  // 检查材料是否充足或可以链式合成
  const canCraft = useMemo(() => {
    if (!recipe) return false;
    
    const hasInputMaterials = Object.keys(recipe.in).length > 0;
    const isMiningRecipe = recipe.flags?.includes('mining');

    if (!hasInputMaterials || isMiningRecipe) {
      return true;
    }

    // 首先检查直接制作是否可行
    const canCraftDirectly = Object.entries(recipe.in).every(([itemId, required]) => {
      const available = getInventoryItem(itemId).currentAmount;
      return available >= required;
    });

    if (canCraftDirectly) {
      return true;
    }

    // 如果直接制作不可行，检查是否可以链式合成
    const chainAnalysis = dependencyService.analyzeCraftingChain(item.id, 1, inventory);
    return chainAnalysis !== null;
  }, [recipe, getInventoryItem, dependencyService, item.id, inventory]);

  // 如果不能手动制作，不显示组件
  if (!manualCraftingStatus.canCraft || !recipe) {
    return null;
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
          onCraft={quantity => handleManualCraft(item.id, quantity, recipe)}
          disabled={!canCraft}
          variant={canCraft ? 'contained' : 'outlined'}
        />
      </Box>
    </Box>
  );
};

export default ManualCraftingCard;
