import type { GameState } from '@/engine/model/GameState';

export interface GameSnapshot {
  schemaVersion: number;
  savedAtMs: number;
  state: GameState;
}

export const CURRENT_GAME_SNAPSHOT_VERSION = 2;

export const migrateGameSnapshot = (snapshot: GameSnapshot): GameSnapshot => {
  if (snapshot.schemaVersion >= CURRENT_GAME_SNAPSHOT_VERSION) {
    return snapshot;
  }

  return {
    ...snapshot,
    schemaVersion: CURRENT_GAME_SNAPSHOT_VERSION,
    state: {
      ...snapshot.state,
      facilities: snapshot.state.facilities.map(facility => ({
        ...facility,
        count: facility.count ?? 1,
      })),
    },
  };
};
