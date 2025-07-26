// 简化的科技网格布局组件

import React from 'react';
import {
  Box,
  Typography,
  useTheme
} from '@mui/material';
import TechGridCard from './TechGridCard';
import TechVirtualizedGridWithAutoSizer from './TechVirtualizedGridWithAutoSizer';
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
  
  /** 是否使用虚拟化（性能优化） */
  useVirtualization?: boolean;
}

const TechSimpleGrid: React.FC<TechSimpleGridProps> = ({
  technologies,
  techStates,
  queuedTechIds,
  onTechClick,
  useVirtualization = false
}) => {
  const theme = useTheme();

  // 修改排序逻辑：保持依赖关系排序，按状态分组显示
  const sortedTechnologies = React.useMemo(() => {
    // 保持传入的technologies的依赖关系排序
    // 按状态分组，但每个状态内部保持原有的依赖关系顺序
    const techsByStatus = new Map<string, Technology[]>();
    
    technologies.forEach(tech => {
      const status = techStates.get(tech.id)?.status || 'locked';
      if (!techsByStatus.has(status)) {
        techsByStatus.set(status, []);
      }
      techsByStatus.get(status)!.push(tech);
    });
    
    // 按状态优先级排序，但在每个状态内部保持原有的依赖关系顺序
    const statusPriority = {
      'researching': 0,
      'available': 1, 
      'locked': 2,
      'unlocked': 3
    };
    
    const sorted: Technology[] = [];
    
    // 按优先级顺序处理每个状态
    Object.entries(statusPriority)
      .sort(([, a], [, b]) => a - b)
      .forEach(([status]) => {
        const techsInStatus = techsByStatus.get(status);
        if (techsInStatus) {
          // 在每个状态内部，保持原有的依赖关系顺序，不按名称排序
          sorted.push(...techsInStatus);
        }
      });
    
    // 排序完成
    
    return sorted;
  }, [technologies, techStates]);

  // 过滤逻辑：只显示当前可研究的和依赖当前可研究的项目
  const filteredTechnologies = sortedTechnologies.filter(tech => {
    const state = techStates.get(tech.id)?.status || 'locked';
    
    // 1. 显示当前可研究的科技（available状态）
    if (state === 'available') {
      return true;
    }
    
    // 2. 显示正在研究的科技（researching状态）
    if (state === 'researching') {
      return true;
    }
    
    // 3. 显示依赖当前可研究科技的科技（locked状态但有可研究的前置科技）
    if (state === 'locked') {
      // 检查是否有前置科技是可研究的
      const hasAvailablePrerequisite = tech.prerequisites.some(prereqId => {
        const prereqState = techStates.get(prereqId)?.status || 'locked';
        return prereqState === 'available' || prereqState === 'researching';
      });
      
      return hasAvailablePrerequisite;
    }
    
    // 4. 如果科技已解锁，检查是否有依赖它的可研究科技需要显示
    if (state === 'unlocked') {
      // 检查是否有依赖此科技的科技需要显示
      const hasDependentToShow = sortedTechnologies.some(dependentTech => {
        const dependentState = techStates.get(dependentTech.id)?.status || 'locked';
        return (dependentState === 'available' || dependentState === 'researching') && 
               dependentTech.prerequisites.includes(tech.id);
      });
      
      // 如果有依赖的科技需要显示，则保留此科技
      return hasDependentToShow;
    }
    
    return false; // 其他情况不显示
  });



  // 获取科技状态
  const getTechState = (techId: string) => {
    return techStates.get(techId) || { status: 'locked' as TechStatus };
  };

  // 处理科技点击
  const handleTechClick = (techId: string) => {
    onTechClick?.(techId);
  };

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
};

export default TechSimpleGrid;