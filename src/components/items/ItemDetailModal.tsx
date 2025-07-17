import React, { useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { closeModal } from '../../store/slices/uiSlice';
import { addToQueue } from '../../store/slices/craftingSlice';
import { itemsById, getRecipesForItem } from '../../data';
import { formatNumber, formatRate, formatTime, formatPercentage } from '../../utils/format';

export const ItemDetailModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const modalOpen = useAppSelector(state => state.ui.modalOpen);
  const selectedItemId = useAppSelector(state => state.ui.selectedItem);
  const inventory = useAppSelector(state => state.inventory.stocks);
  const productionData = useAppSelector(state => state.production);
  
  const item = selectedItemId ? itemsById[selectedItemId] : null;
  const stock = selectedItemId ? (inventory[selectedItemId] || 0) : 0;
  const producers = selectedItemId ? (productionData.producers[selectedItemId] || []) : [];
  const consumers = selectedItemId ? (productionData.consumers[selectedItemId] || []) : [];
  const rate = selectedItemId ? productionData.rates[selectedItemId] : null;
  
  const recipes = useMemo(() => {
    if (!selectedItemId) return [];
    return getRecipesForItem(selectedItemId);
  }, [selectedItemId]);
  
  // const usedInRecipes = useMemo(() => {
  //   if (!selectedItemId) return [];
  //   return getRecipesUsingItem(selectedItemId);
  // }, [selectedItemId]);
  
  const timeToEmpty = useMemo(() => {
    if (!rate || rate.net >= 0) return -1;
    return stock / Math.abs(rate.net);
  }, [stock, rate]);
  
  const handleClose = () => {
    dispatch(closeModal());
  };
  
  const handleCraft = (recipeId: string) => {
    dispatch(addToQueue({ recipeId, quantity: 1 }));
  };
  
  if (!item) return null;
  
  return (
    <Dialog
      open={modalOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">{item.name}</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* 基础信息 */}
          <Grid xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>基础信息</Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>类别</TableCell>
                    <TableCell>{item.category}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>堆叠大小</TableCell>
                    <TableCell>{item.stackSize}</TableCell>
                  </TableRow>
                  {item.description && (
                    <TableRow>
                      <TableCell>描述</TableCell>
                      <TableCell>{item.description}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
          
          {/* 生产统计 */}
          <Grid xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>生产统计</Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>当前库存</TableCell>
                    <TableCell>
                      <Typography variant="h6" color="primary">
                        {formatNumber(stock)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>产量</TableCell>
                    <TableCell>{formatRate(rate?.production || 0)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>消耗量</TableCell>
                    <TableCell>{formatRate(rate?.consumption || 0)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>净增量</TableCell>
                    <TableCell>
                      <Typography
                        color={rate && rate.net > 0 ? 'success.main' : rate && rate.net < 0 ? 'error.main' : 'inherit'}
                      >
                        {rate ? (rate.net > 0 ? '+' : '') + formatRate(rate.net) : '0/秒'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                  {timeToEmpty > 0 && (
                    <TableRow>
                      <TableCell>剩余可用时间</TableCell>
                      <TableCell color="error">{formatTime(timeToEmpty)}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
          
                      {/* 配方信息 */}
            {recipes.length > 0 && (
              <Grid xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>配方</Typography>
                {recipes.map(recipe => (
                  <Box key={recipe.id} sx={{ mb: 2 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="body2">
                          {recipe.ingredients.map((ing, idx) => (
                            <span key={ing.itemId}>
                              {idx > 0 && ' + '}
                              {ing.amount} {itemsById[ing.itemId]?.name || ing.itemId}
                            </span>
                          ))}
                          {' → '}
                          {recipe.products.map((prod, idx) => (
                            <span key={prod.itemId}>
                              {idx > 0 && ' + '}
                              {prod.amount} {itemsById[prod.itemId]?.name || prod.itemId}
                            </span>
                          ))}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          时间: {recipe.time}秒
                        </Typography>
                      </Box>
                      {recipe.handCraftable && (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => handleCraft(recipe.id)}
                        >
                          手动制作
                        </Button>
                      )}
                    </Box>
                                                                     </Box>
               ))}
             </Paper>
           </Grid>
         )}
         
                                       {/* 生产者列表 */}
           {producers.length > 0 && (
             <Grid xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>生产者</Typography>
                <Table size="small">
                  <TableBody>
                    {producers.map((producer, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{producer.machineType}</TableCell>
                        <TableCell>{producer.count} 个</TableCell>
                        <TableCell>{formatRate(producer.rate * producer.count)}</TableCell>
                        <TableCell>{formatPercentage(producer.efficiency)}</TableCell>
                      </TableRow>
                    ))}
                                                                     </TableBody>
               </Table>
             </Paper>
           </Grid>
         )}
         
                                       {/* 消费者列表 */}
           {consumers.length > 0 && (
             <Grid xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>消耗明细</Typography>
                <Table size="small">
                  <TableBody>
                    {consumers.map((consumer, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{consumer.productName}</TableCell>
                        <TableCell>{consumer.machineType}</TableCell>
                        <TableCell>{formatRate(consumer.rate)}</TableCell>
                        <TableCell>{formatPercentage(consumer.percentage)}</TableCell>
                      </TableRow>
                    ))}
                                                                     </TableBody>
               </Table>
             </Paper>
           </Grid>
         )}
       </Grid>
      </DialogContent>
    </Dialog>
  );
};