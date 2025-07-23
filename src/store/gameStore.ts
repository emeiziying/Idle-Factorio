// 游戏状态管理 - Zustand Store

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { InventoryItem, CraftingTask } from '../types/index';
import type { FacilityInstance } from '../types/facilities';

interface GameState {
  // 库存系统
  inventory: Map<string, InventoryItem>;
  
  // 制作队列
  craftingQueue: CraftingTask[];
  maxQueueSize: number;
  
  // 设施系统
  facilities: FacilityInstance[];
  
  // 游戏统计
  gameTime: number;
  totalItemsProduced: number;
  
  // Actions
  updateInventory: (itemId: string, amount: number) => void;
  getInventoryItem: (itemId: string) => InventoryItem;
  addCraftingTask: (task: Omit<CraftingTask, 'id'>) => boolean;
  removeCraftingTask: (taskId: string) => void;
  updateCraftingProgress: (taskId: string, progress: number) => void;
  completeCraftingTask: (taskId: string) => void;
  addFacility: (facility: FacilityInstance) => void;
  updateFacility: (facilityId: string, updates: Partial<FacilityInstance>) => void;
  removeFacility: (facilityId: string) => void;
  incrementGameTime: (deltaTime: number) => void;
}

const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // 初始状态
      inventory: new Map(),
      craftingQueue: [],
      maxQueueSize: 10,
      facilities: [],
      gameTime: 0,
      totalItemsProduced: 0,

      // 库存管理
      updateInventory: (itemId: string, amount: number) => {
        set((state) => {
          const newInventory = new Map(state.inventory);
          const currentItem = newInventory.get(itemId) || {
            itemId,
            currentAmount: 0,
            maxCapacity: 1000, // 默认容量
            productionRate: 0,
            consumptionRate: 0,
            status: 'normal' as const
          };

          const newAmount = Math.max(0, currentItem.currentAmount + amount);
          const updatedItem = {
            ...currentItem,
            currentAmount: Math.min(newAmount, currentItem.maxCapacity)
          };

          newInventory.set(itemId, updatedItem);
          
          return {
            inventory: newInventory,
            totalItemsProduced: state.totalItemsProduced + (amount > 0 ? amount : 0)
          };
        });
      },

      getInventoryItem: (itemId: string) => {
        const inventory = get().inventory;
        return inventory.get(itemId) || {
          itemId,
          currentAmount: 0,
          maxCapacity: 1000,
          productionRate: 0,
          consumptionRate: 0,
          status: 'normal' as const
        };
      },

      // 制作队列管理
      addCraftingTask: (task) => {
        const state = get();
        if (state.craftingQueue.length >= state.maxQueueSize) {
          return false;
        }

        const newTask: CraftingTask = {
          ...task,
          id: `craft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        set((state) => ({
          craftingQueue: [...state.craftingQueue, newTask]
        }));

        return true;
      },

      removeCraftingTask: (taskId: string) => {
        set((state) => ({
          craftingQueue: state.craftingQueue.filter(task => task.id !== taskId)
        }));
      },

      updateCraftingProgress: (taskId: string, progress: number) => {
        set((state) => ({
          craftingQueue: state.craftingQueue.map(task =>
            task.id === taskId ? { ...task, progress, status: 'crafting' as const } : task
          )
        }));
      },

      completeCraftingTask: (taskId: string) => {
        const state = get();
        const task = state.craftingQueue.find(t => t.id === taskId);
        if (task) {
          // 添加产品到库存
          get().updateInventory(task.itemId, task.quantity);
          // 移除任务
          get().removeCraftingTask(taskId);
        }
      },

      // 设施管理
      addFacility: (facility) => {
        set((state) => ({
          facilities: [...state.facilities, facility]
        }));
      },

      updateFacility: (facilityId: string, updates) => {
        set((state) => ({
          facilities: state.facilities.map(facility =>
            facility.id === facilityId ? { ...facility, ...updates } : facility
          )
        }));
      },

      removeFacility: (facilityId: string) => {
        set((state) => ({
          facilities: state.facilities.filter(facility => facility.id !== facilityId)
        }));
      },

      // 游戏时间
      incrementGameTime: (deltaTime: number) => {
        set((state) => ({
          gameTime: state.gameTime + deltaTime
        }));
      },
    }),
    {
      name: 'factorio-game-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        ...state,
        inventory: Array.from(state.inventory.entries())
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 恢复 Map 结构
          state.inventory = new Map(state.inventory as any);
        }
      }
    }
  )
);

export default useGameStore;