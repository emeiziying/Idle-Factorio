// 科技节点组件

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Add as AddToQueueIcon,
  CheckCircle as UnlockedIcon,
  Lock as LockedIcon,
  Science as ResearchingIcon
} from '@mui/icons-material';
import FactorioIcon from '../common/FactorioIcon';
import type { Technology, TechStatus } from '../../types/technology';

interface TechNodeProps {
  /** 科技对象 */
  technology: Technology;
  
  /** 科技状态 */
  status: TechStatus;
  
  /** 研究进度 (0-1, 仅当status为researching时有效) */
  progress?: number;
  
  /** 是否高亮显示 */
  highlighted?: boolean;
  
  /** 是否可以开始研究 */
  canResearch?: boolean;
  
  /** 是否已在研究队列中 */
  inQueue?: boolean;
  
  /** 点击科技节点的回调 */
  onClick?: (techId: string) => void;
  
  /** 开始研究的回调 */
  onStartResearch?: (techId: string) => void;
  
  /** 添加到队列的回调 */
  onAddToQueue?: (techId: string) => void;
  
  /** 节点大小 */
  size?: 'small' | 'medium' | 'large';
}

const TechNode: React.FC<TechNodeProps> = ({
  technology,
  status,
  progress = 0,
  highlighted = false,
  canResearch = false,
  inQueue = false,
  onClick,
  onStartResearch,
  onAddToQueue,
  size = 'medium'
}) => {
  const theme = useTheme();
  const [hovered, setHovered] = useState(false);

  // 根据大小设置尺寸
  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { cardSize: 80, iconSize: 32, titleSize: '0.7rem' };
      case 'large':
        return { cardSize: 120, iconSize: 48, titleSize: '0.9rem' };
      default: // medium
        return { cardSize: 100, iconSize: 40, titleSize: '0.8rem' };
    }
  };

  const { cardSize, iconSize, titleSize } = getSizeConfig();

  // 获取状态颜色和图标
  const getStatusConfig = () => {
    switch (status) {
      case 'unlocked':
        return {
          color: theme.palette.success.main,
          borderColor: theme.palette.success.main,
          icon: <UnlockedIcon sx={{ fontSize: 16 }} />,
          label: '已解锁'
        };
      case 'researching':
        return {
          color: theme.palette.info.main,
          borderColor: theme.palette.info.main,
          icon: <ResearchingIcon sx={{ fontSize: 16 }} />,
          label: '研究中'
        };
      case 'available':
        return {
          color: theme.palette.warning.main,
          borderColor: theme.palette.warning.main,
          icon: <StartIcon sx={{ fontSize: 16 }} />,
          label: '可研究'
        };
      default: // locked
        return {
          color: theme.palette.grey[600],
          borderColor: theme.palette.grey[800],
          icon: <LockedIcon sx={{ fontSize: 16 }} />,
          label: '锁定'
        };
    }
  };

  const statusConfig = getStatusConfig();

  // 处理点击
  const handleClick = () => {
    onClick?.(technology.id);
  };

  // 处理开始研究
  const handleStartResearch = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStartResearch?.(technology.id);
  };

  // 处理添加到队列
  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToQueue?.(technology.id);
  };

  // 计算卡片样式
  const getCardStyles = () => {
    const baseStyles = {
      width: cardSize,
      height: cardSize,
      cursor: onClick ? 'pointer' : 'default',
      border: `2px solid ${statusConfig.borderColor}`,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative' as const,
      overflow: 'visible' as const,
      background: theme.palette.background.paper
    };

    // 高亮效果
    if (highlighted) {
      return {
        ...baseStyles,
        boxShadow: `0 0 16px ${alpha(theme.palette.primary.main, 0.6)}`,
        transform: 'scale(1.05)',
        zIndex: 10
      };
    }

    // 悬停效果
    if (hovered) {
      return {
        ...baseStyles,
        boxShadow: `0 4px 12px ${alpha(statusConfig.color, 0.3)}`,
        transform: 'translateY(-2px)'
      };
    }

    return {
      ...baseStyles,
      boxShadow: `0 2px 4px ${alpha(theme.palette.common.black, 0.2)}`
    };
  };

  return (
    <Card
      sx={getCardStyles()}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 研究进度环 */}
      {status === 'researching' && (
        <Box
          sx={{
            position: 'absolute',
            top: -2,
            left: -2,
            width: cardSize + 4,
            height: cardSize + 4,
            zIndex: 1
          }}
        >
          <CircularProgress
            variant="determinate"
            value={progress * 100}
            size={cardSize + 4}
            thickness={2}
            sx={{
              color: theme.palette.info.main,
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              }
            }}
          />
        </Box>
      )}

      <CardContent
        sx={{
          p: 1,
          '&:last-child': { pb: 1 },
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* 科技图标 */}
        <Box sx={{ mb: 0.5 }}>
          <FactorioIcon
            itemId={technology.icon || technology.id}
            size={iconSize}
            showBorder={false}
            selected={status === 'unlocked'}
          />
        </Box>

        {/* 科技名称 */}
        <Typography
          variant="caption"
          sx={{
            fontSize: titleSize,
            fontWeight: 600,
            textAlign: 'center',
            lineHeight: 1.2,
            color: status === 'locked' ? theme.palette.grey[500] : 'inherit',
            mb: 0.5
          }}
        >
          {technology.name}
        </Typography>

        {/* 状态指示器 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* 状态芯片 */}
          <Chip
            icon={statusConfig.icon}
            label={statusConfig.label}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              '& .MuiChip-icon': {
                fontSize: 12
              },
              bgcolor: alpha(statusConfig.color, 0.1),
              color: statusConfig.color,
              border: `1px solid ${alpha(statusConfig.color, 0.3)}`
            }}
          />

          {/* 队列指示器 */}
          {inQueue && (
            <Chip
              label="队列中"
              size="small"
              sx={{
                height: 20,
                fontSize: '0.6rem',
                bgcolor: alpha(theme.palette.secondary.main, 0.1),
                color: theme.palette.secondary.main
              }}
            />
          )}
        </Box>

        {/* 操作按钮 */}
        {(status === 'available' || canResearch) && (
          <Box
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5
            }}
          >
            {/* 开始研究按钮 */}
            {onStartResearch && !inQueue && (
              <Tooltip title="开始研究" placement="left">
                <IconButton
                  size="small"
                  onClick={handleStartResearch}
                  sx={{
                    bgcolor: alpha(theme.palette.success.main, 0.8),
                    color: 'white',
                    width: 24,
                    height: 24,
                    '&:hover': {
                      bgcolor: theme.palette.success.main
                    }
                  }}
                >
                  <StartIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            )}

            {/* 添加到队列按钮 */}
            {onAddToQueue && !inQueue && (
              <Tooltip title="添加到队列" placement="left">
                <IconButton
                  size="small"
                  onClick={handleAddToQueue}
                  sx={{
                    bgcolor: alpha(theme.palette.info.main, 0.8),
                    color: 'white',
                    width: 24,
                    height: 24,
                    '&:hover': {
                      bgcolor: theme.palette.info.main
                    }
                  }}
                >
                  <AddToQueueIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}

        {/* 科技瓶需求显示 */}
        {Object.keys(technology.researchCost).length > 0 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 4,
              left: 4,
              display: 'flex',
              gap: 0.5
            }}
          >
            {Object.entries(technology.researchCost).slice(0, 2).map(([packId, amount]) => (
              <Tooltip key={packId} title={`${packId}: ${amount}`} placement="top">
                <Box>
                  <FactorioIcon
                    itemId={packId}
                    size={16}
                    quantity={amount}
                    showBorder={false}
                  />
                </Box>
              </Tooltip>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TechNode;