import React, { useMemo, useCallback } from 'react';
import { Card, CardContent, Typography, Box, useTheme, alpha, styled } from '@mui/material';
import {
  CheckCircle as CompletedIcon,
  Lock as LockedIcon,
  Science as ResearchingIcon,
  Add as QueueIcon,
  NewReleases as TriggerIcon,
} from '@mui/icons-material';
import FactorioIcon from '../common/FactorioIcon';
import { TechnologyService } from '../../services/technology/TechnologyService';
import { DataService } from '../../services/core/DataService';
import type { Technology, TechStatus } from '../../types/technology';

// Factorio Design System
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

const SPACING = {
  MICRO: 2, // 0.25rem - 极小间距
  SMALL: 4, // 0.5rem  - 相关元素
  MEDIUM: 8, // 1rem    - 区块间距
  LARGE: 16, // 2rem    - 主要组件
  XLARGE: 24, // 3rem    - 大区块
};

const TYPOGRAPHY = {
  TECH_NAME: '0.8rem', // 主要信息
  STATUS: '0.7rem', // 状态标签
  DETAILS: '0.65rem', // 详细信息
  MICRO: '0.6rem', // 最小标签
};

const TOUCH_TARGET = {
  MIN_SIZE: 44, // 最小触控目标
  MOBILE_SIZE: 40, // 移动端最小尺寸
};

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

// Styled components for better performance
interface StatusConfig {
  color: string;
  bgColor: string;
  borderColor: string;
  accentColor: string;
  icon: React.ReactNode;
  label: string;
  textColor: string;
  hoverEffect: boolean;
}

const StyledCard = styled(Card, {
  shouldForwardProp: prop => !['statusConfig', 'canClick', 'isCompleted'].includes(prop as string),
})<{
  statusConfig: StatusConfig;
  canClick: boolean;
  isCompleted: boolean;
}>(({ theme, statusConfig, canClick, isCompleted }) => ({
  height: '100%',
  minHeight: 160, // 增加高度以提供更好的内容呼吸空间
  cursor: canClick ? 'pointer' : 'default',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

  // Factorio 工业风格背景
  background: FACTORIO_COLORS.CARD_BG_PRIMARY,

  // 工业风格的斜面边框效果
  border: 'none',
  borderLeft: `4px solid ${statusConfig.color}`, // 状态指示條
  borderRadius: 12, // Factorio 使用较大的圆角

  boxShadow: `
    inset 1px 1px 0 ${FACTORIO_COLORS.BORDER_LIGHT},
    inset -1px -1px 0 ${FACTORIO_COLORS.BORDER_DARK},
    0 2px 4px rgba(0, 0, 0, 0.2)
  `,

  opacity: isCompleted ? 0.7 : 1,
  position: 'relative',
  overflow: 'hidden',

  // 移动端优化
  [theme.breakpoints.down('sm')]: {
    minHeight: 140,
    borderRadius: 8,
  },

  // 禁用移动端点击时的蓝色遮罩
  WebkitTapHighlightColor: 'transparent',

  // Factorio 风格的悬停效果
  '&:hover': statusConfig.hoverEffect
    ? {
        background: FACTORIO_COLORS.CARD_BG_HOVER,
        transform: 'translateY(-1px)',
        boxShadow: `
      inset 1px 1px 0 ${FACTORIO_COLORS.BORDER_LIGHT},
      inset -1px -1px 0 ${FACTORIO_COLORS.BORDER_DARK},
      0 4px 8px rgba(0, 0, 0, 0.3),
      0 0 0 1px ${alpha(statusConfig.color, 0.5)}
    `,
        borderLeftColor: statusConfig.accentColor || statusConfig.color,
      }
    : {},

  // Factorio 风格的点击效果
  '&:active': statusConfig.hoverEffect
    ? {
        background: `linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)`,
        transform: 'translateY(1px)',
        boxShadow: `
      inset 2px 2px 4px ${FACTORIO_COLORS.BORDER_DARK},
      inset -1px -1px 0 ${FACTORIO_COLORS.BORDER_LIGHT},
      0 1px 2px rgba(0, 0, 0, 0.4),
      0 0 0 2px ${alpha(statusConfig.color, 0.8)}
    `,
        borderLeftColor: statusConfig.color,
        transition: 'all 0.1s ease-out',
      }
    : {},

  // 焦点样式（用于键盘导航）
  '&:focus-visible': {
    outline: `2px solid ${statusConfig.color}`,
    outlineOffset: 2,
  },

  // 卡片内部分区间距
  '& .card-section + .card-section': {
    marginTop: SPACING.SMALL,
  },
}));

