import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { Item, InventoryItem } from '../types';
import { useGameStore } from '../store/gameStore';
import GameIcon from './GameIcon';
import { formatNumber, getStatusText } from '../utils/format';

interface ItemCardProps {
  item: Item;
  onClick: () => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onClick }) => {
  const inventory = useGameStore(state => state.inventory);
  const inventoryItem = inventory.get(item.id);
  const amount = inventoryItem?.currentAmount || 0;

  const getStatusColor = (status?: InventoryItem['status']) => {
    switch (status) {
      case 'producing':
        return 'success';
      case 'stopped':
        return 'error';
      case 'insufficient':
        return 'warning';
      case 'inventory_full':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        height: '100%',
        bgcolor: 'background.paper',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
          borderColor: 'primary.main',
        },
        border: 1,
        borderColor: 'divider',
      }}
    >
      <CardContent sx={{ textAlign: 'center', p: 2 }}>
        <Box sx={{ mb: 1 }}>
          <GameIcon item={item} size={48} />
        </Box>
        
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
          {item.name}
        </Typography>
        
        <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
          {formatNumber(amount)}
        </Typography>
        
        {inventoryItem?.status && inventoryItem.status !== 'normal' && (
          <Chip
            label={getStatusText(inventoryItem.status)}
            color={getStatusColor(inventoryItem.status)}
            size="small"
            sx={{ mt: 1 }}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default ItemCard;