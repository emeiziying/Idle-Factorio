import React, { useMemo, useCallback } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { Box, useTheme } from '@mui/material';
import TechGridCard from './TechGridCard';
import type { Technology, TechStatus } from '../../types/technology';

interface TechVirtualizedGridProps {
  /** 要显示的科技列表 */
  technologies: Technology[];
  
  /** 科技状态映射 */
  techStates: Map<string, { status: TechStatus; progress?: number }>;
  
  /** 研究队列中的科技ID */
  queuedTechIds: Set<string>;
  
  /** 点击科技卡片的回调 */
  onTechClick?: (techId: string) => void;
  
  /** 容器高度 */
  height: number;
  
  /** 容器宽度 */
  width: number;
}

// 网格配置
const GRID_CONFIG = {
  itemWidth: 200,  // 卡片宽度
  itemHeight: 180, // 卡片高度
  gap: 16,        // 间距
};

const TechVirtualizedGrid: React.FC<TechVirtualizedGridProps> = ({
  technologies,
  techStates,
  queuedTechIds,
  onTechClick,
  height,
  width
}) => {
  const theme = useTheme();

  // 计算网格布局
  const gridConfig = useMemo(() => {
    const { itemWidth, itemHeight, gap } = GRID_CONFIG;
    const availableWidth = width - 32; // 减去padding
    
    // 计算每行能放多少个卡片
    const itemsPerRow = Math.floor(availableWidth / (itemWidth + gap));
    const actualItemsPerRow = Math.max(1, itemsPerRow);
    
    // 计算总行数
    const totalRows = Math.ceil(technologies.length / actualItemsPerRow);
    
    return {
      itemsPerRow: actualItemsPerRow,
      totalRows,
      itemWidth: itemWidth + gap,
      itemHeight: itemHeight + gap,
      gap
    };
  }, [technologies.length, width]);

  // 获取指定位置的科技
  const getTechnologyAtPosition = useCallback((rowIndex: number, columnIndex: number) => {
    const index = rowIndex * gridConfig.itemsPerRow + columnIndex;
    return index < technologies.length ? technologies[index] : null;
  }, [technologies, gridConfig.itemsPerRow]);

  // 渲染单个网格项
  const renderGridItem = useCallback(({ columnIndex, rowIndex, style }: {
    columnIndex: number;
    rowIndex: number;
    style: React.CSSProperties;
  }) => {
    const tech = getTechnologyAtPosition(rowIndex, columnIndex);
    
    if (!tech) {
      return <div style={style} />;
    }

    const state = techStates.get(tech.id) || { status: 'locked' as TechStatus };
    
    return (
      <div style={style}>
        <Box sx={{ p: gridConfig.gap / 2 }}>
          <TechGridCard
            technology={tech}
            status={state.status}
            progress={state.progress}
            inQueue={queuedTechIds.has(tech.id)}
            onClick={onTechClick}
          />
        </Box>
      </div>
    );
  }, [getTechnologyAtPosition, techStates, queuedTechIds, onTechClick, gridConfig.gap]);

  // 如果没有科技，显示空状态
  if (technologies.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: height,
          color: theme.palette.text.secondary
        }}
      >
        <div>🎉 所有科技已解锁</div>
        <div>恭喜！你已经完成了所有科技的研究</div>
      </Box>
    );
  }

  return (
    <Box sx={{ height, width }}>
      <Grid
        columnCount={gridConfig.itemsPerRow}
        columnWidth={gridConfig.itemWidth}
        height={height}
        rowCount={gridConfig.totalRows}
        rowHeight={gridConfig.itemHeight}
        width={width}
      >
        {renderGridItem}
      </Grid>
    </Box>
  );
};

export default TechVirtualizedGrid; 