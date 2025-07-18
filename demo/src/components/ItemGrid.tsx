import React from 'react';
import { Box, Typography } from '@mui/material';
import { Item, InventoryItem } from '../types';
import ItemCard from './ItemCard';

interface ItemGridProps {
  items: Item[];
  inventory: Map<string, InventoryItem>;
  onItemClick?: (item: Item) => void;
}

const ItemGrid: React.FC<ItemGridProps> = ({
  items,
  inventory,
  onItemClick,
}) => {
  if (items.length === 0) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: 200,
          color: 'text.secondary'
        }}
      >
        <Typography variant="body1">
          暂无物品数据
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box 
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1,
          justifyItems: 'center',
        }}
      >
        {items.map((item) => {
          const inventoryItem = inventory.get(item.id);
          
          return (
            <ItemCard
              key={item.id}
              item={item}
              inventory={inventoryItem}
              onClick={onItemClick}
            />
          );
        })}
      </Box>
    </Box>
  );
};

export default ItemGrid; 