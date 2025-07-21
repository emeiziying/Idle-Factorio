import React, { useState } from 'react';
import { Grid, Container } from '@mui/material';
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
      <Container maxWidth="lg">
        <Grid container spacing={2}>
          {items.map((item) => (
            <Grid item xs={6} sm={4} md={3} key={item.id}>
              <ItemCard item={item} onClick={() => handleItemClick(item)} />
            </Grid>
          ))}
        </Grid>
      </Container>
      
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