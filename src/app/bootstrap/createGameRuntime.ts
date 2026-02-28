import type { SnapshotRepository } from '@/app/persistence/SnapshotRepository';
import { GameRuntime } from '@/app/runtime/GameRuntime';
import type { GameCatalog } from '@/data/catalog/GameCatalog';
import { createInitialGameState } from '@/engine/core/createInitialGameState';

export interface CreateGameRuntimeOptions {
  catalog: GameCatalog;
  repository?: SnapshotRepository;
}

export const createGameRuntime = async (options: CreateGameRuntimeOptions): Promise<GameRuntime> => {
  const snapshot = options.repository ? await options.repository.load() : null;

  return new GameRuntime({
    catalog: options.catalog,
    initialState: snapshot?.state || createInitialGameState(),
    repository: options.repository,
  });
};
