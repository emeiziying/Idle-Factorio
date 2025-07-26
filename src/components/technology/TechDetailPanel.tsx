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
  Divider,
  useTheme,
  alpha,
  styled
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

// Factorio Design System (与TechGridCard保持一致)
const FACTORIO_COLORS = {
  // Core Factorio palette
  ORANGE_PRIMARY: '#ff9800',
  ORANGE_DARK: '#e68900',
  ORANGE_LIGHT: '#ffb74d',
  GREEN_SUCCESS: '#4caf50',
  GREEN_DARK: '#388e3c',
  BLUE_INFO: '#2196f3',
  BLUE_DARK: '#1976d2',
  GREY_LOCKED: '#616161',
  GREY_DARK: '#424242',
  
  // Industrial backgrounds with proper contrast
  CARD_BG_PRIMARY: 'linear-gradient(135deg, #3a3a3a 0%, #2a2a2a 100%)',
  CARD_BG_HOVER: 'linear-gradient(135deg, #4a4a4a 0%, #3a3a3a 100%)',
  
  // Status backgrounds
  AVAILABLE_BG: 'rgba(255, 152, 0, 0.25)',
  COMPLETED_BG: 'rgba(76, 175, 80, 0.2)',
  RESEARCHING_BG: 'rgba(33, 150, 243, 0.25)',
  LOCKED_BG: 'rgba(97, 97, 97, 0.15)',
  
  // Border colors for industrial depth
  BORDER_LIGHT: 'rgba(255, 255, 255, 0.1)',
  BORDER_DARK: 'rgba(0, 0, 0, 0.3)',
  BORDER_ACCENT: '#454545',
};

// Factorio风格的Card组件
const FactorioCard = styled(Card)(({ theme }) => ({
  background: FACTORIO_COLORS.CARD_BG_PRIMARY,
  border: 'none',
  borderRadius: 12,
  boxShadow: `
    inset 1px 1px 0 ${FACTORIO_COLORS.BORDER_LIGHT},
    inset -1px -1px 0 ${FACTORIO_COLORS.BORDER_DARK},
    0 2px 4px rgba(0, 0, 0, 0.2)
  `,
  
  // 移动端优化
  [theme.breakpoints.down('sm')]: {
    borderRadius: 8,
  },
}));

// Factorio风格的状态Chip
const FactorioChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'statusColor'
})<{ statusColor: string }>(({ statusColor }) => ({
  background: `linear-gradient(135deg, ${alpha(statusColor, 0.2)} 0%, ${alpha(statusColor, 0.1)} 100%)`,
  border: `1px solid ${alpha(statusColor, 0.4)}`,
  boxShadow: `
    inset 1px 1px 0 rgba(255, 255, 255, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.2)
  `,
  '& .MuiChip-label': {
    color: '#ffffff',
    fontWeight: 600,
    textShadow: '0 1px 1px rgba(0, 0, 0, 0.5)'
  }
}));

