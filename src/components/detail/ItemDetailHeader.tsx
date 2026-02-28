import React from 'react';
import { Typography, Box } from '@mui/material';
import type { Item } from '@/types/index';
import { useDataService } from '@/hooks/useDIServices';
import useGameStore from '@/store/gameStore';

interface ItemDetailHeaderProps {
  item: Item;
}

const ItemDetailHeader: React.FC<ItemDetailHeaderProps> = ({ item }) => {
  const dataService = useDataService();
  const { getInventoryItem } = useGameStore();

  const getLocalizedItemName = (itemId: string): string => {
    return dataService.getLocalizedItemName(itemId) ?? itemId;
  };

  const inventoryItem = getInventoryItem(item.id);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1,
        pb: 0.5,
      }}
    >
      <Box flex={1}>
        <Typography variant="subtitle1" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
          {getLocalizedItemName(item.id)}
        </Typography>
      </Box>

      {/* 库存信息 */}
      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: '60px' }}
      >
        <Typography
          variant="body2"
          sx={{
            fontSize: '0.75rem',
            color: 'primary.main',
          }}
        >
          {inventoryItem.currentAmount.toLocaleString()}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontSize: '0.75rem',
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
