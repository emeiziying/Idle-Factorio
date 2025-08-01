import React, { useMemo, useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
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
  itemWidth: 200, // 卡片宽度
  itemHeight: 180, // 卡片高度
  gap: 16, // 间距
};

const TechVirtualizedGrid: React.FC<TechVirtualizedGridProps> = ({
  technologies,
  techStates,
  queuedTechIds,
  onTechClick,
  height,
  width,
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
      gap,
    };
  }, [technologies.length, width]);

  // 获取指定位置的科技
  const getTechnologyAtPosition = useCallback(
    (rowIndex: number, columnIndex: number) => {
      const index = rowIndex * gridConfig.itemsPerRow + columnIndex;
      return index < technologies.length ? technologies[index] : null;
    },
    [technologies, gridConfig.itemsPerRow]
  );

  // 容器引用
  const parentRef = useRef<HTMLDivElement>(null);

  // 创建虚拟化器
  const rowVirtualizer = useVirtualizer({
    count: gridConfig.totalRows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => gridConfig.itemHeight,
    overscan: 2,
  });

  // 渲染单行中的所有科技卡片
  const renderRow = useCallback(
    (rowIndex: number) => {
      const items = [];
      for (let colIndex = 0; colIndex < gridConfig.itemsPerRow; colIndex++) {
        const tech = getTechnologyAtPosition(rowIndex, colIndex);
        if (!tech) break;

        const state = techStates.get(tech.id) || { status: 'locked' as TechStatus };

        items.push(
          <Box
            key={`${rowIndex}-${colIndex}`}
            sx={{
              display: 'inline-block',
              width: GRID_CONFIG.itemWidth,
              height: GRID_CONFIG.itemHeight,
              p: gridConfig.gap / 2,
              verticalAlign: 'top',
            }}
          >
            <TechGridCard
              technology={tech}
              status={state.status}
              progress={state.progress}
              inQueue={queuedTechIds.has(tech.id)}
              onClick={onTechClick}
            />
          </Box>
        );
      }
      return items;
    },
    [getTechnologyAtPosition, techStates, queuedTechIds, onTechClick, gridConfig]
  );

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
          color: theme.palette.text.secondary,
        }}
      >
        <div>🎉 所有科技已解锁</div>
        <div>恭喜！你已经完成了所有科技的研究</div>
      </Box>
    );
  }

  return (
    <Box
      ref={parentRef}
      sx={{
        height,
        width,
        overflow: 'auto',
      }}
    >
      <div
        style={{
          height: rowVirtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: virtualRow.size,
              transform: `translateY(${virtualRow.start}px)`,
              textAlign: 'left',
            }}
          >
            {renderRow(virtualRow.index)}
          </div>
        ))}
      </div>
    </Box>
  );
};

export default TechVirtualizedGrid;
