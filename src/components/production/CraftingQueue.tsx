import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  IconButton
} from '@mui/material';
import useGameStore from '../../store/gameStore';
import DataService from '../../services/DataService';
import FactorioIcon from '../common/FactorioIcon';
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
            gridTemplateColumns: `repeat(auto-fill, ${isMobile ? 40 : 55}px)`,
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
                {/* 物品图标 */}
                <Box 
                  sx={{ 
                    width: isMobile ? 40 : 55,
                    height: isMobile ? 40 : 55,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <FactorioIcon itemId={task.itemId} size={isMobile ? 24 : 32} />
                  
                  {/* 数量显示 */}
                  {task.quantity > 1 && (
                    <Typography
                      variant="caption"
                      sx={{
                        position: 'absolute',
                        top: 1,
                        right: 1,
                        fontSize: isMobile ? '6px' : '8px',
                        lineHeight: 1,
                        color: '#fff',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        fontWeight: 'bold',
                        bgcolor: 'rgba(0,0,0,0.6)',
                        borderRadius: '50%',
                        width: isMobile ? 12 : 14,
                        height: isMobile ? 12 : 14,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {task.quantity}
                    </Typography>
                  )}
                </Box>

                {/* 进度条 */}
                <LinearProgress
                  variant="determinate"
                  value={task.progress}
                  sx={{ 
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    borderRadius: '0 0 4px 4px',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: '0 0 4px 4px'
                    }
                  }}
                />

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