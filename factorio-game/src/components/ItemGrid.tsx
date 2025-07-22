import React, { useState } from 'react';
import { Box } from '@mui/material';
import ItemCard from './ItemCard';
import ItemDetailDialog from './ItemDetailDialog';
import { Item } from '../types';

interface ItemGridProps {
  items: Item[];
}

const ItemGrid: React.FC<ItemGridProps> = ({ items }) => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
  };

  return (
    <>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(4, 1fr)',
            lg: 'repeat(4, 1fr)'
          },
          gap: 2
        }}>
          {items.map((item) => (
            <ItemCard key={item.id} item={item} onClick={() => handleItemClick(item)} />
          ))}
        </Box>
      </Box>
      
      {selectedItem && (
        <ItemDetailDialog
          open={detailOpen}
          item={selectedItem}
          onClose={handleCloseDetail}
        />
      )}
    </>
  );
};

export default ItemGrid;