/**
 * 游戏状态适配器
 * 将 gameStore 适配为 GameStateProvider 接口
 */

import type { GameStateProvider } from './interfaces';
import type { FacilityInstance } from '@/types/facilities';
import type { InventoryItem } from '@/types/index';
import useGameStore from '@/store/gameStore';

export class GameStateAdapter implements GameStateProvider {
  private static instance: GameStateAdapter;

  private constructor() {}

  static getInstance(): GameStateAdapter {
    if (!GameStateAdapter.instance) {
      GameStateAdapter.instance = new GameStateAdapter();
    }
    return GameStateAdapter.instance;
  }

  getFacilities(): FacilityInstance[] {
    const gameStore = useGameStore.getState();
    return gameStore.facilities || [];
  }

  getInventoryItem(itemId: string): InventoryItem {
    const gameStore = useGameStore.getState();
    return gameStore.getInventoryItem(itemId);
  }
}