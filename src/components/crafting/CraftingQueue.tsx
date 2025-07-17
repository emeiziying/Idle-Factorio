import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  LinearProgress,
  Box,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { removeFromQueue } from '../../store/slices/craftingSlice';
import { recipesById, itemsById } from '../../data';
import { formatTime } from '../../utils/format';

export const CraftingQueue: React.FC = () => {
  const dispatch = useAppDispatch();
  const queue = useAppSelector(state => state.crafting.queue);
  const maxSlots = useAppSelector(state => state.crafting.maxSlots);
  
  const handleRemove = (id: string) => {
    dispatch(removeFromQueue(id));
  };
  
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
            const recipe = recipesById[item.recipeId];
            if (!recipe) return null;
            
            const product = recipe.products[0];
            const productItem = itemsById[product.itemId];
            const totalTime = recipe.time * item.quantity;
            const remainingTime = item.status === 'crafting' 
              ? totalTime * (1 - item.progress / 100) 
              : totalTime;
            
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
                      </Typography>
                      <Chip
                        label={
                          item.status === 'crafting' ? '制作中' :
                          item.status === 'completed' ? '完成' : '等待'
                        }
                        size="small"
                        color={
                          item.status === 'crafting' ? 'primary' :
                          item.status === 'completed' ? 'success' : 'default'
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
                          value={item.progress}
                          sx={{ mt: 1 }}
                        />
                      )}
                    </Box>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      )}
    </Paper>
  );
};