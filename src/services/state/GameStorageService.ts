/**
 * 游戏存档服务（重构版）
 * 使用 BaseService 和 StorageManager 架构
 */
import { BaseService } from '../base/BaseService';
import type { DataService } from '../core/DataService';
import { ServiceLocator } from '../ServiceLocator';
import type { FacilityInstance, FacilityStatus } from '../../types/facilities';
import type { CraftingTask, CraftingChain, DeployedContainer, InventoryItem } from '../../types/index';
import type { TechResearchState, ResearchQueueItem } from '../../types/technology';
import LZString from 'lz-string';

// 游戏状态类型定义
interface GameState {
  inventory: Map<string, InventoryItem>;
  craftingQueue: CraftingTask[];
  craftingChains: CraftingChain[];
  facilities: FacilityInstance[];
  deployedContainers: DeployedContainer[];
  totalItemsProduced: number;
  favoriteRecipes: Set<string>;
  recentRecipes: string[];
  researchState: TechResearchState | null;
  researchQueue: ResearchQueueItem[];
  unlockedTechs: Set<string>;
  autoResearch: boolean;
  craftedItemCounts: Map<string, number>;
  builtEntityCounts: Map<string, number>;
  minedEntityCounts: Map<string, number>;
  lastSaveTime: number;
  saveKey: string;
}

// 优化后的存档格式
interface OptimizedSaveData {
  inventory: Record<string, number>; // 简化为物品ID->数量
  craftingQueue: CraftingTask[];
  craftingChains: CraftingChain[];
  facilities: OptimizedFacility[];
  stats: {
    total: number;
    crafted: [string, number][];
    built: [string, number][];
    mined: [string, number][];
  };
  research: {
    state: TechResearchState | null;
    queue: ResearchQueueItem[];
    unlocked: string[];
    auto: boolean;
  };
  favorites: string[];
  recent: string[];
  containers: DeployedContainer[];
  time: number;
}

// 优化后的设施格式
interface OptimizedFacility {
  id: string;
  type: string;
  recipe: string;
  progress: number;
  fuel: Record<string, number>;
  status: FacilityStatus;
  efficiency: number;
}

// 防抖存储状态
interface PendingSave {
  resolve: () => void;
  reject: (error: unknown) => void;
}

/**
 * 游戏存档服务类
 * 负责游戏状态的保存、加载和管理
 */
export class GameStorageService extends BaseService {
  protected declare dataService?: DataService;
  
  // 防抖相关
  private pendingSave: PendingSave | null = null;
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly debounceMs: number = 2000;
  private readonly storageKey = 'factorio-game-storage';
  
