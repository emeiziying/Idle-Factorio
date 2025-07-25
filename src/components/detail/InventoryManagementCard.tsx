import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  useTheme
} from '@mui/material';
import { 
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import type { Item } from '../../types/index';
import useGameStore from '../../store/gameStore';
import { storageService } from '../../services/StorageService';
import FactorioIcon from '../common/FactorioIcon';

interface InventoryManagementCardProps {
  item: Item;
}

const InventoryManagementCard: React.FC<InventoryManagementCardProps> = ({ item }) => {
  const theme = useTheme();
  const { 
    getInventoryItem, 
    getDeployedContainersForItem, 
    removeDeployedContainer,
    updateInventory
  } = useGameStore();
  
  const inventoryItem = getInventoryItem(item.id);
  const deployedContainers = getDeployedContainersForItem(item.id);
  
  // 判断是否为液体物品
  const isLiquidItem = item.category === 'fluids';
  
  // 获取可用的存储类型
  const availableStorageTypes = isLiquidItem 
    ? storageService.getLiquidStorageTypes()
    : storageService.getSolidStorageTypes();



  const handleAddStorage = (storageType: string) => {
    const storageConfig = storageService.getStorageConfig(storageType);
    if (!storageConfig) return;
    
    // 检查是否有该存储设备
    const storageInventory = getInventoryItem(storageConfig.itemId);
    if (storageInventory.currentAmount > 0) {
      // 直接部署存储设备
      const result = useGameStore.getState().deployChestForStorage(storageType, item.id);
      if (result.success) {
        // 消耗一个存储设备
        updateInventory(storageConfig.itemId, -1);
      }
    }
  };

  const handleRemoveStorage = (containerId: string) => {
    const container = deployedContainers.find(c => c.id === containerId);
    if (container) {
      // 移除存储设备并归还一个存储设备到库存
      removeDeployedContainer(containerId);
      updateInventory(container.chestItemId, 1);
    }
  };

  return (
    <Card sx={{ ...theme.customStyles.layout.cardCompact, bgcolor: 'transparent', boxShadow: 1 }}>
      <CardContent sx={{ p: theme.customStyles.spacing.compact }}>
        <Typography 
          variant="subtitle2" 
          gutterBottom 
          sx={theme.customStyles.typography.subtitle}
        >
          库存管理
        </Typography>
        
        {/* 当前库存状态 */}
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Typography variant="h6" color="primary.main">
            {inventoryItem.currentAmount.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            / {inventoryItem.maxCapacity.toLocaleString()}
          </Typography>
        </Box>
        
        {/* 存储设备列表 */}
        <Typography variant="caption" color="text.secondary" gutterBottom>
          存储设备
        </Typography>
        <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1, mb: 2 }}>
          {availableStorageTypes.map(storageType => {
            const storageConfig = storageService.getStorageConfig(storageType);
            if (!storageConfig) return null;
            
            const storageInventory = getInventoryItem(storageConfig.itemId);
            const deployedCount = deployedContainers.filter(c => c.chestType === storageType).length;
            
            return (
              <ListItem
                key={storageType}
                sx={{ py: 0.5 }}
                secondaryAction={
                  <Box display="flex" alignItems="center" gap={1}>
                    <IconButton
                      size="small"
                      onClick={() => handleAddStorage(storageType)}
                      disabled={storageInventory.currentAmount <= 0}
                      color="primary"
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        const container = deployedContainers.find(c => c.chestType === storageType);
                        if (container) handleRemoveStorage(container.id);
                      }}
                      disabled={deployedCount <= 0}
                      color="error"
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {deployedCount}
                  <FactorioIcon itemId={storageConfig.itemId} size={32} quantity={deployedCount} />
                </ListItemIcon>
              </ListItem>
            );
          })}
        </List>
        
       
        {/* 状态提示 */}
        {inventoryItem.status !== 'normal' && (
          <Box mt={1}>
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

export default InventoryManagementCard; 