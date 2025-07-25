// 科技网格卡片组件 - 紧凑版展示

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import {
  CheckCircle as CompletedIcon,
  Lock as LockedIcon,
  Science as ResearchingIcon,
  Add as QueueIcon
} from '@mui/icons-material';
import FactorioIcon from '../common/FactorioIcon';
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

const TechGridCard: React.FC<TechGridCardProps> = ({
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
          bgColor: alpha(theme.palette.success.main, 0.1),
          borderColor: theme.palette.success.main,
          icon: <CompletedIcon />,
          label: '已完成'
        };
      case 'researching':
        return {
          color: theme.palette.info.main,
          bgColor: alpha(theme.palette.info.main, 0.1),
          borderColor: theme.palette.info.main,
          icon: <ResearchingIcon />,
          label: '研究中'
        };
      case 'available':
        return {
          color: theme.palette.warning.main,
          bgColor: alpha(theme.palette.warning.main, 0.1),
          borderColor: theme.palette.warning.main,
          icon: <QueueIcon />,
          label: '可研究'
        };
      default:
        return {
          color: theme.palette.grey[600],
          bgColor: alpha(theme.palette.grey[600], 0.05),
          borderColor: theme.palette.grey[300],
          icon: <LockedIcon />,
          label: '锁定'
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

  return (
    <Card
      sx={{
        height: '100%',
        cursor: canResearch ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        border: `1px solid ${statusConfig.borderColor}`,
        bgcolor: statusConfig.bgColor,
        opacity: isCompleted ? 0.7 : 1,
        '&:hover': canResearch ? {
          transform: 'translateY(-1px)',
          boxShadow: `0 2px 8px ${alpha(statusConfig.color, 0.3)}`,
          bgcolor: alpha(statusConfig.bgColor, 0.8)
        } : {},
        minHeight: 120
      }}
      onClick={() => onClick?.(technology.id)}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        {/* 头部：图标和名称 */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
          <FactorioIcon
            itemId={technology.icon || technology.id}
            size={32}
            showBorder={false}
          />
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                mb: 0.5,
                color: isCompleted ? theme.palette.text.secondary : 'inherit',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                fontSize: '0.75rem',
                lineHeight: 1.2
              }}
            >
              {technology.name}
            </Typography>
          </Box>
        </Box>

        {/* 研究进度条 */}
        {status === 'researching' && progress !== undefined && (
          <Box sx={{ mb: 1 }}>
            <Box
              sx={{
                width: '100%',
                height: 4,
                bgcolor: alpha(theme.palette.grey[500], 0.3),
                borderRadius: 2,
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  width: `${progress * 100}%`,
                  height: '100%',
                  bgcolor: statusConfig.color,
                  transition: 'width 0.3s ease'
                }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              {Math.round(progress * 100)}%
            </Typography>
          </Box>
        )}

        {/* 科技包需求 - 简化显示 */}
        {Object.keys(technology.researchCost).length > 0 && (
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25 }}>
              {Object.entries(technology.researchCost).map(([packId, amount]) => (
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
                    {amount}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* 研究时间和解锁内容 - 紧凑显示 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {/* 显示前2个解锁的物品图标 */}
            {technology.unlocks.items?.slice(0, 2).map(itemId => (
              <FactorioIcon
                key={itemId}
                itemId={itemId}
                size={16}
                showBorder={false}
              />
            ))}
            
            {/* 显示解锁数量 */}
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              +{getUnlockCount()}
            </Typography>
          </Box>
        </Box>

        {/* 队列状态指示 */}
        {inQueue && (
          <Box sx={{ mt: 0.5 }}>
            <Chip
              label="队列中"
              size="small"
              color="info"
              sx={{ 
                height: 18, 
                fontSize: '0.6rem',
                '& .MuiChip-label': {
                  px: 0.5
                }
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TechGridCard;