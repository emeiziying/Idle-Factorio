import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import TechSimpleGrid from './TechSimpleGrid';
import TechDetailPanel from './TechDetailPanel';
import ResearchQueue from './ResearchQueue';

import useGameStore from '../../store/gameStore';
import { TechnologyService } from '../../services/TechnologyService';
import type { TechStatus } from '../../types/technology';
import { ResearchPriority } from '../../types/technology';
import { usePersistentState } from '../../hooks/usePersistentState';

const TechnologyModule: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // 从store获取状态
  const {
    technologies,
    researchState,
    researchQueue,
    unlockedTechs,
    autoResearch,
    initializeTechnologyService,
    startResearch,
    addToResearchQueue,
    removeFromResearchQueue,
    setAutoResearch,
    updateResearchProgress
  } = useGameStore();

  // 本地状态
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTechId, setSelectedTechId] = usePersistentState<string | null>('technology-selected-tech', null);

  // 初始化科技服务
  useEffect(() => {
    const initializeTech = async () => {
      try {
        setLoading(true);
        await initializeTechnologyService();
        
        // 强制刷新科技数据
        const techService = TechnologyService.getInstance();
        if (techService.isServiceInitialized()) {
          // 强制重新初始化以应用最新修改
          await techService.forceReinitialize();
          
          // 重新获取排序后的科技数据
          techService.getAllTechnologies();
        }
        
        // 科技数据加载完成
        
        setError(null);
      } catch (err) {
        console.error('Failed to initialize technology service:', err);
        setError('科技系统初始化失败');
      } finally {
        setLoading(false);
      }
    };

    initializeTech();
  }, [initializeTechnologyService]);

  // 研究进度更新定时器
  useEffect(() => {
    if (!researchState) return;

    const interval = setInterval(() => {
      updateResearchProgress(1); // 每秒更新1秒
    }, 1000);

    return () => clearInterval(interval);
  }, [researchState, updateResearchProgress]);

  // 处理科技点击
  const handleTechClick = (techId: string) => {
    setSelectedTechId(techId);
  };

  // 处理开始研究
  const handleStartResearch = async (techId: string) => {
    try {
      const success = await startResearch(techId);
      if (success) {
        // 研究开始
      }
    } catch (error) {
      console.error('Failed to start research:', error);
    }
  };

  // 处理添加到队列
  const handleAddToQueue = (techId: string) => {
    try {
      const success = addToResearchQueue(techId, ResearchPriority.NORMAL);
      if (success) {
        // 添加到队列
      }
    } catch (error) {
      console.error('Failed to add to queue:', error);
    }
  };

  // 关闭详情面板
  const handleCloseDetailPanel = () => {
    setSelectedTechId(null);
  };

  // 构建科技状态映射
  const techStates = React.useMemo(() => {
    const states = new Map<string, { status: TechStatus; progress?: number }>();
    
    Array.from(technologies.values()).forEach(tech => {
      let status: TechStatus = 'locked';
      let progress: number | undefined;

      if (unlockedTechs.has(tech.id)) {
        status = 'unlocked';
      } else if (researchState?.techId === tech.id) {
        status = 'researching';
        progress = researchState.progress;
      } else if (TechnologyService.getInstance().isTechAvailable(tech.id)) {
        status = 'available';
      }

      states.set(tech.id, { status, progress });
    });

    return states;
  }, [technologies, unlockedTechs, researchState]);

  // 获取队列中的科技ID
  const queuedTechIds = new Set(researchQueue.map(item => item.techId));

  // 筛选科技列表
  const filteredTechnologies = React.useMemo(() => {
    // 直接从TechnologyService获取排序后的科技数据
    const techService = TechnologyService.getInstance();
    if (techService.isServiceInitialized()) {
      const sortedTechs = techService.getAllTechnologies();

      
      // 科技排序完成
      
      return sortedTechs;
    }
    
    // 如果服务未初始化，使用store中的数据作为后备
    const allTechs = Array.from(technologies.values());
    return allTechs;
  }, [technologies]);

  // 加载状态
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          gap: 2
        }}
      >
        <CircularProgress size={48} />
        <Typography variant="body1" color="text.secondary">
          正在加载科技数据...
        </Typography>
      </Box>
    );
  }

  // 错误状态
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Typography variant="body2" color="text.secondary">
          请检查网络连接或刷新页面重试
        </Typography>
      </Box>
    );
  }

  // 空数据状态
  if (technologies.size === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          gap: 2
        }}
      >
        <Typography variant="h6" color="text.secondary">
          🔬 暂无科技数据
        </Typography>
        <Typography variant="body2" color="text.secondary">
          科技系统正在准备中...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>


      {/* 主体内容 */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden' }}>
        {/* 科技网格主体 */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <TechSimpleGrid
            technologies={filteredTechnologies}
            techStates={techStates}
            queuedTechIds={queuedTechIds}
            onTechClick={handleTechClick}
            useVirtualization={false}
          />
        </Box>

        {/* 研究队列面板 */}
        <Box 
          sx={{ 
            width: isMobile ? '100%' : 350,
            height: isMobile ? 'auto' : '100%',
            overflow: 'auto',
            borderLeft: isMobile ? 'none' : `1px solid ${theme.palette.divider}`,
            borderTop: isMobile ? `1px solid ${theme.palette.divider}` : 'none',
            p: 2,
            bgcolor: theme.palette.background.paper
          }}
        >
          <ResearchQueue
            queue={researchQueue}
            currentResearch={researchState || undefined}
            autoResearch={autoResearch}
            onRemoveFromQueue={removeFromResearchQueue}
            onSetAutoResearch={setAutoResearch}
            onStartResearch={handleStartResearch}
            collapsible={isMobile}
          />
        </Box>
      </Box>

      {/* 详情面板 */}
      {selectedTechId && (
        <TechDetailPanel
          techId={selectedTechId}
          techState={researchState?.techId === selectedTechId ? researchState : undefined}
          open={!!selectedTechId}
          onClose={handleCloseDetailPanel}
          onStartResearch={handleStartResearch}
          onAddToQueue={handleAddToQueue}
          anchor={isMobile ? 'bottom' : 'right'}
        />
      )}
    </Box>
  );
};

export default TechnologyModule;