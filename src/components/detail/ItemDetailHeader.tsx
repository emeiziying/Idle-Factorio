import React from 'react';
import {
  DialogTitle,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type { Item } from '../../types/index';
import FactorioIcon from '../common/FactorioIcon';
import { useIsMobile } from '../../hooks/useIsMobile';
import DataService from '../../services/DataService';

interface ItemDetailHeaderProps {
  item: Item;
  onClose: () => void;
}

const ItemDetailHeader: React.FC<ItemDetailHeaderProps> = ({ item, onClose }) => {
  const isMobile = useIsMobile();
  const dataService = DataService.getInstance();

  const getLocalizedItemName = (itemId: string): string => {
    return dataService.getLocalizedItemName(itemId);
  };

  return (
    <DialogTitle sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 2,
      p: isMobile ? 2 : 3,
      pb: isMobile ? 1 : 2
    }}>
      <FactorioIcon itemId={item.id} size={isMobile ? 28 : 32} />
      <Box flex={1}>
        <Typography variant={isMobile ? "h6" : "h6"} sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
          {getLocalizedItemName(item.id)}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
          {item.description || '暂无描述'}
        </Typography>
      </Box>
      <IconButton onClick={onClose} size={isMobile ? "medium" : "small"}>
        <CloseIcon />
      </IconButton>
    </DialogTitle>
  );
};

export default ItemDetailHeader; 