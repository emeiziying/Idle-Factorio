// 科技详情面板组件

import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  Card,
  CardContent,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  PlayArrow as StartIcon,
  Add as AddToQueueIcon,
  CheckCircle as CheckCircleIcon,
  Lock as LockIcon,
  Science as ResearchingIcon,
  Schedule as TimeIcon,
  Build as RequirementIcon,
  NewReleases as UnlockIcon
} from '@mui/icons-material';
import FactorioIcon from '../common/FactorioIcon';
import type { TechResearchState } from '../../types/technology';
import type { ResearchTrigger } from '../../types/index';
import { TechnologyService } from '../../services/TechnologyService';
import { DataService } from '../../services/DataService';

interface TechDetailPanelProps {
  /** 要显示的科技ID */
  techId: string;
  
  /** 科技状态 */
  techState?: TechResearchState;
  
  /** 是否打开面板 */
  open: boolean;
  
  /** 关闭面板的回调 */
  onClose: () => void;
  
  /** 开始研究的回调 */
  onStartResearch?: (techId: string) => void;
  
  /** 添加到队列的回调 */
  onAddToQueue?: (techId: string) => void;
  
  /** 面板位置 */
  anchor?: 'left' | 'right' | 'bottom';
}

const TechDetailPanel: React.FC<TechDetailPanelProps> = ({
  techId,
  techState,
  open,
  onClose,
  onStartResearch,
  onAddToQueue,
  anchor = 'right'
}) => {
  const theme = useTheme();
  const techService = TechnologyService.getInstance();
  const dataService = DataService.getInstance();
  
  // 获取科技信息
  const technology = techService.getTechnology(techId);
  const status = techState?.status || (techService.isTechUnlocked(techId) ? 'unlocked' : 'locked');
  const progress = techState?.progress || 0;
  const canResearch = techService.isTechAvailable(techId);
  
  if (!technology) {
    return null;
  }

  // 获取状态配置
  const getStatusConfig = () => {
    switch (status) {
      case 'unlocked':
        return {
          color: theme.palette.success.main,
          icon: <CheckCircleIcon />,
          label: '已解锁',
          description: '此科技已完成研究'
        };
      case 'researching':
        return {
          color: theme.palette.info.main,
          icon: <ResearchingIcon />,
          label: '研究中',
          description: '正在进行研究'
        };
      case 'available':
        return {
          color: theme.palette.warning.main,
          icon: <StartIcon />,
          label: '可研究',
          description: '满足前置条件，可以开始研究'
        };
      default:
        return {
          color: theme.palette.grey[600],
          icon: <LockIcon />,
          label: '锁定',
          description: '需要完成前置科技才能解锁'
        };
    }
  };

  const statusConfig = getStatusConfig();

  // 获取前置科技信息
  const getPrerequisites = () => {
    return technology.prerequisites.map(prereqId => {
      const prereqTech = techService.getTechnology(prereqId);
      const isUnlocked = techService.isTechUnlocked(prereqId);
      return {
        id: prereqId,
        name: prereqTech?.name || prereqId,
        unlocked: isUnlocked
      };
    });
  };

  // 获取解锁内容信息
  const getUnlockInfo = () => {
    const unlocks = {
      items: [] as Array<{id: string; name: string}>,
      recipes: [] as Array<{id: string; name: string}>,
      buildings: [] as Array<{id: string; name: string}>
    };

    technology.unlocks.items?.forEach(itemId => {
      const item = dataService.getItem(itemId);
      unlocks.items.push({
        id: itemId,
        name: item?.name || itemId
      });
    });

    technology.unlocks.recipes?.forEach(recipeId => {
      const recipe = dataService.getRecipe(recipeId);
      unlocks.recipes.push({
        id: recipeId,
        name: recipe?.name || recipeId
      });
    });

    technology.unlocks.buildings?.forEach(buildingId => {
      const building = dataService.getItem(buildingId);
      unlocks.buildings.push({
        id: buildingId,
        name: building?.name || buildingId
      });
    });

    return unlocks;
  };

  const prerequisites = getPrerequisites();
  const unlockInfo = getUnlockInfo();

  // 获取研究触发器信息
  const getResearchTrigger = () => {
    const techRecipe = dataService.getRecipe(technology.id);
    return techRecipe?.researchTrigger;
  };

  const researchTrigger = getResearchTrigger();

  // 格式化研究触发器显示
  const formatResearchTrigger = (trigger: ResearchTrigger) => {
    switch (trigger.type) {
      case 'craft-item': {
        const item = dataService.getItem(trigger.item!);
        return {
          description: `制造 ${trigger.count || 1} 件物品`,
          itemName: item?.name || trigger.item!,
          itemId: trigger.item!,
          count: trigger.count || 1
        };
      }
      case 'build-entity': {
        return {
          description: `建造 ${trigger.count || 1} 个建筑`,
          itemName: trigger.entity!,
          itemId: trigger.entity!,
          count: trigger.count || 1
        };
      }
      case 'mine-entity': {
        return {
          description: `挖掘 ${trigger.count || 1} 个资源`,
          itemName: trigger.entity!,
          itemId: trigger.entity!,
          count: trigger.count || 1
        };
      }
      case 'create-space-platform': {
        return {
          description: '创建太空平台',
          itemName: '太空平台',
          itemId: 'space-platform',
          count: 1
        };
      }
      case 'capture-spawner': {
        return {
          description: '捕获虫巢',
          itemName: '虫巢',
          itemId: 'spawner',
          count: 1
        };
      }
      default:
        return null;
    }
  };

  // 格式化时间显示
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}分${remainingSeconds}秒` : `${minutes}分钟`;
  };

  const panelWidth = anchor === 'bottom' ? '100%' : 400;

  return (
    <Drawer
      anchor={anchor}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: panelWidth,
          maxWidth: '100vw',
          ...(anchor === 'bottom' && {
            maxHeight: '70vh'
          })
        }
      }}
    >
      <Box sx={{ overflow: 'auto', height: '100%' }}>
        {/* 头部 */}
        <Box
          sx={{
            p: 2,
            bgcolor: alpha(statusConfig.color, 0.1),
            borderBottom: `1px solid ${alpha(statusConfig.color, 0.3)}`,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <FactorioIcon
            itemId={technology.icon || technology.id}
            size={48}
            showBorder={false}
          />
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              {technology.name}
            </Typography>
            
            <Chip
              icon={statusConfig.icon}
              label={statusConfig.label}
              size="small"
              sx={{
                bgcolor: alpha(statusConfig.color, 0.2),
                color: statusConfig.color
              }}
            />
          </Box>
          
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 2 }}>
          {/* 描述 */}
          {technology.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              {technology.description}
            </Typography>
          )}

          {/* 研究进度 */}
          {status === 'researching' && (
            <Card sx={{ mb: 2 }}>
              <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ResearchingIcon fontSize="small" />
                  研究进度
                </Typography>
                
                <LinearProgress
                  variant="determinate"
                  value={progress * 100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    mb: 1,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: statusConfig.color
                    }
                  }}
                />
                
                <Typography variant="caption" color="text.secondary">
                  {Math.round(progress * 100)}% 完成
                  {techState?.timeRemaining && (
                    <span> - 剩余 {formatTime(techState.timeRemaining)}</span>
                  )}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* 研究需求 */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ '&:last-child': { pb: 2 } }}>
              <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <RequirementIcon fontSize="small" />
                研究需求
              </Typography>

              {/* 科技包需求 */}
              {Object.keys(technology.researchCost).length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    科技包需求：
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {Object.entries(technology.researchCost).map(([packId, amount]) => (
                      <Box
                        key={packId}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          p: 1,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 1
                        }}
                      >
                        <FactorioIcon
                          itemId={packId}
                          size={24}
                          showBorder={false}
                        />
                        <Typography variant="body2">
                          ×{amount}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* 研究时间 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimeIcon fontSize="small" color="action" />
                <Typography variant="body2">
                  研究时间: {formatTime(technology.researchTime)}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* 研究触发器 */}
          {researchTrigger && (
            <Card sx={{ mb: 2 }}>
              <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <UnlockIcon fontSize="small" />
                  自动解锁条件
                </Typography>
                
                {(() => {
                  const triggerInfo = formatResearchTrigger(researchTrigger);
                  if (!triggerInfo) return null;
                  
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1 }}>
                      <FactorioIcon
                        itemId={triggerInfo.itemId}
                        size={32}
                        showBorder={false}
                      />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {triggerInfo.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {triggerInfo.itemName} ×{triggerInfo.count}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* 前置科技 */}
          {prerequisites.length > 0 && (
            <Card sx={{ mb: 2 }}>
              <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  前置科技
                </Typography>
                
                <List dense>
                  {prerequisites.map(prereq => (
                    <ListItem key={prereq.id} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {prereq.unlocked ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <LockIcon color="disabled" fontSize="small" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={prereq.name}
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: prereq.unlocked ? 'inherit' : 'text.disabled'
                          }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}

          {/* 解锁内容 */}
          {(unlockInfo.items.length > 0 || unlockInfo.recipes.length > 0 || unlockInfo.buildings.length > 0) && (
            <Card sx={{ mb: 2 }}>
              <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <UnlockIcon fontSize="small" />
                  解锁内容
                </Typography>

                {/* 解锁物品 */}
                {unlockInfo.items.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      物品:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {unlockInfo.items.map(item => (
                        <Box
                          key={item.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            p: 0.5,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 1
                          }}
                        >
                          <FactorioIcon
                            itemId={item.id}
                            size={20}
                            showBorder={false}
                          />
                          <Typography variant="caption">
                            {item.name}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* 解锁配方 */}
                {unlockInfo.recipes.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      配方:
                    </Typography>
                    <List dense>
                      {unlockInfo.recipes.map(recipe => (
                        <ListItem key={recipe.id} sx={{ px: 0 }}>
                          <ListItemText
                            primary={recipe.name}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* 解锁建筑 */}
                {unlockInfo.buildings.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      建筑:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {unlockInfo.buildings.map(building => (
                        <Box
                          key={building.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            p: 0.5,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 1
                          }}
                        >
                          <FactorioIcon
                            itemId={building.id}
                            size={20}
                            showBorder={false}
                          />
                          <Typography variant="caption">
                            {building.name}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          <Divider sx={{ my: 2 }} />

          {/* 操作按钮 */}
          <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
            {canResearch && onStartResearch && (
              <Button
                variant="contained"
                color="success"
                startIcon={<StartIcon />}
                onClick={() => onStartResearch(techId)}
                fullWidth
              >
                开始研究
              </Button>
            )}

            {canResearch && onAddToQueue && (
              <Button
                variant="outlined"
                color="info"
                startIcon={<AddToQueueIcon />}
                onClick={() => onAddToQueue(techId)}
                fullWidth
              >
                添加到队列
              </Button>
            )}

            {status === 'locked' && (
              <Typography
                variant="body2"
                color="text.disabled"
                sx={{ textAlign: 'center', p: 2 }}
              >
                {statusConfig.description}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default TechDetailPanel;