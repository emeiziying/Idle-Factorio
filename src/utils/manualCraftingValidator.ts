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
   * 基于官方Wiki规则：https://wiki.factorio.com/Crafting/zh#Manual_crafting
   * @param recipe 配方
   * @returns 验证结果
   */
  public validateRecipe(recipe: Recipe): ManualCraftingValidation {
    // 检查配方类别（category）
    // 根据Wiki，只有某些类别的配方可以手动制作
    if (recipe.category) {
      // 可以手动制作的配方类别
      const manualCraftableCategories = [
        'crafting',           // 基础制作
        'advanced-crafting',  // 高级制作
        'crafting-with-fluid' // 某些包含流体的配方（但需要进一步检查）
      ];

      // 需要特殊设备的配方类别
      const restrictedCategories = [
        'smelting',           // 熔炼 - 需要熔炉
        'chemistry',          // 化工 - 需要化工厂
        'oil-processing',     // 炼油 - 需要炼油厂
        'centrifuging',       // 离心 - 需要离心机
        'rocket-building',    // 火箭建造 - 需要火箭发射井
        'electromagnetics',   // 电磁 - 需要电磁工厂（太空时代）
        'cryogenics',         // 低温 - 需要低温工厂（太空时代）
        'metallurgy',         // 冶金 - 需要铸造厂（太空时代）
        'organic',            // 有机 - 需要生物室（太空时代）
        'recycling',          // 回收 - 需要回收机（太空时代）
        'recycling-or-hand-crafting' // 特殊：回收或手动制作
      ];

      // 特殊处理回收配方
      if (recipe.category === 'recycling-or-hand-crafting') {
        // 这类配方既可以在回收机中进行，也可以手动制作
        return {
          canCraftManually: true,
          reason: '可手动制作或使用回收机',
          category: 'craftable'
        };
      }

      // 检查是否为受限类别
      if (restrictedCategories.includes(recipe.category)) {
        return {
          canCraftManually: false,
          reason: this.getCategoryRestrictionReason(recipe.category),
          category: 'restricted'
        };
      }

      // 检查是否为可手动制作类别
      if (!manualCraftableCategories.includes(recipe.category)) {
        return {
          canCraftManually: false,
          reason: `配方类别 "${recipe.category}" 需要特殊设备`,
          category: 'restricted'
        };
      }
    }

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

      // 回收配方 - 根据Wiki，某些回收配方可以手动制作
      if (recipe.flags.includes('recycling')) {
        // 检查是否有特定的生产者限制
        if (recipe.producers && this.hasRestrictedProducer(recipe.producers)) {
          return {
            canCraftManually: false,
            reason: '回收配方需要回收机',
            category: 'restricted'
          };
        }
        return {
          canCraftManually: true,
          reason: '回收配方，可手动制作',
          category: 'craftable'
        };
      }
    }

    // 检查生产者限制
    if (recipe.producers && recipe.producers.length > 0) {
      if (this.hasRestrictedProducer(recipe.producers)) {
        return {
          canCraftManually: false,
          reason: '需要特殊生产设备',
          category: 'restricted'
        };
      }
    }

    // 检查输入材料是否包含液体
    // 根据Wiki："Products that require liquids and a few others (such as engine units) cannot be manually crafted"
    if (recipe.in) {
      const fluidInputs = Object.keys(recipe.in).filter(input => 
        this.isFluidItem(input)
      );

      if (fluidInputs.length > 0) {
        // 特殊情况：某些包含流体的配方仍可手动制作（需要具体配方数据）
        // 暂时按照严格规则：所有包含流体的配方都不能手动制作
        return {
          canCraftManually: false,
          reason: '配方包含液体，无法手动制作',
          category: 'restricted'
        };
      }
    }

    // 检查是否为特殊限制物品
    // 根据Wiki提到的 "engine units" 等物品
    const restrictedItems = [
      'engine-unit',              // 引擎单元
      'electric-engine-unit',     // 电动引擎单元
      'flying-robot-frame',       // 飞行机器人框架
      'rocket-fuel',              // 火箭燃料（某些版本）
      'rocket-control-unit',      // 火箭控制单元
      'low-density-structure',    // 低密度结构（某些版本）
      'rocket-part',              // 火箭部件
      // 太空时代新增
      'quantum-processor',        // 量子处理器
      'fusion-power-cell',        // 聚变能量电池
      'superconductor',           // 超导体
      'supercapacitor'            // 超级电容器
    ];

    if (recipe.id && restrictedItems.includes(recipe.id)) {
      return {
        canCraftManually: false,
        reason: '高级物品，需要特殊设备',
        category: 'restricted'
      };
    }

    // 默认可以手动制作
    return {
      canCraftManually: true,
      reason: '可通过配方手动制作',
      category: 'craftable'
    };
  }

  /**
   * 检查是否包含受限的生产者
   */
  private hasRestrictedProducer(producers: string[]): boolean {
    const restrictedProducers = [
      // 熔炉
      'stone-furnace', 'steel-furnace', 'electric-furnace',
      // 装配机
      'assembling-machine-1', 'assembling-machine-2', 'assembling-machine-3',
      // 化工设备
      'chemical-plant', 'oil-refinery', 'centrifuge',
      // 流体设备
      'pumpjack', 'offshore-pump',
      // 太空时代设备
      'foundry',                  // 铸造厂
      'electromagnetic-plant',     // 电磁工厂
      'cryogenic-plant',          // 低温工厂
      'biochamber',               // 生物室
      'recycler',                 // 回收机
      'agricultural-tower',       // 农业塔
      'captive-biter-spawner'     // 虫巢孵化器
    ];

    return producers.some(producer => restrictedProducers.includes(producer));
  }

  /**
   * 获取配方类别限制原因
   */
  private getCategoryRestrictionReason(category: string): string {
    const categoryReasons: Record<string, string> = {
      'smelting': '需要熔炉进行熔炼',
      'chemistry': '需要化工厂进行化学反应',
      'oil-processing': '需要炼油厂进行炼油',
      'centrifuging': '需要离心机进行离心分离',
      'rocket-building': '需要火箭发射井',
      'electromagnetics': '需要电磁工厂',
      'cryogenics': '需要低温工厂',
      'metallurgy': '需要铸造厂',
      'organic': '需要生物室',
      'recycling': '需要回收机'
    };

    return categoryReasons[category] || `需要特殊设备进行 ${category}`;
  }

  /**
   * 判断物品是否为流体
   * @param itemId 物品ID
   * @returns 是否为流体
   */
  private isFluidItem(itemId: string): boolean {
    const fluidItems = [
      // 基础流体
      'water', 'steam', 'crude-oil', 'heavy-oil', 'light-oil', 'petroleum-gas',
      'sulfuric-acid', 'lubricant',
      // 核能相关
      'uranium-235', 'uranium-238',
      // 太空时代流体
      'thruster-fuel', 'thruster-oxidizer',
      'lava', 'molten-iron', 'molten-copper',
      'holmium-solution', 'electrolyte',
      'ammoniacal-solution', 'ammonia',
      'lithium-brine', 'fluorine',
      'fluoroketone-hot', 'fluoroketone-cold',
      'plasma'
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