// 科技依赖关系连接线组件

import React, { useMemo } from 'react';
import { Box, useTheme } from '@mui/material';
import type { Technology } from '../../types/technology';

interface TechConnectionsProps {
  /** 科技列表 */
  technologies: Technology[];
  
  /** 网格单元大小 */
  cellSize: number;
  
  /** 网格间距 */
  gap: number;
  
  /** 高亮显示的科技ID集合 */
  highlightedTechIds?: Set<string>;
  
  /** 当前选中的科技ID */
  selectedTechId?: string;
}

interface Connection {
  from: { x: number; y: number };
  to: { x: number; y: number };
  highlighted: boolean;
  selected: boolean;
}

const TechConnections: React.FC<TechConnectionsProps> = ({
  technologies,
  cellSize,
  gap,
  highlightedTechIds,
  selectedTechId
}) => {
  const theme = useTheme();

  // 构建科技位置映射
  const techPositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    technologies.forEach(tech => {
      positions.set(tech.id, tech.position);
    });
    return positions;
  }, [technologies]);

  // 计算所有连接
  const connections = useMemo(() => {
    const lines: Connection[] = [];
    
    technologies.forEach(tech => {
      const toPos = techPositions.get(tech.id);
      if (!toPos) return;
      
      tech.prerequisites.forEach(prereqId => {
        const fromPos = techPositions.get(prereqId);
        if (!fromPos) return;
        
        // 检查是否高亮
        const highlighted = !!(
          highlightedTechIds?.has(tech.id) ||
          highlightedTechIds?.has(prereqId)
        );
        
        // 检查是否选中
        const selected = !!(
          selectedTechId === tech.id ||
          selectedTechId === prereqId
        );
        
        lines.push({
          from: fromPos,
          to: toPos,
          highlighted,
          selected
        });
      });
    });
    
    return lines;
  }, [technologies, techPositions, highlightedTechIds, selectedTechId]);

  // 将网格坐标转换为像素坐标
  const gridToPixel = (gridPos: { x: number; y: number }) => {
    return {
      x: gridPos.x * (cellSize + gap) + cellSize / 2,
      y: gridPos.y * (cellSize + gap) + cellSize / 2
    };
  };

  // 生成SVG路径
  const generatePath = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const fromPixel = gridToPixel(from);
    const toPixel = gridToPixel(to);
    
    const dx = toPixel.x - fromPixel.x;
    const dy = toPixel.y - fromPixel.y;
    
    // 如果是直线连接
    if (Math.abs(dx) < 10 || Math.abs(dy) < 10) {
      return `M ${fromPixel.x} ${fromPixel.y} L ${toPixel.x} ${toPixel.y}`;
    }
    
    // 控制点偏移
    const controlOffset = Math.min(Math.abs(dx), Math.abs(dy)) * 0.3;
    
    const cp1x = fromPixel.x + controlOffset;
    const cp1y = fromPixel.y;
    const cp2x = toPixel.x - controlOffset;
    const cp2y = toPixel.y;
    
    return `M ${fromPixel.x} ${fromPixel.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toPixel.x} ${toPixel.y}`;
  };

  // 获取连接线样式
  const getConnectionStyle = (connection: Connection) => {
    if (connection.selected) {
      return {
        stroke: theme.palette.primary.main,
        strokeWidth: 3,
        opacity: 1,
        filter: `drop-shadow(0 0 4px ${theme.palette.primary.main}40)`
      };
    }
    
    if (connection.highlighted) {
      return {
        stroke: theme.palette.warning.main,
        strokeWidth: 2.5,
        opacity: 0.9,
        filter: `drop-shadow(0 0 3px ${theme.palette.warning.main}30)`
      };
    }
    
    return {
      stroke: theme.palette.divider,
      strokeWidth: 1.5,
      opacity: 0.6
    };
  };

  // 计算SVG容器尺寸
  const svgDimensions = useMemo(() => {
    let maxX = 0;
    let maxY = 0;
    
    technologies.forEach(tech => {
      const pixel = gridToPixel(tech.position);
      maxX = Math.max(maxX, pixel.x);
      maxY = Math.max(maxY, pixel.y);
    });
    
    return {
      width: maxX + cellSize / 2 + 20,
      height: maxY + cellSize / 2 + 20
    };
  }, [technologies, cellSize, gap]);

  if (connections.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
      }}
    >
      <svg
        width={svgDimensions.width}
        height={svgDimensions.height}
        style={{
          position: 'absolute',
          top: 0,
          left: 0
        }}
      >
        <defs>
          {/* 箭头标记 */}
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill={theme.palette.divider}
              opacity={0.6}
            />
          </marker>
          
          <marker
            id="arrowhead-highlighted"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill={theme.palette.warning.main}
              opacity={0.9}
            />
          </marker>
          
          <marker
            id="arrowhead-selected"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill={theme.palette.primary.main}
              opacity={1}
            />
          </marker>

          {/* 动画效果 */}
          <animate
            id="flow-animation"
            attributeName="stroke-dashoffset"
            values="10;0"
            dur="2s"
            repeatCount="indefinite"
          />
        </defs>

        {/* 渲染连接线 */}
        {connections.map((connection, index) => {
          const style = getConnectionStyle(connection);
          const markerId = connection.selected 
            ? 'arrowhead-selected'
            : connection.highlighted 
            ? 'arrowhead-highlighted'
            : 'arrowhead';

          return (
            <g key={index}>
              {/* 背景线 */}
              <path
                d={generatePath(connection.from, connection.to)}
                fill="none"
                stroke={theme.palette.background.paper}
                strokeWidth={style.strokeWidth + 2}
                opacity={0.8}
              />
              
              {/* 主连接线 */}
              <path
                d={generatePath(connection.from, connection.to)}
                fill="none"
                stroke={style.stroke}
                strokeWidth={style.strokeWidth}
                opacity={style.opacity}
                markerEnd={`url(#${markerId})`}
                style={{
                  filter: style.filter,
                  transition: 'all 0.3s ease'
                }}
                strokeDasharray={connection.selected ? "5,5" : "none"}
              >
                {/* 选中状态的流动动画 */}
                {connection.selected && (
                  <animate
                    attributeName="stroke-dashoffset"
                    values="10;0"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                )}
              </path>
            </g>
          );
        })}
      </svg>
    </Box>
  );
};

export default TechConnections;