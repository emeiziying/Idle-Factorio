import React, { useState } from 'react';
import { Card, CardContent, Typography, Chip, Box, Button, useTheme } from '@mui/material';
import { AddBox as AddBoxIcon } from '@mui/icons-material';
import type { Item } from '@/types/index';
import useGameStore from '@/store/gameStore';
import StorageExpansionDialog from './StorageExpansionDialog';

interface InventoryCardProps {
  item: Item;
}

const InventoryCard: React.FC<InventoryCardProps> = ({ item }) => {
  const [expansionDialogOpen, setExpansionDialogOpen] = useState(false);
  const theme = useTheme();
  const { getInventoryItem } = useGameStore();

  const inventoryItem = getInventoryItem(item.id);

  return (
    <>
      <Card sx={{ ...theme.customStyles.layout.cardCompact, bgcolor: 'transparent', boxShadow: 1 }}>
        <CardContent sx={{ p: theme.customStyles.spacing.compact }}>
          <Typography variant="subtitle2" gutterBottom sx={theme.customStyles.typography.subtitle}>
            库存信息
          </Typography>

          {/* 数量显示 */}
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Typography variant="h6" color="primary.main">
              {inventoryItem.currentAmount.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              / {inventoryItem.maxCapacity.toLocaleString()}
            </Typography>

            <Chip
              label={`${Math.ceil(inventoryItem.currentAmount / inventoryItem.stackSize)}/${inventoryItem.totalStacks} 堆叠`}
              size="small"
              variant="outlined"
            />
          </Box>

          {/* 堆叠信息 */}
          <Box display="flex" gap={0.5} mb={1}>
            <Chip label={`基础: ${inventoryItem.baseStacks} 堆叠`} size="small" variant="outlined" />
            {inventoryItem.additionalStacks > 0 && (
              <Chip label={`箱子: +${inventoryItem.additionalStacks} 堆叠`} size="small" color="primary" />
            )}
          </Box>

          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            每堆叠容量: {inventoryItem.stackSize.toLocaleString()}
          </Typography>

          <Button size="small" startIcon={<AddBoxIcon />} onClick={() => setExpansionDialogOpen(true)} sx={{ mt: 0.5 }}>
            扩展存储
          </Button>

          {inventoryItem.status !== 'normal' && (
            <Box mt={theme.customStyles.spacing.compact}>
              <Chip label={inventoryItem.status} color="warning" size="small" sx={theme.customStyles.typography.tiny} />
            </Box>
          )}
        </CardContent>
      </Card>

      <StorageExpansionDialog open={expansionDialogOpen} onClose={() => setExpansionDialogOpen(false)} item={item} />
    </>
  );
};

export default InventoryCard;
