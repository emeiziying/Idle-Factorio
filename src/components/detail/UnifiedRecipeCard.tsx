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
import DataService from '../../services/DataService';
import useGameStore from '../../store/gameStore';
import CraftingButtons from './CraftingButtons';

interface UnifiedRecipeCardProps {
  recipe: Recipe;
  variant: 'normal' | 'manual' | 'producer';
  title?: string;
  onCraft: (recipe: Recipe, quantity: number) => void;
  showNoMaterials?: boolean; // 手动合成的无材料情况
  disabled?: boolean;
  cardVariant?: 'contained' | 'outlined';
}

const UnifiedRecipeCard: React.FC<UnifiedRecipeCardProps> = ({ 
  recipe, 
  variant, 
  title, 
  onCraft, 
  showNoMaterials = false,
  disabled = false,
  cardVariant = 'contained'
}) => {
  const { getInventoryItem } = useGameStore();
  const dataService = DataService.getInstance();

  const getLocalizedItemName = (itemId: string): string => {
    return dataService.getLocalizedItemName(itemId);
  };

  // 颜色主题映射
  const getThemeColor = () => {
    switch (variant) {
      case 'normal':
      case 'manual':
        return 'primary.main';
      case 'producer':
        return 'secondary.main';
      default:
        return 'primary.main';
    }
  };

  const themeColor = getThemeColor();

  const canCraft = showNoMaterials || Object.entries(recipe.in).every(([itemId, required]) => {
    const available = getInventoryItem(itemId).currentAmount;
    return available >= required;
  });

  const handleCraft = (quantity: number) => {
    onCraft(recipe, quantity);
  };

  return (
    <Card 
      variant={cardVariant === 'outlined' ? 'outlined' : 'elevation'} 
      sx={{ 
        mb: 2,
        borderColor: cardVariant === 'outlined' ? 'divider' : 'transparent',
        bgcolor: 'background.paper'
      }}
    >
      <CardContent sx={{ p: 2 }}>
        {/* 标题和时间 */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle2" fontWeight="bold" color={title ? "primary.main" : themeColor}>
            {title || dataService.getLocalizedRecipeName(recipe.id)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {showNoMaterials ? '立即完成' : `${recipe.time}秒`}
          </Typography>
        </Box>

        {/* 配方流程：时间图标 + 原料 => 产物 */}
        <Box 
          display="flex" 
          alignItems="center" 
          justifyContent="center" 
          gap={2}
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
          <Box 
            sx={{ 
              position: 'relative',
              width: 48,
              height: 48,
              padding: '4px',
              backgroundColor: '#999',
              borderTop: '1px solid #454545',
              borderLeft: '1px solid #212121',
              borderRight: '1px solid #212121',
              borderBottom: '1px solid #191919',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img 
              src="/Time.png" 
              alt="Time" 
              style={{ 
                width: '100%', 
                height: '100%',
                objectFit: 'contain'
              }} 
            />
            <Typography 
              variant="caption" 
              sx={{ 
                position: 'absolute',
                bottom: '-3px',
                right: '2px',
                color: '#fff',
                fontSize: 'larger',
                fontWeight: 'bold',
                textShadow: '0px 1px 1px #000, 0px -1px 1px #000, 1px 0px 1px #000, -1px 0px 1px #000',
                lineHeight: 1
              }}
            >
              {showNoMaterials ? '0' : recipe.time}
            </Typography>
          </Box>

          {/* 输入材料 */}
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            {showNoMaterials ? (
              // 无材料情况
              <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', textAlign: 'center' }}>
                  无需材料
                </Typography>
              </Box>
            ) : (
              // 有材料情况
              Object.entries(recipe.in).map(([itemId, required], index) => {
                const available = getInventoryItem(itemId).currentAmount;
                const hasEnough = available >= required;
                return (
                  <Box key={itemId} display="flex" flexDirection="column" alignItems="center" gap={0.5} position="relative">
                    <FactorioIcon itemId={itemId} size={32} />
                    <Typography 
                      variant="caption" 
                      color={hasEnough ? "text.secondary" : "error.main"}
                      sx={{ 
                        fontSize: '0.7rem',
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        backgroundColor: 'background.paper',
                        borderRadius: '50%',
                        width: 16,
                        height: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid',
                        borderColor: hasEnough ? 'divider' : 'error.main'
                      }}
                    >
                      {required}
                    </Typography>
                    {index < Object.entries(recipe.in).length - 1 && (
                      <AddIcon sx={{ fontSize: 16, color: 'text.secondary', mt: 1 }} />
                    )}
                  </Box>
                );
              })
            )}
          </Box>

          {/* 箭头 */}
          <ArrowIcon sx={{ color: themeColor, fontSize: 24 }} />

          {/* 输出产品 */}
          <Box display="flex" alignItems="center" gap={1}>
            {Object.entries(recipe.out).map(([itemId, quantity]) => (
              <Box key={itemId} display="flex" flexDirection="column" alignItems="center" gap={0.5} position="relative">
                <FactorioIcon itemId={itemId} size={36} />
                <Typography 
                  variant="caption" 
                  color={themeColor}
                  sx={{ 
                    fontSize: '0.8rem',
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: 'background.paper',
                    borderRadius: '50%',
                    width: 18,
                    height: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid',
                    borderColor: themeColor
                  }}
                >
                  {quantity}
                </Typography>
              </Box>
            ))}
          </Box>
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
                  icon={<FactorioIcon itemId={producerId} size={16} />}
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