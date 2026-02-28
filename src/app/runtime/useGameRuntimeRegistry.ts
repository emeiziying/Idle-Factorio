import {
  getGameRuntimeRegistryState,
  subscribeGameRuntimeRegistry,
  type GameRuntimeRegistryState,
} from '@/app/runtime/GameRuntimeRegistry';
import { useSyncExternalStore } from 'react';

export const useGameRuntimeRegistry = (): GameRuntimeRegistryState => {
  return useSyncExternalStore(
    subscribeGameRuntimeRegistry,
    getGameRuntimeRegistryState,
    getGameRuntimeRegistryState
  );
};