// Factorio风格的按钮
const FactorioButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'buttonColor'
})<{ buttonColor: string }>(({ buttonColor }) => ({
  background: `linear-gradient(135deg, ${buttonColor} 0%, ${alpha(buttonColor, 0.8)} 100%)`,
  border: `2px solid ${alpha(buttonColor, 0.6)}`,
  borderRadius: 8,
  boxShadow: `
    inset 1px 1px 0 rgba(255, 255, 255, 0.2),
    0 2px 4px rgba(0, 0, 0, 0.3)
  `,
  color: '#ffffff',
  fontWeight: 700,
  textShadow: '0 1px 1px rgba(0, 0, 0, 0.5)',
  
  '&:hover': {
    background: `linear-gradient(135deg, ${alpha(buttonColor, 0.9)} 0%, ${alpha(buttonColor, 0.7)} 100%)`,
    transform: 'translateY(-1px)',
    boxShadow: `
      inset 1px 1px 0 rgba(255, 255, 255, 0.2),
      0 4px 8px rgba(0, 0, 0, 0.4)
    `,
  },
  
  '&:disabled': {
    background: FACTORIO_COLORS.GREY_LOCKED,
    border: `2px solid ${FACTORIO_COLORS.GREY_DARK}`,
    color: 'rgba(255, 255, 255, 0.5)',
  }
}));

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

  // 获取状态配置 (使用Factorio配色)
  const getStatusConfig = () => {
    switch (status) {
      case 'unlocked':
        return {
          color: FACTORIO_COLORS.GREEN_SUCCESS,
          icon: <CheckCircleIcon />,
          label: '已解锁',
          description: '此科技已完成研究'
        };
      case 'researching':
        return {
          color: FACTORIO_COLORS.BLUE_INFO,
          icon: <ResearchingIcon />,
          label: '研究中',
          description: '正在进行研究'
        };
      case 'available':
        return {
          color: FACTORIO_COLORS.ORANGE_PRIMARY,
          icon: <StartIcon />,
          label: '可研究',
          description: '满足前置条件，可以开始研究'
        };
      default:
        return {
          color: FACTORIO_COLORS.GREY_LOCKED,
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
      const localizedName = dataService.getLocalizedItemName(itemId);
      unlocks.items.push({
        id: itemId,
        name: localizedName || itemId
      });
    });

    technology.unlocks.recipes?.forEach(recipeId => {
      const localizedName = dataService.getLocalizedRecipeName(recipeId);
      unlocks.recipes.push({
        id: recipeId,
        name: localizedName || recipeId
      });
    });

    technology.unlocks.buildings?.forEach(buildingId => {
      const localizedName = dataService.getLocalizedItemName(buildingId);
      unlocks.buildings.push({
        id: buildingId,
        name: localizedName || buildingId
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
        const localizedName = dataService.getLocalizedItemName(trigger.item!);
        return {
          description: `制造 ${trigger.count || 1} 件物品`,
          itemName: localizedName || trigger.item!,
          itemId: trigger.item!,
          count: trigger.count || 1
        };
      }
      case 'build-entity': {
        const localizedName = dataService.getLocalizedItemName(trigger.entity!);
        return {
          description: `建造 ${trigger.count || 1} 个建筑`,
          itemName: localizedName || trigger.entity!,
          itemId: trigger.entity!,
          count: trigger.count || 1
        };
      }
      case 'mine-entity': {
        const localizedName = dataService.getLocalizedItemName(trigger.entity!);
        return {
          description: `挖掘 ${trigger.count || 1} 个资源`,
          itemName: localizedName || trigger.entity!,
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
            
            <FactorioChip
              icon={statusConfig.icon}
              label={statusConfig.label}
              size="small"
              statusColor={statusConfig.color}
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
            <FactorioCard sx={{ mb: 2 }}>
              <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ResearchingIcon fontSize="small" />
                  研究进度
                </Typography>
                
                <Box
                  sx={{
                    width: '100%',
                    height: 8,
                    background: `linear-gradient(135deg, ${FACTORIO_COLORS.BORDER_DARK} 0%, ${alpha(FACTORIO_COLORS.GREY_DARK, 0.3)} 100%)`,
                    borderRadius: 4,
                    overflow: 'hidden',
                    border: `1px solid ${FACTORIO_COLORS.BORDER_ACCENT}`,
                    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)',
                    mb: 1
                  }}
                >
                  <Box
                    sx={{
                      width: `${progress * 100}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${statusConfig.color} 0%, ${alpha(statusConfig.color, 0.8)} 100%)`,
                      transition: 'width 0.5s ease-out',
                      borderRadius: 3,
                      boxShadow: `0 0 6px ${alpha(statusConfig.color, 0.6)}`,
                      position: 'relative',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '50%',
                        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%)',
                        borderRadius: '3px 3px 0 0'
                      }
                    }}
                  />
                </Box>
                
                <Typography variant="caption" color="text.secondary">
                  {Math.round(progress * 100)}% 完成
                  {techState?.timeRemaining && (
                    <span> - 剩余 {formatTime(techState.timeRemaining)}</span>
                  )}
                </Typography>
              </CardContent>
            </FactorioCard>
          )}

          {/* 研究需求 */}
          <FactorioCard sx={{ mb: 2 }}>
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
          </FactorioCard>

          {/* 研究触发器 */}
          {researchTrigger && (
            <FactorioCard sx={{ mb: 2 }}>
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
            </FactorioCard>
          )}

          {/* 前置科技 */}
          {prerequisites.length > 0 && (
            <FactorioCard sx={{ mb: 2 }}>
              <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RequirementIcon fontSize="small" />
                  前置科技
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {prerequisites.map(prereq => (
                    <Box
                      key={prereq.id}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 0.5,
                        p: 1,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        bgcolor: prereq.unlocked 
                          ? alpha(theme.palette.success.main, 0.05)
                          : alpha(theme.palette.grey[500], 0.05),
                        minWidth: 64,
                        maxWidth: 80,
                        position: 'relative',
                        '&:hover': {
                          bgcolor: prereq.unlocked 
                            ? alpha(theme.palette.success.main, 0.1)
                            : alpha(theme.palette.grey[500], 0.1),
                        }
                      }}
                      title={`前置科技: ${prereq.name} ${prereq.unlocked ? '(已解锁)' : '(未解锁)'}`}
                    >
                      {/* 科技图标 */}
                      <Box
                        sx={{
                          filter: prereq.unlocked ? 'none' : 'grayscale(1) opacity(0.6)'
                        }}
                      >
                        <FactorioIcon
                          itemId={prereq.id}
                          size={32}
                          showBorder={false}
                        />
                      </Box>
                      
                      {/* 状态指示器 */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          bgcolor: prereq.unlocked ? theme.palette.success.main : theme.palette.grey[500],
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `2px solid ${theme.palette.background.paper}`
                        }}
                      >
                        {prereq.unlocked ? (
                          <CheckCircleIcon sx={{ fontSize: 10, color: 'white' }} />
                        ) : (
                          <LockIcon sx={{ fontSize: 10, color: 'white' }} />
                        )}
                      </Box>
                      
                      {/* 科技名称 */}
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          textAlign: 'center',
                          fontSize: '0.65rem',
                          lineHeight: 1.2,
                          wordBreak: 'break-word',
                          hyphens: 'auto',
                          color: prereq.unlocked ? 'inherit' : 'text.disabled'
                        }}
                      >
                        {prereq.name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </FactorioCard>
          )}

          {/* 解锁内容 */}
          {(unlockInfo.items.length > 0 || unlockInfo.recipes.length > 0 || unlockInfo.buildings.length > 0) && (
            <FactorioCard sx={{ mb: 2 }}>
              <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <UnlockIcon fontSize="small" />
                  解锁内容
                </Typography>

                {/* 统一显示所有解锁内容 */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {/* 解锁物品 */}
                  {unlockInfo.items.map(item => (
                    <Box
                      key={`item-${item.id}`}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 0.5,
                        p: 1,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        bgcolor: alpha(theme.palette.success.main, 0.05),
                        minWidth: 64,
                        maxWidth: 80,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                        }
                      }}
                      title={`物品: ${item.name}`}
                    >
                      <FactorioIcon
                        itemId={item.id}
                        size={32}
                        showBorder={false}
                      />
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          textAlign: 'center',
                          fontSize: '0.65rem',
                          lineHeight: 1.2,
                          wordBreak: 'break-word',
                          hyphens: 'auto'
                        }}
                      >
                        {item.name}
                      </Typography>
                    </Box>
                  ))}

                  {/* 解锁配方 */}
                  {unlockInfo.recipes.map(recipe => (
                    <Box
                      key={`recipe-${recipe.id}`}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 0.5,
                        p: 1,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        minWidth: 64,
                        maxWidth: 80,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                        }
                      }}
                      title={`配方: ${recipe.name}`}
                    >
                      <FactorioIcon
                        itemId={recipe.id}
                        size={32}
                        showBorder={false}
                      />
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          textAlign: 'center',
                          fontSize: '0.65rem',
                          lineHeight: 1.2,
                          wordBreak: 'break-word',
                          hyphens: 'auto'
                        }}
                      >
                        {recipe.name}
                      </Typography>
                    </Box>
                  ))}

                  {/* 解锁建筑 */}
                  {unlockInfo.buildings.map(building => (
                    <Box
                      key={`building-${building.id}`}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 0.5,
                        p: 1,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        bgcolor: alpha(theme.palette.warning.main, 0.05),
                        minWidth: 64,
                        maxWidth: 80,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.warning.main, 0.1),
                        }
                      }}
                      title={`建筑: ${building.name}`}
                    >
                      <FactorioIcon
                        itemId={building.id}
                        size={32}
                        showBorder={false}
                      />
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          textAlign: 'center',
                          fontSize: '0.65rem',
                          lineHeight: 1.2,
                          wordBreak: 'break-word',
                          hyphens: 'auto'
                        }}
                      >
                        {building.name}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* 如果没有任何解锁内容，显示提示 */}
                {unlockInfo.items.length === 0 && unlockInfo.recipes.length === 0 && unlockInfo.buildings.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    此科技不解锁任何新内容
                  </Typography>
                )}
              </CardContent>
            </FactorioCard>
          )}

          <Divider sx={{ my: 2 }} />

          {/* 操作按钮 */}
          <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
            {/* 有研究触发器的科技不显示研究按钮，因为它们是自动解锁的 */}
            {canResearch && !researchTrigger && onStartResearch && (
              <FactorioButton
                startIcon={<StartIcon />}
                onClick={() => onStartResearch(techId)}
                fullWidth
                buttonColor={FACTORIO_COLORS.GREEN_SUCCESS}
              >
                开始研究
              </FactorioButton>
            )}

            {canResearch && !researchTrigger && onAddToQueue && (
              <FactorioButton
                startIcon={<AddToQueueIcon />}
                onClick={() => onAddToQueue(techId)}
                fullWidth
                buttonColor={FACTORIO_COLORS.BLUE_INFO}
              >
                添加到队列
              </FactorioButton>
            )}

            {/* 研究触发器科技的说明 */}
            {researchTrigger && status !== 'unlocked' && (
              <Box
                sx={{ 
                  textAlign: 'center', 
                  p: 2, 
                  background: `linear-gradient(135deg, ${alpha(FACTORIO_COLORS.ORANGE_PRIMARY, 0.15)} 0%, ${alpha(FACTORIO_COLORS.ORANGE_PRIMARY, 0.05)} 100%)`,
                  border: `1px solid ${alpha(FACTORIO_COLORS.ORANGE_PRIMARY, 0.3)}`,
                  borderRadius: 2,
                  boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.1)`
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ 
                    color: FACTORIO_COLORS.ORANGE_PRIMARY,
                    fontWeight: 600,
                    textShadow: '0 1px 1px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  此科技将在满足条件时自动解锁
                </Typography>
              </Box>
            )}

            {status === 'locked' && !researchTrigger && (
              <Box
                sx={{ 
                  textAlign: 'center', 
                  p: 2, 
                  background: `linear-gradient(135deg, ${alpha(FACTORIO_COLORS.GREY_LOCKED, 0.15)} 0%, ${alpha(FACTORIO_COLORS.GREY_LOCKED, 0.05)} 100%)`,
                  border: `1px solid ${alpha(FACTORIO_COLORS.GREY_LOCKED, 0.3)}`,
                  borderRadius: 2,
                  boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.1)`
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ 
                    color: FACTORIO_COLORS.GREY_LOCKED,
                    fontWeight: 600
                  }}
                >
                  {statusConfig.description}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default TechDetailPanel;