/**
 * 存档优化服务
 * 实现第一阶段优化：移除冗余字段，降低精度，简化数据结构
 */

import { DataService } from './DataService';
import type { FacilityInstance } from '../types/facilities';

// 优化后的存档格式
export interface OptimizedSaveData {
  version: number;
  inventory: Record<string, number>; // 简化为物品ID->数量
  craftingQueue: any[]; // 保持原样
  craftingChains: any[]; // 保持原样
  facilities: OptimizedFacility[];
  stats: {
    total: number;
    crafted: [string, number][];
    built: [string, number][];
    mined: [string, number][];
  };
  research: {
    state: any;
    queue: any[];
    unlocked: string[];
    auto: boolean;
  };
  favorites: string[];
  recent: any[];
  containers: any[];
  time: number;
}

// 优化后的设施格式
export interface OptimizedFacility {
  id: string;
  type: string;
  recipe: string;
  progress: number;
  fuel: Record<string, number>;
  status: string;
  efficiency: number;
}

export class SaveOptimizationService {
  private static instance: SaveOptimizationService;
  private dataService: DataService;

  private constructor() {
    this.dataService = DataService.getInstance();
  }

  static getInstance(): SaveOptimizationService {
    if (!SaveOptimizationService.instance) {
      SaveOptimizationService.instance = new SaveOptimizationService();
    }
    return SaveOptimizationService.instance;
  }

  /**
   * 将游戏状态转换为优化后的存档格式
   */
  optimize(state: any): OptimizedSaveData {
    const optimized: OptimizedSaveData = {
      version: 2,
      inventory: {},
      craftingQueue: state.craftingQueue || [],
      craftingChains: state.craftingChains || [],
      facilities: [],
      stats: {
        total: state.totalItemsProduced || 0,
        crafted: Array.from(state.craftedItemCounts?.entries() || []),
        built: Array.from(state.builtEntityCounts?.entries() || []),
        mined: Array.from(state.minedEntityCounts?.entries() || [])
      },
      research: {
        state: state.researchState || null,
        queue: state.researchQueue || [],
        unlocked: Array.from(state.unlockedTechs || []),
        auto: state.autoResearch ?? true
      },
      favorites: Array.from(state.favoriteRecipes || []),
      recent: state.recentRecipes || [],
      containers: state.deployedContainers || [],
      time: Date.now()
    };

    // 优化库存：只存储物品ID和数量
    if (state.inventory) {
      for (const [itemId, itemData] of state.inventory) {
        optimized.inventory[itemId] = itemData.currentAmount;
      }
    }

    // 优化设施：简化数据结构，降低精度
    if (state.facilities) {
      optimized.facilities = state.facilities.map((facility: FacilityInstance) => {
        const fuel = facility.fuelBuffer?.slots?.[0];
        return {
          id: facility.id,
          type: facility.facilityId,
          recipe: facility.targetItemId,
          progress: Math.round((facility.production?.progress || 0) * 100) / 100, // 保留2位小数
          fuel: fuel ? { [fuel.itemId]: Math.round(fuel.remainingEnergy * 100) / 100 } : {},
          status: facility.status,
          efficiency: facility.efficiency
        };
      });
    }

    return optimized;
  }

  /**
   * 从优化后的存档格式恢复游戏状态
   */
  restore(optimized: OptimizedSaveData): any {
    const restored: any = {
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
      saveKey: `optimized_${optimized.time}`
    };

    // 恢复库存（需要从游戏配置获取完整信息）
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
        status: 'normal'
      });
    }

    // 恢复设施
    restored.facilities = optimized.facilities.map(facility => {
      const fuelItem = Object.keys(facility.fuel)[0];
      return {
        id: facility.id,
        facilityId: facility.type,
        targetItemId: facility.recipe,
        count: 1,
        status: facility.status,
        efficiency: facility.efficiency,
        production: {
          currentRecipeId: facility.recipe,
          progress: facility.progress,
          inputBuffer: [],
          outputBuffer: []
        },
        fuelBuffer: {
          slots: fuelItem ? [{
            itemId: fuelItem,
            quantity: 1,
            remainingEnergy: facility.fuel[fuelItem]
          }] : [],
          maxSlots: 1,
          totalEnergy: facility.fuel[fuelItem] || 0,
          maxEnergy: this.getFacilityMaxEnergy(facility.type),
          consumptionRate: this.getFacilityConsumptionRate(facility.type),
          lastUpdate: optimized.time
        }
      };
    });

    return restored;
  }

  /**
   * 计算存档大小（用于比较）
   */
  calculateSize(data: any): number {
    return JSON.stringify(data).length;
  }

  /**
   * 比较优化前后的存档大小
   */
  compareSizes(original: any, optimized: OptimizedSaveData): {
    originalSize: number;
    optimizedSize: number;
    reduction: number;
    percentage: number;
  } {
    const originalSize = this.calculateSize(original);
    const optimizedSize = this.calculateSize(optimized);
    const reduction = originalSize - optimizedSize;
    const percentage = Math.round((reduction / originalSize) * 100);

    return {
      originalSize,
      optimizedSize,
      reduction,
      percentage
    };
  }

  // 从游戏配置获取物品堆叠大小
  private getItemStackSize(itemId: string): number {
    const item = this.dataService.getItem(itemId);
    return item?.stack || 50; // 默认堆叠大小50
  }

  // 从游戏配置获取设施最大能量
  private getFacilityMaxEnergy(facilityType: string): number {
    // 暂时使用硬编码值，后续可以从设施配置服务获取
    const energyLimits: Record<string, number> = {
      'stone-furnace': 90,
      'steel-furnace': 90,
      'electric-furnace': 180,
      'burner-mining-drill': 150,
      'electric-mining-drill': 90,
      'burner-inserter': 150,
      'inserter': 150,
      'long-handed-inserter': 150
    };
    return energyLimits[facilityType] || 100;
  }

  // 从游戏配置获取设施能源消耗率
  private getFacilityConsumptionRate(facilityType: string): number {
    // 暂时使用硬编码值，后续可以从设施配置服务获取
    const consumptionRates: Record<string, number> = {
      'stone-furnace': 0.09,
      'steel-furnace': 0.09,
      'electric-furnace': 0.18,
      'burner-mining-drill': 0.15,
      'electric-mining-drill': 0.09,
      'burner-inserter': 0.094,
      'inserter': 0.013,
      'long-handed-inserter': 0.02
    };
    return consumptionRates[facilityType] || 0.1;
  }
}

export const saveOptimizationService = SaveOptimizationService.getInstance();