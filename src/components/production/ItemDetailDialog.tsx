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
  Grid,
  IconButton,
  Chip,
  Snackbar,
  Alert
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon } from '@mui/icons-material';
import type { Item, Recipe } from '../../types/index';
import DataService from '../../services/DataService';
import useGameStore from '../../store/gameStore';
import FactorioIcon from '../common/FactorioIcon';
import { useIsMobile } from '../../hooks/useIsMobile';
import ManualCraftingValidator from '../../utils/manualCraftingValidator';

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
  const [showMessage, setShowMessage] = useState<{ open: boolean; message: string; severity: 'error' | 'warning' | 'info' | 'success' }>({
    open: false,
    message: '',
    severity: 'info'
  });
  const { getInventoryItem, addCraftingTask } = useGameStore();
  const isMobile = useIsMobile();
  const dataService = DataService.getInstance();

  const inventoryItem = getInventoryItem(item.id);

  useEffect(() => {
    if (item) {
      const itemRecipes = dataService.getRecipesForItem(item.id);
      const usageRecipes = dataService.getRecipesUsingItem(item.id);
      // 过滤掉producers全部未解锁的配方
      const isProducerUnlocked = (recipe: Recipe) => {
        if (!recipe.producers || recipe.producers.length === 0) return true;
        return recipe.producers.some((pid: string) => dataService.isItemUnlocked(pid));
      };
      setRecipes(itemRecipes.filter(isProducerUnlocked));
      setUsedInRecipes(usageRecipes.filter(isProducerUnlocked));
    }
  }, [item, dataService]);

  const handleCraft = (recipe: Recipe, quantity: number = 1) => {
    // 检查材料是否足够
    const canCraft = Object.entries(recipe.in).every(([itemId, required]) => {
      const available = getInventoryItem(itemId).currentAmount;
      return available >= required * quantity;
    });

    if (!canCraft) {
      setShowMessage({
        open: true,
        message: '材料不足，无法制作',
        severity: 'error'
      });
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
      setShowMessage({
        open: true,
        message: '制作队列已满',
        severity: 'warning'
      });
    }
  };

  const handleManualCraft = (quantity: number = 1) => {
    // 获取物品的第一个配方作为手动合成配方
    const itemRecipes = dataService.getRecipesForItem(item.id);
    
    // 如果物品没有配方（原材料），直接添加到制作队列
    if (itemRecipes.length === 0) {
      const success = addCraftingTask({
        recipeId: `manual_${item.id}`, // 使用特殊前缀标识手动合成
        itemId: item.id,
        quantity,
        progress: 0,
        startTime: Date.now(),
        craftingTime: 0, // 手动合成时间设为0
        status: 'pending'
      });

      if (success) {
        console.log(`Added manual crafting task: ${item.id} x${quantity}`);
        setShowMessage({
          open: true,
          message: `已添加手动合成任务: ${dataService.getLocalizedItemName(item.id)} x${quantity}`,
          severity: 'success'
        });
      } else {
        setShowMessage({
          open: true,
          message: '制作队列已满',
          severity: 'warning'
        });
      }
      return;
    }

    const recipe = itemRecipes[0]; // 使用第一个配方

    // 检查材料是否足够
    const canCraft = Object.entries(recipe.in).every(([itemId, required]) => {
      const available = getInventoryItem(itemId).currentAmount;
      return available >= required * quantity;
    });

    if (!canCraft) {
      setShowMessage({
        open: true,
        message: '材料不足，无法手动合成',
        severity: 'error'
      });
      return;
    }

    // 添加到制作队列
    const success = addCraftingTask({
      recipeId: recipe.id, // 使用实际配方ID
      itemId: item.id,
      quantity,
      progress: 0,
      startTime: Date.now(),
      craftingTime: recipe.time * 1000, // 使用配方时间
      status: 'pending'
    });

    if (success) {
      console.log(`Added manual crafting task: ${item.id} x${quantity}`);
      setShowMessage({
        open: true,
        message: `已添加手动合成任务: ${dataService.getLocalizedItemName(item.id)} x${quantity}`,
        severity: 'success'
      });
    } else {
      setShowMessage({
        open: true,
        message: '制作队列已满',
        severity: 'warning'
      });
    }
  };

  const formatTime = (seconds: number) => {
    return `${seconds}秒`;
  };

  // 获取本地化的物品名称
  const getLocalizedItemName = (itemId: string): string => {
    return dataService.getLocalizedItemName(itemId);
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
        <FactorioIcon itemId={item.id} size={isMobile ? 28 : 32} />
        <Box flex={1}>
          <Typography variant={isMobile ? "h6" : "h6"} sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
            {getLocalizedItemName(item.id)}
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
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              制作配方
            </Typography>
            
            {/* 手动合成配方 */}
            {(() => {
              const itemRecipes = dataService.getRecipesForItem(item.id);
              const validator = ManualCraftingValidator.getInstance();
              
              // 如果物品没有配方（原材料），显示无需材料
              if (itemRecipes.length === 0) {
                return (
                  <Box sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" fontWeight="bold" color="primary.main">
                        手动合成
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        立即完成
                      </Typography>
                    </Box>

                    {/* 输入材料 */}
                    <Typography variant="caption" color="text.secondary">
                      需要材料:
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        无需材料
                      </Typography>
                    </Box>

                    {/* 输出产品 */}
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      输出产品:
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                      <FactorioIcon itemId={item.id} size={24} />
                      <Typography variant="body2">
                        {dataService.getLocalizedItemName(item.id)} x1
                      </Typography>
                    </Box>

                    {/* 制作时间 */}
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      制作时间: 0秒
                    </Typography>

                    {/* 制作按钮 */}
                    <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                      <Button
                        size={isMobile ? "medium" : "small"}
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleManualCraft(1)}
                        sx={{ 
                          fontSize: isMobile ? '0.8rem' : '0.875rem',
                          minWidth: 'auto',
                          px: isMobile ? 1 : 1.5
                        }}
                      >
                        x1
                      </Button>
                      <Button
                        size={isMobile ? "medium" : "small"}
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleManualCraft(5)}
                        sx={{ 
                          fontSize: isMobile ? '0.8rem' : '0.875rem',
                          minWidth: 'auto',
                          px: isMobile ? 1 : 1.5
                        }}
                      >
                        x5
                      </Button>
                    </Box>
                  </Box>
                );
              }
              
              // 使用验证器检查哪些配方可以手动制作 - 优化版本
              const recipeValidations = itemRecipes.map(recipe => ({
                recipe,
                validation: validator.validateRecipe(recipe)
              }));
              
              const manualCraftableRecipes = recipeValidations
                .filter(({ validation }) => validation.canCraftManually)
                .map(({ recipe }) => recipe);

              const restrictedRecipes = recipeValidations
                .filter(({ validation }) => !validation.canCraftManually && validation.category === 'restricted')
                .map(({ recipe }) => recipe);

              // 如果有可手动制作的配方，显示第一个
              if (manualCraftableRecipes.length > 0) {
                const recipe = manualCraftableRecipes[0];
                const canCraft = Object.entries(recipe.in).every(([itemId, required]) => {
                  const available = getInventoryItem(itemId).currentAmount;
                  return available >= required;
                });

                return (
                  <Box sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" fontWeight="bold" color="primary.main">
                        手动合成
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {recipe.time}秒
                      </Typography>
                    </Box>

                    {/* 输入材料 */}
                    <Typography variant="caption" color="text.secondary">
                      需要材料:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1} mt={0.5}>
                      {Object.entries(recipe.in).map(([itemId, required]) => {
                        const available = getInventoryItem(itemId).currentAmount;
                        const hasEnough = available >= required;
                        return (
                          <Box key={itemId} display="flex" alignItems="center" gap={0.5}>
                            <FactorioIcon itemId={itemId} size={20} />
                            <Typography 
                              variant="body2" 
                              color={hasEnough ? "text.primary" : "error.main"}
                            >
                              {dataService.getLocalizedItemName(itemId)} x{required}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ({available})
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>

                    {/* 输出产品 */}
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      输出产品:
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                      <FactorioIcon itemId={item.id} size={24} />
                      <Typography variant="body2">
                        {dataService.getLocalizedItemName(item.id)} x{recipe.out[item.id] || 1}
                      </Typography>
                    </Box>

                    {/* 制作时间 */}
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      制作时间: {recipe.time}秒
                    </Typography>

                    {/* 制作按钮 */}
                    <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                      <Button
                        size={isMobile ? "medium" : "small"}
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleManualCraft(1)}
                        disabled={!canCraft}
                        sx={{ 
                          fontSize: isMobile ? '0.8rem' : '0.875rem',
                          minWidth: 'auto',
                          px: isMobile ? 1 : 1.5
                        }}
                      >
                        x1
                      </Button>
                      <Button
                        size={isMobile ? "medium" : "small"}
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleManualCraft(5)}
                        disabled={!canCraft}
                        sx={{ 
                          fontSize: isMobile ? '0.8rem' : '0.875rem',
                          minWidth: 'auto',
                          px: isMobile ? 1 : 1.5
                        }}
                      >
                        x5
                      </Button>
                    </Box>
                  </Box>
                );
              }

              // 如果没有可手动制作的配方，但有需要特定生产者的配方，显示提示
              if (restrictedRecipes.length > 0) {
                const recipe = restrictedRecipes[0];
                const validation = validator.validateRecipe(recipe);
                
                return (
                  <Box sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" fontWeight="bold" color="warning.main">
                        需要生产设备
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {recipe.time}秒
                      </Typography>
                    </Box>

                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        {validation.reason}
                      </Typography>
                      {recipe.producers && recipe.producers.length > 0 && (
                        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                          需要设备: {recipe.producers.join(', ')}
                        </Typography>
                      )}
                    </Alert>

                    {/* 输入材料 */}
                    <Typography variant="caption" color="text.secondary">
                      需要材料:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1} mt={0.5}>
                      {Object.entries(recipe.in).map(([itemId, required]) => {
                        const available = getInventoryItem(itemId).currentAmount;
                        const hasEnough = available >= required;
                        return (
                          <Box key={itemId} display="flex" alignItems="center" gap={0.5}>
                            <FactorioIcon itemId={itemId} size={20} />
                            <Typography 
                              variant="body2" 
                              color={hasEnough ? "text.primary" : "error.main"}
                            >
                              {dataService.getLocalizedItemName(itemId)} x{required}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ({available})
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>

                    {/* 输出产品 */}
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      输出产品:
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                      <FactorioIcon itemId={item.id} size={24} />
                      <Typography variant="body2">
                        {dataService.getLocalizedItemName(item.id)} x{recipe.out[item.id] || 1}
                      </Typography>
                    </Box>

                    {/* 制作时间 */}
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      制作时间: {recipe.time}秒
                    </Typography>

                    {/* 提示：需要在设施模块中生产 */}
                    <Box mt={2}>
                      <Typography variant="body2" color="text.secondary">
                        请在设施模块中配置相应的生产设备来制作此物品。
                      </Typography>
                    </Box>
                  </Box>
                );
              }

              // 如果没有任何配方，显示默认信息
              return (
                <Box sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="body2" color="text.secondary">
                    此物品没有可用的制作配方。
                  </Typography>
                </Box>
              );
            })()}
            
            {/* 生产设备配方 */}
            {(() => {
              const itemRecipes = dataService.getRecipesForItem(item.id);
              const validator = ManualCraftingValidator.getInstance();
              
              // 获取需要生产设备的配方
              const producerRecipes = itemRecipes.filter(recipe => {
                const validation = validator.validateRecipe(recipe);
                return !validation.canCraftManually && validation.category === 'restricted';
              });

              // 检查producer解锁状态
              const isProducerUnlocked = (recipe: Recipe) => {
                if (!recipe.producers || recipe.producers.length === 0) return true;
                return recipe.producers.some((pid: string) => dataService.isItemUnlocked(pid));
              };

              // 过滤出已解锁的producer配方
              const unlockedProducerRecipes = producerRecipes.filter(isProducerUnlocked);

              if (unlockedProducerRecipes.length === 0) {
                return null; // 没有解锁的producer配方，不显示此区域
              }

              return (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom color="secondary.main">
                    生产设备配方
                  </Typography>
                  
                  {unlockedProducerRecipes.map((recipe) => {
                    const canCraft = Object.entries(recipe.in).every(([itemId, required]) => {
                      const available = getInventoryItem(itemId).currentAmount;
                      return available >= required;
                    });

                    return (
                      <Box key={recipe.id} sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="body2" fontWeight="bold" color="secondary.main">
                            {dataService.getLocalizedRecipeName(recipe.id)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {recipe.time}秒
                          </Typography>
                        </Box>

                        {/* 生产设备信息 */}
                        {recipe.producers && recipe.producers.length > 0 && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              生产设备:
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={1} mt={0.5}>
                              {recipe.producers.map((producerId) => (
                                <Chip
                                  key={producerId}
                                  icon={<FactorioIcon itemId={producerId} size={16} />}
                                  label={dataService.getLocalizedItemName(producerId)}
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </Box>
                        )}

                        {/* 输入材料 */}
                        <Typography variant="caption" color="text.secondary">
                          需要材料:
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1} mt={0.5}>
                          {Object.entries(recipe.in).map(([itemId, required]) => {
                            const available = getInventoryItem(itemId).currentAmount;
                            const hasEnough = available >= required;
                            return (
                              <Box key={itemId} display="flex" alignItems="center" gap={0.5}>
                                <FactorioIcon itemId={itemId} size={20} />
                                <Typography 
                                  variant="body2" 
                                  color={hasEnough ? "text.primary" : "error.main"}
                                >
                                  {dataService.getLocalizedItemName(itemId)} x{required}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ({available})
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>

                        {/* 输出产品 */}
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          输出产品:
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                          <FactorioIcon itemId={item.id} size={24} />
                          <Typography variant="body2">
                            {dataService.getLocalizedItemName(item.id)} x{recipe.out[item.id] || 1}
                          </Typography>
                        </Box>

                        {/* 制作时间 */}
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          制作时间: {recipe.time}秒
                        </Typography>

                        {/* 制作按钮 */}
                        <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                          <Button
                            size={isMobile ? "medium" : "small"}
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => handleCraft(recipe, 1)}
                            disabled={!canCraft}
                            sx={{ 
                              fontSize: isMobile ? '0.8rem' : '0.875rem',
                              minWidth: 'auto',
                              px: isMobile ? 1 : 1.5
                            }}
                          >
                            x1
                          </Button>
                          <Button
                            size={isMobile ? "medium" : "small"}
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => handleCraft(recipe, 5)}
                            disabled={!canCraft}
                            sx={{ 
                              fontSize: isMobile ? '0.8rem' : '0.875rem',
                              minWidth: 'auto',
                              px: isMobile ? 1 : 1.5
                            }}
                          >
                            x5
                          </Button>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              );
            })()}
            
            {/* 其他配方 */}
            {recipes.map((recipe) => (
              <Box key={recipe.id} sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" fontWeight="bold">
                    {dataService.getLocalizedRecipeName(recipe.id)}
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
                    const available = getInventoryItem(itemId).currentAmount;
                    const sufficient = available >= quantity;
                    
                    return (
                      <Chip
                        key={itemId}
                        icon={<FactorioIcon itemId={itemId} size={16} />}
                        label={`${getLocalizedItemName(itemId)} x${quantity}`}
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
                    return (
                      <Chip
                        key={itemId}
                        icon={<FactorioIcon itemId={itemId} size={16} />}
                        label={`${getLocalizedItemName(itemId)} x${quantity}`}
                        size="small"
                        color="primary"
                        variant="filled"
                      />
                    );
                  })}
                </Box>

                {/* 制作按钮 */}
                <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                  <Button
                    size={isMobile ? "medium" : "small"}
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleCraft(recipe, 1)}
                    sx={{ 
                      fontSize: isMobile ? '0.8rem' : '0.875rem',
                      minWidth: 'auto',
                      px: isMobile ? 1 : 1.5
                    }}
                  >
                    x1
                  </Button>
                  <Button
                    size={isMobile ? "medium" : "small"}
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleCraft(recipe, 5)}
                    sx={{ 
                      fontSize: isMobile ? '0.8rem' : '0.875rem',
                      minWidth: 'auto',
                      px: isMobile ? 1 : 1.5
                    }}
                  >
                    x5
                  </Button>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>

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
                  return (
                    <Chip
                      key={recipe.id}
                      icon={<FactorioIcon itemId={outputItemId} size={16} />}
                      label={getLocalizedItemName(outputItemId)}
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

      {/* 消息提示 */}
      <Snackbar
        open={showMessage.open}
        autoHideDuration={4000}
        onClose={() => setShowMessage(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowMessage(prev => ({ ...prev, open: false }))} 
          severity={showMessage.severity}
          sx={{ width: '100%' }}
        >
          {showMessage.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default ItemDetailDialog;