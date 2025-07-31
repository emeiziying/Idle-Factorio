import React, { useCallback, useMemo } from 'react';
import { Box, LinearProgress, IconButton } from '@mui/material';
import { Clear as ClearIcon } from '@mui/icons-material';
import FactorioIcon from '@/components/common/FactorioIcon';
import { DataService } from '@/services';
import useGameStore from '@/store/gameStore';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { CraftingTask } from '@/types/index';

// Constants
const MOBILE_ITEM_SIZE = 48;
const DESKTOP_ITEM_SIZE = 64;
const PROGRESS_BAR_HEIGHT = 4;
const GRID_GAP_MOBILE = 1;
const GRID_GAP_DESKTOP = 2;

// Sub-component for individual crafting queue items
interface CraftingQueueItemProps {
  task: CraftingTask;
  isMobile: boolean;
  onRemove: (taskId: string) => void;
}

const CraftingQueueItem: React.FC<CraftingQueueItemProps> = React.memo(({ task, isMobile, onRemove }) => {
  const dataService = DataService.getInstance();

  // Always call hooks first
  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove(task.id);
    },
    [task.id, onRemove]
  );

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
    <Box
      role="button"
      tabIndex={0}
      aria-label={`制作 ${item.name || task.itemId} - 进度 ${Math.round(progress)}%`}
      sx={{
        position: 'relative',
        cursor: 'default',
        // 移除transform动画，使用opacity和box-shadow代替
        transition: 'opacity 0.2s ease, box-shadow 0.2s ease',
        // 确保固定尺寸，避免布局跳动
        width: itemSize,
        height: itemSize,
        flexShrink: 0,
        '&:hover': {
          opacity: 0.9,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          '& .cancel-button': {
            opacity: 1,
          },
        },
        '&:focus': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: 2,
        },
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
          width: '100%',
          height: '100%',
          // 确保内容不会超出容器
          overflow: 'hidden',
        }}
      >
        {/* 物品图标 */}
        <FactorioIcon itemId={task.itemId} size={itemSize} quantity={task.quantity > 1 ? task.quantity : undefined} />

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
          },
        }}
      >
        <ClearIcon sx={{ fontSize: cancelButtonSize - 4 }} />
      </IconButton>
    </Box>
  );
});

CraftingQueueItem.displayName = 'CraftingQueueItem';

interface CraftingQueueProps {
  // No props needed for direct display
  placeholder?: never;
}

const CraftingQueue: React.FC<CraftingQueueProps> = () => {
  const craftingQueue = useGameStore((state) => state.craftingQueue);
  const removeCraftingTask = useGameStore((state) => state.removeCraftingTask);
  const isMobile = useIsMobile();

  // Memoize the remove handler to prevent unnecessary re-renders
  const handleRemoveTask = useCallback(
    (taskId: string) => {
      removeCraftingTask(taskId);
    },
    [removeCraftingTask]
  );

  // Memoize grid styles for horizontal layout
  const gridStyles = useMemo(
    () => ({
      display: 'flex',
      flexDirection: 'row',
      gap: isMobile ? GRID_GAP_MOBILE : GRID_GAP_DESKTOP,
      alignItems: 'center',
      flexWrap: 'wrap',
      maxWidth: '400px', // Limit width to prevent overflow
    }),
    [isMobile]
  );

  // Container styles for bottom-left positioning
  const containerStyles = useMemo(
    () => ({
      position: 'fixed',
      bottom: '16px',
      left: '16px',
      zIndex: 1000,
      maxWidth: isMobile ? '300px' : '400px',
      maxHeight: isMobile ? '200px' : '300px',
      overflow: 'auto',
      padding: 1,
      borderRadius: 2,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      border: '1px solid',
      borderColor: 'divider',
    }),
    [isMobile]
  );

  // Only show when there are tasks
  if (craftingQueue.length === 0) {
    return null;
  }

  return (
    <Box sx={containerStyles}>
      {/* Task list */}
      <Box sx={gridStyles} role="grid" aria-label="制作队列">
        {craftingQueue.map((task) => (
          <CraftingQueueItem key={task.id} task={task} isMobile={isMobile} onRemove={handleRemoveTask} />
        ))}
      </Box>
    </Box>
  );
};

export default React.memo(CraftingQueue);
