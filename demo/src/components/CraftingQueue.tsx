import React, { useState, useEffect } from 'react';
import {
  Box,
  Fab,
  Badge,
  Modal,
  Typography,
  IconButton,
  styled,
  LinearProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BuildIcon from '@mui/icons-material/Build';
import { CraftingTask } from '../types';
import { dataService } from '../services/DataService';

const FloatingButton = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: 20,
  right: 20,
  zIndex: 1000,
  backgroundColor: '#22C55E',
  color: 'white',
  '&:hover': {
    backgroundColor: '#16A34A',
  },
}));

const QueueModal = styled(Modal)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
}));

const QueueContent = styled(Box)(({ theme }) => ({
  backgroundColor: 'white',
  borderRadius: '16px 16px 0 0',
  padding: '16px',
  width: '100%',
  maxWidth: '480px',
  maxHeight: '60vh',
  overflow: 'auto',
}));

const TaskCard = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  marginBottom: '8px',
  position: 'relative',
}));

const TaskIcon = styled(Box)<{ 
  iconposition: string; 
  backgroundcolor: string; 
}>(({ iconposition, backgroundcolor }) => ({
  width: 40,
  height: 40,
  borderRadius: '6px',
  backgroundColor: backgroundcolor,
  backgroundImage: 'url(/data/1.1/icons.webp)',
  backgroundPosition: iconposition,
  backgroundSize: 'auto',
  flexShrink: 0,
  cursor: 'pointer',
  transition: 'transform 0.2s ease',
  '&:hover': {
    transform: 'scale(1.1)',
  },
}));

const getProgressColor = (status: string): string => {
  switch (status) {
    case 'in_progress': return '#22C55E';
    case 'waiting': return '#F59E0B';
    case 'blocked': return '#EF4444';
    default: return '#6B7280';
  }
};

const getStatusText = (status: string): string => {
  switch (status) {
    case 'in_progress': return '制作中';
    case 'waiting': return '等待中';
    case 'blocked': return '材料不足';
    default: return '未知';
  }
};

interface CraftingQueueProps {
  tasks: CraftingTask[];
  onCancelTask?: (taskId: string) => void;
}

const CraftingQueue: React.FC<CraftingQueueProps> = ({
  tasks,
  onCancelTask,
}) => {
  const [showQueue, setShowQueue] = useState(false);

  const handleTaskClick = (taskId: string) => {
    onCancelTask?.(taskId);
  };

  const handleToggleQueue = () => {
    setShowQueue(!showQueue);
  };

  // 如果没有任务，不显示浮动按钮
  if (tasks.length === 0) {
    return null;
  }

  return (
    <>
      {/* 浮动气泡按钮 */}
      <Badge 
        badgeContent={tasks.length} 
        color="secondary"
        max={99}
      >
        <FloatingButton 
          onClick={handleToggleQueue}
          size="medium"
        >
          <BuildIcon />
        </FloatingButton>
      </Badge>

      {/* 队列详情模态框 */}
      <QueueModal
        open={showQueue}
        onClose={() => setShowQueue(false)}
      >
        <QueueContent>
          {/* 标题栏 */}
          <Box 
            display="flex" 
            alignItems="center" 
            justifyContent="space-between" 
            mb={2}
          >
            <Typography variant="h6" fontWeight={600}>
              🔧 制作队列 ({tasks.length}/10)
            </Typography>
            <IconButton 
              onClick={() => setShowQueue(false)} 
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* 任务列表 */}
          <Box>
            {tasks.length === 0 ? (
              <Box 
                display="flex" 
                justifyContent="center" 
                alignItems="center"
                height={120}
                color="text.secondary"
              >
                <Typography variant="body1">
                  制作队列为空
                </Typography>
              </Box>
            ) : (
              tasks.map((task) => {
                const iconPosition = dataService.getItemIconPosition(task.itemId);
                const iconColor = dataService.getItemIconColor(task.itemId);
                const progressPercent = (task.progress / task.totalTime) * 100;

                return (
                  <TaskCard key={task.id}>
                    {/* 物品图标 */}
                    <TaskIcon
                      iconposition={iconPosition}
                      backgroundcolor={iconColor}
                      onClick={() => handleTaskClick(task.id)}
                      title="点击取消制作"
                    />

                    {/* 任务信息 */}
                    <Box flex={1}>
                      <Box 
                        display="flex" 
                        alignItems="center" 
                        justifyContent="space-between"
                        mb={1}
                      >
                        <Typography variant="body2" fontWeight={600}>
                          {task.itemId} × {task.quantity}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: getProgressColor(task.status),
                            fontWeight: 500,
                          }}
                        >
                          {getStatusText(task.status)}
                        </Typography>
                      </Box>

                      {/* 进度条 */}
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress
                          variant="determinate"
                          value={progressPercent}
                          sx={{
                            flex: 1,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: 'rgba(0,0,0,0.1)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getProgressColor(task.status),
                              borderRadius: 3,
                            },
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {Math.round(progressPercent)}%
                        </Typography>
                      </Box>

                      {/* 剩余时间 */}
                      {task.status === 'in_progress' && (
                        <Typography variant="caption" color="text.secondary" mt={0.5}>
                          剩余: {Math.max(0, task.totalTime - task.progress).toFixed(1)}秒
                        </Typography>
                      )}
                    </Box>
                  </TaskCard>
                );
              })
            )}
          </Box>

          {/* 提示信息 */}
          <Box sx={{ mt: 2, p: 1, backgroundColor: "#f0f9ff", borderRadius: 1 }}>
            <Typography variant="caption" color="info.main">
              💡 点击物品图标可以取消制作任务
            </Typography>
          </Box>
        </QueueContent>
      </QueueModal>
    </>
  );
};

export default CraftingQueue; 