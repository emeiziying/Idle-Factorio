import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  IconButton
} from '@mui/material';
import FactorioIcon from '../common/FactorioIcon';
import DataService from '../../services/DataService';
import useGameStore from '../../store/gameStore';
import { useIsMobile } from '../../hooks/useIsMobile';

const CraftingQueue: React.FC = () => {
  const craftingQueue = useGameStore((state) => state.craftingQueue);
  const removeCraftingTask = useGameStore((state) => state.removeCraftingTask);
  const isMobile = useIsMobile();

  if (craftingQueue.length === 0) {
    return null;
  }

  const dataService = DataService.getInstance();

  return (
    <Card sx={{ mb: isMobile ? 1.5 : 2 }}>
      <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
          制作队列 ({craftingQueue.length}/50)
        </Typography>
        
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, ${isMobile ? 64 : 80}px)`,
            gap: isMobile ? 0.8 : 1.2,
            justifyContent: 'start'
          }}
        >
          {craftingQueue.map((task) => {
            const recipe = dataService.getRecipe(task.recipeId);
            const item = dataService.getItem(task.itemId);
            
            if (!recipe || !item) return null;

            return (
              <Box 
                key={task.id} 
                sx={{ 
                  position: 'relative',
                  cursor: 'pointer',
                  '&:hover': {
                    '& .cancel-button': {
                      opacity: 1,
                    }
                  }
                }}
                onClick={() => removeCraftingTask(task.id)}
              >
                {/* 环形进度条 */}
                <Box
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: isMobile ? 64 : 80,
                    height: isMobile ? 64 : 80,
                  }}
                >
                  {/* 背景圆环 */}
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={isMobile ? 64 : 80}
                    thickness={2}
                    sx={{
                      position: 'absolute',
                      color: 'rgba(255, 255, 255, 0.1)',
                      zIndex: 1,
                    }}
                  />
                  
                  {/* 进度圆环 */}
                  <CircularProgress
                    variant="determinate"
                    value={task.progress}
                    size={isMobile ? 64 : 80}
                    thickness={2}
                    sx={{
                      position: 'absolute',
                      color: 'primary.main',
                      zIndex: 2,
                      transform: 'rotate(-90deg) !important',
                      '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round',
                      },
                    }}
                  />

                  {/* 物品图标 */}
                  <Box 
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      zIndex: 3,
                    }}
                  >
                    <FactorioIcon 
                      itemId={task.itemId} 
                      size={isMobile ? 40 : 48} 
                      quantity={task.quantity > 1 ? task.quantity : undefined}
                    />
                  </Box>
                </Box>

                {/* 取消按钮 */}
                <IconButton
                  className="cancel-button"
                  size="small"
                  sx={{ 
                    position: 'absolute',
                    top: -3,
                    right: -3,
                    bgcolor: 'error.main',
                    color: 'white',
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                    width: isMobile ? 16 : 20,
                    height: isMobile ? 16 : 20,
                    '&:hover': {
                      bgcolor: 'error.dark',
                      opacity: 1,
                    }
                  }}
                >
                  ×
                </IconButton>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CraftingQueue;