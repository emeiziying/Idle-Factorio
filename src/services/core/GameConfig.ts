// 游戏配置服务 - 集中管理所有游戏常量和配置
// 用于替代分散在各个文件中的硬编码常量

import { DataService } from '@/services/core/DataService';

export interface GameConstants {
  // 制作系统常量
  crafting: {
    minCraftingTime: number; // 最小制作时间（秒）
    updateInterval: number; // 制作引擎更新间隔（毫秒）
    maxProductivityBonus: number; // 最大生产力加成
  };

  // 燃料系统常量
  fuel: {
    defaultFuelSlots: number; // 默认燃料槽位数
    fuelBufferFullThreshold: number; // 燃料缓存区已满阈值（百分比）
    autoRefuelCheckInterval: number; // 自动补充燃料检查间隔（毫秒）
  };

  // 电力系统常量
  power: {
    surplusThreshold: number; // 电力盈余阈值（百分比）
    balancedThreshold: number; // 电力平衡阈值（百分比）
    solarPanelDayRatio: number; // 太阳能板平均发电率（白天比例）
  };

  // 存储系统常量
  storage: {
    defaultStackSize: number; // 默认堆叠大小
    maxInventorySlots: number; // 最大库存槽位
    storageOptimizationThreshold: number; // 存储优化阈值
  };

  // 用户界面常量
  ui: {
    autoSaveInterval: number; // 自动保存间隔（毫秒）
    debounceDelay: number; // 防抖延迟（毫秒）
    maxRecentRecipes: number; // 最大最近配方数量
  };
}

export class GameConfig {
  private static instance: GameConfig;
  private constants: GameConstants;
  private dataService: DataService;

  constructor(dataService?: DataService) {
    this.dataService = dataService || {} as DataService; // 临时处理，在DI容器中会注入正确的实例
    this.constants = this.initializeConstants();
  }

  static getInstance(): GameConfig {
    if (!GameConfig.instance) {
      GameConfig.instance = new GameConfig();
    }
    return GameConfig.instance;
  }

  /**
   * 初始化游戏常量
   */
  private initializeConstants(): GameConstants {
    return {
      crafting: {
        minCraftingTime: 0.1, // 最小制作时间 0.1秒
        updateInterval: 100, // 制作引擎每100ms更新一次
        maxProductivityBonus: 0.5, // 最大50%生产力加成
      },

      fuel: {
        defaultFuelSlots: 1, // 默认1个燃料槽位
        fuelBufferFullThreshold: 95, // 95%以上认为已满
        autoRefuelCheckInterval: 5000, // 每5秒检查一次自动补充
      },

      power: {
        surplusThreshold: 110, // 110%以上为盈余
        balancedThreshold: 95, // 95%以上为平衡
        solarPanelDayRatio: 0.7, // 太阳能板70%时间有效发电
      },

      storage: {
        defaultStackSize: 50, // 默认堆叠50个
        maxInventorySlots: 1000, // 最大1000个库存槽位
        storageOptimizationThreshold: 100, // 100项以上触发优化
      },

      ui: {
        autoSaveInterval: 10000, // 每10秒自动保存
        debounceDelay: 2000, // 2秒防抖延迟
        maxRecentRecipes: 10, // 最多记录10个最近配方
      },
    };
  }

  /**
   * 获取游戏常量
   */
  getConstants(): GameConstants {
    return this.constants;
  }

  /**
   * 获取燃料优先级列表（从data.json动态生成）
   */
  getFuelPriority(): string[] {
    // 默认燃料优先级（可以被用户设置覆盖）
    const defaultPriority = [
      'coal', // 4 MJ - 优先使用煤炭
      'solid-fuel', // 12 MJ - 其次使用固体燃料
      'rocket-fuel', // 100 MJ - 高级燃料
      'nuclear-fuel', // 1.21 GJ - 核燃料
      'wood', // 2 MJ - 最后使用木材
    ];

    // TODO: 从data.json的fuel属性动态生成更完整的燃料列表
    // 按燃料价值排序：value值越高优先级越低（保留高价值燃料）

    return defaultPriority;
  }

  /**
   * 获取物品的燃料类别（从data.json动态获取）
   */
  getFuelCategory(itemId: string): string | null {
    const item = this.dataService.getItem(itemId);

    if (!item?.fuel) {
      return null;
    }

    // 从data.json的fuel.category获取，如果没有则根据燃料值判断
    if (item.fuel.category) {
      return item.fuel.category;
    }

    // 回退逻辑：根据燃料值和物品ID判断类别
    const fuelValue = item.fuel.value || 0;

    if (itemId.includes('nuclear') || itemId.includes('uranium')) {
      return 'nuclear';
    } else if (fuelValue > 0) {
      return 'chemical';
    }

    return 'chemical'; // 默认化学燃料
  }

  /**
   * 判断机器是否为燃料消耗型（burner类型）
   */
  isBurnerMachine(machineId: string): boolean {
    const item = this.dataService.getItem(machineId);
    return item?.machine?.type === 'burner';
  }

  /**
   * 获取机器的燃料类别要求
   */
  getMachineFuelCategories(machineId: string): string[] {
    const item = this.dataService.getItem(machineId);
    return item?.machine?.fuelCategories || [];
  }

  /**
   * 计算基于功率的最大燃料储存量
   */
  calculateMaxFuelStorage(powerConsumption: number): number {
    // 假设最大储存 = 功率消耗 * 储存时间常数
    const storageTimeConstant = (this.constants.fuel.autoRefuelCheckInterval / 1000) * 200; // 200倍检查间隔的秒数
    return powerConsumption * storageTimeConstant;
  }

  /**
   * 更新常量（用于运行时配置）
   */
  updateConstants(newConstants: Partial<GameConstants>): void {
    this.constants = { ...this.constants, ...newConstants };
  }
}

export default GameConfig;