const StatusChip = styled(Box, {
  shouldForwardProp: prop => prop !== 'statusColor',
})<{ statusColor: string }>(({ theme, statusColor }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: SPACING.MICRO,
  padding: `${SPACING.SMALL}px ${SPACING.MEDIUM}px`,
  minHeight: TOUCH_TARGET.MIN_SIZE,

  // Factorio 风格背景
  background: `linear-gradient(135deg, ${alpha(statusColor, 0.2)} 0%, ${alpha(statusColor, 0.1)} 100%)`,
  borderRadius: 6,
  border: `1px solid ${alpha(statusColor, 0.4)}`,

  // 工业风格阴影
  boxShadow: `
    inset 1px 1px 0 rgba(255, 255, 255, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.2)
  `,

  // 移动端优化
  [theme.breakpoints.down('sm')]: {
    minHeight: TOUCH_TARGET.MOBILE_SIZE,
    padding: `${SPACING.MICRO}px ${SPACING.SMALL}px`,
    fontSize: TYPOGRAPHY.STATUS,
  },

  // 悬停效果
  '&:hover': {
    background: `linear-gradient(135deg, ${alpha(statusColor, 0.3)} 0%, ${alpha(statusColor, 0.15)} 100%)`,
    transform: 'scale(1.02)',
  },
}));

