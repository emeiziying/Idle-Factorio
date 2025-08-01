import React, { useMemo } from 'react'

import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material'

import { getRecipesForItem, itemsById, recipesById } from '../../data'
import { useAppDispatch, useAppSelector } from '../../hooks'
import { addToQueue } from '../../store/slices/craftingSlice'
import { closeModal } from '../../store/slices/uiSlice'
import { formatNumber, formatPercentage, formatRate, formatTime } from '../../utils/format'

export const ItemDetailModal: React.FC = () => {
  const dispatch = useAppDispatch()
  const modalOpen = useAppSelector((state) => state.ui.modalOpen)
  const selectedItemId = useAppSelector((state) => state.ui.selectedItem)
  const inventory = useAppSelector((state) => state.inventory.stocks)
  const productionData = useAppSelector((state) => state.production)

  const item = selectedItemId ? itemsById[selectedItemId] : null
  const stock = selectedItemId ? inventory[selectedItemId] || 0 : 0
  const producers = selectedItemId ? productionData.producers[selectedItemId] || [] : []
  const consumers = selectedItemId ? productionData.consumers[selectedItemId] || [] : []
  const rate = selectedItemId ? productionData.rates[selectedItemId] : null

  const recipes = useMemo(() => {
    if (!selectedItemId) return []
    return getRecipesForItem(selectedItemId)
  }, [selectedItemId])

  // const usedInRecipes = useMemo(() => {
  //   if (!selectedItemId) return [];
  //   return getRecipesUsingItem(selectedItemId);
  // }, [selectedItemId]);

  const timeToEmpty = useMemo(() => {
    if (!rate || rate.net >= 0) return -1
    return stock / Math.abs(rate.net)
  }, [stock, rate])

  const handleClose = () => {
    dispatch(closeModal())
  }

  const handleCraft = (recipeId: string, quantity: number = 1) => {
    const recipe = recipesById[recipeId]
    if (!recipe) return

    // 检查原料是否充足
    let hasEnoughMaterials = true
    let missingMaterial = ''

    for (const ingredient of recipe.ingredients) {
      const required = ingredient.amount * quantity
      const available = inventory[ingredient.itemId] || 0
      if (available < required) {
        hasEnoughMaterials = false
        missingMaterial = itemsById[ingredient.itemId]?.name || ingredient.itemId
        break
      }
    }

    if (!hasEnoughMaterials) {
      // TODO: 显示错误提示
      console.warn(`材料不足: ${missingMaterial}`)
      return
    }

    dispatch(addToQueue({ recipeId, quantity }))
  }

  if (!item) return null

  return (
    <Dialog open={modalOpen} onClose={handleClose} maxWidth="md" fullWidth>
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
              <Typography variant="subtitle2" gutterBottom>
                基础信息
              </Typography>
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
              <Typography variant="subtitle2" gutterBottom>
                生产统计
              </Typography>
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
                        color={
                          rate && rate.net > 0
                            ? 'success.main'
                            : rate && rate.net < 0
                              ? 'error.main'
                              : 'inherit'
                        }
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
                <Typography variant="subtitle2" gutterBottom>
                  配方
                </Typography>
                {recipes.map((recipe) => {
                  // 检查是否有足够的材料
                  const hasEnoughMaterials = recipe.ingredients.every(
                    (ing) => (inventory[ing.itemId] || 0) >= ing.amount,
                  )

                  return (
                    <Box key={recipe.id} sx={{ mb: 2 }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="body2">
                            {recipe.ingredients.map((ing, idx) => {
                              const hasEnough = (inventory[ing.itemId] || 0) >= ing.amount
                              return (
                                <span
                                  key={ing.itemId}
                                  style={{ color: hasEnough ? 'inherit' : '#f44336' }}
                                >
                                  {idx > 0 && ' + '}
                                  {ing.amount} {itemsById[ing.itemId]?.name || ing.itemId}
                                  {!hasEnough &&
                                    ` (缺少 ${ing.amount - (inventory[ing.itemId] || 0)})`}
                                </span>
                              )
                            })}
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
                            disabled={!hasEnoughMaterials}
                          >
                            手动制作
                          </Button>
                        )}
                      </Box>
                    </Box>
                  )
                })}
              </Paper>
            </Grid>
          )}

          {/* 生产者列表 */}
          {producers.length > 0 && (
            <Grid xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  生产者
                </Typography>
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
                <Typography variant="subtitle2" gutterBottom>
                  消耗明细
                </Typography>
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
  )
}
