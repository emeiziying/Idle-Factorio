/**
 * 游戏存档服务 - 统一的存档和读档管理
 * 整合了数据优化、压缩、防抖和localStorage操作
 */

import { DataService } from '@/services/core/DataService';
import type { FacilityInstance, FacilityStatus } from '@/types/facilities';
import type { CraftingChain, CraftingTask, DeployedContainer, InventoryItem } from '@/types/index';
import type { ResearchQueueItem, TechResearchState } from '@/types/technology';
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
  private dataService: DataService | null = null;

  // 防抖相关
  private pendingSave: PendingSave | null = null;
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly debounceMs: number = 2000;
  private readonly storageKey = 'factorio-game-storage';
  private pendingState: Partial<GameState> | null = null; // 保存等待写入的快照

  private constructor() {
    // 延迟初始化 dataService，避免在测试收集阶段构造依赖

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

  // 延迟获取 DataService 实例
  private getDataService(): DataService {
    if (!this.dataService) {
      this.dataService = new DataService();
    }
    return this.dataService;
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
      this.pendingState = state;

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
          this.pendingState = null;
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
    if (import.meta.env.DEV) {
      try {
        const fuelSnapshots = (optimized.facilities || []).map(f => ({
          id: f.id,
          type: f.type,
          fuel: f.fuel,
          progress: f.progress,
          status: f.status,
        }));
        console.debug('[GameStorage] Saving facilities fuel snapshot:', fuelSnapshots);
      } catch (e) {
        console.warn('[GameStorage] Failed to log fuel snapshot on save:', e);
      }
    }
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
        if (import.meta.env.DEV) {
          console.debug('[GameStorage] Optimize facility fuel:', {
            id: facility.id,
            type: facility.facilityId,
            slot: fuel
              ? {
                  itemId: fuel.itemId,
                  remainingEnergy: fuel.remainingEnergy,
                  quantity: fuel.quantity,
                }
              : null,
          });
        }
        return {
          id: facility.id,
          type: facility.facilityId,
          recipe: facility.targetItemId || '',
          progress: Math.round((facility.production?.progress || 0) * 100) / 100,
          // 仅当有有效燃料物品且剩余能量>0时才保存，否则存空对象
          fuel:
            fuel && fuel.itemId && fuel.remainingEnergy > 0
              ? { [fuel.itemId]: Math.round(fuel.remainingEnergy * 100) / 100 }
              : {},
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
        const slots = fuelItems.map(([itemId, energy]) => {
          const fuelValue = this.getDataService().getItem(itemId)?.fuel?.value || 0;
          // 存档中记录的是“当前这块燃料的剩余能量”，不是总能量
          // 因此恢复时最多只应还原为1个单位的燃料，并且剩余能量不应超过单个燃料的能量值
          const clampedEnergy = Math.max(0, Math.min(energy as number, fuelValue));
          const slot = {
            itemId,
            quantity: clampedEnergy > 0 ? 1 : 0,
            remainingEnergy: clampedEnergy,
          };
          if (import.meta.env.DEV) {
            console.debug('[GameStorage] Restore facility fuel slot:', {
              id: facility.id,
              type: facility.type,
              itemId,
              savedEnergy: energy,
              fuelValue,
              restored: slot,
            });
          }
          return slot;
        });

        const restoredFacility = {
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
            facilityId: facility.type,
            slots,
            maxSlots: Math.max(1, slots.length),
            totalEnergy:
              slots.length > 0 ? slots.reduce((sum, s) => sum + s.remainingEnergy, 0) : 0,
            maxEnergy: this.getFacilityMaxEnergy(facility.type),
            burnRate: this.getFacilityConsumptionRate(facility.type),
            lastUpdate: optimized.time,
          },
        };
        if (import.meta.env.DEV) {
          console.debug('[GameStorage] Restored facility:', {
            id: restoredFacility.id,
            type: restoredFacility.facilityId,
            fuelBuffer: restoredFacility.fuelBuffer,
          });
        }
        return restoredFacility;
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
    // 不清理 pendingState，这样 flushPendingSave 仍可立即写入
  }

  /**
   * 立即执行待处理的保存
   */
  private flushPendingSave(): void {
    if (this.saveTimeout && this.pendingSave && this.pendingState) {
      try {
        // 清理定时器，转为同步保存以适配 beforeunload
        clearTimeout(this.saveTimeout);

        const optimized = this.optimizeState(this.pendingState);
        const jsonString = JSON.stringify(optimized);
        const compressed = LZString.compressToUTF16(jsonString);
        const finalData = compressed.length * 2 < jsonString.length ? compressed : jsonString;
        localStorage.setItem(this.storageKey, finalData);
        if (import.meta.env.DEV) {
          console.debug('[GameStorage] flushPendingSave: wrote snapshot synchronously');
        }
        this.pendingSave.resolve();
      } catch (e) {
        console.warn('[GameStorage] flushPendingSave failed:', e);
        this.pendingSave.resolve();
      } finally {
        this.pendingSave = null;
        this.saveTimeout = null;
        this.pendingState = null;
      }
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
    const item = this.getDataService().getItem(itemId);
    return item?.stack || 50;
  }

  private getFacilityMaxEnergy(facilityType: string): number {
    const item = this.getDataService().getItem(facilityType);
    if (item?.machine?.usage) {
      // usage 字段就是最大能量消耗，通常也等于最大能量容量
      return item.machine.usage;
    }
    return 100; // 默认值
  }

  private getFacilityConsumptionRate(facilityType: string): number {
    const item = this.getDataService().getItem(facilityType);
    if (item?.machine?.usage) {
      // 燃料消耗率应该保持 kW 单位，与 FuelService.initializeFuelBuffer 保持一致
      return item.machine.usage;
    }
    return 100; // 默认值 (kW)
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
