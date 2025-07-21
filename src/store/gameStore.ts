import { create } from 'zustand';
import { InventoryItem, CraftingTask, ResearchTask } from '../types';
import { Facility } from '../types/facilities';

interface GameStore {
  // 库存状态
  inventory: Map<string, InventoryItem>;
  updateInventory: (itemId: string, amount: number) => void;
  getInventoryItem: (itemId: string) => InventoryItem | undefined;
  
  // 设施状态
  facilities: Facility[];
  addFacility: (facility: Facility) => void;
  updateFacility: (facilityId: string, updates: Partial<Facility>) => void;
  removeFacility: (facilityId: string) => void;
  
  // 制作队列
  craftingQueue: CraftingTask[];
  addCraftingTask: (task: CraftingTask) => void;
  updateCraftingTask: (taskId: string, updates: Partial<CraftingTask>) => void;
  removeCraftingTask: (taskId: string) => void;
  
  // 研究任务
  currentResearch: ResearchTask | null;
  setCurrentResearch: (research: ResearchTask | null) => void;
  
  // 游戏循环
  lastUpdateTime: number;
  setLastUpdateTime: (time: number) => void;
  
  // 初始化
  initializeGame: () => void;
  
  // 保存和加载
  saveGame: () => void;
  loadGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // 初始状态
  inventory: new Map(),
  facilities: [],
  craftingQueue: [],
  currentResearch: null,
  lastUpdateTime: Date.now(),
  
  // 库存管理
  updateInventory: (itemId: string, amount: number) => {
    set((state) => {
      const inventory = new Map(state.inventory);
      const existing = inventory.get(itemId) || {
        itemId,
        currentAmount: 0,
        maxCapacity: 9999,
        productionRate: 0,
        consumptionRate: 0,
        status: 'normal' as const
      };
      
      existing.currentAmount = Math.max(0, Math.min(existing.currentAmount + amount, existing.maxCapacity));
      inventory.set(itemId, existing);
      
      return { inventory };
    });
  },
  
  getInventoryItem: (itemId: string) => {
    return get().inventory.get(itemId);
  },
  
  // 设施管理
  addFacility: (facility: Facility) => {
    set((state) => ({
      facilities: [...state.facilities, facility]
    }));
  },
  
  updateFacility: (facilityId: string, updates: Partial<Facility>) => {
    set((state) => ({
      facilities: state.facilities.map(f => 
        f.id === facilityId ? { ...f, ...updates } : f
      )
    }));
  },
  
  removeFacility: (facilityId: string) => {
    set((state) => ({
      facilities: state.facilities.filter(f => f.id !== facilityId)
    }));
  },
  
  // 制作队列管理
  addCraftingTask: (task: CraftingTask) => {
    set((state) => {
      if (state.craftingQueue.length >= 10) {
        console.warn('Crafting queue is full');
        return state;
      }
      return { craftingQueue: [...state.craftingQueue, task] };
    });
  },
  
  updateCraftingTask: (taskId: string, updates: Partial<CraftingTask>) => {
    set((state) => ({
      craftingQueue: state.craftingQueue.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      )
    }));
  },
  
  removeCraftingTask: (taskId: string) => {
    set((state) => ({
      craftingQueue: state.craftingQueue.filter(task => task.id !== taskId)
    }));
  },
  
  // 研究管理
  setCurrentResearch: (research: ResearchTask | null) => {
    set({ currentResearch: research });
  },
  
  // 游戏循环
  setLastUpdateTime: (time: number) => {
    set({ lastUpdateTime: time });
  },
  
  // 初始化游戏
  initializeGame: () => {
    const savedState = localStorage.getItem('factorio-game-state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        set({
          inventory: new Map(parsed.inventory),
          facilities: parsed.facilities || [],
          craftingQueue: parsed.craftingQueue || [],
          currentResearch: parsed.currentResearch || null,
          lastUpdateTime: Date.now()
        });
      } catch (error) {
        console.error('Failed to load game state:', error);
      }
    } else {
      // 初始化一些基础资源
      const initialInventory = new Map<string, InventoryItem>();
      ['iron-ore', 'copper-ore', 'coal', 'stone', 'wood'].forEach(itemId => {
        initialInventory.set(itemId, {
          itemId,
          currentAmount: 50,
          maxCapacity: 9999,
          productionRate: 0,
          consumptionRate: 0,
          status: 'normal'
        });
      });
      
      set({
        inventory: initialInventory,
        facilities: [],
        craftingQueue: [],
        currentResearch: null,
        lastUpdateTime: Date.now()
      });
    }
  },
  
  // 保存游戏
  saveGame: () => {
    const state = get();
    const saveData = {
      inventory: Array.from(state.inventory.entries()),
      facilities: state.facilities,
      craftingQueue: state.craftingQueue,
      currentResearch: state.currentResearch,
      timestamp: Date.now()
    };
    localStorage.setItem('factorio-game-state', JSON.stringify(saveData));
  },
  
  // 加载游戏
  loadGame: () => {
    get().initializeGame();
  }
}));