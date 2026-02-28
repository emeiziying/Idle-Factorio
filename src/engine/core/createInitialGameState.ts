import type { GameState } from '@/engine/model/GameState';

export const createInitialGameState = (): GameState => {
  return {
    simulationTimeMs: 0,
    inventory: {
      items: {},
    },
    facilities: [],
    research: {
      currentTechId: null,
      progress: 0,
      queue: [],
      autoResearch: true,
    },
    unlocks: {
      techs: [],
      recipes: [],
      items: [],
      buildings: [],
    },
    power: {
      generation: 0,
      consumption: 0,
      satisfactionRatio: 1,
    },
    stats: {
      totalItemsProduced: 0,
      craftedItemCounts: {},
      builtEntityCounts: {},
      minedEntityCounts: {},
    },
  };
};
