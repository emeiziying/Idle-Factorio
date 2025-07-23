// 手动采集验证工具类
// 基于 Factorio Wiki 官方规则实现

import DataService from '../services/DataService';
import type { Recipe } from '../types/index';

export interface ManualCraftingValidation {
  canCraftManually: boolean;
  reason: string;
  category: 'raw_material' | 'craftable' | 'restricted';
}

export class ManualCraftingValidator {
  private static instance: ManualCraftingValidator;
  private dataService: DataService;

  private constructor() {
    this.dataService = DataService.getInstance();
  }

  static getInstance(): ManualCraftingValidator {
    if (!ManualCraftingValidator.instance) {
      ManualCraftingValidator.instance = new ManualCraftingValidator();
    }
    return ManualCraftingValidator.instance;
  }

  /**
   * 判断物品是否可以手动采集
   * @param itemId 物品ID
   * @returns 验证结果
   */
  validateManualCrafting(itemId: string): ManualCraftingValidation {
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

    // 1. 检查是否为原材料（没有配方）
    if (recipes.length === 0) {
      return {
        canCraftManually: true,
        reason: '原材料，可直接采集',
        category: 'raw_material'
      };
    }

    // 2. 检查配方是否有限制
    for (const recipe of recipes) {
      const validation = this.validateRecipe(recipe);
      if (validation.canCraftManually) {
        return {
          canCraftManually: true,
          reason: '可通过配方手动制作',
          category: 'craftable'
        };
      }
    }

    return {
      canCraftManually: false,
      reason: '需要特殊设备制作',
      category: 'restricted'
    };
  }

  /**
   * 验证单个配方是否可以手动制作
   * @param recipe 配方
   * @returns 验证结果
   */
  public validateRecipe(recipe: Recipe): ManualCraftingValidation {
    // 检查配方标志
    if (recipe.flags) {
      // 采矿配方 - 可以手动采集
      if (recipe.flags.includes('mining')) {
        return {
          canCraftManually: true,
          reason: '采矿配方，可手动采集',
          category: 'raw_material'
        };
      }

      // 回收配方 - 通常可以手动制作
      if (recipe.flags.includes('recycling')) {
        return {
          canCraftManually: true,
          reason: '回收配方，可手动制作',
          category: 'craftable'
        };
      }
    }

    // 检查生产者限制
    if (recipe.producers) {
      const restrictedProducers = [
        'stone-furnace', 'steel-furnace', 'electric-furnace', // 熔炉
        'assembling-machine-1', 'assembling-machine-2', 'assembling-machine-3', // 装配机
        'chemical-plant', 'oil-refinery', 'centrifuge', // 化工设备
        'pumpjack', 'offshore-pump' // 流体设备
      ];

      const hasRestrictedProducer = recipe.producers.some((producer: string) => 
        restrictedProducers.includes(producer)
      );

      if (hasRestrictedProducer) {
        return {
          canCraftManually: false,
          reason: '需要特殊生产设备',
          category: 'restricted'
        };
      }
    }

    // 检查输入材料是否包含液体
    if (recipe.in) {
      const fluidInputs = Object.keys(recipe.in).filter(input => 
        this.isFluidItem(input)
      );

      if (fluidInputs.length > 0) {
        return {
          canCraftManually: false,
          reason: '配方包含液体，无法手动制作',
          category: 'restricted'
        };
      }
    }

    // 检查是否为特殊限制物品
    const restrictedItems = [
      'engine-unit',
      'electric-engine-unit', 
      'flying-robot-frame',
      'rocket-fuel',
      'rocket-control-unit',
      'low-density-structure',
      'rocket-part'
    ];

    if (restrictedItems.includes(recipe.id)) {
      return {
        canCraftManually: false,
        reason: '高级物品，需要特殊设备',
        category: 'restricted'
      };
    }

    // 默认可以手动制作（基于配方特征判断）
    return {
      canCraftManually: true,
      reason: '可通过配方手动制作',
      category: 'craftable'
    };
  }

  /**
   * 判断物品是否为流体
   * @param itemId 物品ID
   * @returns 是否为流体
   */
  private isFluidItem(itemId: string): boolean {
    const fluidItems = [
      'water', 'steam', 'crude-oil', 'heavy-oil', 'light-oil', 'petroleum-gas',
      'sulfuric-acid', 'lubricant', 'uranium-235', 'uranium-238'
    ];
    return fluidItems.includes(itemId);
  }

  /**
   * 获取可手动采集的物品列表
   * @returns 可手动采集的物品ID列表
   */
  getManualCraftableItems(): string[] {
    const allItems = this.dataService.getAllItems();
    const manualCraftableItems: string[] = [];

    for (const item of allItems) {
      const validation = this.validateManualCrafting(item.id);
      if (validation.canCraftManually) {
        manualCraftableItems.push(item.id);
      }
    }

    return manualCraftableItems;
  }

  /**
   * 获取原材料物品列表（无配方物品）
   * @returns 原材料物品ID列表
   */
  getRawMaterials(): string[] {
    const allItems = this.dataService.getAllItems();
    const rawMaterials: string[] = [];

    for (const item of allItems) {
      const recipes = this.dataService.getRecipesForItem(item.id);
      if (recipes.length === 0) {
        rawMaterials.push(item.id);
      }
    }

    return rawMaterials;
  }

  /**
   * 获取采矿类物品列表
   * @returns 采矿物品ID列表
   */
  getMiningItems(): string[] {
    const allRecipes = this.dataService.getAllRecipes();
    const miningItems: string[] = [];

    for (const recipe of allRecipes) {
      if (recipe.flags && recipe.flags.includes('mining')) {
        // 从输出中获取物品ID
        const outputItems = Object.keys(recipe.out);
        miningItems.push(...outputItems);
      }
    }

    return [...new Set(miningItems)]; // 去重
  }
}

export default ManualCraftingValidator; 