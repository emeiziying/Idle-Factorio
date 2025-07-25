// 科技树网格布局组件

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  useTheme,
  Tooltip,
  Fab,
  Paper,
  Typography
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
  DragHandle as DragIcon
} from '@mui/icons-material';
import TechNode from './TechNode';
import TechConnections from './TechConnections';
import type { Technology, TechStatus } from '../../types/technology';
import TechnologyService from '../../services/TechnologyService';

interface TechGridProps {
  /** 要显示的科技列表 */
  technologies: Technology[];
  
  /** 科技状态映射 */
  techStates: Map<string, { status: TechStatus; progress?: number }>;
  
  /** 研究队列中的科技ID */
  queuedTechIds: Set<string>;
  
  /** 当前选中的科技ID */
  selectedTechId?: string;
  
  /** 高亮显示的科技ID集合 */
  highlightedTechIds?: Set<string>;
  
  /** 点击科技节点的回调 */
  onTechClick?: (techId: string) => void;
  
  /** 开始研究的回调 */
  onStartResearch?: (techId: string) => void;
  
  /** 添加到队列的回调 */
  onAddToQueue?: (techId: string) => void;
  
  /** 是否显示连接线 */
  showConnections?: boolean;
  
  /** 网格大小模式 */
  gridSize?: 'compact' | 'normal' | 'spacious';
  
  /** 是否启用缩放和导航 */
  enableNavigation?: boolean;
}

