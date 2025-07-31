import React from 'react';
import { Box, Grid } from '@mui/material';
import ItemCard from './ItemCard';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Item } from '@/types/index';

interface ItemGridProps {
  items: Item[];
  onItemClick?: (item: Item) => void;
}

const ItemGrid: React.FC<ItemGridProps> = ({ items, onItemClick }) => {
  const isMobile = useIsMobile();

  return (
    <Box>
      <Grid container spacing={isMobile ? 1 : 1.5}>
        {items.map((item) => (
          <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={item.id}>
            <ItemCard
              item={item}
              onClick={() => onItemClick?.(item)}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ItemGrid;