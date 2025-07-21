// 持久化服务 - 保存和恢复游戏状态
import { InventoryItem } from '../types';
import { Facility } from '../types/facilities';
import { FacilityLogistics } from '../types/logistics';

interface GameState {
  version: string;
  timestamp: number;
  inventory: Record<string, InventoryItem>;
  facilities: Record<string, Facility[]>;
  logistics: Record<string, FacilityLogistics>;
  craftingQueue: any[];
}

class PersistenceService {
  private readonly STORAGE_KEY = 'alien-factory-save';
  private readonly SAVE_VERSION = '1.0.0';

  // 保存游戏状态
  saveGameState(state: Partial<GameState>): boolean {
    try {
      const existingState = this.loadGameState();
      const newState: GameState = {
        version: this.SAVE_VERSION,
        timestamp: Date.now(),
        inventory: state.inventory || existingState?.inventory || {},
        facilities: state.facilities || existingState?.facilities || {},
        logistics: state.logistics || existingState?.logistics || {},
        craftingQueue: state.craftingQueue || existingState?.craftingQueue || [],
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newState));
      return true;
    } catch (error) {
      console.error('Failed to save game state:', error);
      return false;
    }
  }

  // 加载游戏状态
  loadGameState(): GameState | null {
    try {
      const savedData = localStorage.getItem(this.STORAGE_KEY);
      if (!savedData) return null;

      const state = JSON.parse(savedData) as GameState;
      
      // 版本兼容性检查
      if (state.version !== this.SAVE_VERSION) {
        console.warn('Save version mismatch, some data may be incompatible');
      }

      return state;
    } catch (error) {
      console.error('Failed to load game state:', error);
      return null;
    }
  }

  // 保存库存
  saveInventory(inventory: Record<string, InventoryItem>): boolean {
    const state = this.loadGameState() || {} as GameState;
    state.inventory = inventory;
    return this.saveGameState(state);
  }

  // 保存设施配置
  saveFacilities(facilities: Record<string, Facility[]>): boolean {
    const state = this.loadGameState() || {} as GameState;
    state.facilities = facilities;
    return this.saveGameState(state);
  }

  // 保存物流配置
  saveLogistics(logistics: Record<string, FacilityLogistics>): boolean {
    const state = this.loadGameState() || {} as GameState;
    state.logistics = logistics;
    return this.saveGameState(state);
  }

  // 清除存档
  clearSave(): boolean {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear save:', error);
      return false;
    }
  }

  // 导出存档
  exportSave(): string | null {
    try {
      const state = this.loadGameState();
      if (!state) return null;
      
      return btoa(JSON.stringify(state));
    } catch (error) {
      console.error('Failed to export save:', error);
      return null;
    }
  }

  // 导入存档
  importSave(data: string): boolean {
    try {
      const state = JSON.parse(atob(data)) as GameState;
      
      // 验证存档数据
      if (!state.version || !state.timestamp) {
        throw new Error('Invalid save data');
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      console.error('Failed to import save:', error);
      return false;
    }
  }

  // 自动保存
  enableAutoSave(intervalMs: number = 30000): () => void {
    const interval = setInterval(() => {
      console.log('Auto-saving game state...');
      
      try {
        // 从各个服务收集当前状态
        const inventory: Record<string, InventoryItem> = {};
        const facilities: Record<string, Facility[]> = {};
        
        // 获取库存数据
        const dataService = require('./DataService').dataService;
        const inventoryItems = dataService.getAllInventoryItems();
        inventoryItems.forEach((item: InventoryItem) => {
          inventory[item.itemId] = item;
        });
        
        // 获取设施数据
        const facilityService = require('./FacilityService').facilityService;
        const allFacilities = facilityService.getAllFacilities();
        allFacilities.forEach((facility: Facility) => {
          if (!facilities[facility.itemId]) {
            facilities[facility.itemId] = [];
          }
          facilities[facility.itemId].push(facility);
        });
        
        // 获取制作队列
        const craftingQueue = dataService.getCraftingQueue();
        
        // 保存状态
        this.saveGameState({
          inventory,
          facilities,
          craftingQueue,
        });
        
        console.log('Game state saved successfully');
      } catch (error) {
        console.error('Failed to auto-save:', error);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }
}

export const persistenceService = new PersistenceService();