import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  ButtonGroup,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { adaptGameStateResearchToLegacyView } from '@/app/runtime/adapters/adaptRuntimeResearchToLegacyView';
import { adaptLegacyStoreStateToGameState } from '@/app/persistence/adaptLegacyStoreStateToSnapshot';
import { useGameRuntimeRegistry } from '@/app/runtime/useGameRuntimeRegistry';
import ExperimentalTechDetailActions from '@/components/technology/ExperimentalTechDetailActions';
import ExperimentalResearchQueuePreview from '@/components/technology/ExperimentalResearchQueuePreview';
import TechSimpleGrid from '@/components/technology/TechSimpleGrid';
import TechDetailPanel from '@/components/technology/TechDetailPanel';
import ResearchQueue from '@/components/technology/ResearchQueue';
import { getGameCatalog } from '@/data/catalog/loadGameCatalog';
import {
  buildTechnologyDetailMetadata,
  buildTechnologyCardMetadataMap,
  buildTechnologyCardStateMap,
  buildTechnologyTriggerProgressMap,
  getQueuedTechnologyIds,
  getTechnologyDetailState,
} from '@/engine/selectors/technologySelectors';

import useGameStore from '@/store/gameStore';
import { ResearchPriority } from '@/types/technology';
import { useLocalStorageState } from 'ahooks';
import { TECHNOLOGY_STORAGE_KEYS } from '@/constants/storageKeys';
import { useUnlockedTechsRepair } from '@/hooks/useUnlockedTechsRepair';

