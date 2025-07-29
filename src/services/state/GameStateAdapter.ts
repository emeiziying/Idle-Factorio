/**
 * 游戏状态适配器
 * 将 gameStore 适配为 GameStateProvider 接口
 */

import type { GameStateProvider } from '../interfaces';
import type { FacilityInstance } from '../../types/facilities';
import type { InventoryItem } from '../../types/index';
import useGameStore from '../../store/gameStore';
import { BaseService } from '../base/BaseService';

export class GameStateAdapter extends BaseService implements GameStateProvider {
  protected constructor() {
    super();
    this.initializeDependencies();
  }

  getFacilities(): FacilityInstance[] {
    try {
      const gameStore = useGameStore.getState();
      return gameStore.facilities || [];
    } catch (error) {
      this.handleError(error, 'getFacilities');
      return [];
    }
  }

  getInventoryItem(itemId: string): InventoryItem {
    try {
      const gameStore = useGameStore.getState();
      return gameStore.getInventoryItem(itemId);
    } catch (error) {
      this.handleError(error, 'getInventoryItem');
      return { 
        itemId, 
        currentAmount: 0, 
        stackSize: 1,
        baseStacks: 1,
        additionalStacks: 0,
        totalStacks: 1,
        maxCapacity: 1,
        productionRate: 0,
        consumptionRate: 0,
        status: 'normal' as const
      };
    }
  }

  // 扩展功能：获取完整的游戏状态
  getGameState() {
    try {
      return useGameStore.getState();
    } catch (error) {
      this.handleError(error, 'getGameState');
      return null;
    }
  }

  // 扩展功能：更新游戏状态
  updateGameState(updates: Record<string, unknown>) {
    try {
      const store = useGameStore.getState();
      // 这里可以添加更多的状态更新逻辑
      Object.assign(store, updates);
    } catch (error) {
      this.handleError(error, 'updateGameState');
    }
  }

  // 扩展功能：获取库存物品列表
  getInventory(): InventoryItem[] {
    try {
      const gameStore = useGameStore.getState();
      // 如果 inventory 是 Map，转换为数组
      if (gameStore.inventory instanceof Map) {
        return Array.from(gameStore.inventory.values());
      }
      return gameStore.inventory || [];
    } catch (error) {
      this.handleError(error, 'getInventory');
      return [];
    }
  }

  // 扩展功能：检查物品是否存在于库存中
  hasInventoryItem(itemId: string, requiredCount: number = 1): boolean {
    try {
      const item = this.getInventoryItem(itemId);
      return item.currentAmount >= requiredCount;
    } catch (error) {
      this.handleError(error, 'hasInventoryItem');
      return false;
    }
  }
}