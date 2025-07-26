// 简化的科技网格布局组件

import React from 'react';
import {
  Box,
  Typography,
  useTheme
} from '@mui/material';
import TechGridCard from './TechGridCard';
import type { Technology, TechStatus } from '../../types/technology';

interface TechSimpleGridProps {
  /** 要显示的科技列表 */
  technologies: Technology[];
  
  /** 科技状态映射 */
  techStates: Map<string, { status: TechStatus; progress?: number }>;
  
  /** 研究队列中的科技ID */
  queuedTechIds: Set<string>;
  
  /** 点击科技卡片的回调 */
  onTechClick?: (techId: string) => void;
}

const TechSimpleGrid: React.FC<TechSimpleGridProps> = ({
  technologies,
  techStates,
  queuedTechIds,
  onTechClick
}) => {
  const theme = useTheme();

  // 按状态分组和排序科技
  const sortedTechnologies = React.useMemo(() => {
    const sorted = [...technologies].sort((a, b) => {
      const stateA = techStates.get(a.id)?.status || 'locked';
      const stateB = techStates.get(b.id)?.status || 'locked';
      
      // 优先级排序：researching > available > locked > unlocked
      const priority = {
        'researching': 0,
        'available': 1, 
        'locked': 2,
        'unlocked': 3
      };
      
      const priorityDiff = priority[stateA] - priority[stateB];
      if (priorityDiff !== 0) return priorityDiff;
      
      // 同状态按名称排序
      return a.name.localeCompare(b.name);
    });
    
    return sorted;
  }, [technologies, techStates]);

  // 过滤掉已解锁的科技（根据用户需求）
  const unlockedTechnologies = sortedTechnologies.filter(tech => {
    const state = techStates.get(tech.id)?.status || 'locked';
    return state !== 'unlocked';
  });

  // 获取科技状态
  const getTechState = (techId: string) => {
    return techStates.get(techId) || { status: 'locked' as TechStatus };
  };

  // 处理科技点击
  const handleTechClick = (techId: string) => {
    onTechClick?.(techId);
  };

  if (unlockedTechnologies.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 300,
          color: theme.palette.text.secondary
        }}
      >
        <Typography variant="h6" sx={{ mb: 1 }}>
          🎉 所有科技已解锁
        </Typography>
        <Typography variant="body2">
          恭喜！你已经完成了所有科技的研究
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      {/* 科技网格 - 更紧凑的布局 */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(4, 1fr)',
            lg: 'repeat(5, 1fr)',
            xl: 'repeat(6, 1fr)'
          },
          gap: 1,
          p: 1
        }}
      >
        {unlockedTechnologies.map(tech => {
          const state = getTechState(tech.id);
          
          return (
            <TechGridCard
              key={tech.id}
              technology={tech}
              status={state.status}
              progress={state.progress}
              inQueue={queuedTechIds.has(tech.id)}
              onClick={handleTechClick}
            />
          );
        })}
      </Box>
    </Box>
  );
};

export default TechSimpleGrid;