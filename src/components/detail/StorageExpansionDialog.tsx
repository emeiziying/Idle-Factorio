import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  TextField
} from '@mui/material';
import { 
  Close as CloseIcon,
  Add as AddIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';
import type { Item } from '../../types/index';
import useGameStore from '../../store/gameStore';
import FactorioIcon from '../common/FactorioIcon';
import { DataService } from '../../services/core/DataService';
import { getAvailableChestTypes } from '../../data/storageConfigs';
import { getStorageService } from '../../data/storageConfigs';

interface StorageExpansionDialogProps {
  open: boolean;
  onClose: () => void;
  item: Item;
}

interface ChestCraftingDialogProps {
  open: boolean;
  onClose: () => void;
  chestType: string;
}

const ChestCraftingDialog: React.FC<ChestCraftingDialogProps> = ({ 
  open, 
  onClose, 
  chestType 
}) => {
  const [craftQuantity, setCraftQuantity] = useState(1);
  const { craftChest, canCraftChest, getInventoryItem } = useGameStore();
  const dataService = DataService.getInstance();

  const config = getStorageService()?.getStorageConfig(chestType);
  if (!config) return null;

  const handleCraft = () => {
    const result = craftChest(chestType, craftQuantity);
    if (result.success) {
      onClose();
    }
  };

  const canCraftQuantity = (quantity: number) => {
    return canCraftChest(chestType, quantity);
  };

  // const hasEnoughMaterial = (itemId: string, needed: number) => {
  //   const available = getInventoryItem(itemId).currentAmount;
  //   return available >= needed;
  // };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        制造 {config.name}
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <FactorioIcon itemId={config.itemId} size={48} />
          <Box>
            <Typography variant="h6">{config.name}</Typography>
            <Typography variant="caption">
              制造时间: {config.craftingTime}秒
            </Typography>
          </Box>
        </Box>
        
        {/* 原材料需求 */}
        <Typography variant="subtitle2" gutterBottom>
          所需材料:
        </Typography>
        <Box display="flex" gap={1} mb={2}>
          {Object.entries(config.recipe).map(([itemId, amount]) => {
            const available = getInventoryItem(itemId).currentAmount;
            const needed = (amount as number) * craftQuantity;
            const itemName = dataService.getLocalizedItemName(itemId);
            
            return (
              <Card key={itemId} variant="outlined">
                <CardContent sx={{ p: 1 }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <FactorioIcon itemId={itemId} size={24} />
                    <Box>
                      <Typography variant="caption">
                        {itemName}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color={available >= needed ? "success.main" : "error.main"}
                        display="block"
                      >
                        {needed} / {available}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
        
        {/* 数量选择 */}
        <Typography variant="subtitle2" gutterBottom>
          制造数量:
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton 
            onClick={() => setCraftQuantity(Math.max(1, craftQuantity - 1))}
            disabled={craftQuantity <= 1}
          >
            <RemoveIcon />
          </IconButton>
          <TextField
            type="number"
            value={craftQuantity}
            onChange={(e) => setCraftQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            sx={{ width: 80 }}
            size="small"
          />
          <IconButton 
            onClick={() => setCraftQuantity(craftQuantity + 1)}
            disabled={!canCraftQuantity(craftQuantity + 1)}
          >
            <AddIcon />
          </IconButton>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button 
          variant="contained"
          onClick={handleCraft}
          disabled={!canCraftQuantity(craftQuantity)}
        >
          开始制造
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const StorageExpansionDialog: React.FC<StorageExpansionDialogProps> = ({ 
  open, 
  onClose, 
  item 
}) => {
  const [craftDialogOpen, setCraftDialogOpen] = useState(false);
  const [selectedChestType, setSelectedChestType] = useState('');

  const { 
    deployChestForStorage, 
    getInventoryItem, 
    canCraftChest 
  } = useGameStore();
  
  const dataService = DataService.getInstance();

  const handleDeployChest = (chestType: string) => {
    const result = deployChestForStorage(chestType, item.id);
    if (result.success) {
      onClose();
    }
  };

  const openCraftDialog = (chestType: string) => {
    setSelectedChestType(chestType);
    setCraftDialogOpen(true);
  };

  const closeCraftDialog = () => {
    setCraftDialogOpen(false);
    setSelectedChestType('');
  };

  const hasEnoughMaterial = (itemId: string, amount: number) => {
    return getInventoryItem(itemId).currentAmount >= amount;
  };

  const getItemName = (itemId: string) => {
    return dataService.getLocalizedItemName(itemId);
  };

  const getItemStackSize = (itemId: string) => {
    const gameItem = dataService.getItem(itemId);
    return gameItem?.stack || 100;
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          为 {getItemName(item.id)} 扩展存储
          <IconButton
            onClick={onClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          {getAvailableChestTypes().map((chestType) => {
            const config = getStorageService()?.getStorageConfig(chestType);
            if (!config) return null;
            const chestInventory = getInventoryItem(config.itemId);
            const hasChest = chestInventory.currentAmount > 0;
            const canCraft = canCraftChest(chestType);
            const stackSize = getItemStackSize(item.id);
            
            return (
              <Card key={chestType} sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box flex={1}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {config.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        +{config.additionalStacks || 0} 堆叠 
                        (+{(config.additionalStacks || 0) * stackSize} 容量)
                      </Typography>
                      
                      {/* 库存状态 */}
                      <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                        <FactorioIcon itemId={config.itemId} size={20} />
                        <Typography variant="caption">
                          库存: {chestInventory.currentAmount}
                        </Typography>
                        {hasChest && (
                          <Chip label="可用" size="small" color="success" />
                        )}
                      </Box>
                    </Box>
                    
                    <Box display="flex" flexDirection="column" gap={1}>
                      {/* 立即使用按钮 */}
                      {hasChest && (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleDeployChest(chestType)}
                        >
                          立即使用
                        </Button>
                      )}
                      
                      {/* 制造按钮 */}
                      <Button
                        variant={hasChest ? "outlined" : "contained"}
                        size="small"
                        disabled={!canCraft}
                        onClick={() => openCraftDialog(chestType)}
                      >
                        制造
                      </Button>
                    </Box>
                  </Box>
                  
                  {/* 制造配方显示 */}
                  <Box display="flex" gap={0.5} mt={1}>
                    <Typography variant="caption" color="text.secondary">
                      制造需要:
                    </Typography>
                    {Object.entries(config.recipe).map(([itemId, amount]) => (
                      <Chip
                        key={itemId}
                        icon={<FactorioIcon itemId={itemId} size={16} />}
                        label={amount as number}
                        size="small"
                        color={hasEnoughMaterial(itemId, amount as number) ? "default" : "error"}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose}>关闭</Button>
        </DialogActions>
      </Dialog>

      {/* 箱子制造对话框 */}
      <ChestCraftingDialog
        open={craftDialogOpen}
        onClose={closeCraftDialog}
        chestType={selectedChestType}
      />
    </>
  );
};

export default StorageExpansionDialog;