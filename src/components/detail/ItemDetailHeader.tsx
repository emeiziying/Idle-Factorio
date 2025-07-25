import React from 'react';
import {
  Typography,
  Box,
  IconButton,
  useTheme
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type { Item } from '../../types/index';
import FactorioIcon from '../common/FactorioIcon';
import DataService from '../../services/DataService';
import useGameStore from '../../store/gameStore';

interface ItemDetailHeaderProps {
  item: Item;
  onClose: () => void;
  hideCloseButton?: boolean;
}

const ItemDetailHeader: React.FC<ItemDetailHeaderProps> = ({ 
  item, 
  onClose, 
  hideCloseButton = false
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
      <FactorioIcon 
        itemId={item.id} 
        size={24} 
      />
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
            ...theme.customStyles.typography.compact,
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
            ml: theme.customStyles.spacing.tight
          }}
        >
          / {inventoryItem.maxCapacity.toLocaleString()}
        </Typography>
      </Box>

      {!hideCloseButton && (
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      )}
    </Box>
  );
};

export default ItemDetailHeader; 