// Header component with improved hierarchy
const TechHeader: React.FC<{
  technology: Technology;
  hasResearchTrigger: boolean;
  statusConfig: StatusConfig;
  status: TechStatus;
}> = React.memo(({ technology, hasResearchTrigger, statusConfig, status }) => (
  <Box
    className="card-section"
    sx={{ display: 'flex', alignItems: 'flex-start', gap: SPACING.MEDIUM / 8 }}
  >
    {/* 科技图标区域 */}
    <Box sx={{ position: 'relative', flexShrink: 0 }}>
      <FactorioIcon
        itemId={technology.icon || technology.id}
        size={40} // 将图标尺寸从 32 增加到 40
        showBorder={false}
      />
      {/* 研究触发器指示器 */}
      {hasResearchTrigger && (
        <Box
          sx={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 18,
            height: 18,
            background: `linear-gradient(135deg, ${FACTORIO_COLORS.ORANGE_PRIMARY} 0%, ${FACTORIO_COLORS.ORANGE_DARK} 100%)`,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${FACTORIO_COLORS.BORDER_ACCENT}`,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
          }}
        >
          <TriggerIcon sx={{ fontSize: 12, color: 'white' }} />
        </Box>
      )}
    </Box>

    {/* 科技信息区域 */}
    <Box sx={{ flex: 1, minWidth: 0 }}>
      {/* 科技名称 - 主要信息 */}
      <Typography
        variant="h6"
        component="h3"
        sx={{
          fontSize: TYPOGRAPHY.TECH_NAME,
          fontWeight: 700,
          lineHeight: 1.2,
          mb: SPACING.MICRO / 8,
          color: statusConfig.textColor,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          textShadow: status === 'available' ? `0 0 6px ${alpha(statusConfig.color, 0.4)}` : 'none',
        }}
      >
        {technology.name}
      </Typography>
    </Box>
  </Box>
));

// Progress bar component with Factorio styling
const ProgressBar: React.FC<{
  progress: number;
  statusConfig: StatusConfig;
}> = React.memo(({ progress, statusConfig }) => (
  <Box className="card-section">
    {/* 进度条 */}
    <Box
      sx={{
        width: '100%',
        height: 8, // 增加高度以提高可视性
        background: `linear-gradient(135deg, ${FACTORIO_COLORS.BORDER_DARK} 0%, ${alpha(FACTORIO_COLORS.GREY_DARK, 0.3)} 100%)`,
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
        border: `1px solid ${FACTORIO_COLORS.BORDER_ACCENT}`,
        boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)',
      }}
    >
      <Box
        sx={{
          width: `${progress * 100}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${statusConfig.color} 0%, ${statusConfig.accentColor} 100%)`,
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
            borderRadius: '3px 3px 0 0',
          },
        }}
      />
    </Box>

    {/* 进度信息 */}
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mt: SPACING.MICRO / 8,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontSize: TYPOGRAPHY.DETAILS,
          fontWeight: 600,
          color: statusConfig.color,
        }}
      >
        {Math.round(progress * 100)}%
      </Typography>
      <Typography
        variant="caption"
        sx={{
          fontSize: TYPOGRAPHY.DETAILS,
          color: '#cccccc',
          fontStyle: 'italic',
        }}
      >
        研究中...
      </Typography>
    </Box>
  </Box>
));

// Unlock content component with better hierarchy
const UnlockContent: React.FC<{
  unlockedContent: {
    items: Array<{ id: string; name: string }>;
    recipes: Array<{ id: string; name: string }>;
    buildings: Array<{ id: string; name: string }>;
    total: number;
  };
  unlockCount: number;
}> = React.memo(({ unlockedContent, unlockCount }) => {
  const maxDisplayItems = 5; // 最多显示5个图标
  // 合并所有解锁内容
  const allItems = [
    ...unlockedContent.items.map(item => ({ ...item, type: 'item' })),
    ...unlockedContent.recipes.map(recipe => ({ ...recipe, type: 'recipe' })),
    ...unlockedContent.buildings.map(building => ({ ...building, type: 'building' }))
  ];
  const displayItems = allItems.slice(0, maxDisplayItems);
  const hasMoreItems = unlockCount > maxDisplayItems;
  const remainingCount = unlockCount - maxDisplayItems;

  return (
    <Box
      className="card-section"
      sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
    >
      {/* 解锁内容预览 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: SPACING.MICRO / 8, flexWrap: 'wrap' }}>
        {/* 显示图标，最多5个 */}
        {displayItems.map(content => (
          <Box
            key={content.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24, // 增加尺寸以提高可视性
              height: 24,
              background: `linear-gradient(135deg, ${FACTORIO_COLORS.COMPLETED_BG} 0%, ${alpha(FACTORIO_COLORS.GREEN_SUCCESS, 0.1)} 100%)`,
              borderRadius: 4,
              border: `1px solid ${alpha(FACTORIO_COLORS.GREEN_SUCCESS, 0.4)}`,
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
            title={`解锁项目: ${content.id}`}
          >
            <FactorioIcon
              itemId={content.icon}
              size={16} // 从 14 增加到 16
              showBorder={false}
            />
          </Box>
        ))}

        {/* 剩余数量显示 - 只有在超过5个时才显示 */}
        {hasMoreItems && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: SPACING.SMALL / 8,
              py: SPACING.MICRO / 8,
              background: `linear-gradient(135deg, ${FACTORIO_COLORS.GREEN_SUCCESS} 0%, ${FACTORIO_COLORS.GREEN_DARK} 100%)`,
              borderRadius: 4,
              border: `1px solid ${FACTORIO_COLORS.GREEN_DARK}`,
              boxShadow: `
                inset 0 1px 0 rgba(255, 255, 255, 0.2),
                0 1px 2px rgba(0, 0, 0, 0.2)
              `,
              minHeight: 24,
            }}
            title={`还有 ${remainingCount} 个解锁项目`}
          >
            <Typography
              variant="caption"
              sx={{
                fontSize: TYPOGRAPHY.DETAILS,
                fontWeight: 700,
                color: '#ffffff',
                textShadow: '0 1px 1px rgba(0, 0, 0, 0.5)',
              }}
            >
              +{remainingCount}
            </Typography>
          </Box>
        )}

        {/* 如果没有解锁内容，显示提示 */}
        {unlockCount === 0 && (
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.65rem',
              color: 'text.secondary',
              fontStyle: 'italic',
            }}
          >
            无解锁内容
          </Typography>
        )}
      </Box>
    </Box>
  );
});

const TechGridCard: React.FC<TechGridCardProps> = React.memo(
  ({ technology, status, progress, inQueue, onClick }) => {
    const theme = useTheme();

    // Memoize service calls
    const techData = useMemo(
      () => ({
        unlockedContent: TechnologyService.getUnlockedContentInfo(technology),
        prerequisiteNames: TechnologyService.getPrerequisiteNames(technology.prerequisites),
        researchTriggerInfo: TechnologyService.getResearchTriggerInfo(technology.id),
      }),
      [technology]
    );

    const { unlockedContent, prerequisiteNames, researchTriggerInfo } = techData;

    const hasResearchTrigger = Boolean(researchTriggerInfo);
    const unlockCount = unlockedContent.total;

    // Memoize status configuration
    const statusConfig = useMemo(() => {
      const configs = {
        unlocked: {
          color: FACTORIO_COLORS.GREEN_SUCCESS,
          bgColor: FACTORIO_COLORS.COMPLETED_BG,
          borderColor: FACTORIO_COLORS.GREEN_SUCCESS,
          accentColor: FACTORIO_COLORS.GREEN_DARK,
          icon: <CompletedIcon sx={{ fontSize: 16 }} />,
          label: '已完成',
          textColor: '#ffffff',
          hoverEffect: false,
        },
        researching: {
          color: FACTORIO_COLORS.BLUE_INFO,
          bgColor: FACTORIO_COLORS.RESEARCHING_BG,
          borderColor: FACTORIO_COLORS.BLUE_INFO,
          accentColor: FACTORIO_COLORS.BLUE_DARK,
          icon: <ResearchingIcon sx={{ fontSize: 16 }} />,
          label: '研究中',
          textColor: '#ffffff',
          hoverEffect: false,
        },
        available: {
          color: FACTORIO_COLORS.ORANGE_PRIMARY,
          bgColor: FACTORIO_COLORS.AVAILABLE_BG,
          borderColor: FACTORIO_COLORS.ORANGE_PRIMARY,
          accentColor: FACTORIO_COLORS.ORANGE_LIGHT,
          icon: <QueueIcon sx={{ fontSize: 16 }} />,
          label: '可研究',
          textColor: '#ffffff',
          hoverEffect: true,
        },
        locked: {
          color: FACTORIO_COLORS.GREY_LOCKED,
          bgColor: FACTORIO_COLORS.LOCKED_BG,
          borderColor: FACTORIO_COLORS.GREY_LOCKED,
          accentColor: FACTORIO_COLORS.GREY_DARK,
          icon: <LockedIcon sx={{ fontSize: 16 }} />,
          label: '锁定',
          textColor: '#cccccc',
          hoverEffect: false,
        },
      };
      return configs[status] || configs.locked;
    }, [status]);

    // 可以点击查看详情的条件：不是已完成状态的科技都可以点击查看
    const canClick = status !== 'unlocked';
    const isCompleted = status === 'unlocked';

    const handleClick = useCallback(() => {
      onClick?.(technology.id);
    }, [onClick, technology.id]);

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (canClick) {
            handleClick();
          }
        }
      },
      [canClick, handleClick]
    );

    return (
      <StyledCard
        statusConfig={statusConfig}
        canClick={canClick}
        isCompleted={isCompleted}
        onClick={canClick ? handleClick : undefined}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={canClick ? 0 : -1}
        aria-label={`${technology.name} 科技。状态：${statusConfig.label}${canClick ? '。点击查看详情' : ''}`}
        aria-describedby={`tech-${technology.id}-details`}
      >
        <CardContent
          sx={{
            p: SPACING.MEDIUM / 8,
            '&:last-child': { pb: SPACING.MEDIUM / 8 },
            // 移动端优化
            [theme.breakpoints.down('sm')]: {
              p: SPACING.SMALL / 8,
              '&:last-child': { pb: SPACING.SMALL / 8 },
            },
          }}
          id={`tech-${technology.id}-details`}
          aria-live="polite"
        >
          <TechHeader
            technology={technology}
            hasResearchTrigger={hasResearchTrigger}
            statusConfig={statusConfig}
            status={status}
          />

          {status === 'researching' && progress !== undefined && (
            <ProgressBar progress={progress} statusConfig={statusConfig} />
          )}

          {/* 解锁条件显示 */}
          {(technology.prerequisites &&
            technology.prerequisites.length > 0 &&
            (status === 'locked' || status === 'available')) ||
          !technology.prerequisites ||
          technology.prerequisites.length === 0 ? (
            <Box sx={{ mb: 1 }}>
              {/* 有前置科技的科技 */}
              {technology.prerequisites &&
                technology.prerequisites.length > 0 &&
                (status === 'locked' || status === 'available') && (
                  <>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: '0.65rem', fontWeight: 600, mb: 0.5 }}
                    >
                      {status === 'locked' ? '需要解锁:' : '前置科技:'}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {technology.prerequisites.map((prereqId, index) => {
                        const isCompleted = status === 'available'; // 如果是可研究状态，说明前置科技已完成
                        const prereqName = prerequisiteNames[index];
                        return (
                          <Box
                            key={prereqId}
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 0.25,
                              p: 0.5,
                              bgcolor: isCompleted
                                ? alpha(theme.palette.success.main, 0.1)
                                : alpha(theme.palette.grey[500], 0.1),
                              borderRadius: 0.5,
                              border: `1px solid ${
                                isCompleted
                                  ? alpha(theme.palette.success.main, 0.3)
                                  : alpha(theme.palette.grey[500], 0.3)
                              }`,
                              minWidth: 28,
                              position: 'relative',
                            }}
                            title={`前置科技: ${prereqName} ${isCompleted ? '(已解锁)' : '(未解锁)'}`}
                          >
                            {/* 科技图标 */}
                            <FactorioIcon itemId={prereqId} size={20} showBorder={false} />

                            {/* 状态指示器 */}
                            <Box
                              sx={{
                                position: 'absolute',
                                top: -2,
                                right: -2,
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: isCompleted
                                  ? theme.palette.success.main
                                  : theme.palette.grey[500],
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `1px solid ${theme.palette.background.paper}`,
                              }}
                            >
                              {isCompleted ? (
                                <CompletedIcon sx={{ fontSize: 8, color: 'white' }} />
                              ) : (
                                <LockedIcon sx={{ fontSize: 8, color: 'white' }} />
                              )}
                            </Box>
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
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                          }}
                        >
                          <QueueIcon sx={{ fontSize: 12, color: theme.palette.primary.main }} />
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '0.6rem',
                              color: theme.palette.primary.main,
                              fontWeight: 600,
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
              {(!technology.prerequisites || technology.prerequisites.length === 0) &&
                status === 'available' && (
                  <Box sx={{ mt: 0.5 }}>
                    {(() => {
                      if (researchTriggerInfo) {
                        // 有研究触发器的科技
                        return (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: '0.65rem', fontWeight: 600 }}
                            >
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
                                border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                              }}
                            >
                              {researchTriggerInfo.item && (
                                <FactorioIcon
                                  itemId={researchTriggerInfo.item}
                                  size={16}
                                  showBorder={false}
                                />
                              )}
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: '0.6rem',
                                  color: theme.palette.info.main,
                                  fontWeight: 600,
                                }}
                              >
                                {researchTriggerInfo.text}
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
                              border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                            }}
                          >
                            <QueueIcon sx={{ fontSize: 12, color: theme.palette.info.main }} />
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: '0.6rem',
                                color: theme.palette.info.main,
                                fontWeight: 600,
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
                                boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                              },
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
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: '0.65rem' }}
                        >
                          时间: {researchTime}s
                        </Typography>
                        {researchCount > 1 && (
                          <>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: '0.65rem' }}
                            >
                              ×
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: '0.65rem' }}
                            >
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
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                            }}
                          >
                            <FactorioIcon itemId={packId} size={12} showBorder={false} />
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 600, fontSize: '0.65rem' }}
                            >
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

          <UnlockContent unlockedContent={unlockedContent} unlockCount={unlockCount} />

          {/* 队列状态指示 */}
          {inQueue && (
            <Box className="card-section" sx={{ mt: SPACING.MICRO / 8 }}>
              <StatusChip statusColor={FACTORIO_COLORS.BLUE_INFO}>
                <QueueIcon sx={{ fontSize: 14, color: '#ffffff' }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: TYPOGRAPHY.STATUS,
                    fontWeight: 600,
                    color: '#ffffff',
                  }}
                >
                  队列中
                </Typography>
              </StatusChip>
            </Box>
          )}
        </CardContent>
      </StyledCard>
    );
  }
);

export default TechGridCard;
