import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  Chip
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon } from '@mui/icons-material';
import type { Item, Recipe } from '../../types/index';
import DataService from '../../services/DataService';
import useGameStore from '../../store/gameStore';
import GameIcon from '../common/GameIcon';
import { useIsMobile } from '../../hooks/useIsMobile';

interface ItemDetailDialogProps {
  item: Item;
  open: boolean;
  onClose: () => void;
}

const ItemDetailDialog: React.FC<ItemDetailDialogProps> = ({
  item,
  open,
  onClose
}) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [usedInRecipes, setUsedInRecipes] = useState<Recipe[]>([]);
  const getInventoryItem = useGameStore((state) => state.getInventoryItem);
  const addCraftingTask = useGameStore((state) => state.addCraftingTask);
  const isMobile = useIsMobile();

  const inventoryItem = getInventoryItem(item.id);

  useEffect(() => {
    if (item) {
      const dataService = DataService.getInstance();
      const itemRecipes = dataService.getRecipesForItem(item.id);
      const usageRecipes = dataService.getRecipesUsingItem(item.id);
      
      setRecipes(itemRecipes);
      setUsedInRecipes(usageRecipes);
    }
  }, [item]);

  const handleCraft = (recipe: Recipe, quantity: number = 1) => {
    const dataService = DataService.getInstance();
    
    // 检查材料是否足够
    const canCraft = Object.entries(recipe.in).every(([itemId, required]) => {
      const available = getInventoryItem(itemId).currentAmount;
      return available >= required * quantity;
    });

    if (!canCraft) {
      alert('材料不足');
      return;
    }

    // 添加到制作队列
    const success = addCraftingTask({
      recipeId: recipe.id,
      itemId: Object.keys(recipe.out)[0],
      quantity,
      progress: 0,
      startTime: Date.now(),
      craftingTime: recipe.time,
      status: 'pending'
    });

    if (success) {
      console.log(`Added crafting task: ${recipe.name} x${quantity}`);
    } else {
      alert('制作队列已满');
    }
  };

  const formatTime = (seconds: number) => {
    return `${seconds}秒`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={isMobile ? false : "sm"}
      fullWidth={!isMobile}
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          ...(isMobile && {
            margin: 0,
            maxHeight: '100vh',
            height: '100vh',
            borderRadius: 0,
          })
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        p: isMobile ? 2 : 3,
        pb: isMobile ? 1 : 2
      }}>
        <GameIcon itemId={item.id} size={isMobile ? 28 : 32} />
        <Box flex={1}>
          <Typography variant={isMobile ? "h6" : "h6"} sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
            {item.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
            {item.description || '暂无描述'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size={isMobile ? "medium" : "small"}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent 
        dividers 
        sx={{ 
          p: isMobile ? 1.5 : 2,
          '&.MuiDialogContent-dividers': {
            borderTop: isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
            borderBottom: isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
          }
        }}
      >
        {/* 库存信息 */}
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

        {/* 制作配方 */}
        {recipes.length > 0 && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                制作配方
              </Typography>
              
              {recipes.map((recipe) => (
                <Box key={recipe.id} sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" fontWeight="bold">
                      {recipe.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatTime(recipe.time)}
                    </Typography>
                  </Box>

                  {/* 输入材料 */}
                  <Typography variant="caption" color="text.secondary">
                    需要材料:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1} mb={1}>
                    {Object.entries(recipe.in).map(([itemId, quantity]) => {
                      const inputItem = DataService.getInstance().getItem(itemId);
                      const available = getInventoryItem(itemId).currentAmount;
                      const sufficient = available >= quantity;
                      
                      return (
                        <Chip
                          key={itemId}
                          icon={<GameIcon itemId={itemId} size={16} />}
                          label={`${inputItem?.name} x${quantity}`}
                          size="small"
                          color={sufficient ? 'default' : 'error'}
                          variant={sufficient ? 'filled' : 'outlined'}
                        />
                      );
                    })}
                  </Box>

                  {/* 输出产品 */}
                  <Typography variant="caption" color="text.secondary">
                    产出:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1} mb={1}>
                    {Object.entries(recipe.out).map(([itemId, quantity]) => {
                      const outputItem = DataService.getInstance().getItem(itemId);
                      return (
                        <Chip
                          key={itemId}
                          icon={<GameIcon itemId={itemId} size={16} />}
                          label={`${outputItem?.name} x${quantity}`}
                          size="small"
                          color="success"
                        />
                      );
                    })}
                  </Box>

                  {/* 制作按钮 */}
                  <Box display="flex" gap={isMobile ? 0.5 : 1} mt={1} flexWrap="wrap">
                    <Button
                      size={isMobile ? "medium" : "small"}
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => handleCraft(recipe, 1)}
                      sx={{ 
                        fontSize: isMobile ? '0.8rem' : '0.875rem',
                        minWidth: isMobile ? 100 : 'auto',
                        flex: isMobile ? 1 : 'none'
                      }}
                    >
                      制作 x1
                    </Button>
                    <Button
                      size={isMobile ? "medium" : "small"}
                      variant="outlined"
                      onClick={() => handleCraft(recipe, 5)}
                      sx={{ 
                        fontSize: isMobile ? '0.8rem' : '0.875rem',
                        minWidth: isMobile ? 100 : 'auto',
                        flex: isMobile ? 1 : 'none'
                      }}
                    >
                      制作 x5
                    </Button>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 用途 */}
        {usedInRecipes.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                用于制作
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {usedInRecipes.map((recipe) => {
                  const outputItemId = Object.keys(recipe.out)[0];
                  const outputItem = DataService.getInstance().getItem(outputItemId);
                  return (
                    <Chip
                      key={recipe.id}
                      icon={<GameIcon itemId={outputItemId} size={16} />}
                      label={outputItem?.name}
                      size="small"
                      variant="outlined"
                    />
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: isMobile ? 2 : 3,
        pt: isMobile ? 1 : 2,
        gap: isMobile ? 1 : 0
      }}>
        <Button 
          onClick={onClose}
          size={isMobile ? "large" : "medium"}
          sx={{ 
            fontSize: isMobile ? '0.9rem' : '0.875rem',
            minWidth: isMobile ? 120 : 'auto'
          }}
        >
          关闭
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ItemDetailDialog;