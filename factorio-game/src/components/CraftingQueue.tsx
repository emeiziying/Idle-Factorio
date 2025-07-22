import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Tooltip,
  Collapse,
  Badge
} from '@mui/material';
import {
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Timer as TimerIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import { useGameStore } from '../store/gameStore';
import { CraftingService } from '../services/CraftingService';
import { CraftingTask, Recipe } from '../types';
import { DataService } from '../services/DataService';
import { formatTime } from '../utils/format';

interface TaskInfo {
  task: CraftingTask;
  recipe: Recipe | null;
  progress: number;
  remainingTime: number;
}

const CraftingQueue: React.FC = () => {
  const craftingQueue = useGameStore(state => state.craftingQueue);
  const [taskInfos, setTaskInfos] = useState<TaskInfo[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const craftingService = CraftingService.getInstance();

  useEffect(() => {
    // 每100ms更新一次显示
    const interval = setInterval(() => {
      setUpdateTrigger(prev => prev + 1);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateTaskInfos = async () => {
      const infos: TaskInfo[] = [];
      
      for (const task of craftingQueue) {
        const taskInfo = await craftingService.getCraftingTaskInfo(task);
        infos.push({
          task,
          recipe: taskInfo.recipe,
          progress: taskInfo.progress,
          remainingTime: taskInfo.remainingTime
        });
      }
      
      setTaskInfos(infos);
    };
    
    updateTaskInfos();
  }, [craftingQueue, updateTrigger, craftingService]);

  const handleCancel = async (taskId: string) => {
    const result = await craftingService.cancelCrafting(taskId);
    if (!result.success) {
      console.error(result.message);
    }
  };



  const totalTasks = craftingQueue.length;
  const completedProgress = taskInfos.reduce((sum, info) => sum + info.progress, 0) / Math.max(totalTasks, 1);

  if (totalTasks === 0) {
    return null;
  }

  return (
    <Card 
      sx={{ 
        position: 'fixed',
        bottom: 70,
        right: 20,
        width: 350,
        maxHeight: 400,
        zIndex: 1000,
        boxShadow: 4
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <BuildIcon color="primary" />
            <Typography variant="h6">
              制作队列
            </Typography>
            <Badge badgeContent={totalTasks} color="primary">
              <Box />
            </Badge>
          </Box>
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        
        {totalTasks > 0 && (
          <Box sx={{ mt: 1 }}>
            <LinearProgress 
              variant="determinate" 
              value={completedProgress} 
              sx={{ height: 6, borderRadius: 1 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              总进度: {Math.round(completedProgress)}%
            </Typography>
          </Box>
        )}
      </CardContent>

      <Collapse in={expanded}>
        <List sx={{ maxHeight: 300, overflow: 'auto', pt: 0 }}>
          {taskInfos.map((info, index) => (
            <ListItem key={info.task.id} divider={index < taskInfos.length - 1}>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2">
                      {info.recipe?.name || '未知物品'} x{info.task.quantity}
                    </Typography>
                    {info.remainingTime > 0 && (
                      <Chip
                        icon={<TimerIcon />}
                        label={formatTime(info.remainingTime)}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={info.progress} 
                      sx={{ height: 4, borderRadius: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {Math.round(info.progress)}%
                    </Typography>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <Tooltip title="取消制作">
                  <IconButton 
                    edge="end" 
                    size="small"
                    onClick={() => handleCancel(info.task.id)}
                  >
                    <CancelIcon />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Collapse>
    </Card>
  );
};

export default CraftingQueue;