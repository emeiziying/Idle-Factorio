// 科技网格卡片组件 - 紧凑版展示

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  alpha
} from '@mui/material';
import {
  CheckCircle as CompletedIcon,
  Lock as LockedIcon,
  Science as ResearchingIcon,
  Add as QueueIcon,
  NewReleases as TriggerIcon
} from '@mui/icons-material';
import FactorioIcon from '../common/FactorioIcon';
import { DataService } from '../../services/DataService';
import { RecipeService } from '../../services/RecipeService';
import type { Technology, TechStatus } from '../../types/technology';

interface TechGridCardProps {
  /** 科技数据 */
  technology: Technology;
  
  /** 科技状态 */
  status: TechStatus;
  
  /** 研究进度 (0-1) */
  progress?: number;
  
  /** 是否在研究队列中 */
  inQueue: boolean;
  
  /** 点击科技卡片的回调 */
  onClick?: (techId: string) => void;
}

const TechGridCard: React.FC<TechGridCardProps> = React.memo(({
  technology,
  status,
  progress,
  inQueue,
  onClick
}) => {
  const theme = useTheme();

  // 获取状态配置
  const getStatusConfig = () => {
    switch (status) {
      case 'unlocked':
        return {
          color: theme.palette.success.main,
          bgColor: alpha(theme.palette.success.main, 0.08),
          borderColor: alpha(theme.palette.success.main, 0.3),
          icon: <CompletedIcon />,
          label: '已完成',
          textColor: theme.palette.text.secondary,
          hoverEffect: false
        };
      case 'researching':
        return {
          color: theme.palette.info.main,
          bgColor: alpha(theme.palette.info.main, 0.12),
          borderColor: theme.palette.info.main,
          icon: <ResearchingIcon />,
          label: '研究中',
          textColor: theme.palette.text.primary,
          hoverEffect: false
        };
      case 'available':
        return {
          color: theme.palette.primary.main,
          bgColor: alpha(theme.palette.primary.main, 0.08),
          borderColor: theme.palette.primary.main,
          icon: <QueueIcon />,
          label: '可研究',
          textColor: theme.palette.text.primary,
          hoverEffect: true
        };
      default:
        return {
          color: theme.palette.grey[500],
          bgColor: alpha(theme.palette.grey[500], 0.04),
          borderColor: alpha(theme.palette.grey[400], 0.3),
          icon: <LockedIcon />,
          label: '锁定',
          textColor: theme.palette.text.disabled,
          hoverEffect: false
        };
    }
  };

  const statusConfig = getStatusConfig();
  const canResearch = status === 'available' && !inQueue;
  const isCompleted = status === 'unlocked';

  // 获取解锁内容的数量
  const getUnlockCount = () => {
    const items = technology.unlocks.items?.length || 0;
    const recipes = technology.unlocks.recipes?.length || 0;
    const buildings = technology.unlocks.buildings?.length || 0;
    return items + recipes + buildings;
  };

  // 检查是否有研究触发器
  const hasResearchTrigger = () => {
    try {
      const dataService = DataService.getInstance();
      const techRecipe = dataService.getRecipe(technology.id);
      return !!techRecipe?.researchTrigger;
    } catch {
      return false;
    }
  };

  // 获取解锁的配方信息
  const getUnlockedRecipes = () => {
    if (!technology.unlocks.recipes || technology.unlocks.recipes.length === 0) {
      return [];
    }
    
    return technology.unlocks.recipes.map(recipeId => {
      const recipe = RecipeService.getRecipeById(recipeId);
      return {
        id: recipeId,
        icon: recipe?.icon || recipeId,
        name: recipe?.name || recipeId
      };
    });
  };

  // 获取解锁的物品信息
  const getUnlockedItems = () => {
    if (!technology.unlocks.items || technology.unlocks.items.length === 0) {
      return [];
    }
    
    return technology.unlocks.items.map(itemId => ({
      id: itemId,
      icon: itemId,
      name: itemId
    }));
  };

  // 获取解锁的建筑信息
  const getUnlockedBuildings = () => {
    if (!technology.unlocks.buildings || technology.unlocks.buildings.length === 0) {
      return [];
    }
    
    return technology.unlocks.buildings.map(buildingId => ({
      id: buildingId,
      icon: buildingId,
      name: buildingId
    }));
  };

  // 合并所有解锁内容，优先显示配方
  const getAllUnlockedContent = () => {
    const recipes = getUnlockedRecipes();
    const items = getUnlockedItems();
    const buildings = getUnlockedBuildings();
    
    // 优先显示配方，然后是物品，最后是建筑
    return [...recipes, ...items, ...buildings];
  };

  // 获取前置科技的名称
  const getPrerequisiteNames = () => {
    if (!technology.prerequisites || technology.prerequisites.length === 0) {
      return [];
    }
    
    const dataService = DataService.getInstance();
    return technology.prerequisites.map(prereqId => {
      // 尝试从科技数据中获取名称
      const techs = dataService.getTechnologies() as Array<{ id: string; name: string }>;
      const tech = techs?.find(t => t.id === prereqId);
      if (tech?.name) {
        return tech.name;
      }
      
      // 如果科技数据中没有，尝试从物品数据中获取
      const item = dataService.getItem(prereqId);
      if (item) {
        return dataService.getLocalizedItemName(item.id);
      }
      
      // 最后回退到ID
      return prereqId;
    });
  };

  // 获取研究触发器的信息
  const getResearchTriggerInfo = () => {
    try {
      const dataService = DataService.getInstance();
      const techRecipe = dataService.getRecipe(technology.id);
      const researchTrigger = techRecipe?.researchTrigger;
      
      if (!researchTrigger) {
        return null;
      }
      
      let triggerText = '';
      let triggerItem = '';
      
      switch (researchTrigger.type) {
        case 'craft-item': {
          triggerItem = researchTrigger.item || '';
          const itemName = dataService.getLocalizedItemName(triggerItem);
          const count = researchTrigger.count || 1;
          triggerText = `制作 ${count} 个 ${itemName}`;
          break;
        }
        case 'build-entity': {
          triggerItem = researchTrigger.entity || '';
          const itemName = dataService.getLocalizedItemName(triggerItem);
          const count = researchTrigger.count || 1;
          triggerText = `建造 ${count} 个 ${itemName}`;
          break;
        }
        case 'mine-entity': {
          triggerItem = researchTrigger.entity || '';
          const itemName = dataService.getLocalizedItemName(triggerItem);
          const count = researchTrigger.count || 1;
          triggerText = `挖掘 ${count} 个 ${itemName}`;
          break;
        }
        case 'create-space-platform': {
          triggerText = `创建空间平台`;
          break;
        }
        case 'capture-spawner': {
          triggerText = `捕获生成器`;
          break;
        }
        default:
          triggerText = `触发条件: ${researchTrigger.type}`;
      }
      
      return {
        text: triggerText,
        item: triggerItem,
        type: researchTrigger.type,
        count: researchTrigger.count || 1
      };
    } catch {
      return null;
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        cursor: canResearch ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: `2px solid ${statusConfig.borderColor}`,
        bgcolor: statusConfig.bgColor,
        opacity: isCompleted ? 0.6 : 1,
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden',
        '&:hover': statusConfig.hoverEffect ? {
          transform: 'translateY(-2px) scale(1.02)',
          boxShadow: `0 8px 25px ${alpha(statusConfig.color, 0.4)}`,
          borderColor: statusConfig.color,
          '&::before': {
            opacity: 0.1
          }
        } : {},
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${alpha(statusConfig.color, 0.1)} 0%, transparent 100%)`,
          opacity: 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none'
        },
        minHeight: 130
      }}
      onClick={() => onClick?.(technology.id)}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        {/* 头部：图标和名称 */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
          <Box sx={{ position: 'relative' }}>
            <FactorioIcon
              itemId={technology.icon || technology.id}
              size={32}
              showBorder={false}
            />
            {/* 研究触发器指示器 */}
            {hasResearchTrigger() && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  width: 16,
                  height: 16,
                  bgcolor: theme.palette.primary.main,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${theme.palette.background.paper}`
                }}
              >
                <TriggerIcon sx={{ fontSize: 10, color: 'white' }} />
              </Box>
            )}
          </Box>
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                mb: 0.5,
                color: statusConfig.textColor,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                fontSize: '0.8rem',
                lineHeight: 1.3,
                textShadow: status === 'available' ? `0 0 8px ${alpha(statusConfig.color, 0.3)}` : 'none'
              }}
            >
              {technology.name}
            </Typography>
            
            {/* 状态指示器 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.25,
                  px: 0.5,
                  py: 0.125,
                  bgcolor: alpha(statusConfig.color, 0.15),
                  borderRadius: 1,
                  border: `1px solid ${alpha(statusConfig.color, 0.3)}`
                }}
              >
                {statusConfig.icon}
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontSize: '0.6rem', 
                    fontWeight: 600,
                    color: statusConfig.color
                  }}
                >
                  {statusConfig.label}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* 研究进度条 */}
        {status === 'researching' && progress !== undefined && (
          <Box sx={{ mb: 1 }}>
            <Box
              sx={{
                width: '100%',
                height: 6,
                bgcolor: alpha(theme.palette.grey[500], 0.2),
                borderRadius: 3,
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <Box
                sx={{
                  width: `${progress * 100}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${statusConfig.color} 0%, ${alpha(statusConfig.color, 0.8)} 100%)`,
                  transition: 'width 0.3s ease',
                  borderRadius: 3,
                  boxShadow: `0 0 8px ${alpha(statusConfig.color, 0.5)}`
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontWeight: 600 }}>
                {Math.round(progress * 100)}%
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                研究中...
              </Typography>
            </Box>
          </Box>
        )}

        {/* 解锁条件显示 */}
        {(technology.prerequisites && technology.prerequisites.length > 0 && (status === 'locked' || status === 'available')) || 
         (!technology.prerequisites || technology.prerequisites.length === 0) ? (
          <Box sx={{ mb: 1 }}>
            {/* 有前置科技的科技 */}
            {technology.prerequisites && technology.prerequisites.length > 0 && (status === 'locked' || status === 'available') && (
              <>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontWeight: 600, mb: 0.5 }}>
                  {status === 'locked' ? '需要解锁:' : '前置科技:'}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {getPrerequisiteNames().map((prereqName, index) => {
                    const isCompleted = status === 'available'; // 如果是可研究状态，说明前置科技已完成
                    return (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.25,
                          px: 0.5,
                          py: 0.25,
                          bgcolor: isCompleted 
                            ? alpha(theme.palette.success.main, 0.1)
                            : alpha(theme.palette.grey[500], 0.1),
                          borderRadius: 0.5,
                          border: `1px solid ${
                            isCompleted 
                              ? alpha(theme.palette.success.main, 0.3)
                              : alpha(theme.palette.grey[500], 0.3)
                          }`,
                          fontSize: '0.6rem'
                        }}
                      >
                        {isCompleted ? (
                          <CompletedIcon sx={{ fontSize: 12, color: theme.palette.success.main }} />
                        ) : (
                          <LockedIcon sx={{ fontSize: 12, color: theme.palette.grey[500] }} />
                        )}
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontSize: '0.6rem', 
                            color: isCompleted ? theme.palette.success.main : theme.palette.grey[600],
                            textDecoration: isCompleted ? 'line-through' : 'none'
                          }}
                        >
                          {prereqName}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
                
                {/* 可研究状态的特殊提示 */}
                {status === 'available' && (
                  <Box sx={{ mt: 0.5 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.25,
                        px: 0.5,
                        py: 0.25,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        borderRadius: 0.5,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                      }}
                    >
                      <QueueIcon sx={{ fontSize: 12, color: theme.palette.primary.main }} />
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontSize: '0.6rem', 
                          color: theme.palette.primary.main,
                          fontWeight: 600
                        }}
                      >
                        可以开始研究
                      </Typography>
                    </Box>
                  </Box>
                )}
              </>
            )}
            
            {/* 自动解锁的科技 */}
            {(!technology.prerequisites || technology.prerequisites.length === 0) && status === 'available' && (
              <Box sx={{ mt: 0.5 }}>
                {(() => {
                  const triggerInfo = getResearchTriggerInfo();
                  if (triggerInfo) {
                    // 有研究触发器的科技
                    return (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontWeight: 600 }}>
                          解锁条件:
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            px: 0.5,
                            py: 0.25,
                            bgcolor: alpha(theme.palette.info.main, 0.1),
                            borderRadius: 0.5,
                            border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`
                          }}
                        >
                          {triggerInfo.item && (
                            <FactorioIcon
                              itemId={triggerInfo.item}
                              size={16}
                              showBorder={false}
                            />
                          )}
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontSize: '0.6rem', 
                              color: theme.palette.info.main,
                              fontWeight: 600
                            }}
                          >
                            {triggerInfo.text}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  } else {
                    // 真正的自动解锁科技（无前置科技且无触发器）
                    return (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.25,
                          px: 0.5,
                          py: 0.25,
                          bgcolor: alpha(theme.palette.info.main, 0.1),
                          borderRadius: 0.5,
                          border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`
                        }}
                      >
                        <QueueIcon sx={{ fontSize: 12, color: theme.palette.info.main }} />
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontSize: '0.6rem', 
                            color: theme.palette.info.main,
                            fontWeight: 600
                          }}
                        >
                          自动解锁科技
                        </Typography>
                      </Box>
                    );
                  }
                })()}
              </Box>
            )}
          </Box>
        ) : null}

        {/* 科技包需求 - 详细显示 */}
        {Object.keys(technology.researchCost).length > 0 && (
          <Box sx={{ mb: 1 }}>
            {/* 获取研究配方信息 */}
            {(() => {
              try {
                const dataService = DataService.getInstance();
                const techRecipe = dataService.getRecipe(technology.id);
                const researchTime = techRecipe?.time || technology.researchTime;
                const researchCount = techRecipe?.count || 1;
                
                return (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {/* 输入物品显示 - 显示单次所需数量 */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {Object.entries(techRecipe?.in || {}).map(([packId, amount]) => (
                        <Box
                          key={packId}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.25,
                            px: 0.75,
                            py: 0.5,
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                            borderRadius: 1,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`,
                            boxShadow: `0 2px 4px ${alpha(theme.palette.primary.main, 0.2)}`,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'scale(1.05)',
                              boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.3)}`
                            }
                          }}
                        >
                          <FactorioIcon
                            itemId={packId}
                            size={28}
                            showBorder={false}
                            quantity={amount}
                          />
                        </Box>
                      ))}
                    </Box>
                    
                    {/* 研究时间和次数信息 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        时间: {researchTime}s
                      </Typography>
                      {researchCount > 1 && (
                        <>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                            ×
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                            {researchCount}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Box>
                );
              } catch {
                // 如果获取配方信息失败，回退到简单显示（仍然显示单次数量）
                return (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25 }}>
                    {Object.entries(technology.researchCost).map(([packId, totalAmount]) => {
                      // 尝试从researchCost反推单次数量
                      const dataService = DataService.getInstance();
                      const techRecipe = dataService.getRecipe(technology.id);
                      const unitAmount = techRecipe?.in?.[packId] || totalAmount;
                      
                      return (
                        <Box
                          key={packId}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.25,
                            px: 0.25,
                            py: 0.125,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            borderRadius: 0.25,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                          }}
                        >
                          <FactorioIcon
                            itemId={packId}
                            size={12}
                            showBorder={false}
                          />
                          <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>
                            {unitAmount}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                );
              }
            })()}
          </Box>
        )}

        {/* 解锁内容显示 - 改进版 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {/* 显示解锁内容的图标（优先显示配方） */}
            {getAllUnlockedContent().slice(0, 3).map((content) => (
              <Box
                key={content.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 20,
                  height: 20,
                  bgcolor: alpha(theme.palette.success.main, 0.15),
                  borderRadius: 0.5,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`
                }}
              >
                <FactorioIcon
                  itemId={content.icon}
                  size={14}
                  showBorder={false}
                />
              </Box>
            ))}
            
            {/* 显示解锁数量 */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 0.5,
                py: 0.125,
                bgcolor: alpha(theme.palette.success.main, 0.2),
                borderRadius: 0.5,
                border: `1px solid ${alpha(theme.palette.success.main, 0.4)}`
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: '0.65rem', 
                  fontWeight: 600,
                  color: theme.palette.success.main
                }}
              >
                +{getUnlockCount()}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* 队列状态指示 */}
        {inQueue && (
          <Box sx={{ mt: 0.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.25,
                px: 0.75,
                py: 0.25,
                bgcolor: alpha(theme.palette.info.main, 0.15),
                borderRadius: 1,
                border: `1px solid ${alpha(theme.palette.info.main, 0.4)}`,
                boxShadow: `0 2px 4px ${alpha(theme.palette.info.main, 0.2)}`
              }}
            >
              <QueueIcon sx={{ fontSize: 12, color: theme.palette.info.main }} />
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: '0.6rem', 
                  fontWeight: 600,
                  color: theme.palette.info.main
                }}
              >
                队列中
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

export default TechGridCard;