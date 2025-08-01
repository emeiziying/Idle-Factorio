import React from 'react';
import { Typography, Box } from '@mui/material';
import type { Recipe } from '@/types/index';
import FactorioIcon from '@/components/common/FactorioIcon';
import { DataService } from '@/services/core/DataService';

interface UsageCardProps {
  usedInRecipes: Recipe[];
  onItemSelect?: (item: import('../../types/index').Item) => void;
}

const UsageCard: React.FC<UsageCardProps> = ({ usedInRecipes, onItemSelect }) => {
  const dataService = DataService.getInstance();

  // 处理物品点击
  const handleItemClick = (itemId: string) => {
    // Navigate to item detail
    if (onItemSelect) {
      const clickedItem = dataService.getItem(itemId);
      if (clickedItem) {
        // Navigate to clicked item
        onItemSelect(clickedItem);
      } else {
        console.warn('UsageCard: Item not found:', itemId);
      }
    } else {
      console.warn('UsageCard: onItemSelect callback not provided');
    }
  };

  if (usedInRecipes.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="subtitle2"
        gutterBottom
        sx={{
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'text.primary',
          mb: 1,
        }}
      >
        用于制作
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={0.5}>
        {usedInRecipes.map(recipe => {
          // 获取配方的主要输出物品（数量最多的输出物品）
          const outputEntries = Object.entries(recipe.out);
          const mainOutputEntry = outputEntries.reduce((max, current) =>
            current[1] > max[1] ? current : max
          );
          const outputItemId = mainOutputEntry[0];

          return (
            <Box
              key={recipe.id}
              onClick={() => handleItemClick(outputItemId)}
              sx={{
                cursor: onItemSelect ? 'pointer' : 'default',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': onItemSelect
                  ? {
                      backgroundColor: 'action.hover',
                    }
                  : {},
              }}
            >
              <FactorioIcon itemId={outputItemId} size={32} />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default UsageCard;
