import {
  adaptLegacyStoreStateToSnapshot,
  type LegacyStoreStateSnapshotInput,
} from '@/app/persistence/adaptLegacyStoreStateToSnapshot';
import type { SnapshotRepository } from '@/app/persistence/SnapshotRepository';
import { gameSnapshotRepository } from '@/app/persistence/LocalStorageSnapshotRepository';

export interface MirrorLegacyStoreStateOptions {
  repository?: Pick<SnapshotRepository, 'load' | 'save'>;
}

export const persistRuntimeSnapshotFromLegacyState = async (
  legacyState: LegacyStoreStateSnapshotInput,
  options: MirrorLegacyStoreStateOptions = {}
): Promise<void> => {
  const repository = options.repository || gameSnapshotRepository;
  const snapshot = adaptLegacyStoreStateToSnapshot(legacyState);
  await repository.save(snapshot);
};

export const ensureRuntimeSnapshotFromLegacyState = async (
  legacyState: LegacyStoreStateSnapshotInput,
  options: MirrorLegacyStoreStateOptions = {}
): Promise<boolean> => {
  const repository = options.repository || gameSnapshotRepository;
  const existingSnapshot = await repository.load();

  if (existingSnapshot) {
    return false;
  }

  await persistRuntimeSnapshotFromLegacyState(legacyState, options);
  return true;
};
