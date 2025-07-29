import React from 'react';
import {
  Typography,
  Box,
  useTheme
} from '@mui/material';
import type { Item } from '../../types/index';
import { DataService } from '../../services/core/DataService';
import useGameStore from '../../store/gameStore';

interface ItemDetailHeaderProps {
  item: Item;
}

const ItemDetailHeader: React.FC<ItemDetailHeaderProps> = ({ 
  item
}) => {
  const theme = useTheme();
  const dataService = DataService.getInstance();
  const { getInventoryItem } = useGameStore();

  const getLocalizedItemName = (itemId: string): string => {
    return dataService.getLocalizedItemName(itemId);
  };

  const inventoryItem = getInventoryItem(item.id);

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1.5,
      p: 1,
      pb: 0.5
    }}>
      <Box flex={1}>
        <Typography 
          variant="subtitle1"
          sx={theme.customStyles.typography.compact}
        >
          {getLocalizedItemName(item.id)}
        </Typography>
      </Box>
      
      {/* 库存信息 */}
      <Box sx={theme.customStyles.layout.inventoryInfo}>
        <Typography 
          variant="body2" 
          sx={{ 
            ...theme.customStyles.typography.small,
            color: 'primary.main'
          }}
        >
          {inventoryItem.currentAmount.toLocaleString()}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            ...theme.customStyles.typography.small,
            color: 'text.secondary',
          }}
        >
          /{inventoryItem.maxCapacity.toLocaleString()}
        </Typography>
      </Box>
    </Box>
  );
};

export default ItemDetailHeader; 