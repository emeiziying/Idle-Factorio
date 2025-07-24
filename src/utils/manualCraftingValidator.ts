// 手动采集验证工具类
// 基于 Factorio Wiki 官方规则实现，支持自定义配置

import DataService from '../services/DataService';
import type { Recipe } from '../types/index';
import { 
  ManualCraftingConfig, 
  defaultManualCraftingConfig,
  relaxedManualCraftingConfig 
} from '../config/manualCraftingConfig';

export interface ManualCraftingValidation {
  canCraftManually: boolean;
  reason: string;
  category: 'raw_material' | 'craftable' | 'restricted';
}

export class ManualCraftingValidator {
  private static instance: ManualCraftingValidator;
  private dataService: DataService;
  private config: ManualCraftingConfig;

  private constructor(config?: ManualCraftingConfig) {
    this.dataService = DataService.getInstance();
    this.config = config || defaultManualCraftingConfig;
  }

  static getInstance(config?: ManualCraftingConfig): ManualCraftingValidator {
    if (!ManualCraftingValidator.instance || config) {
      ManualCraftingValidator.instance = new ManualCraftingValidator(config);
    }
    return ManualCraftingValidator.instance;
  }

  /**
   * 设置配置
   */
  setConfig(config: ManualCraftingConfig) {
    this.config = config;
  }

  /**
   * 使用宽松配置（允许更多物品手动制作）
   */
  useRelaxedConfig() {
    this.config = relaxedManualCraftingConfig;
  }

  /**
   * 使用默认配置
   */
  useDefaultConfig() {
    this.config = defaultManualCraftingConfig;
  }

  /**
   * 判断物品是否可以手动采集
   * @param itemId 物品ID
   * @returns 验证结果
   */
  validateManualCrafting(itemId: string): ManualCraftingValidation {
    // 1. 检查黑名单（最高优先级）
    if (this.config.manualCraftingBlacklist.includes(itemId)) {
      return {
        canCraftManually: false,
        reason: '在手动制作黑名单中',
        category: 'restricted'
      };
    }

    // 2. 检查白名单（第二优先级）
    if (this.config.manualCraftingWhitelist.includes(itemId)) {
      return {
        canCraftManually: true,
        reason: '在手动制作白名单中',
        category: 'craftable'
      };
    }

    const item = this.dataService.getItem(itemId);
    if (!item) {
      return {
        canCraftManually: false,
        reason: '物品不存在',
        category: 'restricted'
      };
    }

    // 获取物品的所有配方
    const recipes = this.dataService.getRecipesForItem(itemId);

    // 3. 检查是否为原材料（没有配方）
    if (recipes.length === 0) {
      return {
        canCraftManually: true,
        reason: '原材料，可直接采集',
        category: 'raw_material'
      };
    }

    // 4. 检查配方是否有限制
    for (const recipe of recipes) {
      const validation = this.validateRecipe(recipe);
      if (validation.canCraftManually) {
        return {
          canCraftManually: true,
          reason: validation.reason,
          category: 'craftable'
        };
      }
    }

    return {
      canCraftManually: false,
      reason: '所有配方都需要特殊设备',
      category: 'restricted'
    };
  }

