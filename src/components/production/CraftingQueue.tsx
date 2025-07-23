import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  IconButton,
  Chip
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import useGameStore from '../../store/gameStore';
import DataService from '../../services/DataService';
import GameIcon from '../common/GameIcon';
import { useIsMobile } from '../../hooks/useIsMobile';

const CraftingQueue: React.FC = () => {
  const craftingQueue = useGameStore((state) => state.craftingQueue);
  const removeCraftingTask = useGameStore((state) => state.removeCraftingTask);
  const isMobile = useIsMobile();

  if (craftingQueue.length === 0) {
    return null;
  }

  const dataService = DataService.getInstance();

  const formatTimeRemaining = (task: any) => {
    if (task.status === 'completed') return '已完成';
    if (task.status === 'pending') return '等待中';
    
    const totalTime = task.craftingTime * 1000; // 转换为毫秒
    const elapsed = Date.now() - task.startTime;
    const remaining = Math.max(0, totalTime - elapsed);
    return `${Math.ceil(remaining / 1000)}秒`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'crafting': return 'primary';
      case 'pending': return 'default';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  return (
    <Card sx={{ mb: isMobile ? 1.5 : 2 }}>
      <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
          制作队列 ({craftingQueue.length}/10)
        </Typography>
        
        {craftingQueue.map((task, index) => {
          const recipe = dataService.getRecipe(task.recipeId);
          const item = dataService.getItem(task.itemId);
          
          if (!recipe || !item) return null;

          return (
            <Box 
              key={task.id} 
              sx={{ 
                mb: isMobile ? 1.5 : 2, 
                pb: isMobile ? 1.5 : 2, 
                borderBottom: index < craftingQueue.length - 1 ? 1 : 0, 
                borderColor: 'divider' 
              }}
            >
              <Box display="flex" alignItems="center" gap={isMobile ? 1.5 : 2}>
                <GameIcon itemId={task.itemId} size={isMobile ? 28 : 32} />
                
                <Box flex={1}>
                  <Typography 
                    variant="body2" 
                    fontWeight="bold"
                    sx={{ fontSize: isMobile ? '0.85rem' : '0.875rem' }}
                  >
                    {item.name} x{task.quantity}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
                  >
                    {recipe.name}
                  </Typography>
                  
                  <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                    <LinearProgress
                      variant="determinate"
                      value={task.progress}
                      sx={{ 
                        flex: 1, 
                        height: isMobile ? 4 : 6, 
                        borderRadius: 3 
                      }}
                    />
                    <Typography 
                      variant="caption" 
                      color="text.secondary" 
                      sx={{ 
                        minWidth: isMobile ? 35 : 50,
                        fontSize: isMobile ? '0.7rem' : '0.75rem'
                      }}
                    >
                      {Math.round(task.progress)}%
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" flexDirection={isMobile ? "row" : "column"} alignItems="flex-end" gap={0.5}>
                  <Chip
                    label={formatTimeRemaining(task)}
                    size="small"
                    color={getStatusColor(task.status) as any}
                    variant="outlined"
                    sx={{ 
                      fontSize: isMobile ? '0.65rem' : '0.75rem',
                      height: isMobile ? 20 : 24
                    }}
                  />
                  
                  <IconButton
                    size={isMobile ? "medium" : "small"}
                    onClick={() => removeCraftingTask(task.id)}
                    sx={{ 
                      opacity: 0.7, 
                      '&:hover': { opacity: 1 },
                      p: isMobile ? 0.5 : 1
                    }}
                  >
                    <DeleteIcon fontSize={isMobile ? "medium" : "small"} />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default CraftingQueue;