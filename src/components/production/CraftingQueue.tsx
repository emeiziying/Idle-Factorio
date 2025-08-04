import React, { useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Slide,
} from '@mui/material';
import { Clear as ClearIcon, Delete as DeleteIcon, Close as CloseIcon } from '@mui/icons-material';
import type { TransitionProps } from '@mui/material/transitions';
import FactorioIcon from '@/components/common/FactorioIcon';
import { useDataService } from '@/hooks/useDIServices';
import useGameStore from '@/store/gameStore';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { CraftingTask } from '@/types/index';

// Constants
const QUEUE_CAPACITY = 50;
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

const CraftingQueueItem: React.FC<CraftingQueueItemProps> = React.memo(
  ({ task, isMobile, onRemove }) => {
    const dataService = useDataService();

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

    // craftingQueue 中的所有任务都是手动制作任务，仍需要 recipe 数据用于显示
    if (!item || !recipe) {
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
            },
          }}
        >
          <ClearIcon sx={{ fontSize: cancelButtonSize - 4 }} />
        </IconButton>
      </Box>
    );
  }
);

CraftingQueueItem.displayName = 'CraftingQueueItem';

// 从底部向上滑入的过渡动画
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface CraftingQueueProps {
  open?: boolean;
  onClose?: () => void;
}

const CraftingQueue: React.FC<CraftingQueueProps> = ({ open = false, onClose }) => {
  const craftingQueue = useGameStore(state => state.craftingQueue);
  const removeCraftingTask = useGameStore(state => state.removeCraftingTask);
  const isMobile = useIsMobile();

  // Memoize the remove handler to prevent unnecessary re-renders
  const handleRemoveTask = useCallback(
    (taskId: string) => {
      removeCraftingTask(taskId);
    },
    [removeCraftingTask]
  );

  const handleClearAll = useCallback(() => {
    if (window.confirm('确定要清空所有制作任务吗？')) {
      // Clear all tasks by removing them one by one
      craftingQueue.forEach(task => removeCraftingTask(task.id));
    }
  }, [craftingQueue, removeCraftingTask]);

  // Memoize grid styles - 使用 auto-fit 替代 auto-fill 减少重新计算
  const gridStyles = useMemo(
    () => ({
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fit, ${isMobile ? MOBILE_ITEM_SIZE : DESKTOP_ITEM_SIZE}px)`,
      gap: isMobile ? GRID_GAP_MOBILE : GRID_GAP_DESKTOP,
      justifyContent: 'start',
      // 添加固定高度减少布局跳动
      minHeight: isMobile ? MOBILE_ITEM_SIZE : DESKTOP_ITEM_SIZE,
      // 使用subgrid优化性能（如果支持）
      gridAutoRows: 'max-content',
    }),
    [isMobile]
  );

  const dialogStyles = useMemo(
    () => ({
      '& .MuiDialog-paper': {
        margin: 0,
        maxHeight: '70vh',
        minHeight: isMobile ? '350px' : '400px', // 移动端稍小的最小高度
        width: '100%',
        maxWidth: isMobile ? '100vw' : '600px',
        borderRadius: isMobile ? '16px 16px 0 0' : '16px',
        position: 'fixed',
        bottom: 0,
        left: isMobile ? 0 : '50%',
        transform: isMobile ? 'none' : 'translateX(-50%)',
      },
    }),
    [isMobile]
  );

  // 如果不是弹窗模式且队列为空，不显示
  if (!open && craftingQueue.length === 0) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      slots={{ transition: Transition }}
      sx={dialogStyles}
      hideBackdrop={false}
      disableEscapeKeyDown={false}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Box component="span">
          制作队列 ({craftingQueue.length}/{QUEUE_CAPACITY})
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
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
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="关闭">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 2, pb: 2, minHeight: 'calc(100% - 80px)' }}>
        {craftingQueue.length === 0 ? (
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            minHeight="250px"
            color="text.secondary"
          >
            <Typography variant="body2" sx={{ mb: 1 }}>
              制作队列为空
            </Typography>
            <Typography variant="caption" sx={{ textAlign: 'center', maxWidth: '300px' }}>
              添加手动制作任务或启用自动化设备来开始生产
            </Typography>
          </Box>
        ) : (
          <Box sx={gridStyles} role="grid" aria-label="制作队列">
            {craftingQueue.map(task => (
              <CraftingQueueItem
                key={task.id}
                task={task}
                isMobile={isMobile}
                onRemove={handleRemoveTask}
              />
            ))}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(CraftingQueue);
