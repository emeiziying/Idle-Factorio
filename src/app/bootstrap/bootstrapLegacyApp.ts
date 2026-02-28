import { ensureRuntimeSnapshotFromLegacyState } from '@/app/persistence/mirrorLegacyStoreStateToRuntimeSnapshot';
import { DIServiceInitializer } from '@/services/core/DIServiceInitializer';
import useGameStore from '@/store/gameStore';

export interface LegacyBootstrapState {
  didLoadLegacySave: boolean;
  didSeedRuntimeSnapshot: boolean;
}

let initialStoreLoadResult: boolean | null = null;
let loadInitialStorePromise: Promise<boolean> | null = null;
let lastBootstrapState: LegacyBootstrapState = {
  didLoadLegacySave: false,
  didSeedRuntimeSnapshot: false,
};

const loadInitialStoreState = async (): Promise<boolean> => {
  if (initialStoreLoadResult !== null) {
    return initialStoreLoadResult;
  }

  if (loadInitialStorePromise) {
    return loadInitialStorePromise;
  }

  loadInitialStorePromise = (async () => {
    try {
      const loaded = await useGameStore.getState().loadGameData();
      initialStoreLoadResult = loaded;
      return loaded;
    } finally {
      if (initialStoreLoadResult === null) {
        loadInitialStorePromise = null;
      }
    }
  })();

  return loadInitialStorePromise;
};

export const bootstrapLegacyApp = async (): Promise<LegacyBootstrapState> => {
  const didLoadLegacySave = await loadInitialStoreState();
  let didSeedRuntimeSnapshot = false;

  if (didLoadLegacySave) {
    didSeedRuntimeSnapshot = await ensureRuntimeSnapshotFromLegacyState(useGameStore.getState());
  }

  await DIServiceInitializer.acquire();

  lastBootstrapState = {
    didLoadLegacySave,
    didSeedRuntimeSnapshot,
  };

  return lastBootstrapState;
};

export const getLegacyBootstrapState = (): LegacyBootstrapState => {
  return lastBootstrapState;
};

export const resetLegacyAppBootstrap = (): void => {
  initialStoreLoadResult = null;
  loadInitialStorePromise = null;
  lastBootstrapState = {
    didLoadLegacySave: false,
    didSeedRuntimeSnapshot: false,
  };
};
