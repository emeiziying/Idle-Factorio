import type { GameCatalog } from '@/data/catalog/GameCatalog';
import { tickResearch, unlockTriggeredTechnologies } from '@/engine/core/researchState';
import type { DomainEvent } from '@/engine/model/DomainEvent';
import type { GameState } from '@/engine/model/GameState';

export interface TickContext {
  nowMs: number;
  deltaMs: number;
  catalog: GameCatalog;
}

export interface TickResult {
  state: GameState;
  events: DomainEvent[];
}

export const tickGame = (state: GameState, context: TickContext): TickResult => {
  const researchResult = tickResearch(state, context.catalog, Math.max(0, context.deltaMs));
  const triggerUnlockResult = unlockTriggeredTechnologies(researchResult.state, context.catalog);

  return {
    state: {
      ...triggerUnlockResult.state,
      simulationTimeMs: triggerUnlockResult.state.simulationTimeMs + Math.max(0, context.deltaMs),
    },
    events: [...researchResult.events, ...triggerUnlockResult.events],
  };
};