const TechnologyModule: React.FC = React.memo(() => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const runtimeRegistry = useGameRuntimeRegistry();
  const [gridSource, setGridSource] = useState<'legacy' | 'runtime'>('legacy');
  const legacyCatalog = React.useMemo(() => getGameCatalog(), []);

  // 安全修复unlockedTechs状态
  useUnlockedTechsRepair();

  // 从store获取状态
  const {
    technologies,
    researchState,
    researchQueue,
    unlockedTechs,
    autoResearch,
    totalItemsProduced,
    craftedItemCounts,
    builtEntityCounts,
    minedEntityCounts,
    initializeTechnologyService,
    startResearch,
    addToResearchQueue,
    removeFromResearchQueue,
    setAutoResearch,
    // updateResearchProgress // 现在由GameLoopService管理
  } = useGameStore();

  // 本地状态 - 智能初始化loading状态
  const [loading, setLoading] = useState(() => technologies.size === 0);
  const [error, setError] = useState<string | null>(null);
  const [selectedTechId, setSelectedTechId] = useLocalStorageState<string | null>(
    TECHNOLOGY_STORAGE_KEYS.SELECTED_TECH,
    { defaultValue: null }
  );

  const runtimeGridView = React.useMemo(() => {
    if (
      runtimeRegistry.status !== 'ready' ||
      !runtimeRegistry.runtime ||
      !runtimeRegistry.runtimeState
    ) {
      return null;
    }

    const runtimeTechnologies = [...runtimeRegistry.runtime.getCatalog().technologiesInOrder];
    const runtimeTechStates = buildTechnologyCardStateMap(
      runtimeTechnologies,
      runtimeRegistry.runtimeState
    );
    const selectedTechnology = selectedTechId
      ? runtimeRegistry.runtime.getCatalog().technologiesById.get(selectedTechId)
      : undefined;

    return {
      technologies: runtimeTechnologies,
      state: runtimeRegistry.runtimeState,
      techStates: runtimeTechStates,
      queuedTechIds: getQueuedTechnologyIds(runtimeRegistry.runtimeState),
      triggerProgressById: buildTechnologyTriggerProgressMap(
        runtimeTechnologies,
        runtimeRegistry.runtimeState
      ),
      selectedTechState: selectedTechnology
        ? getTechnologyDetailState(runtimeRegistry.runtimeState, selectedTechnology)
        : undefined,
    };
  }, [runtimeRegistry, selectedTechId]);

  useEffect(() => {
    if (gridSource === 'runtime' && !runtimeGridView) {
      setGridSource('legacy');
    }
  }, [gridSource, runtimeGridView]);

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

  // 筛选科技列表
  const legacyTechnologies = React.useMemo(() => {
    if (technologies.size === 0) {
      return [];
    }

    return Array.from(technologies.values());
  }, [technologies]);
  const legacyGameState = React.useMemo(
    () =>
      adaptLegacyStoreStateToGameState(
        {
          researchState,
          researchQueue,
          unlockedTechs,
          autoResearch,
          totalItemsProduced,
          craftedItemCounts,
          builtEntityCounts,
          minedEntityCounts,
        },
        { technologies: legacyCatalog.technologiesInOrder }
      ),
    [
      researchState,
      researchQueue,
      unlockedTechs,
      autoResearch,
      totalItemsProduced,
      craftedItemCounts,
      builtEntityCounts,
      minedEntityCounts,
      legacyCatalog,
    ]
  );
  const legacyGridView = React.useMemo(() => {
    const selectedTechnology = selectedTechId
      ? legacyTechnologies.find(technology => technology.id === selectedTechId)
      : undefined;

    return {
      technologies: legacyTechnologies,
      state: legacyGameState,
      techStates: buildTechnologyCardStateMap(legacyTechnologies, legacyGameState),
      queuedTechIds: getQueuedTechnologyIds(legacyGameState),
      triggerProgressById: buildTechnologyTriggerProgressMap(legacyTechnologies, legacyGameState),
      selectedTechState: selectedTechnology
        ? getTechnologyDetailState(legacyGameState, selectedTechnology)
        : undefined,
    };
  }, [legacyTechnologies, legacyGameState, selectedTechId]);
  const activeGridView =
    gridSource === 'runtime' && runtimeGridView ? runtimeGridView : legacyGridView;
  const activeTechnologies = activeGridView.technologies;
  const activeCatalog =
    gridSource === 'runtime' && runtimeRegistry.runtime
      ? runtimeRegistry.runtime.getCatalog()
      : legacyCatalog;
  const activeTechStates = activeGridView.techStates;
  const activeQueuedTechIds = activeGridView.queuedTechIds;
  const activeTriggerProgressById = activeGridView.triggerProgressById;
  const activeUnlockedTechIds = activeGridView.state.unlocks.techs;
  const activeCardMetadataById = React.useMemo(
    () => buildTechnologyCardMetadataMap(activeTechnologies, activeCatalog),
    [activeTechnologies, activeCatalog]
  );
  const selectedTechnology =
    selectedTechId && activeTechnologies.length > 0
      ? activeTechnologies.find(technology => technology.id === selectedTechId)
      : undefined;
  const selectedDetailMetadata = React.useMemo(
    () =>
      selectedTechnology
        ? buildTechnologyDetailMetadata(selectedTechnology, activeCatalog, activeUnlockedTechIds)
        : undefined,
    [selectedTechnology, activeCatalog, activeUnlockedTechIds]
  );
  const selectedDetailState = React.useMemo(() => {
    if (!selectedTechnology || !selectedTechId) {
      return undefined;
    }

    if (gridSource === 'runtime' && runtimeGridView) {
      return runtimeGridView.selectedTechState;
    }

    return legacyGridView.selectedTechState;
  }, [selectedTechnology, selectedTechId, gridSource, runtimeGridView, legacyGridView]);
  const selectedTriggerProgress = selectedTechId
    ? activeTriggerProgressById.get(selectedTechId)
    : undefined;
  const activeResearchView = React.useMemo(
    () => adaptGameStateResearchToLegacyView(activeGridView.state, activeCatalog),
    [activeGridView.state, activeCatalog]
  );
  const resolveActiveTechnology = React.useCallback(
    (techId: string) => activeCatalog.technologiesById.get(techId),
    [activeCatalog]
  );
  const runtimeQueueActions =
    gridSource === 'runtime' && runtimeRegistry.runtime
      ? {
          onRemoveFromQueue: (techId: string) => {
            runtimeRegistry.runtime?.dispatch({ type: 'research/queue-remove', techId });
          },
          onSetAutoResearch: (enabled: boolean) => {
            runtimeRegistry.runtime?.dispatch({ type: 'research/auto-set', enabled });
          },
          onStartResearch: (techId: string) => {
            runtimeRegistry.runtime?.dispatch({ type: 'research/start', techId });
          },
        }
      : null;

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
          {import.meta.env.DEV && (
            <Box
              sx={{
                px: 2,
                pt: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                flexWrap: 'wrap',
              }}
            >
              <Typography variant="caption" color="text.secondary">
                卡片状态来源
              </Typography>
              <ButtonGroup size="small" variant="outlined">
                <Button
                  variant={gridSource === 'legacy' ? 'contained' : 'outlined'}
                  onClick={() => setGridSource('legacy')}
                >
                  旧链路
                </Button>
                <Button
                  variant={gridSource === 'runtime' ? 'contained' : 'outlined'}
                  disabled={!runtimeGridView}
                  onClick={() => setGridSource('runtime')}
                >
                  新引擎
                </Button>
              </ButtonGroup>
            </Box>
          )}
          <TechSimpleGrid
            technologies={activeTechnologies}
            techStates={activeTechStates}
            queuedTechIds={activeQueuedTechIds}
            cardMetadataById={activeCardMetadataById}
            triggerProgressById={activeTriggerProgressById}
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
            title={import.meta.env.DEV && gridSource === 'runtime' ? '新引擎研究队列' : '研究队列'}
            emptyHint={
              gridSource === 'runtime'
                ? '点击科技卡片或科技详情中的新引擎按钮来添加研究任务'
                : undefined
            }
            queue={activeResearchView.queue}
            currentResearch={activeResearchView.currentResearch}
            autoResearch={activeGridView.state.research.autoResearch}
            onRemoveFromQueue={
              runtimeQueueActions ? runtimeQueueActions.onRemoveFromQueue : removeFromResearchQueue
            }
            onSetAutoResearch={
              runtimeQueueActions ? runtimeQueueActions.onSetAutoResearch : setAutoResearch
            }
            onStartResearch={
              runtimeQueueActions ? runtimeQueueActions.onStartResearch : handleStartResearch
            }
            resolveTechnology={resolveActiveTechnology}
            collapsible={isMobile}
          />
          {import.meta.env.DEV && gridSource === 'legacy' && <ExperimentalResearchQueuePreview />}
        </Box>
      </Box>

      {/* 详情面板 */}
      {selectedTechnology && selectedDetailMetadata && (
        <TechDetailPanel
          technology={selectedTechnology}
          techState={selectedDetailState}
          detailMetadata={selectedDetailMetadata}
          triggerProgress={selectedTriggerProgress}
          canResearch={selectedDetailState?.status === 'available'}
          open={!!selectedTechId}
          onClose={handleCloseDetailPanel}
          onStartResearch={gridSource === 'legacy' ? handleStartResearch : undefined}
          onAddToQueue={gridSource === 'legacy' ? handleAddToQueue : undefined}
          anchor={isMobile ? 'bottom' : 'right'}
          extraActionContent={
            import.meta.env.DEV ? (
              <ExperimentalTechDetailActions techId={selectedTechnology.id} />
            ) : undefined
          }
        />
      )}
    </Box>
  );
});

TechnologyModule.displayName = 'TechnologyModule';

export default TechnologyModule;
