import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Box
} from '@mui/material';
import type { Item } from '../../types/index';
import useGameStore from '../../store/gameStore';
import { useIsMobile } from '../../hooks/useIsMobile';

interface InventoryCardProps {
  item: Item;
}

const InventoryCard: React.FC<InventoryCardProps> = ({ item }) => {
  const { getInventoryItem } = useGameStore();
  const isMobile = useIsMobile();
  
  const inventoryItem = getInventoryItem(item.id);

  return (
    <Card sx={{ mb: isMobile ? 1.5 : 2 }}>
      <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }}>
          库存信息
        </Typography>
        <Grid container spacing={isMobile ? 1 : 2}>
          <Grid size={6}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
              当前数量:
            </Typography>
            <Typography variant="h6" color="primary.main" sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
              {inventoryItem.currentAmount.toLocaleString()}
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
              最大容量:
            </Typography>
            <Typography variant="h6" sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
              {inventoryItem.maxCapacity.toLocaleString()}
            </Typography>
          </Grid>
        </Grid>
        
        {inventoryItem.status !== 'normal' && (
          <Box mt={1}>
            <Chip
              label={inventoryItem.status}
              color="warning"
              size={isMobile ? "small" : "small"}
              sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default InventoryCard; 