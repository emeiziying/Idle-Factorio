import type { GameCatalog } from '@/data/catalog/GameCatalog';
import type { GameState } from '@/engine/model/GameState';
import {
  ResearchPriority,
  type ResearchQueueItem,
  type TechResearchState,
} from '@/types/technology';

export interface RuntimeResearchView {
  currentResearch?: TechResearchState;
  queue: ResearchQueueItem[];
}

export const adaptGameStateResearchToLegacyView = (
  state: GameState,
  catalog: GameCatalog
): RuntimeResearchView => {
  const currentTechnology = state.research.currentTechId
    ? catalog.technologiesById.get(state.research.currentTechId)
    : undefined;

  const currentResearch = currentTechnology
    ? {
        techId: currentTechnology.id,
        status: 'researching' as const,
        progress: state.research.progress,
        timeRemaining: Math.max(
          0,
          Math.ceil(currentTechnology.researchTime * (1 - state.research.progress))
        ),
        currentCost: {},
      }
    : undefined;

  const queue = state.research.queue.map((techId, index) => {
    const technology = catalog.technologiesById.get(techId);
    const blockedBy =
      technology?.prerequisites.filter(
        prerequisite => !state.unlocks.techs.includes(prerequisite)
      ) || [];

    const queueItem: ResearchQueueItem = {
      techId,
      addedTime: index,
      priority: ResearchPriority.NORMAL,
      estimatedStartTime: undefined,
      estimatedTime: technology?.researchTime,
      canStart: blockedBy.length === 0,
      blockedBy: blockedBy.length > 0 ? blockedBy : undefined,
      queuePosition: index + 1,
    };

    return queueItem;
  });

  return {
    currentResearch,
    queue,
  };
};

export const adaptRuntimeResearchToLegacyView = adaptGameStateResearchToLegacyView;
