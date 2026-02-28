import type { GameState } from '@/engine/model/GameState';

export interface GameSnapshot {
  schemaVersion: number;
  savedAtMs: number;
  state: GameState;
}

export const CURRENT_GAME_SNAPSHOT_VERSION = 1;
