import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import type { Recipe } from '../../types/index';
import FactorioIcon from '../common/FactorioIcon';
import { DataService } from '../../services/DataService';
import useGameStore from '../../store/gameStore';
import CraftingButtons from './CraftingButtons';
import RecipeFlowDisplay from './RecipeFlowDisplay';

interface UnifiedRecipeCardProps {
  recipe: Recipe;
  variant: 'normal' | 'manual' | 'producer';
  title?: string;
  onCraft: (recipe: Recipe, quantity: number) => void;
  disabled?: boolean;
  cardVariant?: 'contained' | 'outlined';
}

const UnifiedRecipeCard: React.FC<UnifiedRecipeCardProps> = ({
  recipe,
  variant,
  title,
  onCraft,
  disabled = false,
  cardVariant = 'contained',
}) => {
  const { getInventoryItem } = useGameStore();
  const dataService = DataService.getInstance();

  const getLocalizedItemName = (itemId: string): string => {
    return dataService.getLocalizedItemName(itemId);
  };

  const getThemeColor = () => {
    switch (variant) {
      case 'manual':
        return 'primary.main';
      case 'producer':
        return 'secondary.main';
      default:
        return 'text.primary';
    }
  };

  const themeColor = getThemeColor();

  // 检查是否可以制作
  const canCraft = Object.entries(recipe.in).every(([itemId, required]) => {
    const available = getInventoryItem(itemId).currentAmount;
    return available >= required;
  });

  const handleCraft = (quantity: number) => {
    onCraft(recipe, quantity);
  };

  return (
    <Box
      sx={{
        mb: 1.5,
        p: 1.5,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      {/* 标题 */}
      <Box display="flex" justifyContent="flex-start" alignItems="center" mb={1.5}>
        <Typography
          variant="subtitle2"
          fontWeight="bold"
          color={title ? 'primary.main' : themeColor}
        >
          {title || dataService.getLocalizedRecipeName(recipe.id)}
        </Typography>
      </Box>

      {/* 配方流程：使用独立组件 */}
      <Box sx={{ mb: 1.5 }}>
        <RecipeFlowDisplay recipe={recipe} themeColor={themeColor} showTime={true} iconSize={24} />
      </Box>

      {/* 生产者信息 - 移到配方流程下方 */}
      {variant === 'producer' && recipe.producers && recipe.producers.length > 0 && (
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" color="text.secondary">
            生产设备:
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1} mt={0.5}>
            {recipe.producers.map(producerId => (
              <Chip
                key={producerId}
                icon={<FactorioIcon itemId={producerId} size={24} />}
                label={getLocalizedItemName(producerId)}
                size="small"
                color="secondary"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      )}

      {/* 制作按钮 */}
      <CraftingButtons
        onCraft={handleCraft}
        disabled={disabled || !canCraft}
        variant={cardVariant}
      />
    </Box>
  );
};

export default UnifiedRecipeCard;
