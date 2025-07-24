import React, { useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  IconButton,
  Fade,
  Button
} from '@mui/material';
import { Clear as ClearIcon, Delete as DeleteIcon } from '@mui/icons-material';
import FactorioIcon from '../common/FactorioIcon';
import DataService from '../../services/DataService';
import useGameStore from '../../store/gameStore';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { CraftingTask } from '../../types/index';

// Constants
const QUEUE_CAPACITY = 50;
const MOBILE_ITEM_SIZE = 48;
const DESKTOP_ITEM_SIZE = 64;
const PROGRESS_BAR_HEIGHT = 4;
const GRID_GAP_MOBILE = 0.8;
const GRID_GAP_DESKTOP = 1.2;

// Sub-component for individual crafting queue items
interface CraftingQueueItemProps {
  task: CraftingTask;
  isMobile: boolean;
  onRemove: (taskId: string) => void;
}

const CraftingQueueItem: React.FC<CraftingQueueItemProps> = React.memo(({ task, isMobile, onRemove }) => {
  const dataService = DataService.getInstance();
  
  // Always call hooks first
  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(task.id);
  }, [task.id, onRemove]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // 移除键盘取消功能，因为现在只有取消按钮可以取消任务
    // 保留基本的焦点管理
    if (e.key === 'Escape') {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
  }, []);

  const recipe = dataService.getRecipe(task.recipeId);
  const item = dataService.getItem(task.itemId);
  
  // Handle missing data gracefully
  // 对于手动合成任务，不需要recipe数据
  const isManualTask = task.recipeId.startsWith('manual_');
  if (!item || (!isManualTask && !recipe)) {
    console.warn(`Missing data for task ${task.id}: recipe=${!!recipe}, item=${!!item}`);
    return null;
  }

  // Validate progress value
  const progress = Math.max(0, Math.min(100, task.progress || 0));  
  const itemSize = isMobile ? MOBILE_ITEM_SIZE : DESKTOP_ITEM_SIZE;
  const cancelButtonSize = isMobile ? 16 : 20;

  return (
    <Fade in timeout={300}>
      <Box 
        role="button"
        tabIndex={0}
        aria-label={`制作 ${item.name || task.itemId} - 进度 ${Math.round(progress)}%`}
        sx={{ 
          position: 'relative',
          cursor: 'default', // 改为default，因为不再可点击
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'scale(1.05)',
            '& .cancel-button': {
              opacity: 1,
            }
          },
          '&:focus': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: 2,
          }
        }}
        onKeyDown={handleKeyDown}
      >
        {/* 物品图标和进度条容器 */}
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: itemSize,
            height: itemSize,
          }}
        >
          {/* 物品图标 */}
          <FactorioIcon 
            itemId={task.itemId} 
            size={itemSize} 
            quantity={task.quantity > 1 ? task.quantity : undefined}
          />

          {/* 底部线性进度条 */}
          <LinearProgress
            variant="determinate"
            value={progress}
            aria-label={`制作进度 ${Math.round(progress)}%`}
            sx={{
              width: '100%',
              height: PROGRESS_BAR_HEIGHT,
              borderRadius: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s ease',
              '& .MuiLinearProgress-bar': {
                borderRadius: 2,
                transition: 'transform 0.3s ease',
              },
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
            }}
          />
        </Box>

        {/* 取消按钮 */}
        <IconButton
          className="cancel-button"
          size="small"
          aria-label="取消制作任务"
          onClick={handleRemove}
          sx={{ 
            position: 'absolute',
            top: -3,
            right: -3,
            bgcolor: 'error.main',
            color: 'white',
            opacity: 0,
            transition: 'all 0.2s ease',
            width: cancelButtonSize,
            height: cancelButtonSize,
            minWidth: 'unset',
            '&:hover': {
              bgcolor: 'error.dark',
              opacity: 1,
              transform: 'scale(1.1)',
            }
          }}
        >
          <ClearIcon sx={{ fontSize: cancelButtonSize - 4 }} />
        </IconButton>
      </Box>
    </Fade>
  );
});

CraftingQueueItem.displayName = 'CraftingQueueItem';

const CraftingQueue: React.FC = () => {
  const craftingQueue = useGameStore((state) => state.craftingQueue);
  const removeCraftingTask = useGameStore((state) => state.removeCraftingTask);
  const isMobile = useIsMobile();

  // Memoize the remove handler to prevent unnecessary re-renders
  const handleRemoveTask = useCallback((taskId: string) => {
    removeCraftingTask(taskId);
  }, [removeCraftingTask]);

  const handleClearAll = useCallback(() => {
    if (window.confirm('确定要清空所有制作任务吗？')) {
      // Clear all tasks by removing them one by one
      craftingQueue.forEach(task => removeCraftingTask(task.id));
    }
  }, [craftingQueue, removeCraftingTask]);

  // Memoize grid styles
  const gridStyles = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, ${isMobile ? MOBILE_ITEM_SIZE : DESKTOP_ITEM_SIZE}px)`,
    gap: isMobile ? GRID_GAP_MOBILE : GRID_GAP_DESKTOP,
    justifyContent: 'start'
  }), [isMobile]);

  const cardStyles = useMemo(() => ({
    mb: isMobile ? 1.5 : 2,
    transition: 'all 0.3s ease'
  }), [isMobile]);

  const contentStyles = useMemo(() => ({
    p: isMobile ? 1.5 : 2
  }), [isMobile]);

  // Don't show anything when queue is empty
  if (craftingQueue.length === 0) {
    return null;
  }

  return (
    <Card sx={cardStyles}>
      <CardContent sx={contentStyles}>
        {/* Header with queue info and clear button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography 
            variant="h6" 
            sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}
          >
            制作队列 ({craftingQueue.length}/{QUEUE_CAPACITY})
          </Typography>
          
          {craftingQueue.length > 1 && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleClearAll}
              sx={{ minWidth: 'auto', px: 1 }}
            >
              清空
            </Button>
          )}
        </Box>
        
        <Box sx={gridStyles} role="grid" aria-label="制作队列">
          {craftingQueue.map((task) => (
            <CraftingQueueItem
              key={task.id}
              task={task}
              isMobile={isMobile}
              onRemove={handleRemoveTask}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default React.memo(CraftingQueue);