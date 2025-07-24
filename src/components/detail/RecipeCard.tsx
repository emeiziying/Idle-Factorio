import React from 'react';
import {
  Box,
  Typography
} from '@mui/material';
import type { Recipe } from '../../types/index';
import FactorioIcon from '../common/FactorioIcon';
import DataService from '../../services/DataService';
import useGameStore from '../../store/gameStore';
import CraftingButtons from './CraftingButtons';

interface RecipeCardProps {
  recipe: Recipe;
  title?: string;
  onCraft: (recipe: Recipe, quantity: number) => void;
  variant?: 'contained' | 'outlined';
}

const RecipeCard: React.FC<RecipeCardProps> = ({ 
  recipe, 
  title, 
  onCraft, 
  variant = 'contained' 
}) => {
  const { getInventoryItem } = useGameStore();
  const dataService = DataService.getInstance();

  const getLocalizedItemName = (itemId: string): string => {
    return dataService.getLocalizedItemName(itemId);
  };

  const canCraft = Object.entries(recipe.in).every(([itemId, required]) => {
    const available = getInventoryItem(itemId).currentAmount;
    return available >= required;
  });

  const handleCraft = (quantity: number) => {
    onCraft(recipe, quantity);
  };

  return (
    <Box sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="body2" fontWeight="bold" color={title ? "primary.main" : "text.primary"}>
          {title || dataService.getLocalizedRecipeName(recipe.id)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {recipe.time}秒
        </Typography>
      </Box>

      {/* 输入材料 */}
      <Typography variant="caption" color="text.secondary">
        需要材料:
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={1} mt={0.5}>
        {Object.entries(recipe.in).map(([itemId, required]) => {
          const available = getInventoryItem(itemId).currentAmount;
          const hasEnough = available >= required;
          return (
            <Box key={itemId} display="flex" alignItems="center" gap={0.5}>
              <FactorioIcon itemId={itemId} size={20} />
              <Typography 
                variant="body2" 
                color={hasEnough ? "text.primary" : "error.main"}
              >
                {getLocalizedItemName(itemId)} x{required}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ({available})
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* 输出产品 */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        输出产品:
      </Typography>
      <Box display="flex" alignItems="center" gap={1} mt={0.5}>
        {Object.entries(recipe.out).map(([itemId, quantity]) => (
          <Box key={itemId} display="flex" alignItems="center" gap={0.5}>
            <FactorioIcon itemId={itemId} size={24} />
            <Typography variant="body2">
              {getLocalizedItemName(itemId)} x{quantity}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* 制作时间 */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        制作时间: {recipe.time}秒
      </Typography>

      {/* 制作按钮 */}
      <CraftingButtons 
        onCraft={handleCraft}
        disabled={!canCraft}
        variant={variant}
      />
    </Box>
  );
};

export default RecipeCard; 