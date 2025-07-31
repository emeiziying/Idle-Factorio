// 简化的科技网格布局组件

import React from 'react';
import {
  Box,
  Typography,
  useTheme
} from '@mui/material';
import TechGridCard from './TechGridCard';
import TechVirtualizedGridWithAutoSizer from './TechVirtualizedGridWithAutoSizer';
import type { Technology, TechStatus } from '@/types/technology';
import { TechnologyService } from '@/services';

interface TechSimpleGridProps {
  /** 要显示的科技列表 */
  technologies: Technology[];
  
  /** 科技状态映射 */
  techStates: Map<string, { status: TechStatus; progress?: number }>;
  
  /** 研究队列中的科技ID */
  queuedTechIds: Set<string>;
  
  /** 点击科技卡片的回调 */
  onTechClick?: (techId: string) => void;
  
  /** 是否使用虚拟化（性能优化） */
  useVirtualization?: boolean;
}

const TechSimpleGrid: React.FC<TechSimpleGridProps> = React.memo(({
  technologies,
  techStates,
  queuedTechIds,
  onTechClick,
  useVirtualization = false
}) => {
  const theme = useTheme();

  // 修改排序逻辑：保持依赖关系排序，按状态分组显示
  const sortedTechnologies = React.useMemo(() => {
    return TechnologyService.getTechnologiesSortedByStatus(technologies, techStates);
  }, [technologies, techStates]);

  // 过滤逻辑：只显示当前可研究的和依赖当前可研究的项目 - 使用useMemo缓存
  const filteredTechnologies = React.useMemo(() => {
    return TechnologyService.getDisplayTechnologies(sortedTechnologies, techStates);
  }, [sortedTechnologies, techStates]);


  // 获取科技状态 - 使用useCallback缓存
  const getTechState = React.useCallback((techId: string) => {
    return techStates.get(techId) || { status: 'locked' as TechStatus };
  }, [techStates]);

  // 处理科技点击 - 使用useCallback缓存
  const handleTechClick = React.useCallback((techId: string) => {
    onTechClick?.(techId);
  }, [onTechClick]);

  if (filteredTechnologies.length === 0) {
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

  // 如果启用虚拟化且科技数量较多，使用虚拟化组件
  if (useVirtualization && filteredTechnologies.length > 50) {
    return (
      <TechVirtualizedGridWithAutoSizer
        technologies={filteredTechnologies}
        techStates={techStates}
        queuedTechIds={queuedTechIds}
        onTechClick={handleTechClick}
      />
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      {/* 科技网格 - 优化布局 */}
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
          gap: 2,
          p: 1,
          '& > *': {
            minHeight: 140
          }
        }}
      >
        {filteredTechnologies.map((tech: Technology) => {
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
});

TechSimpleGrid.displayName = 'TechSimpleGrid';

export default TechSimpleGrid;