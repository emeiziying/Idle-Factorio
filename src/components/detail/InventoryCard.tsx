import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Box,
  useTheme
} from '@mui/material';
import type { Item } from '../../types/index';
import useGameStore from '../../store/gameStore';

interface InventoryCardProps {
  item: Item;
}

const InventoryCard: React.FC<InventoryCardProps> = ({ item }) => {
  const theme = useTheme();
  const { getInventoryItem } = useGameStore();
  
  const inventoryItem = getInventoryItem(item.id);

  return (
    <Card sx={{ ...theme.customStyles.layout.cardCompact, bgcolor: 'transparent', boxShadow: 1 }}>
      <CardContent sx={{ p: theme.customStyles.spacing.compact }}>
        <Typography 
          variant="subtitle2" 
          gutterBottom 
          sx={theme.customStyles.typography.subtitle}
        >
          库存信息
        </Typography>
        <Grid container spacing={theme.customStyles.spacing.compact}>
          <Grid size={6}>
            <Typography variant="body2" color="text.secondary" sx={theme.customStyles.typography.small}>
              当前数量:
            </Typography>
            <Typography variant="h6" color="primary.main" sx={theme.customStyles.typography.compact}>
              {inventoryItem.currentAmount.toLocaleString()}
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="body2" color="text.secondary" sx={theme.customStyles.typography.small}>
              最大容量:
            </Typography>
            <Typography variant="h6" sx={theme.customStyles.typography.compact}>
              {inventoryItem.maxCapacity.toLocaleString()}
            </Typography>
          </Grid>
        </Grid>
        
        {inventoryItem.status !== 'normal' && (
          <Box mt={theme.customStyles.spacing.compact}>
            <Chip
              label={inventoryItem.status}
              color="warning"
              size="small"
              sx={theme.customStyles.typography.tiny}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default InventoryCard; 