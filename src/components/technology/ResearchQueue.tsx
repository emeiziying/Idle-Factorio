// 研究队列组件

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Collapse,
  useTheme
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Delete as RemoveIcon,
  DragHandle as DragIcon,
  ExpandLess,
  ExpandMore,
  Queue as QueueIcon,
  Science as ResearchIcon
} from '@mui/icons-material';
import FactorioIcon from '../common/FactorioIcon';
import type { ResearchQueueItem, TechResearchState } from '../../types/technology';
import { TechnologyService } from '../../services/core/TechnologyService';

interface ResearchQueueProps {
  /** 研究队列列表 */
  queue: ResearchQueueItem[];
  
  /** 当前研究状态 */
  currentResearch?: TechResearchState;
  
  /** 自动研究开关 */
  autoResearch: boolean;
  
  /** 移除队列项目的回调 */
  onRemoveFromQueue?: (techId: string) => void;
  
  /** 设置自动研究的回调 */
  onSetAutoResearch?: (enabled: boolean) => void;
  
  /** 开始研究的回调 */
  onStartResearch?: (techId: string) => void;
  
  /** 是否可折叠 */
  collapsible?: boolean;
}

const ResearchQueue: React.FC<ResearchQueueProps> = React.memo(({
  queue,
  currentResearch,
  autoResearch,
  onRemoveFromQueue,
  onSetAutoResearch,
  onStartResearch,
  collapsible = true
}) => {
  const theme = useTheme();
  // 当没有当前研究时，默认收起队列
  const [expanded, setExpanded] = React.useState(!!currentResearch);
  const techService = TechnologyService.getInstance();

  // 格式化时间显示 - 使用useCallback缓存
  const formatTime = React.useCallback((seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}分${remainingSeconds}秒` : `${minutes}分钟`;
  }, []);

  // 获取队列总时间 - 使用useMemo缓存
  const totalQueueTime = React.useMemo(() => {
    let totalTime = 0;
    queue.forEach(item => {
      const tech = techService.getTechnology(item.techId);
      if (tech) {
        totalTime += tech.researchTime;
      }
    });
    return totalTime;
  }, [queue, techService]);

  // 获取优先级显示 - 使用useCallback缓存
  const getPriorityLabel = React.useCallback((priority: number) => {
    switch (priority) {
      case 0: return { label: '高', color: 'error' as const };
      case 1: return { label: '普通', color: 'primary' as const };
      case 2: return { label: '低', color: 'default' as const };
      default: return { label: '普通', color: 'primary' as const };
    }
  }, []);


  // 监听当前研究状态变化，自动展开/收起队列
  React.useEffect(() => {
    if (currentResearch) {
      // 有研究时展开队列
      setExpanded(true);
    } else {
      // 没有研究时收起队列
      setExpanded(false);
    }
  }, [currentResearch]);

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ '&:last-child': { pb: 2 } }}>
        {/* 队列头部 */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
            cursor: collapsible ? 'pointer' : 'default'
          }}
          onClick={collapsible ? () => setExpanded(!expanded) : undefined}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QueueIcon color="primary" />
            <Typography variant="h6">
              研究队列
            </Typography>
            <Chip
              size="small"
              label={`${queue.length} 项`}
              color="primary"
              variant="outlined"
            />
            {totalQueueTime > 0 && (
              <Chip
                size="small"
                label={formatTime(totalQueueTime)}
                color="info"
                variant="outlined"
              />
            )}
          </Box>
          
          {collapsible && (
            expanded ? <ExpandLess /> : <ExpandMore />
          )}
        </Box>

        {/* 当前研究状态 */}
        {currentResearch && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ResearchIcon color="info" fontSize="small" />
              <Typography variant="subtitle2" color="info.main">
                正在研究
              </Typography>
            </Box>
            
            <Card variant="outlined" sx={{ bgcolor: theme.palette.info.main + '10' }}>
              <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
                {(() => {
                  const tech = techService.getTechnology(currentResearch.techId);
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <FactorioIcon
                        itemId={tech?.icon || currentResearch.techId}
                        size={32}
                        showBorder={false}
                      />
                      
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {tech?.name || currentResearch.techId}
                        </Typography>
                        
                        <LinearProgress
                          variant="determinate"
                          value={currentResearch.progress * 100}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            mb: 0.5,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: theme.palette.info.main
                            }
                          }}
                        />
                        
                        <Typography variant="caption" color="text.secondary">
                          {Math.round(currentResearch.progress * 100)}% 完成
                          {currentResearch.timeRemaining && (
                            <> - 剩余 {formatTime(currentResearch.timeRemaining)}</>
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })()}
              </CardContent>
            </Card>
          </Box>
        )}

        {/* 队列内容 */}
        <Collapse in={expanded}>
          {queue.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4,
                color: theme.palette.text.secondary
              }}
            >
              <QueueIcon sx={{ fontSize: 48, opacity: 0.5, mb: 1 }} />
              <Typography variant="body2">
                研究队列为空
              </Typography>
              <Typography variant="caption">
                点击科技节点的 "添加到队列" 按钮来添加研究任务
              </Typography>
            </Box>
          ) : (
            <List dense>
              {queue.map((item, index) => {
                const tech = techService.getTechnology(item.techId);
                const priorityConfig = getPriorityLabel(item.priority);
                const isBlocked = !item.canStart;
                
                return (
                  <ListItem
                    key={item.techId}
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: isBlocked ? theme.palette.action.disabled + '20' : 'transparent'
                    }}
                  >
                    <ListItemIcon>
                      <DragIcon color="action" />
                    </ListItemIcon>
                    
                    <ListItemIcon>
                      <FactorioIcon
                        itemId={tech?.icon || item.techId}
                        size={24}
                        showBorder={false}
                      />
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {tech?.name || item.techId}
                          </Typography>
                          
                          <Chip
                            size="small"
                            label={priorityConfig.label}
                            color={priorityConfig.color}
                            variant="outlined"
                            sx={{ minWidth: 40 }}
                          />
                          
                          {isBlocked && (
                            <Chip
                              size="small"
                              label="等待前置"
                              color="warning"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" color="text.secondary" component="span" display="inline">
                            队列位置: {index + 1}
                          </Typography>
                          
                          {tech && (
                            <Typography variant="caption" color="text.secondary" component="span" display="inline" sx={{ ml: 2 }}>
                              研究时间: {formatTime(tech.researchTime)}
                            </Typography>
                          )}
                          
                          {item.estimatedStartTime && (
                            <Typography variant="caption" color="text.secondary" component="span" display="inline" sx={{ ml: 2 }}>
                              预计开始: {new Date(item.estimatedStartTime).toLocaleTimeString()}
                            </Typography>
                          )}
                        </>
                      }
                    />
                    
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {!currentResearch && index === 0 && onStartResearch && (
                          <IconButton
                            size="small"
                            onClick={() => onStartResearch(item.techId)}
                            disabled={isBlocked}
                            color="success"
                          >
                            <StartIcon />
                          </IconButton>
                        )}
                        
                        <IconButton
                          size="small"
                          onClick={() => onRemoveFromQueue?.(item.techId)}
                          color="error"
                        >
                          <RemoveIcon />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Collapse>

        {/* 自动研究开关 */}
        {queue.length > 0 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2">
                自动研究
              </Typography>
              
              <Chip
                label={autoResearch ? '已启用' : '已禁用'}
                color={autoResearch ? 'success' : 'default'}
                size="small"
                onClick={() => onSetAutoResearch?.(!autoResearch)}
                clickable
                icon={autoResearch ? <StartIcon /> : <PauseIcon />}
              />
            </Box>
            
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {autoResearch 
                ? '队列中的科技将按顺序自动开始研究'
                : '需要手动点击开始按钮来进行研究'
              }
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

ResearchQueue.displayName = 'ResearchQueue';

export default ResearchQueue;