const TechGrid: React.FC<TechGridProps> = ({
  technologies,
  techStates,
  queuedTechIds,
  selectedTechId,
  highlightedTechIds,
  onTechClick,
  onStartResearch,
  onAddToQueue,
  showConnections = true,
  gridSize = 'normal',
  enableNavigation = true
}) => {
  const theme = useTheme();
  
  // 缩放和导航状态
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 获取网格配置
  const getGridConfig = () => {
    switch (gridSize) {
      case 'compact':
        return {
          nodeSize: 'small' as const,
          cellSize: 100,
          gap: 16
        };
      case 'spacious':
        return {
          nodeSize: 'large' as const,
          cellSize: 140,
          gap: 32
        };
      default: // normal
        return {
          nodeSize: 'medium' as const,
          cellSize: 120,
          gap: 24
        };
    }
  };

  const { nodeSize, cellSize, gap } = getGridConfig();

  // 按分类和位置组织科技
  const organizedTechs = useCallback(() => {
    const categories = new Map<string, Map<string, Technology[]>>();
    
    // 按分类分组
    technologies.forEach(tech => {
      if (!categories.has(tech.category)) {
        categories.set(tech.category, new Map());
      }
      
      const categoryMap = categories.get(tech.category)!;
      const posKey = `${tech.position.x},${tech.position.y}`;
      
      if (!categoryMap.has(posKey)) {
        categoryMap.set(posKey, []);
      }
      
      categoryMap.get(posKey)!.push(tech);
    });
    
    return categories;
  }, [technologies]);

  // 计算网格尺寸
  const getGridDimensions = () => {
    let maxX = 0;
    let maxY = 0;
    
    technologies.forEach(tech => {
      maxX = Math.max(maxX, tech.position.x);
      maxY = Math.max(maxY, tech.position.y);
    });
    
    return {
      width: (maxX + 1) * cellSize + maxX * gap,
      height: (maxY + 1) * cellSize + maxY * gap
    };
  };

  const { height: gridHeight } = getGridDimensions();

  // 缩放功能
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.3));
  };

  const handleFitToScreen = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleCenterView = useCallback(() => {
    if (selectedTechId && containerRef.current && contentRef.current) {
      const tech = technologies.find(t => t.id === selectedTechId);
      if (tech) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const techX = tech.position.x * (cellSize + gap) + cellSize / 2;
        const techY = tech.position.y * (cellSize + gap) + cellSize / 2;
        
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;
        
        setPanOffset({
          x: centerX - techX * zoomLevel,
          y: centerY - techY * zoomLevel
        });
      }
    }
  }, [selectedTechId, technologies, cellSize, gap, zoomLevel]);

  // 拖拽功能
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!enableNavigation) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !enableNavigation) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!enableNavigation) return;
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.3, Math.min(3, zoomLevel * delta));
    
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const zoomRatio = newZoom / zoomLevel;
      setPanOffset(prev => ({
        x: mouseX - (mouseX - prev.x) * zoomRatio,
        y: mouseY - (mouseY - prev.y) * zoomRatio
      }));
    }
    
    setZoomLevel(newZoom);
  };

  // 选中科技时自动居中
  useEffect(() => {
    if (selectedTechId && enableNavigation) {
      setTimeout(() => handleCenterView(), 100);
    }
  }, [selectedTechId, enableNavigation, handleCenterView]);

  // 获取科技状态
  const getTechState = (techId: string) => {
    return techStates.get(techId) || { status: 'locked' as TechStatus };
  };

  // 检查是否可以研究
  const canResearch = (tech: Technology) => {
    const state = getTechState(tech.id);
    return state.status === 'available' && !queuedTechIds.has(tech.id);
  };

  // 获取分类信息
  const getCategoryInfo = (categoryId: string) => {
    const techService = TechnologyService;
    const categories = techService.getTechCategories();
    const category = categories.find(cat => cat.id === categoryId);
    
    return category || {
      id: categoryId,
      name: categoryId,
      icon: '🔬',
      color: theme.palette.grey[500],
      description: '',
      order: 999
    };
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        cursor: isDragging ? 'grabbing' : enableNavigation ? 'grab' : 'default',
        userSelect: 'none'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* 导航控制按钮 */}
      {enableNavigation && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}
        >
          <Tooltip title="放大">
            <Fab
              size="small"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3}
              sx={{ bgcolor: theme.palette.background.paper }}
            >
              <ZoomInIcon />
            </Fab>
          </Tooltip>
          
          <Tooltip title="缩小">
            <Fab
              size="small"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.3}
              sx={{ bgcolor: theme.palette.background.paper }}
            >
              <ZoomOutIcon />
            </Fab>
          </Tooltip>
          
          <Tooltip title="适应屏幕">
            <Fab
              size="small"
              onClick={handleFitToScreen}
              sx={{ bgcolor: theme.palette.background.paper }}
            >
              <DragIcon />
            </Fab>
          </Tooltip>
          
          {selectedTechId && (
            <Tooltip title="居中选中科技">
              <Fab
                size="small"
                onClick={handleCenterView}
                color="primary"
                sx={{ bgcolor: theme.palette.primary.main }}
              >
                <CenterIcon />
              </Fab>
            </Tooltip>
          )}
        </Box>
      )}

      {/* 缩放级别显示 */}
      {enableNavigation && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            zIndex: 100,
            bgcolor: theme.palette.background.paper,
            px: 1,
            py: 0.5,
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`,
            fontSize: '0.75rem',
            color: theme.palette.text.secondary
          }}
        >
          {Math.round(zoomLevel * 100)}%
        </Box>
      )}

      {/* 可缩放内容区域 */}
      <Box
        ref={contentRef}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          p: 2
        }}
      >
      {/* 按分类渲染科技树 */}
      {Array.from(organizedTechs().entries())
        .sort(([catA], [catB]) => {
          const catInfoA = getCategoryInfo(catA);
          const catInfoB = getCategoryInfo(catB);
          return catInfoA.order - catInfoB.order;
        })
        .map(([categoryId, categoryTechs]) => {
          const categoryInfo = getCategoryInfo(categoryId);
          
          return (
            <Box key={categoryId} sx={{ mb: 4 }}>
              {/* 分类标题 */}
              <Paper
                elevation={2}
                sx={{
                  p: 1.5,
                  mb: 2,
                  bgcolor: `${categoryInfo.color}20`,
                  border: `1px solid ${categoryInfo.color}40`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: categoryInfo.color,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <span style={{ fontSize: '1.2em' }}>{categoryInfo.icon}</span>
                  {categoryInfo.name}
                  <Typography
                    variant="caption"
                    sx={{ ml: 'auto', opacity: 0.7 }}
                  >
                    {Array.from(categoryTechs.values()).flat().length} 个科技
                  </Typography>
                </Typography>
              </Paper>

              {/* 科技网格 */}
              <Box
                sx={{
                  position: 'relative',
                  minHeight: gridHeight,
                  border: `1px dashed ${theme.palette.divider}`,
                  borderRadius: 1,
                  p: 2,
                  background: `linear-gradient(45deg, ${theme.palette.background.paper}00 25%, ${theme.palette.action.hover}10 25%, ${theme.palette.action.hover}10 50%, ${theme.palette.background.paper}00 50%, ${theme.palette.background.paper}00 75%, ${theme.palette.action.hover}10 75%)`
                }}
                style={{
                  backgroundSize: '20px 20px'
                }}
              >
                {/* 渲染科技节点 */}
                {Array.from(categoryTechs.entries()).map(([posKey, techs]) => {
                  const [x, y] = posKey.split(',').map(Number);
                  
                  return techs.map((tech, index) => {
                    const state = getTechState(tech.id);
                    const offsetX = index * (cellSize * 0.3); // 同位置多个科技时的偏移
                    
                    return (
                      <Box
                        key={tech.id}
                        sx={{
                          position: 'absolute',
                          left: x * (cellSize + gap) + offsetX,
                          top: y * (cellSize + gap),
                          zIndex: selectedTechId === tech.id ? 20 : 10
                        }}
                      >
                        <TechNode
                          technology={tech}
                          status={state.status}
                          progress={state.progress}
                          highlighted={
                            selectedTechId === tech.id ||
                            highlightedTechIds?.has(tech.id)
                          }
                          canResearch={canResearch(tech)}
                          inQueue={queuedTechIds.has(tech.id)}
                          onClick={onTechClick}
                          onStartResearch={onStartResearch}
                          onAddToQueue={onAddToQueue}
                          size={nodeSize}
                        />
                      </Box>
                    );
                  });
                })}

                {/* 渲染连接线 */}
                {showConnections && (
                  <TechConnections
                    technologies={Array.from(categoryTechs.values()).flat()}
                    cellSize={cellSize}
                    gap={gap}
                    highlightedTechIds={highlightedTechIds}
                    selectedTechId={selectedTechId}
                  />
                )}
              </Box>
            </Box>
          );
        })}

        {/* 空状态 */}
        {technologies.length === 0 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: 200,
              color: theme.palette.text.secondary
            }}
          >
            <Typography variant="h6" sx={{ mb: 1 }}>
              🔬 没有科技数据
            </Typography>
            <Typography variant="body2">
              请检查科技服务是否正确初始化
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TechGrid;