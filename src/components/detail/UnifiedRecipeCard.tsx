import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { Add as AddIcon, ArrowForward as ArrowIcon } from '@mui/icons-material';
import type { Recipe } from '../../types/index';
import FactorioIcon from '../common/FactorioIcon';
import { DataService } from '../../services/DataService';
import useGameStore from '../../store/gameStore';
import CraftingButtons from './CraftingButtons';

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
  cardVariant = 'contained'
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

  // 通用的材料/产品渲染函数
  const renderItems = (items: { [itemId: string]: number }, isInput: boolean = true) => {
    return Object.entries(items).map(([itemId, quantity], index) => {
      const available = isInput ? getInventoryItem(itemId).currentAmount : 0;
      const isShortage = isInput && available < quantity;
      
      return (
        <React.Fragment key={itemId}>
          <FactorioIcon 
            itemId={itemId} 
            size={32} 
            quantity={quantity}
            shortage={isShortage}
          />
          {index < Object.entries(items).length - 1 && (
            <AddIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <Card 
      variant={cardVariant === 'outlined' ? 'outlined' : 'elevation'} 
      sx={{ 
        mb: 2,
        borderColor: cardVariant === 'outlined' ? 'divider' : 'transparent',
        bgcolor: 'transparent',
        boxShadow: 1
      }}
    >
      <CardContent sx={{ p: 2 }}>
        {/* 标题和时间 */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle2" fontWeight="bold" color={title ? "primary.main" : themeColor}>
            {title || dataService.getLocalizedRecipeName(recipe.id)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {`${recipe.time}秒`}
          </Typography>
        </Box>

        {/* 配方流程：时间图标 + 原料 => 产物 */}
        <Box 
          display="flex" 
          alignItems="center" 
          justifyContent="center" 
          gap={0.25}
          sx={{ 
            mb: 2,
            p: 2,
            bgcolor: 'background.default',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          {/* 时间图标 */}
          <FactorioIcon 
            customImage="/Time.png"
            size={32} 
            quantity={recipe.time}
          />

          {/* 加号连接 */}
          <AddIcon sx={{ color: 'text.secondary', fontSize: 16 }} />

          {/* 输入材料 */}
          {renderItems(recipe.in)}

          {/* 箭头 */}
          <ArrowIcon sx={{ color: themeColor, fontSize: 16 }} />

          {/* 输出产品 */}
          {renderItems(recipe.out, false)}
        </Box>

        {/* 生产者信息 - 移到配方流程下方 */}
        {variant === 'producer' && recipe.producers && recipe.producers.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              生产设备:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1} mt={0.5}>
              {recipe.producers.map((producerId) => (
                <Chip
                  key={producerId}
                  icon={<FactorioIcon itemId={producerId} size={32} />}
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
      </CardContent>
    </Card>
  );
};

export default UnifiedRecipeCard; 