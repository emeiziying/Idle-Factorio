import { gameSnapshotRepository } from '@/app/persistence/LocalStorageSnapshotRepository';
import { ensureRuntimeSnapshotFromLegacyState } from '@/app/persistence/mirrorLegacyStoreStateToRuntimeSnapshot';
import type { SnapshotRepository } from '@/app/persistence/SnapshotRepository';
import { GameRuntime } from '@/app/runtime/GameRuntime';
import type { GameCatalog } from '@/data/catalog/GameCatalog';
import { createInitialGameState } from '@/engine/core/createInitialGameState';
import type { GameSnapshot } from '@/engine/model/GameSnapshot';
import type { LegacyStoreStateSnapshotInput } from '@/app/persistence/adaptLegacyStoreStateToSnapshot';

export interface CreateGameRuntimeOptions {
  catalog: GameCatalog;
  repository?: SnapshotRepository;
  snapshot?: GameSnapshot | null;
  legacyState?: LegacyStoreStateSnapshotInput | null;
  now?: () => number;
}

export const createGameRuntime = async (
  options: CreateGameRuntimeOptions
): Promise<GameRuntime> => {
  const repository = options.repository || gameSnapshotRepository;
  let snapshot = options.snapshot ?? (await repository.load());

  if (!snapshot && options.legacyState) {
    await ensureRuntimeSnapshotFromLegacyState(options.legacyState, { repository });
    snapshot = await repository.load();
  }

  const runtime = new GameRuntime({
    catalog: options.catalog,
    initialState: snapshot?.state || createInitialGameState(),
    repository,
    now: options.now,
  });

  runtime.tick(0);

  return runtime;
};
