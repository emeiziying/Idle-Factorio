import type { GameCatalog } from '@/data/catalog/GameCatalog';
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
  return {
    state: {
      ...state,
      simulationTimeMs: state.simulationTimeMs + Math.max(0, context.deltaMs),
    },
    events: [],
  };
};
