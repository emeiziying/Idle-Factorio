import React from 'react'

import DeleteIcon from '@mui/icons-material/Delete'
import {
  Box,
  Chip,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material'

import { itemsById, recipesById } from '../../data'
import { useAppDispatch, useAppSelector } from '../../hooks'
import { removeFromQueue } from '../../store/slices/craftingSlice'
import { addItem } from '../../store/slices/inventorySlice'
import { formatTime } from '../../utils/format'

export const CraftingQueue: React.FC = () => {
  const dispatch = useAppDispatch()
  const queue = useAppSelector((state) => state.crafting.queue)
  const maxSlots = useAppSelector((state) => state.crafting.maxSlots)

  const handleRemove = (id: string) => {
    // 找到要取消的物品
    const item = queue.find((q) => q.id === id)
    if (!item) return

    const recipe = recipesById[item.recipeId]
    if (!recipe) {
      dispatch(removeFromQueue(id))
      return
    }

    // 如果物品正在制作或等待，返还原料
    if (item.status === 'crafting' || item.status === 'waiting') {
      // 计算已完成的数量
      const completedItems =
        item.status === 'crafting' ? Math.floor((item.progress / 100) * item.quantity) : 0

      // 返还未完成部分的原料
      const remainingQuantity = item.quantity - completedItems
      if (remainingQuantity > 0) {
        recipe.ingredients.forEach((ingredient) => {
          dispatch(
            addItem({
              itemId: ingredient.itemId,
              amount: ingredient.amount * remainingQuantity,
            }),
          )
        })
      }
    }

    dispatch(removeFromQueue(id))
  }

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        制作队列 ({queue.length}/{maxSlots})
      </Typography>

      {queue.length === 0 ? (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
          队列为空
        </Typography>
      ) : (
        <List>
          {queue.map((item) => {
            const recipe = recipesById[item.recipeId]
            if (!recipe) return null

            const product = recipe.products[0]
            const productItem = itemsById[product.itemId]
            const timePerItem = recipe.time
            const totalTime = timePerItem * item.quantity

            // 计算当前物品的进度
            const completedItems = Math.floor((item.progress / 100) * item.quantity)
            const currentItemProgress =
              ((item.progress / 100) * item.quantity - completedItems) * 100

            // 计算剩余时间
            const remainingItems = item.quantity - completedItems
            const currentItemRemainingTime =
              item.status === 'crafting' && currentItemProgress > 0
                ? timePerItem * (1 - currentItemProgress / 100)
                : timePerItem
            const remainingTime =
              item.status === 'crafting'
                ? currentItemRemainingTime + (remainingItems - 1) * timePerItem
                : totalTime

            return (
              <ListItem
                key={item.id}
                secondaryAction={
                  <IconButton edge="end" onClick={() => handleRemove(item.id)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body1">
                        {productItem?.name || product.itemId} x{item.quantity}
                        {item.status === 'crafting' && completedItems > 0 && (
                          <Typography component="span" variant="caption" color="text.secondary">
                            {' '}
                            ({completedItems} 已完成)
                          </Typography>
                        )}
                      </Typography>
                      <Chip
                        label={
                          item.status === 'crafting'
                            ? '制作中'
                            : item.status === 'completed'
                              ? '完成'
                              : '等待'
                        }
                        size="small"
                        color={
                          item.status === 'crafting'
                            ? 'primary'
                            : item.status === 'completed'
                              ? 'success'
                              : 'default'
                        }
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        剩余时间: {formatTime(remainingTime / 1000)}
                      </Typography>
                      {item.status === 'crafting' && (
                        <LinearProgress
                          variant="determinate"
                          value={currentItemProgress}
                          sx={{ mt: 1 }}
                        />
                      )}
                    </Box>
                  }
                />
              </ListItem>
            )
          })}
        </List>
      )}
    </Paper>
  )
}