  /**
   * 验证单个配方是否可以手动制作
   * @param recipe 配方
   * @returns 验证结果
   */
  public validateRecipe(recipe: Recipe): ManualCraftingValidation {
    // 获取配方的主要产出物品ID
    const mainProduct = recipe.results?.[0]?.name || 
                       (recipe.out ? Object.keys(recipe.out)[0] : null);

    // 1. 检查产品黑名单
    if (mainProduct && this.config.manualCraftingBlacklist.includes(mainProduct)) {
      return {
        canCraftManually: false,
        reason: '产品在手动制作黑名单中',
        category: 'restricted'
      };
    }

    // 2. 检查产品白名单
    if (mainProduct && this.config.manualCraftingWhitelist.includes(mainProduct)) {
      return {
        canCraftManually: true,
        reason: '产品在手动制作白名单中',
        category: 'craftable'
      };
    }

    // 3. 严格模式：如果有生产者就不能手动制作
    if (this.config.strictMode && recipe.producers && recipe.producers.length > 0) {
      return {
        canCraftManually: false,
        reason: '严格模式：配方指定了生产设备',
        category: 'restricted'
      };
    }

    // 4. 检查配方类别
    if (recipe.category) {
      // 特殊类别处理
      if (recipe.category === 'recycling-or-hand-crafting') {
        return {
          canCraftManually: true,
          reason: '可手动制作或使用回收机',
          category: 'craftable'
        };
      }

      // 检查是否为受限类别
      if (this.config.restrictedCategories.includes(recipe.category)) {
        return {
          canCraftManually: false,
          reason: this.getCategoryRestrictionReason(recipe.category),
          category: 'restricted'
        };
      }

      // 检查是否为可手动制作类别
      if (!this.config.manualCraftableCategories.includes(recipe.category)) {
        return {
          canCraftManually: false,
          reason: `配方类别 "${recipe.category}" 需要特殊设备`,
          category: 'restricted'
        };
      }
    }

    // 5. 检查配方标志
    if (recipe.flags) {
      // 采矿配方 - 可以手动采集
      if (recipe.flags.includes('mining')) {
        return {
          canCraftManually: true,
          reason: '采矿配方，可手动采集',
          category: 'raw_material'
        };
      }
    }

    // 6. 检查生产者限制
    if (recipe.producers && recipe.producers.length > 0) {
      if (this.hasRestrictedProducer(recipe.producers)) {
        return {
          canCraftManually: false,
          reason: '需要特殊生产设备',
          category: 'restricted'
        };
      }
    }

    // 7. 检查输入材料是否包含液体
    if (recipe.in) {
      const fluidInputs = Object.keys(recipe.in).filter(input => 
        this.config.fluidItems.includes(input)
      );

      if (fluidInputs.length > 0) {
        return {
          canCraftManually: false,
          reason: '配方包含液体，无法手动制作',
          category: 'restricted'
        };
      }
    }

    // 8. 检查是否为特殊限制物品
    if (mainProduct && this.config.restrictedItems.includes(mainProduct)) {
      return {
        canCraftManually: false,
        reason: '高级物品需要特殊设备',
        category: 'restricted'
      };
    }

    // 默认：可以手动制作
    return {
      canCraftManually: true,
      reason: '可以手动制作',
      category: 'craftable'
    };
  }

  /**
   * 检查是否有受限的生产者
   */
  private hasRestrictedProducer(producers: string[]): boolean {
    return producers.some(producer => 
      this.config.restrictedProducers.includes(producer)
    );
  }

  /**
   * 获取类别限制原因
   */
  private getCategoryRestrictionReason(category: string): string {
    const categoryReasons: Record<string, string> = {
      'smelting': '熔炼配方需要熔炉',
      'chemistry': '化工配方需要化工厂',
      'oil-processing': '炼油配方需要炼油厂',
      'centrifuging': '离心配方需要离心机',
      'rocket-building': '火箭建造需要火箭发射井',
      'electromagnetics': '电磁配方需要电磁工厂',
      'cryogenics': '低温配方需要低温工厂',
      'metallurgy': '冶金配方需要铸造厂',
      'organic': '有机配方需要生物室',
      'recycling': '回收配方需要回收机'
    };

    return categoryReasons[category] || `配方类别 "${category}" 需要特殊设备`;
  }

  /**
   * 批量验证物品
   */
  validateMultipleItems(itemIds: string[]): Map<string, ManualCraftingValidation> {
    const results = new Map<string, ManualCraftingValidation>();
    
    for (const itemId of itemIds) {
      results.set(itemId, this.validateManualCrafting(itemId));
    }
    
    return results;
  }

  /**
   * 获取所有可手动制作的物品
   */
  getAllManualCraftableItems(): string[] {
    const items = this.dataService.getItems();
    const craftableItems: string[] = [];
    
    for (const item of items) {
      const validation = this.validateManualCrafting(item.id);
      if (validation.canCraftManually) {
        craftableItems.push(item.id);
      }
    }
    
    return craftableItems;
  }
}

// 导出默认实例
export default ManualCraftingValidator.getInstance(); 