  constructor() {
    super();
    this.serviceName = 'GameStorageService';
    this.dependencies = ['DataService'];
    
    // 页面卸载时立即保存
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushPendingSave();
      });
    }
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    // 获取依赖服务
    this.dataService = ServiceLocator.get<DataService>('DataService');
  }

  /**
   * 保存游戏数据（带防抖）
   */
  async saveGame(state: Partial<GameState>): Promise<void> {
    return new Promise((resolve, reject) => {
      // 取消之前的保存任务
      this.cancelPendingSave();
      
      // 设置新的待保存任务
      this.pendingSave = { resolve, reject };
      
      // 设置防抖计时器
      this.saveTimeout = setTimeout(async () => {
        try {
          await this.executeSave(state);
          this.pendingSave?.resolve();
        } catch (error) {
          this.pendingSave?.reject(error);
        } finally {
          this.pendingSave = null;
          this.saveTimeout = null;
        }
      }, this.debounceMs);
    });
  }

  /**
   * 强制立即保存（绕过防抖）
   */
  async forceSaveGame(state: Partial<GameState>): Promise<void> {
    this.cancelPendingSave();
    await this.executeSave(state);
  }

  /**
   * 加载游戏数据
   */
  async loadGame(): Promise<Partial<GameState> | null> {
    return this.safeAsync(async () => {
      const rawData = this.storageManager.get<string>(this.storageKey);
      if (!rawData) return null;

      // 检测并解压数据
      let decompressedData = rawData;
      if (rawData.startsWith('ᯡ')) { // LZString压缩标识
        const decompressed = LZString.decompressFromUTF16(rawData);
        if (decompressed) {
          decompressedData = decompressed;
        }
      }
      
      const data = JSON.parse(decompressedData) as OptimizedSaveData;
      
      // 还原为完整的游戏状态
      const state: Partial<GameState> = {
        inventory: this.restoreInventory(data.inventory),
        craftingQueue: data.craftingQueue || [],
        craftingChains: data.craftingChains || [],
        facilities: this.restoreFacilities(data.facilities || []),
        deployedContainers: data.containers || [],
        totalItemsProduced: data.stats?.total || 0,
        favoriteRecipes: new Set(data.favorites || []),
        recentRecipes: data.recent || [],
        researchState: data.research?.state || null,
        researchQueue: data.research?.queue || [],
        unlockedTechs: new Set(data.research?.unlocked || []),
        autoResearch: data.research?.auto || false,
        craftedItemCounts: new Map(data.stats?.crafted || []),
        builtEntityCounts: new Map(data.stats?.built || []),
        minedEntityCounts: new Map(data.stats?.mined || []),
        lastSaveTime: data.time || Date.now()
      };
      
      return state;
    }, 'loadGame', null);
  }

  /**
   * 导出存档数据为字符串
   */
  async exportSave(state: Partial<GameState>): Promise<string> {
    return this.safeAsync(async () => {
      const optimized = this.optimizeGameState(state);
      const json = JSON.stringify(optimized);
      
      // 如果数据较大，进行压缩
      if (json.length > 10240) { // 10KB
        return LZString.compressToBase64(json);
      }
      
      return json;
    }, 'exportSave', '');
  }

  /**
   * 导入存档数据
   */
  async importSave(data: string): Promise<Partial<GameState> | null> {
    return this.safeAsync(async () => {
      let decompressedData = data;
      
      // 尝试解压缩
      try {
        const decompressed = LZString.decompressFromBase64(data);
        if (decompressed) {
          decompressedData = decompressed;
        }
      } catch {
        // 不是压缩数据，继续使用原始数据
      }
      
      const saveData = JSON.parse(decompressedData) as OptimizedSaveData;
      
      // 验证数据格式
      if (!this.validateSaveData(saveData)) {
        throw new Error('Invalid save data format');
      }
      
      // 保存到localStorage
      await this.executeSave({
        inventory: this.restoreInventory(saveData.inventory),
        craftingQueue: saveData.craftingQueue,
        craftingChains: saveData.craftingChains,
        facilities: this.restoreFacilities(saveData.facilities),
        deployedContainers: saveData.containers,
        totalItemsProduced: saveData.stats?.total || 0,
        favoriteRecipes: new Set(saveData.favorites),
        recentRecipes: saveData.recent,
        researchState: saveData.research?.state || null,
        researchQueue: saveData.research?.queue || [],
        unlockedTechs: new Set(saveData.research?.unlocked || []),
        autoResearch: saveData.research?.auto || false,
        craftedItemCounts: new Map(saveData.stats?.crafted || []),
        builtEntityCounts: new Map(saveData.stats?.built || []),
        minedEntityCounts: new Map(saveData.stats?.mined || []),
        lastSaveTime: saveData.time
      });
      
      // 重新加载
      return this.loadGame();
    }, 'importSave', null);
  }

  /**
   * 清除存档
   */
  async clearSave(): Promise<void> {
    this.cancelPendingSave();
    this.storageManager.remove(this.storageKey);
  }

  /**
   * 清除游戏数据（向后兼容方法）
   */
  async clearGameData(): Promise<void> {
    return this.clearSave();
  }

  /**
   * 获取存档大小（字节）
   */
  getSaveSize(): number {
    return this.safe(() => {
      const data = this.storageManager.get<string>(this.storageKey);
      return data ? new Blob([data]).size : 0;
    }, 'getSaveSize', 0);
  }

  /**
   * 获取存档信息
   */
  getSaveInfo(): { exists: boolean; size: number; lastSaveTime?: number } {
    return this.safe(() => {
      const data = this.storageManager.get<string>(this.storageKey);
      if (!data) {
        return { exists: false, size: 0 };
      }
      
      try {
        let decompressedData = data;
        if (data.startsWith('ᯡ')) {
          const decompressed = LZString.decompressFromUTF16(data);
          if (decompressed) {
            decompressedData = decompressed;
          }
        }
        
        const saveData = JSON.parse(decompressedData) as OptimizedSaveData;
        return {
          exists: true,
          size: new Blob([data]).size,
          lastSaveTime: saveData.time
        };
      } catch {
        return { exists: true, size: new Blob([data]).size };
      }
    }, 'getSaveInfo', { exists: false, size: 0 });
  }

  /**
   * 执行保存操作
   */
  private async executeSave(state: Partial<GameState>): Promise<void> {
    const optimized = this.optimizeGameState(state);
    const json = JSON.stringify(optimized);
    
    // 如果数据较大，进行压缩
    let dataToSave = json;
    if (json.length > 10240) { // 10KB
      const compressed = LZString.compressToUTF16(json);
      if (compressed && compressed.length < json.length * 0.8) {
        dataToSave = compressed;
      }
    }
    
    this.storageManager.set(this.storageKey, dataToSave);
  }

  /**
   * 取消待保存的任务
   */
  private cancelPendingSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    if (this.pendingSave) {
      this.pendingSave.reject(new Error('Save cancelled'));
      this.pendingSave = null;
    }
  }

  /**
   * 立即执行待保存的任务
   */
  private flushPendingSave(): void {
    if (this.pendingSave && this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.pendingSave.resolve();
      this.pendingSave = null;
      this.saveTimeout = null;
    }
  }

  /**
   * 优化游戏状态为精简格式
   */
  private optimizeGameState(state: Partial<GameState>): OptimizedSaveData {
    return {
      inventory: this.optimizeInventory(state.inventory),
      craftingQueue: state.craftingQueue || [],
      craftingChains: state.craftingChains || [],
      facilities: this.optimizeFacilities(state.facilities || []),
      stats: {
        total: state.totalItemsProduced || 0,
        crafted: Array.from(state.craftedItemCounts || []),
        built: Array.from(state.builtEntityCounts || []),
        mined: Array.from(state.minedEntityCounts || [])
      },
      research: {
        state: state.researchState || null,
        queue: state.researchQueue || [],
        unlocked: Array.from(state.unlockedTechs || []),
        auto: state.autoResearch || false
      },
      favorites: Array.from(state.favoriteRecipes || []),
      recent: state.recentRecipes || [],
      containers: state.deployedContainers || [],
      time: Date.now()
    };
  }

  /**
   * 优化物品栏数据
   */
  private optimizeInventory(inventory?: Map<string, InventoryItem>): Record<string, number> {
    if (!inventory) return {};
    
    const result: Record<string, number> = {};
    inventory.forEach((item, id) => {
      if (item.currentAmount > 0) {
        result[id] = item.currentAmount;
      }
    });
    
    return result;
  }

  /**
   * 优化设施数据
   */
  private optimizeFacilities(facilities: FacilityInstance[]): OptimizedFacility[] {
    return facilities.map(f => ({
      id: f.id,
      type: f.facilityId,
      recipe: f.production?.currentRecipeId || '',
      progress: f.production?.progress || 0,
      fuel: this.optimizeFuelBuffer(f),
      status: f.status,
      efficiency: f.efficiency
    }));
  }

  /**
   * 优化燃料缓存数据
   */
  private optimizeFuelBuffer(facility: FacilityInstance): Record<string, number> {
    if (!facility.fuelBuffer) return {};
    
    const result: Record<string, number> = {};
    facility.fuelBuffer.slots.forEach(slot => {
      result[slot.itemId] = slot.quantity;
    });
    
    return result;
  }

  /**
   * 还原物品栏数据
   */
  private restoreInventory(data: Record<string, number>): Map<string, InventoryItem> {
    const inventory = new Map<string, InventoryItem>();
    
    Object.entries(data).forEach(([itemId, amount]) => {
      const item = this.dataService!.getItem(itemId);
      if (item) {
        const stackSize = item.stack || 100;
        inventory.set(itemId, {
          itemId,
          currentAmount: amount,
          stackSize,
          baseStacks: 1,
          additionalStacks: 0,
          totalStacks: 1,
          maxCapacity: stackSize,
          productionRate: 0,
          consumptionRate: 0,
          status: 'normal'
        });
      }
    });
    
    return inventory;
  }

  /**
   * 还原设施数据
   */
  private restoreFacilities(data: OptimizedFacility[]): FacilityInstance[] {
    return data.map(f => ({
      id: f.id,
      facilityId: f.type,
      count: 1,
      efficiency: f.efficiency,
      status: f.status,
      production: f.recipe ? {
        currentRecipeId: f.recipe,
        progress: f.progress,
        cyclesCompleted: 0,
        lastUpdateTime: Date.now(),
        inputBuffer: [],
        outputBuffer: []
      } : undefined,
      fuelBuffer: this.restoreFuelBuffer(f),
      type: 'burner', // 默认类型，实际使用时会更新
      isClosed: false
    }));
  }

  /**
   * 还原燃料缓存数据
   */
  private restoreFuelBuffer(facility: OptimizedFacility): any {
    if (!facility.fuel || Object.keys(facility.fuel).length === 0) {
      return undefined;
    }
    
    return {
      slots: Object.entries(facility.fuel).map(([itemId, quantity]) => ({
        itemId,
        quantity,
        remainingEnergy: 0 // 简化处理，启动时会重新计算
      })),
      maxSlots: 1,
      totalEnergy: 0,
      maxEnergy: 100,
      consumptionRate: 0,
      lastUpdate: Date.now()
    };
  }

  /**
   * 验证存档数据格式
   */
  private validateSaveData(data: any): data is OptimizedSaveData {
    return data &&
      typeof data === 'object' &&
      ('inventory' in data) &&
      ('time' in data);
  }

  // ========== 服务信息 ==========

  getServiceInfo() {
    return {
      ...super.getServiceInfo(),
      storageKeys: [this.storageKey]
    };
  }

  async healthCheck() {
    const isHealthy = !!this.dataService;
    const saveInfo = this.getSaveInfo();
    return {
      healthy: isHealthy,
      message: isHealthy 
        ? `Service is running. Save exists: ${saveInfo.exists}, Size: ${saveInfo.size} bytes`
        : 'Dependencies not loaded'
    };
  }
}

// 导出单例实例以保持向后兼容
export const gameStorageService = GameStorageService.getInstance();