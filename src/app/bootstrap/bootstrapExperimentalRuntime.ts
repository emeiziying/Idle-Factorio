import { createGameRuntime } from '@/app/bootstrap/createGameRuntime';
import { getLegacyBootstrapState } from '@/app/bootstrap/bootstrapLegacyApp';
import { gameSnapshotRepository } from '@/app/persistence/LocalStorageSnapshotRepository';
import {
  markGameRuntimeBooting,
  registerGameRuntime,
  registerGameRuntimeError,
  resetGameRuntimeRegistry,
  type GameRuntimeSource,
} from '@/app/runtime/GameRuntimeRegistry';
import type { GameRuntime } from '@/app/runtime/GameRuntime';
import { GameRuntimeScheduler } from '@/app/runtime/GameRuntimeScheduler';
import { loadGameCatalog } from '@/data/catalog/loadGameCatalog';
import useGameStore from '@/store/gameStore';

let experimentalRuntimePromise: Promise<GameRuntime> | null = null;
let runtimeScheduler: GameRuntimeScheduler | null = null;

export const bootstrapExperimentalRuntime = async (): Promise<GameRuntime> => {
  if (experimentalRuntimePromise) {
    return experimentalRuntimePromise;
  }

  markGameRuntimeBooting();

  experimentalRuntimePromise = (async () => {
    const catalog = await loadGameCatalog();
    const existingSnapshot = await gameSnapshotRepository.load();
    const legacyBootstrapState = getLegacyBootstrapState();

    const runtime = await createGameRuntime({
      catalog,
      repository: gameSnapshotRepository,
      snapshot: existingSnapshot,
      legacyState: existingSnapshot ? null : useGameStore.getState(),
    });

    runtimeScheduler?.stop();
    runtimeScheduler = new GameRuntimeScheduler({
      runtime,
      tickIntervalMs: 1000,
      autosaveIntervalMs: 15000,
    });
    runtimeScheduler.start();

    const source = resolveRuntimeSource(!!existingSnapshot, legacyBootstrapState.didLoadLegacySave);
    registerGameRuntime(runtime, { source });
    exposeRuntimeForDebug(runtime);

    return runtime;
  })().catch(error => {
    experimentalRuntimePromise = null;
    registerGameRuntimeError(error);
    throw error;
  });

  return experimentalRuntimePromise;
};

export const resetExperimentalRuntimeBootstrap = (): void => {
  runtimeScheduler?.stop();
  runtimeScheduler = null;
  experimentalRuntimePromise = null;
  resetGameRuntimeRegistry();
  clearRuntimeDebugExposure();
};

const resolveRuntimeSource = (
  hasExistingSnapshot: boolean,
  didLoadLegacySave: boolean
): GameRuntimeSource => {
  if (hasExistingSnapshot) {
    return 'snapshot';
  }

  if (didLoadLegacySave) {
    return 'legacy-import';
  }

  return 'initial';
};

const exposeRuntimeForDebug = (runtime: GameRuntime): void => {
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return;
  }

  (
    window as Window & {
      __IDLE_FACTORIO_RUNTIME__?: GameRuntime;
      __IDLE_FACTORIO_RUNTIME_SCHEDULER__?: GameRuntimeScheduler;
    }
  ).__IDLE_FACTORIO_RUNTIME__ = runtime;
  (
    window as Window & {
      __IDLE_FACTORIO_RUNTIME__?: GameRuntime;
      __IDLE_FACTORIO_RUNTIME_SCHEDULER__?: GameRuntimeScheduler;
    }
  ).__IDLE_FACTORIO_RUNTIME_SCHEDULER__ = runtimeScheduler || undefined;
};

const clearRuntimeDebugExposure = (): void => {
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return;
  }

  delete (
    window as Window & {
      __IDLE_FACTORIO_RUNTIME__?: GameRuntime;
      __IDLE_FACTORIO_RUNTIME_SCHEDULER__?: GameRuntimeScheduler;
    }
  ).__IDLE_FACTORIO_RUNTIME__;
  delete (
    window as Window & {
      __IDLE_FACTORIO_RUNTIME__?: GameRuntime;
      __IDLE_FACTORIO_RUNTIME_SCHEDULER__?: GameRuntimeScheduler;
    }
  ).__IDLE_FACTORIO_RUNTIME_SCHEDULER__;
};
