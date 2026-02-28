import FactorioIcon from '@/components/common/FactorioIcon';
import { useDataService } from '@/hooks/useDIServices';
import { useIsMobile } from '@/hooks/useIsMobile';
import useGameStore from '@/store/gameStore';
import { Box, LinearProgress, Chip } from '@mui/material';
import React, { useMemo } from 'react';
import { mergeCraftingTasks, getTaskIdsToCancel } from '@/utils/taskMerger';

const FloatingTaskList: React.FC = () => {
  const craftingQueue = useGameStore(state => state.craftingQueue);
  const removeCraftingTask = useGameStore(state => state.removeCraftingTask);
  const isMobile = useIsMobile();
  const dataService = useDataService();

  // 先合并任务，再过滤活动任务，最多显示18个（3行×6列）
  const activeTasks = useMemo(() => {
    const mergedTasks = mergeCraftingTasks(craftingQueue);
    return mergedTasks
      .filter(task => task.status !== 'completed' && task.progress < 100)
      .slice(0, 18);
  }, [craftingQueue]);

  if (activeTasks.length === 0) return null;

  const itemSize = isMobile ? 44 : 56;
  const gap = isMobile ? 0.5 : 1;

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap,
        maxWidth: `${itemSize * 6 + gap * 5}px`,
        pointerEvents: 'auto', // 允许点击交互
      }}
    >
      {Array.from({ length: Math.min(Math.ceil(activeTasks.length / 6), 3) }, (_, rowIndex) => {
        const rowTasks = activeTasks.slice(rowIndex * 6, (rowIndex + 1) * 6);
        return (
          <Box key={rowIndex} sx={{ display: 'flex', gap, justifyContent: 'flex-start' }}>
            {rowTasks.map(task => {
              const item = dataService.getItem(task.itemId);
              if (!item) return null;

              const progress = Math.max(0, Math.min(100, task.progress || 0));

              const handleClick = () => {
                const taskIds = getTaskIdsToCancel(task, craftingQueue);
                taskIds.forEach(taskId => removeCraftingTask(taskId));
              };

              return (
                <Box
                  key={task.id}
                  onClick={handleClick}
                  sx={{
                    position: 'relative',
                    width: itemSize,
                    height: itemSize,
                    flexShrink: 0,
                    opacity: progress >= 100 ? 0.7 : 1,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      opacity: 0.6,
                      transform: 'scale(0.9)',
                    },
                  }}
                >
                  <FactorioIcon
                    itemId={task.itemId}
                    size={itemSize}
                    quantity={task.quantity > 1 ? task.quantity : undefined}
                  />
                  {/* 合并标识 */}
                  {task.isMerged && (
                    <Chip
                      label={`×${task.mergedCount}`}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 1,
                        right: 1,
                        height: 12,
                        fontSize: '8px',
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        '& .MuiChip-label': {
                          px: 0.3,
                        },
                      }}
                    />
                  )}
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      width: itemSize,
                      height: 3,
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      borderRadius: 1,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 1,
                        backgroundColor: progress >= 100 ? '#4caf50' : '#2196f3',
                      },
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
};

export default FloatingTaskList;
