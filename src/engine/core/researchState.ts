import type { GameCatalog } from '@/data/catalog/GameCatalog';
import { isResearchTriggerSatisfied } from '@/engine/core/researchTriggers';
import type { DomainEvent } from '@/engine/model/DomainEvent';
import type { GameState, UnlockState } from '@/engine/model/GameState';
import type { Technology } from '@/types/technology';

export const queueResearch = (
  state: GameState,
  techId: string,
  catalog: GameCatalog
): GameState => {
  if (!canQueueTechnology(state, techId, catalog)) {
    return state;
  }

  return {
    ...state,
    research: {
      ...state.research,
      queue: [...state.research.queue, techId],
    },
  };
};

export const removeQueuedResearch = (state: GameState, techId: string): GameState => {
  if (!state.research.queue.includes(techId)) {
    return state;
  }

  return {
    ...state,
    research: {
      ...state.research,
      queue: state.research.queue.filter(queuedTechId => queuedTechId !== techId),
    },
  };
};

export const setAutoResearch = (state: GameState, enabled: boolean): GameState => {
  if (state.research.autoResearch === enabled) {
    return state;
  }

  return {
    ...state,
    research: {
      ...state.research,
      autoResearch: enabled,
    },
  };
};

export const startResearch = (
  state: GameState,
  techId: string,
  catalog: GameCatalog
): GameState => {
  const technology = catalog.technologiesById.get(techId);
  if (
    !technology ||
    technology.researchTrigger ||
    state.research.currentTechId ||
    !canStartTechnology(state, technology)
  ) {
    return state;
  }

  return {
    ...state,
    research: {
      ...state.research,
      currentTechId: techId,
      progress: 0,
      queue: state.research.queue.filter(queuedTechId => queuedTechId !== techId),
    },
  };
};

export const tickResearch = (
  state: GameState,
  catalog: GameCatalog,
  deltaMs: number
): {
  state: GameState;
  events: DomainEvent[];
} => {
  let nextState = state;
  const events: DomainEvent[] = [];

  if (!nextState.research.currentTechId && nextState.research.autoResearch) {
    const nextTechId = nextState.research.queue.find(queuedTechId => {
      const technology = catalog.technologiesById.get(queuedTechId);
      return !!technology && canStartTechnology(nextState, technology);
    });

    if (nextTechId) {
      nextState = startResearch(nextState, nextTechId, catalog);
    }
  }

  const currentTechId = nextState.research.currentTechId;
  if (!currentTechId) {
    return {
      state: nextState,
      events,
    };
  }

  const technology = catalog.technologiesById.get(currentTechId);
  if (!technology) {
    return {
      state: {
        ...nextState,
        research: {
          ...nextState.research,
          currentTechId: null,
          progress: 0,
        },
      },
      events,
    };
  }

  const totalResearchTimeMs = Math.max(1, technology.researchTime * 1000);
  const nextProgress = Math.min(1, nextState.research.progress + deltaMs / totalResearchTimeMs);

  if (nextProgress < 1) {
    return {
      state: {
        ...nextState,
        research: {
          ...nextState.research,
          progress: nextProgress,
        },
      },
      events,
    };
  }

  const unlockedState = unlockTechnology(nextState.unlocks, technology);
  events.push(
    {
      type: 'research/completed',
      techId: technology.id,
    },
    {
      type: 'technology/unlocked',
      techId: technology.id,
    }
  );

  return {
    state: {
      ...nextState,
      research: {
        ...nextState.research,
        currentTechId: null,
        progress: 0,
      },
      unlocks: unlockedState,
    },
    events,
  };
};

export const unlockTriggeredTechnologies = (
  state: GameState,
  catalog: GameCatalog
): {
  state: GameState;
  events: DomainEvent[];
} => {
  let nextUnlocks = state.unlocks;
  let nextQueue = state.research.queue;
  const events: DomainEvent[] = [];
  let hasUnlockedAny = false;
  let shouldContinue = true;

  while (shouldContinue) {
    shouldContinue = false;

    for (const technology of catalog.technologiesInOrder) {
      if (!technology.researchTrigger || nextUnlocks.techs.includes(technology.id)) {
        continue;
      }

      if (!canStartTechnology({ ...state, unlocks: nextUnlocks }, technology)) {
        continue;
      }

      if (!isResearchTriggerSatisfied(state, technology)) {
        continue;
      }

      nextUnlocks = unlockTechnology(nextUnlocks, technology);
      nextQueue = nextQueue.filter(queuedTechId => queuedTechId !== technology.id);
      events.push({
        type: 'technology/unlocked',
        techId: technology.id,
      });
      hasUnlockedAny = true;
      shouldContinue = true;
    }
  }

  if (!hasUnlockedAny) {
    return {
      state,
      events,
    };
  }

  return {
    state: {
      ...state,
      research: {
        ...state.research,
        queue: nextQueue,
      },
      unlocks: nextUnlocks,
    },
    events,
  };
};

const canStartTechnology = (state: GameState, technology: Technology): boolean => {
  if (state.unlocks.techs.includes(technology.id)) {
    return false;
  }

  return technology.prerequisites.every(prerequisite => state.unlocks.techs.includes(prerequisite));
};

const canQueueTechnology = (state: GameState, techId: string, catalog: GameCatalog): boolean => {
  const technology = catalog.technologiesById.get(techId);
  return (
    !!technology &&
    !technology.researchTrigger &&
    !state.unlocks.techs.includes(techId) &&
    state.research.currentTechId !== techId &&
    !state.research.queue.includes(techId)
  );
};

const unlockTechnology = (unlockState: UnlockState, technology: Technology): UnlockState => {
  return {
    techs: appendUnique(unlockState.techs, technology.id),
    recipes: appendUnique(unlockState.recipes, ...(technology.unlocks.recipes || [])),
    items: appendUnique(unlockState.items, ...(technology.unlocks.items || [])),
    buildings: appendUnique(unlockState.buildings, ...(technology.unlocks.buildings || [])),
  };
};

const appendUnique = (currentValues: readonly string[], ...nextValues: string[]): string[] => {
  if (nextValues.length === 0) {
    return [...currentValues];
  }

  const merged = new Set(currentValues);
  nextValues.forEach(value => {
    if (value) {
      merged.add(value);
    }
  });
  return Array.from(merged);
};
