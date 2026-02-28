import { useGameRuntimeRegistry } from '@/app/runtime/useGameRuntimeRegistry';
import { getResearchTriggerProgress } from '@/engine/core/researchTriggers';
import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material';
import React from 'react';

interface ExperimentalTechDetailActionsProps {
  techId: string;
}

const ExperimentalTechDetailActions: React.FC<ExperimentalTechDetailActionsProps> = ({
  techId,
}) => {
  const runtimeRegistry = useGameRuntimeRegistry();

  if (runtimeRegistry.status === 'error') {
    return <Alert severity="warning">Experimental runtime 不可用: {runtimeRegistry.error}</Alert>;
  }

  if (
    runtimeRegistry.status !== 'ready' ||
    !runtimeRegistry.runtime ||
    !runtimeRegistry.runtimeState
  ) {
    return null;
  }

  const runtime = runtimeRegistry.runtime;
  const runtimeState = runtimeRegistry.runtimeState;
  const technology = runtime.getCatalog().technologiesById.get(techId);

  if (!technology) {
    return <Alert severity="info">新引擎目录里暂时没有这个科技，当前详情仍由旧链路提供。</Alert>;
  }

  const isUnlocked = runtimeState.unlocks.techs.includes(techId);
  const isQueued = runtimeState.research.queue.includes(techId);
  const isResearching = runtimeState.research.currentTechId === techId;
  const blockedBy = technology.prerequisites.filter(
    prerequisite => !runtimeState.unlocks.techs.includes(prerequisite)
  );
  const triggerProgress = technology.researchTrigger
    ? getResearchTriggerProgress(runtimeState, technology)
    : undefined;
  const isAvailable = !isUnlocked && blockedBy.length === 0;
  const hasTriggerResearch = !!technology.researchTrigger;
  const canStart = isAvailable && !hasTriggerResearch && !isQueued && !isResearching;
  const canQueue = isAvailable && !hasTriggerResearch && !isQueued && !isResearching;
  const canStartImmediately = canStart && !runtimeState.research.currentTechId;

  const statusLabel = isUnlocked
    ? '已解锁'
    : isResearching
      ? '研究中'
      : isQueued
        ? '已入队'
        : isAvailable
          ? '可研究'
          : '未满足前置';

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'warning.light',
        bgcolor: 'warning.50',
      }}
    >
      <Typography variant="overline" sx={{ display: 'block', color: 'warning.dark' }}>
        Experimental Runtime
      </Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
        <Chip size="small" color="warning" variant="outlined" label={statusLabel} />
        {isResearching && (
          <Typography variant="caption" color="text.secondary">
            进度 {Math.round(runtimeState.research.progress * 100)}%
          </Typography>
        )}
      </Stack>

      {blockedBy.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          前置未完成:{' '}
          {blockedBy
            .map(id => runtime.getCatalog().technologiesById.get(id)?.name || id)
            .join(' / ')}
        </Typography>
      )}

      {hasTriggerResearch && !isUnlocked && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          自动解锁进度: {triggerProgress?.currentCount || 0}/{triggerProgress?.requiredCount || 1}
        </Typography>
      )}

      {hasTriggerResearch && triggerProgress?.completed && !isUnlocked && (
        <Typography variant="caption" color="success.light" sx={{ display: 'block', mb: 1 }}>
          条件已满足，科技会在新引擎 tick 中自动解锁。
        </Typography>
      )}

      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
        <Button
          size="small"
          variant="outlined"
          disabled={!canStartImmediately}
          onClick={() => {
            runtime.dispatch({ type: 'research/start', techId });
          }}
        >
          新引擎开始研究
        </Button>
        <Button
          size="small"
          variant="outlined"
          disabled={!canQueue}
          onClick={() => {
            runtime.dispatch({ type: 'research/queue-add', techId });
          }}
        >
          新引擎加入队列
        </Button>
        <Button
          size="small"
          variant="text"
          color="error"
          disabled={!isQueued}
          onClick={() => {
            runtime.dispatch({ type: 'research/queue-remove', techId });
          }}
        >
          新引擎移除队列
        </Button>
      </Stack>

      {!canStartImmediately && canStart && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          新引擎已有进行中的研究，可先加入队列或等待当前研究完成。
        </Typography>
      )}
    </Box>
  );
};

export default ExperimentalTechDetailActions;
