import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert, useTheme, useMediaQuery } from '@mui/material';
import TechSimpleGrid from '@/components/technology/TechSimpleGrid';
import TechDetailPanel from '@/components/technology/TechDetailPanel';
import ResearchQueue from '@/components/technology/ResearchQueue';

import useGameStore from '@/store/gameStore';
import { useTechnologyService } from '@/hooks/useDIServices';
import type { TechStatus } from '@/types/technology';
import { ResearchPriority } from '@/types/technology';
import { useLocalStorageState } from 'ahooks';
import { TECHNOLOGY_STORAGE_KEYS } from '@/constants/storageKeys';
import { useUnlockedTechsRepair } from '@/hooks/useUnlockedTechsRepair';

const TechnologyModule: React.FC = React.memo(() => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const technologyService = useTechnologyService();

  // 安全修复unlockedTechs状态
  useUnlockedTechsRepair();

  // 从store获取状态
  const technologies = useGameStore(state => state.technologies);
  const researchState = useGameStore(state => state.researchState);
  const researchQueue = useGameStore(state => state.researchQueue);
  const unlockedTechs = useGameStore(state => state.unlockedTechs);
  const autoResearch = useGameStore(state => state.autoResearch);
  const initializeTechnologyService = useGameStore(state => state.initializeTechnologyService);
  const startResearch = useGameStore(state => state.startResearch);
  const addToResearchQueue = useGameStore(state => state.addToResearchQueue);
  const removeFromResearchQueue = useGameStore(state => state.removeFromResearchQueue);
  const setAutoResearch = useGameStore(state => state.setAutoResearch);

  // 本地状态 - 智能初始化loading状态
  const [loading, setLoading] = useState(() => technologies.size === 0);
  const [error, setError] = useState<string | null>(null);
  const [selectedTechId, setSelectedTechId] = useLocalStorageState<string | null>(
    TECHNOLOGY_STORAGE_KEYS.SELECTED_TECH,
    { defaultValue: null }
  );

  // 初始化科技服务 - 优化版本，避免不必要的loading
  useEffect(() => {
    const initializeTech = async () => {
      try {
        // 检查科技数据是否已经加载
        if (technologies.size > 0) {
          // 科技数据已存在，直接完成初始化，不显示loading
          setError(null);
          setLoading(false);
          return;
        }

        // 只有数据不存在时才显示loading并加载数据
        setLoading(true);
        await initializeTechnologyService();

        setError(null);
      } catch (err) {
        console.error('Failed to initialize technology service:', err);
        setError('科技系统初始化失败');
      } finally {
        setLoading(false);
      }
    };

    initializeTech();
  }, [initializeTechnologyService, technologies.size]);

  // 研究进度更新现在由GameLoopService统一管理，无需单独的定时器

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

    // 安全检查unlockedTechs是否为Set
    const safeUnlockedTechs = unlockedTechs instanceof Set ? unlockedTechs : new Set();

    // 只有当有科技数据时才计算状态
    if (technologies.size === 0) {
      return states;
    }

    Array.from(technologies.values()).forEach(tech => {
      let status: TechStatus = 'locked';
      let progress: number | undefined;

      if (safeUnlockedTechs.has(tech.id)) {
        status = 'unlocked';
      } else if (researchState?.techId === tech.id) {
        status = 'researching';
        progress = researchState?.progress;
      } else if (technologyService.isTechAvailable(tech.id)) {
        status = 'available';
      }

      states.set(tech.id, { status, progress });
    });

    return states;
  }, [technologies, unlockedTechs, researchState, technologyService]);

  // 获取队列中的科技ID
  const queuedTechIds = React.useMemo(() => {
    return new Set(researchQueue.map(item => item.techId));
  }, [researchQueue]);

  // 筛选科技列表
  const filteredTechnologies = React.useMemo(() => {
    // 如果没有科技数据，返回空数组
    if (technologies.size === 0) {
      return [];
    }

    // 直接使用store中的科技数据，避免重复调用service
    const allTechs = Array.from(technologies.values());

    // 按row属性排序（如果需要特定排序逻辑）
    return allTechs.sort((a, b) => (a.row || 0) - (b.row || 0));
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
          gap: 2,
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
          gap: 2,
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
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          overflow: 'hidden',
        }}
      >
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
            bgcolor: theme.palette.background.paper,
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
});

TechnologyModule.displayName = 'TechnologyModule';

export default TechnologyModule;
