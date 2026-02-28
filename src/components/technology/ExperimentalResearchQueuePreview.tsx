import { adaptGameStateResearchToLegacyView } from '@/app/runtime/adapters/adaptRuntimeResearchToLegacyView';
import { useGameRuntimeRegistry } from '@/app/runtime/useGameRuntimeRegistry';
import ResearchQueue from '@/components/technology/ResearchQueue';
import { Alert, Box, Button, Typography } from '@mui/material';
import React from 'react';

const ExperimentalResearchQueuePreview: React.FC = () => {
  const runtimeRegistry = useGameRuntimeRegistry();

  const runtimeResearchView = React.useMemo(() => {
    if (
      runtimeRegistry.status !== 'ready' ||
      !runtimeRegistry.runtime ||
      !runtimeRegistry.runtimeState
    ) {
      return null;
    }

    return adaptGameStateResearchToLegacyView(
      runtimeRegistry.runtimeState,
      runtimeRegistry.runtime.getCatalog()
    );
  }, [runtimeRegistry]);

  if (runtimeRegistry.status === 'error') {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Experimental runtime 启动失败: {runtimeRegistry.error}
      </Alert>
    );
  }

  if (!runtimeResearchView || !runtimeRegistry.runtime || !runtimeRegistry.runtimeState) {
    return null;
  }

  const { runtime } = runtimeRegistry;
  const runtimeState = runtimeRegistry.runtimeState;
  const nextTechnology = runtime
    .getCatalog()
    .technologiesInOrder.find(
      technology =>
        !technology.researchTrigger &&
        !runtimeState.unlocks.techs.includes(technology.id) &&
        runtimeState.research.currentTechId !== technology.id &&
        !runtimeState.research.queue.includes(technology.id) &&
        technology.prerequisites.every(prerequisite =>
          runtimeState.unlocks.techs.includes(prerequisite)
        )
    );

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="overline" sx={{ display: 'block', color: 'warning.main' }}>
          Experimental Runtime
        </Typography>
        <Button
          size="small"
          variant="outlined"
          disabled={!nextTechnology}
          onClick={() => {
            if (!nextTechnology) {
              return;
            }

            runtime.dispatch({
              type:
                runtimeState.research.currentTechId || runtimeState.research.queue.length
                  ? 'research/queue-add'
                  : 'research/start',
              techId: nextTechnology.id,
            });
          }}
          sx={{ minHeight: 28, fontSize: '0.7rem' }}
        >
          添加首个科技
        </Button>
      </Box>
      <ResearchQueue
        title="新引擎研究队列"
        queue={runtimeResearchView.queue}
        currentResearch={runtimeResearchView.currentResearch}
        autoResearch={runtimeState.research.autoResearch}
        emptyHint="使用“添加首个科技”按钮向新引擎投递研究任务"
        onRemoveFromQueue={techId => {
          runtime.dispatch({ type: 'research/queue-remove', techId });
        }}
        onSetAutoResearch={enabled => {
          runtime.dispatch({ type: 'research/auto-set', enabled });
        }}
        onStartResearch={techId => {
          runtime.dispatch({ type: 'research/start', techId });
        }}
        resolveTechnology={techId => runtime.getCatalog().technologiesById.get(techId)}
      />
    </Box>
  );
};

export default ExperimentalResearchQueuePreview;
