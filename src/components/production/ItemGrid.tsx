import React, { useState } from 'react';
import { Box, Grid } from '@mui/material';
import ItemCard from './ItemCard';
import ItemDetailDialog from './ItemDetailDialog';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { Item } from '../../types/index';

interface ItemGridProps {
  items: Item[];
}

const ItemGrid: React.FC<ItemGridProps> = ({ items }) => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedItem(null);
  };

  return (
    <Box>
      <Grid container spacing={isMobile ? 1 : 1.5}>
        {items.map((item) => (
          <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={item.id}>
            <ItemCard
              item={item}
              onClick={() => handleItemClick(item)}
            />
          </Grid>
        ))}
      </Grid>

      {/* 物品详情对话框 */}
      {selectedItem && (
        <ItemDetailDialog
          item={selectedItem}
          open={dialogOpen}
          onClose={handleDialogClose}
        />
      )}
    </Box>
  );
};

export default ItemGrid;