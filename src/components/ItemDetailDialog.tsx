import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  TextField,
  IconButton,
  Chip,
  Alert
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { Item, Recipe } from '../types';
import { DataService } from '../services/DataService';
import { useGameStore } from '../store/gameStore';
import GameIcon from './GameIcon';

interface ItemDetailDialogProps {
  open: boolean;
  item: Item;
  onClose: () => void;
}

const ItemDetailDialog: React.FC<ItemDetailDialogProps> = ({ open, item, onClose }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [craftAmount, setCraftAmount] = useState(1);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const dataService = DataService.getInstance();
  const inventory = useGameStore(state => state.inventory);
  const updateInventory = useGameStore(state => state.updateInventory);
  const addCraftingTask = useGameStore(state => state.addCraftingTask);
  const getInventoryItem = useGameStore(state => state.getInventoryItem);

  useEffect(() => {
    if (open) {
      loadRecipes();
      setMessage(null);
    }
  }, [open, item.id]);

  const loadRecipes = async () => {
    const recipesData = await dataService.getRecipesForItem(item.id);
    setRecipes(recipesData);
    if (recipesData.length > 0) {
      setSelectedRecipe(recipesData[0]);
    }
  };

  const handleCraft = () => {
    if (!selectedRecipe) return;

    // 检查原料是否充足
    let canCraft = true;
    let missingItems: string[] = [];

    Object.entries(selectedRecipe.in).forEach(([itemId, requiredAmount]) => {
      const inventoryItem = getInventoryItem(itemId);
      const available = inventoryItem?.currentAmount || 0;
      if (available < requiredAmount * craftAmount) {
        canCraft = false;
        missingItems.push(itemId);
      }
    });

    if (!canCraft) {
      setMessage({ type: 'error', text: `原料不足: ${missingItems.join(', ')}` });
      return;
    }

    // 消耗原料
    Object.entries(selectedRecipe.in).forEach(([itemId, requiredAmount]) => {
      updateInventory(itemId, -requiredAmount * craftAmount);
    });

    // 添加到制作队列
    const task = {
      id: `craft-${Date.now()}`,
      recipeId: selectedRecipe.id,
      quantity: craftAmount,
      progress: 0,
      startTime: Date.now()
    };
    
    addCraftingTask(task);
    
    // 模拟立即完成（后续可以改为实际的制作时间）
    setTimeout(() => {
      Object.entries(selectedRecipe.out).forEach(([outputId, outputAmount]) => {
        updateInventory(outputId, outputAmount * craftAmount);
      });
      useGameStore.getState().removeCraftingTask(task.id);
    }, selectedRecipe.time * 1000);

    setMessage({ type: 'success', text: `开始制作 ${craftAmount} 个 ${item.name}` });
  };

  const handleAmountChange = (delta: number) => {
    setCraftAmount(Math.max(1, Math.min(999, craftAmount + delta)));
  };

  // 特殊处理：如果是水或蒸汽，显示添加对应设施的选项
  const renderSpecialActions = () => {
    if (item.id === 'water') {
      return (
        <Box sx={{ mt: 2 }}>
          <Alert severity="info">
            水需要通过海水泵从水源获取
          </Alert>
          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => {
              // 这里可以添加创建海水泵的逻辑
              setMessage({ type: 'success', text: '请在设施页面添加海水泵' });
            }}
          >
            添加海水泵
          </Button>
        </Box>
      );
    }
    
    if (item.id === 'steam') {
      return (
        <Box sx={{ mt: 2 }}>
          <Alert severity="info">
            蒸汽需要通过锅炉燃烧煤炭和水产生
          </Alert>
          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => {
              // 这里可以添加创建锅炉的逻辑
              setMessage({ type: 'success', text: '请在设施页面添加锅炉' });
            }}
          >
            添加锅炉
          </Button>
        </Box>
      );
    }
    
    return null;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <GameIcon item={item} size={40} />
            <Typography variant="h6">{item.name}</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            库存: {getInventoryItem(item.id)?.currentAmount || 0} / {item.stack_size || 999}
          </Typography>
          {item.description && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {item.description}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {recipes.length > 0 ? (
          <>
            <Typography variant="subtitle1" gutterBottom>
              制作配方
            </Typography>
            
            <List>
              {recipes.map((recipe) => (
                <ListItem
                  key={recipe.id}
                  button
                  selected={selectedRecipe?.id === recipe.id}
                  onClick={() => setSelectedRecipe(recipe)}
                  sx={{ 
                    borderRadius: 1,
                    mb: 1,
                    border: 1,
                    borderColor: selectedRecipe?.id === recipe.id ? 'primary.main' : 'divider'
                  }}
                >
                  <ListItemText
                    primary={recipe.name}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          原料: {Object.entries(recipe.in).map(([id, amount]) => `${id} x${amount}`).join(', ')}
                        </Typography>
                        <Typography variant="caption" display="block">
                          产出: {Object.entries(recipe.out).map(([id, amount]) => `${id} x${amount}`).join(', ')}
                        </Typography>
                        <Typography variant="caption" display="block">
                          时间: {recipe.time}秒
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>

            {selectedRecipe && (
              <Box sx={{ mt: 2 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="subtitle2">制作数量:</Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <IconButton size="small" onClick={() => handleAmountChange(-1)}>
                      <RemoveIcon />
                    </IconButton>
                    <TextField
                      value={craftAmount}
                      onChange={(e) => setCraftAmount(Math.max(1, Math.min(999, parseInt(e.target.value) || 1)))}
                      size="small"
                      type="number"
                      sx={{ width: 80 }}
                    />
                    <IconButton size="small" onClick={() => handleAmountChange(1)}>
                      <AddIcon />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            )}
          </>
        ) : (
          renderSpecialActions()
        )}

        {message && (
          <Alert severity={message.type} sx={{ mt: 2 }} onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>关闭</Button>
        {selectedRecipe && (
          <Button variant="contained" onClick={handleCraft}>
            制作
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ItemDetailDialog;