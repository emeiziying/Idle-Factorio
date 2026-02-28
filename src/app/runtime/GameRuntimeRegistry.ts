import type { GameRuntime } from '@/app/runtime/GameRuntime';
import type { GameState } from '@/engine/model/GameState';

export type GameRuntimeSource = 'snapshot' | 'legacy-import' | 'initial';
export type GameRuntimeStatus = 'idle' | 'booting' | 'ready' | 'error';

export interface GameRuntimeRegistryState {
  status: GameRuntimeStatus;
  source: GameRuntimeSource | null;
  runtime: GameRuntime | null;
  runtimeState: GameState | null;
  error: string | null;
  lastBootAtMs: number | null;
}

type Listener = () => void;

const listeners = new Set<Listener>();

let runtimeSubscriptionCleanup: (() => void) | null = null;
let registryState: GameRuntimeRegistryState = {
  status: 'idle',
  source: null,
  runtime: null,
  runtimeState: null,
  error: null,
  lastBootAtMs: null,
};

const emitChange = (): void => {
  listeners.forEach(listener => listener());
};

const updateRegistryState = (nextState: Partial<GameRuntimeRegistryState>): void => {
  registryState = {
    ...registryState,
    ...nextState,
  };
  emitChange();
};

const detachRuntimeSubscription = (): void => {
  if (runtimeSubscriptionCleanup) {
    runtimeSubscriptionCleanup();
    runtimeSubscriptionCleanup = null;
  }
};

export const subscribeGameRuntimeRegistry = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getGameRuntimeRegistryState = (): GameRuntimeRegistryState => {
  return registryState;
};

export const markGameRuntimeBooting = (): void => {
  detachRuntimeSubscription();
  updateRegistryState({
    status: 'booting',
    source: null,
    runtime: null,
    runtimeState: null,
    error: null,
  });
};

export const registerGameRuntime = (
  runtime: GameRuntime,
  options: {
    source: GameRuntimeSource;
  }
): void => {
  detachRuntimeSubscription();
  runtimeSubscriptionCleanup = runtime.subscribe((runtimeState: GameState) => {
    updateRegistryState({
      runtimeState,
      runtime,
      status: 'ready',
    });
  });

  updateRegistryState({
    status: 'ready',
    source: options.source,
    runtime,
    runtimeState: runtime.getState(),
    error: null,
    lastBootAtMs: Date.now(),
  });
};

export const registerGameRuntimeError = (error: unknown): void => {
  detachRuntimeSubscription();

  updateRegistryState({
    status: 'error',
    source: null,
    runtime: null,
    runtimeState: null,
    error: error instanceof Error ? error.message : String(error),
  });
};

export const resetGameRuntimeRegistry = (): void => {
  detachRuntimeSubscription();
  registryState = {
    status: 'idle',
    source: null,
    runtime: null,
    runtimeState: null,
    error: null,
    lastBootAtMs: null,
  };
  emitChange();
};
