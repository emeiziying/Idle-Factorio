import type { GameState } from '@/engine/model/GameState';
import type { Technology } from '@/types/technology';

export interface ResearchTriggerProgress {
  currentCount: number;
  requiredCount: number;
  completed: boolean;
}

export const getResearchTriggerProgress = (
  state: GameState,
  technology: Technology
): ResearchTriggerProgress | undefined => {
  const trigger = technology.researchTrigger;
  if (!trigger) {
    return undefined;
  }

  const requiredCount = Math.max(1, trigger.count || 1);
  const currentCount = getResearchTriggerCurrentCount(state, technology);

  return {
    currentCount,
    requiredCount,
    completed: currentCount >= requiredCount,
  };
};

export const isResearchTriggerSatisfied = (state: GameState, technology: Technology): boolean => {
  return getResearchTriggerProgress(state, technology)?.completed ?? false;
};

const getResearchTriggerCurrentCount = (state: GameState, technology: Technology): number => {
  const trigger = technology.researchTrigger;
  if (!trigger) {
    return 0;
  }

  switch (trigger.type) {
    case 'craft-item':
      return trigger.item ? state.stats.craftedItemCounts[trigger.item] || 0 : 0;

    case 'build-entity':
      return trigger.entity ? state.stats.builtEntityCounts[trigger.entity] || 0 : 0;

    case 'mine-entity':
      return trigger.entity ? state.stats.minedEntityCounts[trigger.entity] || 0 : 0;

    case 'create-space-platform':
    case 'capture-spawner':
    default:
      return 0;
  }
};
