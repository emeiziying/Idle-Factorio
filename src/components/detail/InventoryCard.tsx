import React, { useState } from 'react';
import { Card, CardContent, Typography, Chip, Box, Button } from '@mui/material';
import { AddBox as AddBoxIcon } from '@mui/icons-material';
import type { Item } from '@/types/index';
import useGameStore from '@/store/gameStore';
import StorageExpansionDialog from '@/components/detail/StorageExpansionDialog';

interface InventoryCardProps {
  item: Item;
}

const InventoryCard: React.FC<InventoryCardProps> = ({ item }) => {
  const [expansionDialogOpen, setExpansionDialogOpen] = useState(false);
  const { getInventoryItem } = useGameStore();

  const inventoryItem = getInventoryItem(item.id);

  return (
    <>
      <Card sx={{ mb: 0.5, p: 0.5, bgcolor: 'transparent', boxShadow: 1 }}>
        <CardContent sx={{ p: 0.5 }}>
          <Typography
            variant="subtitle2"
            gutterBottom
            sx={{ fontSize: '0.8rem', fontWeight: 600, mb: '0.5rem' }}
          >
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
            <Chip
              label={`基础: ${inventoryItem.baseStacks} 堆叠`}
              size="small"
              variant="outlined"
            />
            {inventoryItem.additionalStacks > 0 && (
              <Chip
                label={`箱子: +${inventoryItem.additionalStacks} 堆叠`}
                size="small"
                color="primary"
              />
            )}
          </Box>

          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            每堆叠容量: {inventoryItem.stackSize.toLocaleString()}
          </Typography>

          <Button
            size="small"
            startIcon={<AddBoxIcon />}
            onClick={() => setExpansionDialogOpen(true)}
            sx={{ mt: 0.5 }}
          >
            扩展存储
          </Button>

          {inventoryItem.status !== 'normal' && (
            <Box mt={0.5}>
              <Chip
                label={inventoryItem.status}
                color="warning"
                size="small"
                sx={{ fontSize: '0.65rem' }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      <StorageExpansionDialog
        open={expansionDialogOpen}
        onClose={() => setExpansionDialogOpen(false)}
        item={item}
      />
    </>
  );
};

export default InventoryCard;
