/**
 * 游戏存档服务 - 统一的存档和读档管理
 * 整合了数据优化、压缩、防抖和localStorage操作
 */

import { DataService } from './DataService';
import type { FacilityInstance, FacilityStatus } from '../types/facilities';
import type { CraftingTask, CraftingChain, DeployedContainer, InventoryItem } from '../types/index';
import type { TechResearchState, ResearchQueueItem } from '../types/technology';
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

export class GameStorageService {
  private static instance: GameStorageService;
  private dataService: DataService;

  // 防抖相关
  private pendingSave: PendingSave | null = null;
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly debounceMs: number = 2000;
  private readonly storageKey = 'factorio-game-storage';

  private constructor() {
    this.dataService = DataService.getInstance();

    // 页面卸载时立即保存
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushPendingSave();
      });
    }
  }

  static getInstance(): GameStorageService {
    if (!GameStorageService.instance) {
      GameStorageService.instance = new GameStorageService();
    }
    return GameStorageService.instance;
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
    try {
      const rawData = localStorage.getItem(this.storageKey);
      if (!rawData) return null;

      // 检测并解压数据
      let decompressedData = rawData;
      if (rawData.startsWith('ᯡ')) {
        // LZString压缩标识
        const decompressed = LZString.decompressFromUTF16(rawData);
        if (decompressed) {
          decompressedData = decompressed;
        }
      }

      const parsed = JSON.parse(decompressedData);

      // 检测数据格式并恢复
      if (this.isOptimizedFormat(parsed)) {
        return this.restoreFromOptimized(parsed);
      } else {
        return this.restoreFromLegacy(parsed);
      }
    } catch (error) {
      console.error('[GameStorage] 加载游戏数据失败:', error);
      return null;
    }
  }

  /**
   * 清除存档数据
   */
  async clearGameData(): Promise<void> {
    this.cancelPendingSave();
    localStorage.removeItem(this.storageKey);
    console.log('[GameStorage] 存档数据已清除');
  }

  /**
   * 执行实际的保存操作
   */
  private async executeSave(state: Partial<GameState>): Promise<void> {
    // 数据优化
    const optimized = this.optimizeState(state);
    const jsonString = JSON.stringify(optimized);

    // 数据压缩
    let finalData = jsonString;
    let sizeInfo = '';

    const originalSize = jsonString.length;
    const compressed = LZString.compressToUTF16(jsonString);
    const compressedSize = compressed.length * 2; // UTF-16每字符2字节

    if (compressedSize < originalSize) {
      finalData = compressed;
      const reduction = Math.round((1 - compressedSize / originalSize) * 100);
      sizeInfo = ` (优化+压缩: ${this.formatSize(originalSize)} → ${this.formatSize(compressedSize)}, -${reduction}%)`;
    } else {
      sizeInfo = ` (未压缩: ${this.formatSize(originalSize)})`;
    }

    // 保存到localStorage
    localStorage.setItem(this.storageKey, finalData);
    console.log(`[GameStorage] 存档成功${sizeInfo}`);
  }

  /**
   * 优化游戏状态数据结构
   */
  private optimizeState(state: Partial<GameState>): OptimizedSaveData {
    const optimized: OptimizedSaveData = {
      inventory: {},
      craftingQueue: state.craftingQueue || [],
      craftingChains: state.craftingChains || [],
      facilities: [],
      stats: {
        total: state.totalItemsProduced || 0,
        crafted: Array.from(state.craftedItemCounts?.entries() || []),
        built: Array.from(state.builtEntityCounts?.entries() || []),
        mined: Array.from(state.minedEntityCounts?.entries() || []),
      },
      research: {
        state: state.researchState || null,
        queue: state.researchQueue || [],
        unlocked: Array.from(state.unlockedTechs || []),
        auto: state.autoResearch ?? true,
      },
      favorites: Array.from(state.favoriteRecipes || []),
      recent: state.recentRecipes || [],
      containers: state.deployedContainers || [],
      time: Date.now(),
    };

    // 优化库存：只存储物品ID和数量
    if (state.inventory) {
      for (const [itemId, itemData] of state.inventory) {
        if (itemData && typeof itemData.currentAmount === 'number' && itemData.currentAmount > 0) {
          optimized.inventory[itemId] = itemData.currentAmount;
        }
      }
    }

    // 优化设施：简化数据结构
    if (state.facilities) {
      optimized.facilities = state.facilities.map((facility: FacilityInstance) => {
        const fuel = facility.fuelBuffer?.slots?.[0];
        return {
          id: facility.id,
          type: facility.facilityId,
          recipe: facility.targetItemId || '',
          progress: Math.round((facility.production?.progress || 0) * 100) / 100,
          fuel: fuel ? { [fuel.itemId]: Math.round(fuel.remainingEnergy * 100) / 100 } : {},
          status: facility.status,
          efficiency: facility.efficiency,
        };
      });
    }

    return optimized;
  }

  /**
   * 从优化格式恢复游戏状态
   */
  private restoreFromOptimized(optimized: OptimizedSaveData): Partial<GameState> {
    const restored: Partial<GameState> = {
      inventory: new Map(),
      craftingQueue: optimized.craftingQueue,
      craftingChains: optimized.craftingChains,
      facilities: [],
      deployedContainers: optimized.containers,
      totalItemsProduced: optimized.stats.total,
      favoriteRecipes: new Set(optimized.favorites),
      recentRecipes: optimized.recent,
      researchState: optimized.research.state,
      researchQueue: optimized.research.queue,
      unlockedTechs: new Set(optimized.research.unlocked),
      autoResearch: optimized.research.auto,
      craftedItemCounts: new Map(optimized.stats.crafted),
      builtEntityCounts: new Map(optimized.stats.built),
      minedEntityCounts: new Map(optimized.stats.mined),
      lastSaveTime: optimized.time,
      saveKey: `restored_${optimized.time}`,
    };

    // 恢复库存
    if (restored.inventory) {
      for (const [itemId, amount] of Object.entries(optimized.inventory)) {
        restored.inventory.set(itemId, {
          itemId,
          currentAmount: amount,
          stackSize: this.getItemStackSize(itemId),
          baseStacks: 1,
          additionalStacks: 0,
          totalStacks: 1,
          maxCapacity: this.getItemStackSize(itemId),
          productionRate: 0,
          consumptionRate: 0,
          status: 'normal',
        });
      }
    }

    // 恢复设施
    if (restored.facilities) {
      restored.facilities = optimized.facilities.map(facility => {
        const fuelItems = Object.entries(facility.fuel);
        const slots = fuelItems.map(([itemId, energy]) => ({
          itemId,
          quantity: Math.ceil(energy / (this.dataService.getItem(itemId)?.fuel?.value || 1)),
          remainingEnergy: energy,
        }));

        return {
          id: facility.id,
          facilityId: facility.type,
          targetItemId: facility.recipe,
          count: 1,
          status: facility.status as FacilityStatus,
          efficiency: facility.efficiency,
          production: {
            currentRecipeId: facility.recipe,
            progress: facility.progress,
            inputBuffer: [],
            outputBuffer: [],
          },
          fuelBuffer: {
            slots,
            maxSlots: Math.max(1, slots.length),
            totalEnergy: Object.values(facility.fuel).reduce((sum, energy) => sum + energy, 0),
            maxEnergy: this.getFacilityMaxEnergy(facility.type),
            consumptionRate: this.getFacilityConsumptionRate(facility.type),
            lastUpdate: optimized.time,
          },
        };
      });
    }

    return restored;
  }

  /**
   * 从传统格式恢复游戏状态
   */
  private restoreFromLegacy(data: unknown): Partial<GameState> {
    // 修复Map和Set序列化问题
    const legacyData = data as Record<string, unknown>;
    return {
      ...legacyData,
      inventory: this.ensureInventoryMap(legacyData.inventory),
      favoriteRecipes: new Set((legacyData.favoriteRecipes as string[]) || []),
      unlockedTechs: new Set((legacyData.unlockedTechs as string[]) || []),
      craftedItemCounts: this.ensureMap(legacyData.craftedItemCounts),
      builtEntityCounts: this.ensureMap(legacyData.builtEntityCounts),
      minedEntityCounts: this.ensureMap(legacyData.minedEntityCounts),
    };
  }

  /**
   * 检测是否为优化格式
   */
  private isOptimizedFormat(data: unknown): data is OptimizedSaveData {
    const obj = data as Record<string, unknown>;
    return !!(
      obj &&
      obj.inventory &&
      typeof obj.inventory === 'object' &&
      !Array.isArray(obj.inventory) &&
      !('entries' in obj.inventory)
    );
  }

  /**
   * 取消待处理的保存任务
   */
  private cancelPendingSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    if (this.pendingSave) {
      this.pendingSave.reject(new Error('保存任务被取消'));
      this.pendingSave = null;
    }
  }

  /**
   * 立即执行待处理的保存
   */
  private flushPendingSave(): void {
    if (this.saveTimeout && this.pendingSave) {
      clearTimeout(this.saveTimeout);
      // 注意：这里是同步操作，用于页面卸载时的紧急保存
      this.pendingSave.resolve();
      this.pendingSave = null;
      this.saveTimeout = null;
    }
  }

  // 工具方法
  private formatSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes}B`;
    } else {
      return `${(bytes / 1024).toFixed(1)}KB`;
    }
  }

  private getItemStackSize(itemId: string): number {
    const item = this.dataService.getItem(itemId);
    return item?.stack || 50;
  }

  private getFacilityMaxEnergy(facilityType: string): number {
    const item = this.dataService.getItem(facilityType);
    if (item?.machine?.usage) {
      // usage 字段就是最大能量消耗，通常也等于最大能量容量
      return item.machine.usage;
    }
    return 100; // 默认值
  }

  private getFacilityConsumptionRate(facilityType: string): number {
    const item = this.dataService.getItem(facilityType);
    if (item?.machine?.usage) {
      // 消耗率 = usage / 1000（转换为每毫秒的消耗）
      return item.machine.usage / 1000;
    }
    return 0.1; // 默认值
  }

  private ensureInventoryMap(inventory: unknown): Map<string, InventoryItem> {
    if (inventory instanceof Map) return inventory;
    if (Array.isArray(inventory)) return new Map(inventory as [string, InventoryItem][]);
    return new Map();
  }

  private ensureMap<K, V>(map: unknown): Map<K, V> {
    if (map instanceof Map) return map;
    if (Array.isArray(map)) return new Map(map as [K, V][]);
    return new Map();
  }
}

export const gameStorageService = GameStorageService.getInstance();
