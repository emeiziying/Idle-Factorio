import { useGameRuntimeRegistry } from '@/app/runtime/useGameRuntimeRegistry';
import { Box, Button, Typography } from '@mui/material';
import React from 'react';

const STATUS_LABELS = {
  idle: '未启动',
  booting: '启动中',
  ready: '就绪',
  error: '失败',
} as const;

const SOURCE_LABELS = {
  snapshot: '新快照',
  'legacy-import': '旧档导入',
  initial: '初始态',
} as const;

const ExperimentalRuntimeDebugPanel: React.FC = () => {
  const runtimeRegistry = useGameRuntimeRegistry();

  if (runtimeRegistry.status === 'idle') {
    return null;
  }

  const inventoryKinds = runtimeRegistry.runtimeState
    ? Object.keys(runtimeRegistry.runtimeState.inventory.items).length
    : 0;
  const facilitiesCount = runtimeRegistry.runtimeState?.facilities.length || 0;
  const facilityUnits =
    runtimeRegistry.runtimeState?.facilities.reduce(
      (total, facility) => total + facility.count,
      0
    ) || 0;
  const unlockedTechCount = runtimeRegistry.runtimeState?.unlocks.techs.length || 0;
  const noFuelFacilities =
    runtimeRegistry.runtimeState?.facilities.filter(facility => facility.status === 'no_fuel')
      .length || 0;
  const noPowerFacilities =
    runtimeRegistry.runtimeState?.facilities.filter(facility => facility.status === 'no_power')
      .length || 0;
  const simulationSeconds = Math.floor(
    (runtimeRegistry.runtimeState?.simulationTimeMs || 0) / 1000
  );
  const currentResearchId = runtimeRegistry.runtimeState?.research.currentTechId || '-';
  const currentResearchProgress = Math.round(
    (runtimeRegistry.runtimeState?.research.progress || 0) * 100
  );
  const queuedResearchCount = runtimeRegistry.runtimeState?.research.queue.length || 0;
  const nextTechnology =
    runtimeRegistry.runtime && runtimeRegistry.runtimeState
      ? runtimeRegistry.runtime
          .getCatalog()
          .technologiesInOrder.find(
            technology =>
              !technology.researchTrigger &&
              !runtimeRegistry.runtimeState!.unlocks.techs.includes(technology.id) &&
              !runtimeRegistry.runtimeState!.research.queue.includes(technology.id) &&
              technology.prerequisites.every(prerequisite =>
                runtimeRegistry.runtimeState!.unlocks.techs.includes(prerequisite)
              )
          )
      : undefined;

  const handleStartFirstResearch = (): void => {
    const runtime = runtimeRegistry.runtime;
    const runtimeState = runtimeRegistry.runtimeState;
    if (!runtime || !runtimeState || !nextTechnology) {
      return;
    }

    runtime.dispatch({
      type:
        runtimeState.research.currentTechId || runtimeState.research.queue.length > 0
          ? 'research/queue-add'
          : 'research/start',
      techId: nextTechnology.id,
    });
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        left: 16,
        bottom: 72,
        zIndex: 1000,
        minWidth: 176,
        maxWidth: 220,
        px: 1.5,
        py: 1.25,
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: 'rgba(255, 255, 255, 0.12)',
        bgcolor: 'background.paper',
        boxShadow: 3,
        opacity: 0.94,
      }}
    >
      <Typography
        variant="caption"
        sx={{ display: 'block', fontWeight: 700, color: 'warning.main' }}
      >
        Experimental Runtime
      </Typography>
      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 0.5 }}>
        状态: {STATUS_LABELS[runtimeRegistry.status]}
        {runtimeRegistry.source ? ` · ${SOURCE_LABELS[runtimeRegistry.source]}` : ''}
      </Typography>

      {runtimeRegistry.error ? (
        <Typography variant="caption" sx={{ display: 'block', color: 'error.main' }}>
          {runtimeRegistry.error}
        </Typography>
      ) : (
        <>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
            仿真时间: {simulationSeconds}s
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
            物品种类: {inventoryKinds}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
            设施数量: {facilitiesCount} 组 / {facilityUnits} 台
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
            电力: {Math.round(runtimeRegistry.runtimeState?.power.generation || 0)} /{' '}
            {Math.round(runtimeRegistry.runtimeState?.power.consumption || 0)} kW
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
            缺燃料/缺电: {noFuelFacilities}/{noPowerFacilities}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
            已解锁科技: {unlockedTechCount}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
            当前研究: {currentResearchId} ({currentResearchProgress}%)
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
            研究队列: {queuedResearchCount}
          </Typography>
          {runtimeRegistry.status === 'ready' && (
            <Button
              variant="outlined"
              size="small"
              onClick={handleStartFirstResearch}
              disabled={!nextTechnology}
              sx={{ mt: 1, minHeight: 28, fontSize: '0.7rem' }}
            >
              首个科技
            </Button>
          )}
        </>
      )}
    </Box>
  );
};

export default ExperimentalRuntimeDebugPanel;
