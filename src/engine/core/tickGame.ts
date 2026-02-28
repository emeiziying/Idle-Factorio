import type { GameCatalog } from '@/data/catalog/GameCatalog';
import { tickFacilityFuelState, updateFacilityPowerState } from '@/engine/core/facilitySystems';
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
  const normalizedDeltaMs = Math.max(0, context.deltaMs);
  const powerResult = updateFacilityPowerState(state, context.catalog);
  const fuelResult = tickFacilityFuelState(powerResult.state, context.catalog, normalizedDeltaMs);
  const researchResult = tickResearch(fuelResult.state, context.catalog, normalizedDeltaMs);
  const triggerUnlockResult = unlockTriggeredTechnologies(researchResult.state, context.catalog);

  return {
    state: {
      ...triggerUnlockResult.state,
      simulationTimeMs: triggerUnlockResult.state.simulationTimeMs + normalizedDeltaMs,
    },
    events: [
      ...powerResult.events,
      ...fuelResult.events,
      ...researchResult.events,
      ...triggerUnlockResult.events,
    ],
  };
};
