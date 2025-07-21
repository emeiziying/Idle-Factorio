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
import { CraftingService } from '../services/CraftingService';
import { useGameStore } from '../store/gameStore';
import GameIcon from './GameIcon';
import QuickCraftButtons from './QuickCraftButtons';
import { formatNumber, formatTime } from '../utils/format';

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
  const craftingService = CraftingService.getInstance();
  const inventory = useGameStore(state => state.inventory);
  const updateInventory = useGameStore(state => state.updateInventory);
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

  const handleCraft = async () => {
    if (!selectedRecipe) return;

    const result = await craftingService.startCrafting(selectedRecipe.id, craftAmount);
    setMessage({ 
      type: result.success ? 'success' : 'error', 
      text: result.message 
    });

    if (result.success) {
      // 重置制作数量
      setCraftAmount(1);
    }
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
            库存: {formatNumber(getInventoryItem(item.id)?.currentAmount || 0)} / {formatNumber(item.stack_size || 999)}
          </Typography>
          {item.description && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {item.description}
            </Typography>
          )}
          {item.fuel_value && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              燃料值: {item.fuel_value}
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
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                          {Object.entries(recipe.in).map(([itemId, amount]) => {
                            const inventoryItem = getInventoryItem(itemId);
                            const available = inventoryItem?.currentAmount || 0;
                            const hasEnough = available >= amount * craftAmount;
                            return (
                              <Chip
                                key={itemId}
                                label={`${itemId} x${amount} (${formatNumber(available)})`}
                                size="small"
                                color={hasEnough ? 'success' : 'error'}
                                variant="outlined"
                              />
                            );
                          })}
                        </Box>
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                          产出: {Object.entries(recipe.out).map(([id, amount]) => `${id} x${amount}`).join(', ')}
                        </Typography>
                        <Typography variant="caption" display="block">
                          时间: {recipe.time}秒 | 效率: {(60 / recipe.time).toFixed(1)}/分钟
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>

            {selectedRecipe && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>制作数量:</Typography>
                <QuickCraftButtons 
                  currentAmount={craftAmount}
                  onSelectAmount={setCraftAmount}
                />
                <Box display="flex" alignItems="center" gap={2} sx={{ mt: 1 }}>
                  <Box display="flex" alignItems="center" gap={1} sx={{ flex: 1 }}>
                    <IconButton size="small" onClick={() => handleAmountChange(-1)}>
                      <RemoveIcon />
                    </IconButton>
                    <TextField
                      value={craftAmount}
                      onChange={(e) => setCraftAmount(Math.max(1, Math.min(999, parseInt(e.target.value) || 1)))}
                      size="small"
                      type="number"
                      sx={{ width: 100 }}
                      fullWidth
                    />
                    <IconButton size="small" onClick={() => handleAmountChange(1)}>
                      <AddIcon />
                    </IconButton>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    总时间: {formatTime(selectedRecipe.time * craftAmount)}
                  </Typography>
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