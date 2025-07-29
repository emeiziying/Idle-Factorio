// 存储服务 - 合并data.json和特定配置

import { BaseService } from '../base/BaseService';
import { CacheManager } from '../base/CacheManager';
import { ServiceLocator, SERVICE_NAMES } from '../utils/ServiceLocator';
import type { DataService } from '../core/DataService';
import type { StorageConfig } from '../../types/index';
import { STORAGE_SPECIFIC_CONFIGS } from '../../data/storageConfigData';

export interface StorageStats {
  totalCapacity: number;
  usedCapacity: number;
  utilizationRate: number;
  storageByType: Record<string, number>;
}

export interface StorageOptimization {
  recommendedStorageType: string;
  reason: string;
  potentialSavings: number;
}

export class StorageService extends BaseService {
  private storageConfigCache = new CacheManager<string, StorageConfig>();
  private storageStatsCache = new CacheManager<string, StorageStats>();

  protected constructor() {
    super();
    this.initializeDependencies();
  }

  /**
   * 获取完整的存储配置（合并data.json和特定配置）
   */
  getStorageConfig(storageType: string): StorageConfig | undefined {
    try {
      const cached = this.storageConfigCache.get(storageType);
      if (cached) {
        return cached;
      }

      const specificConfig = STORAGE_SPECIFIC_CONFIGS[storageType];
      if (!specificConfig) return undefined;

      const dataService = ServiceLocator.get<DataService>(SERVICE_NAMES.DATA);
      if (!dataService) return undefined;

      // 从data.json获取基础信息
      const item = dataService.getItemById(storageType);
      const recipe = dataService.getRecipeById(storageType);

      if (!item || !recipe) return undefined;

      const config: StorageConfig = {
        itemId: storageType,
        name: dataService.getItemName(storageType) || storageType,
        description: item.description || `Storage container for ${storageType}`,
        category: specificConfig.category!,
        additionalStacks: specificConfig.additionalStacks,
        fluidCapacity: specificConfig.fluidCapacity,
        recipe: recipe.in,
        craftingTime: recipe.time,
        // craftingCategory: recipe.category, // 注释掉不存在的字段
        // icon: item.icon // 注释掉不存在的字段
      };

      this.storageConfigCache.set(storageType, config);
      return config;
    } catch (error) {
      this.handleError(error, `getStorageConfig for ${storageType}`);
      return undefined;
    }
  }

  /**
   * 获取所有可用的存储配置
   */
  getAllStorageConfigs(): StorageConfig[] {
    try {
      const configs: StorageConfig[] = [];
      
      for (const storageType of Object.keys(STORAGE_SPECIFIC_CONFIGS)) {
        const config = this.getStorageConfig(storageType);
        if (config) {
          configs.push(config);
        }
      }

      return configs.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      this.handleError(error, 'getAllStorageConfigs');
      return [];
    }
  }

  /**
   * 获取已解锁的存储配置
   */
  getUnlockedStorageConfigs(): StorageConfig[] {
    try {
      return this.getAllStorageConfigs().filter(config => this.isStorageUnlocked(config.itemId));
    } catch (error) {
      this.handleError(error, 'getUnlockedStorageConfigs');
      return [];
    }
  }

  /**
   * 按类别获取存储配置
   */
  getStorageConfigsByCategory(category: string): StorageConfig[] {
    try {
      return this.getAllStorageConfigs().filter(config => config.category === category);
    } catch (error) {
      this.handleError(error, `getStorageConfigsByCategory for ${category}`);
      return [];
    }
  }

  /**
   * 检查存储是否已解锁
   */
  isStorageUnlocked(storageType: string): boolean {
    try {
      // 通过科技服务检查解锁状态
      if (ServiceLocator.has(SERVICE_NAMES.TECHNOLOGY)) {
        const technologyService = ServiceLocator.get<{ isItemUnlocked?: (itemId: string) => boolean }>(SERVICE_NAMES.TECHNOLOGY);
        return technologyService.isItemUnlocked?.(storageType) ?? true;
      }
      return true; // 默认解锁
    } catch (error) {
      this.handleError(error, `isStorageUnlocked for ${storageType}`);
      return true;
    }
  }

  /**
   * 计算存储容量
   */
  calculateStorageCapacity(storageType: string, quantity: number = 1): number {
    try {
      const config = this.getStorageConfig(storageType);
      if (!config) return 0;

      // 计算总容量
      const baseCapacity = 1; // 基础容量（1个堆叠）
      const additionalCapacity = config.additionalStacks || 0;
      const totalCapacity = (baseCapacity + additionalCapacity) * quantity;

      return totalCapacity;
    } catch (error) {
      this.handleError(error, `calculateStorageCapacity for ${storageType}`);
      return 0;
    }
  }

  /**
   * 计算流体存储容量
   */
  calculateFluidCapacity(storageType: string, quantity: number = 1): number {
    try {
      const config = this.getStorageConfig(storageType);
      if (!config || !config.fluidCapacity) return 0;

      return config.fluidCapacity * quantity;
    } catch (error) {
      this.handleError(error, `calculateFluidCapacity for ${storageType}`);
      return 0;
    }
  }

