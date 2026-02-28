import type { GameSnapshot } from '@/engine/model/GameSnapshot';

export interface SnapshotRepository {
  load(): Promise<GameSnapshot | null>;
  save(snapshot: GameSnapshot): Promise<void>;
  clear(): Promise<void>;
}