  /**
   * 获取存储统计信息
   */
  getStorageStats(storageInventory: Record<string, number>): StorageStats {
    try {
      const cacheKey = JSON.stringify(storageInventory);
      const cached = this.storageStatsCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      let totalCapacity = 0;
      let usedCapacity = 0;
      const storageByType: Record<string, number> = {};

      for (const [storageType, quantity] of Object.entries(storageInventory)) {
        const capacity = this.calculateStorageCapacity(storageType, quantity);
        totalCapacity += capacity;
        usedCapacity += quantity; // 假设每个存储都被使用
        storageByType[storageType] = capacity;
      }

      const utilizationRate = totalCapacity > 0 ? usedCapacity / totalCapacity : 0;

      const stats: StorageStats = {
        totalCapacity,
        usedCapacity,
        utilizationRate,
        storageByType
      };

      this.storageStatsCache.set(cacheKey, stats);
      return stats;
    } catch (error) {
      this.handleError(error, 'getStorageStats');
      return {
        totalCapacity: 0,
        usedCapacity: 0,
        utilizationRate: 0,
        storageByType: {}
      };
    }
  }

  /**
   * 推荐最优存储类型
   */
  recommendStorageType(requiredCapacity: number, isFluid: boolean = false): StorageOptimization | null {
    try {
      const availableConfigs = this.getUnlockedStorageConfigs();
      if (availableConfigs.length === 0) return null;

      let bestConfig: StorageConfig | null = null;
      let bestScore = -1;
      let bestCost = Infinity;

      for (const config of availableConfigs) {
        // 过滤流体/固体存储
        if (isFluid && !config.fluidCapacity) continue;
        if (!isFluid && config.fluidCapacity) continue;

        const capacity = isFluid ? 
          config.fluidCapacity || 0 : 
          this.calculateStorageCapacity(config.itemId);

        if (capacity === 0) continue;

        // 计算需要的数量
        const requiredQuantity = Math.ceil(requiredCapacity / capacity);
        
        // 计算成本（简化：基于制作时间和材料）
        const materialCost = this.calculateMaterialCost(config);
        const totalCost = materialCost * requiredQuantity;

        // 计算效率分数（容量/成本）
        const score = capacity / materialCost;

        if (score > bestScore || (score === bestScore && totalCost < bestCost)) {
          bestConfig = config;
          bestScore = score;
          bestCost = totalCost;
        }
      }

      if (!bestConfig) return null;

      const currentBestCapacity = isFluid ? 
        bestConfig.fluidCapacity || 0 : 
        this.calculateStorageCapacity(bestConfig.itemId);

      return {
        recommendedStorageType: bestConfig.itemId,
        reason: `Most efficient storage with ${currentBestCapacity} capacity per unit`,
        potentialSavings: bestCost
      };
    } catch (error) {
      this.handleError(error, 'recommendStorageType');
      return null;
    }
  }

  /**
   * 获取存储升级建议
   */
  getStorageUpgradeSuggestions(currentStorage: Record<string, number>): StorageOptimization[] {
    try {
      const suggestions: StorageOptimization[] = [];
      const allConfigs = this.getUnlockedStorageConfigs();

      for (const [currentType, quantity] of Object.entries(currentStorage)) {
        const currentConfig = this.getStorageConfig(currentType);
        if (!currentConfig) continue;

        const currentCapacity = this.calculateStorageCapacity(currentType, quantity);
        
        // 寻找更高效的替代方案
        for (const betterConfig of allConfigs) {
          if (betterConfig.itemId === currentType) continue;
          if (betterConfig.category !== currentConfig.category) continue;

          const betterCapacity = this.calculateStorageCapacity(betterConfig.itemId);
          if (betterCapacity <= this.calculateStorageCapacity(currentType)) continue;

          const requiredQuantity = Math.ceil(currentCapacity / betterCapacity);
          const materialSavings = this.calculateMaterialCost(currentConfig) * quantity - 
                                 this.calculateMaterialCost(betterConfig) * requiredQuantity;

          if (materialSavings > 0) {
            suggestions.push({
              recommendedStorageType: betterConfig.itemId,
              reason: `Upgrade from ${currentConfig.name} to ${betterConfig.name} for better efficiency`,
              potentialSavings: materialSavings
            });
          }
        }
      }

      return suggestions.sort((a, b) => b.potentialSavings - a.potentialSavings);
    } catch (error) {
      this.handleError(error, 'getStorageUpgradeSuggestions');
      return [];
    }
  }

  /**
   * 计算存储的材料成本
   */
  private calculateMaterialCost(config: StorageConfig): number {
    try {
      if (!config.recipe) return 1;

      let totalCost = 0;
      for (const [, quantity] of Object.entries(config.recipe)) {
        // 简化成本计算：每个材料成本为1
        totalCost += quantity;
      }

      return totalCost + (config.craftingTime || 1);
    } catch (error) {
      this.handleError(error, 'calculateMaterialCost');
      return 1;
    }
  }

  /**
   * 验证存储配置
   */
  validateStorageConfig(storageType: string): boolean {
    try {
      const config = this.getStorageConfig(storageType);
      return !!(config && config.itemId && config.name);
    } catch (error) {
      this.handleError(error, `validateStorageConfig for ${storageType}`);
      return false;
    }
  }

  /**
   * 搜索存储配置
   */
  searchStorageConfigs(query: string): StorageConfig[] {
    try {
      const lowerQuery = query.toLowerCase();
      return this.getAllStorageConfigs().filter(config => 
        config.name.toLowerCase().includes(lowerQuery) ||
        config.itemId.toLowerCase().includes(lowerQuery) ||
        config.category.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      this.handleError(error, 'searchStorageConfigs');
      return [];
    }
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.storageConfigCache.clear();
    this.storageStatsCache.clear();
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      storageConfig: this.storageConfigCache.getStats(),
      storageStats: this.storageStatsCache.getStats()
    };
  }
}