// 手动采集验证工具类
// 基于 Factorio Wiki 官方规则实现

import { ServiceLocator, SERVICE_NAMES } from '../services/ServiceLocator';
import type { DataService } from '../services/DataService';
import { RecipeService } from '../services/RecipeService';
import type { Recipe } from '../types/index';
import type { IManualCraftingValidator } from '../services/interfaces/IManualCraftingValidator';

// 验证结果类别常量
export const ValidationCategory = {
  RAW_MATERIAL: 'raw_material',
  CRAFTABLE: 'craftable',
  RESTRICTED: 'restricted',
  DATA_ERROR: 'data_error'
} as const;

export type ValidationCategoryType = typeof ValidationCategory[keyof typeof ValidationCategory];

// 验证原因常量 - 支持国际化
export const ValidationReason = {
  ITEM_NOT_FOUND: 'item_not_found',
  DATA_SERVICE_UNAVAILABLE: 'data_service_unavailable',
  RAW_MATERIAL: 'raw_material',
  RECIPE_AVAILABLE: 'recipe_available',
  FLUID_INVOLVED: 'fluid_involved',
  BLACKLISTED_ITEM: 'blacklisted_item',
  COMPLEX_MACHINE: 'complex_machine',
  MINING_RECIPE: 'mining_recipe',
  RECYCLING_RECIPE: 'recycling_recipe',
  TECHNOLOGY_RECIPE: 'technology_recipe',
  AGRICULTURE_RECIPE: 'agriculture_recipe',
  SMELTING_REQUIRED: 'smelting_required',
  CHEMICAL_EQUIPMENT: 'chemical_equipment',
  FLUID_EXTRACTION: 'fluid_extraction',
  RECYCLER_REQUIRED: 'recycler_required',
  AGRICULTURE_EQUIPMENT: 'agriculture_equipment',
  LAB_REQUIRED: 'lab_required',
  COLLECTION_RECIPE: 'collection_recipe',
  BASIC_CRAFTING: 'basic_crafting',
  SPECIAL_EQUIPMENT: 'special_equipment'
} as const;

export type ValidationReasonType = typeof ValidationReason[keyof typeof ValidationReason];

export interface ManualCraftingValidation {
  canCraftManually: boolean;
  reason: ValidationReasonType;
  category: ValidationCategoryType;
  details?: string; // 可选的详细说明
}

export class ManualCraftingValidator implements IManualCraftingValidator {
  private static instance: ManualCraftingValidator;
  private dataService!: DataService;
  
  // 缓存机制 - 提升性能
  private validationCache: Map<string, ManualCraftingValidation> = new Map();
  private recipeValidationCache: Map<string, ManualCraftingValidation> = new Map();

  // 黑名单：明确不能手动制作的物品
  // 基于Factorio官方Wiki规则和游戏逻辑
  private readonly MANUAL_CRAFTING_BLACKLIST = [
    // 官方Wiki明确：必须使用装配机，不能手动制作
    'engine-unit',
    // 官方Wiki明确：需要火箭发射井，不能手动制作     
    'rocket-part',
    // 破碎机
    'crusher'   
  ];

  private constructor() {
    // 延迟初始化，避免循环依赖
    // dataService 将在需要时从 ServiceLocator 获取
    // 清除缓存，确保新的验证逻辑生效
    this.clearCache();
  }

  private getDataService(): DataService | null {
    if (!this.dataService && ServiceLocator.has(SERVICE_NAMES.DATA)) {
      this.dataService = ServiceLocator.get<DataService>(SERVICE_NAMES.DATA);
    }
    return this.dataService;
  }

  private getRecipeService(): RecipeService | null {
    if (ServiceLocator.has(SERVICE_NAMES.RECIPE)) {
      return ServiceLocator.get<RecipeService>(SERVICE_NAMES.RECIPE);
    }
    return null;
  }

  static getInstance(): ManualCraftingValidator {
    if (!ManualCraftingValidator.instance) {
      ManualCraftingValidator.instance = new ManualCraftingValidator();
    }
    return ManualCraftingValidator.instance;
  }

  /**
   * 清除缓存 - 当数据更新时调用
   */
  clearCache(): void {
    this.validationCache.clear();
    this.recipeValidationCache.clear();
  }

  /**
   * 判断物品是否可以手动采集
   * @param itemId 物品ID
   * @returns 验证结果
   */
  validateManualCrafting(itemId: string): ManualCraftingValidation {
    // 检查缓存
    if (this.validationCache.has(itemId)) {
      return this.validationCache.get(itemId)!;
    }

    const dataService = this.getDataService();
    if (!dataService) {
      return {
        canCraftManually: false,
        category: ValidationCategory.DATA_ERROR,
        reason: ValidationReason.DATA_SERVICE_UNAVAILABLE
      };
    }
    const item = dataService.getItem(itemId);
    if (!item) {
      const result = {
        canCraftManually: false,
        reason: ValidationReason.ITEM_NOT_FOUND,
        category: ValidationCategory.RESTRICTED
      };
      this.validationCache.set(itemId, result);
      return result;
    }

    // 特殊检查：Technology 物品不能手动制作
    if (item.category === 'technology') {
      const result = {
        canCraftManually: false,
        reason: ValidationReason.TECHNOLOGY_RECIPE,
        category: ValidationCategory.RESTRICTED
      };
      this.validationCache.set(itemId, result);
      return result;
    }

    // 获取物品的所有配方
    const recipeService = this.getRecipeService();
    const recipes = recipeService ? RecipeService.getRecipesThatProduce(itemId) : [];

    // 1. 检查是否为原材料（没有配方）
    if (recipes.length === 0) {
      const result = {
        canCraftManually: true,
        reason: ValidationReason.RAW_MATERIAL,
        category: ValidationCategory.RAW_MATERIAL
      };
      this.validationCache.set(itemId, result);
      return result;
    }

    // 2. 检查配方是否有限制
    for (const recipe of recipes) {
      const validation = this.validateRecipe(recipe);
      if (validation.canCraftManually) {
        const result = {
          canCraftManually: true,
          reason: ValidationReason.RECIPE_AVAILABLE,
          category: ValidationCategory.CRAFTABLE
        };
        this.validationCache.set(itemId, result);
        return result;
      }
    }

    const result = {
      canCraftManually: false,
      reason: ValidationReason.SPECIAL_EQUIPMENT,
      category: ValidationCategory.RESTRICTED
    };
    this.validationCache.set(itemId, result);
    return result;
  }

  /**
   * 验证单个配方是否可以手动制作
   * 基于Factorio官方Wiki规则 + 配方属性自动判断
   * @param recipe 配方
   * @returns 验证结果
   */
  public validateRecipe(recipe: Recipe): ManualCraftingValidation {
    // 使用配方ID作为缓存键
    const cacheKey = recipe.id;
    if (this.recipeValidationCache.has(cacheKey)) {
      return this.recipeValidationCache.get(cacheKey)!;
    }

    // 1. 检查输入输出是否包含流体 - 最高优先级，流体永远不能手动制作
    if (this.hasFluidInRecipe(recipe)) {
      const result = {
        canCraftManually: false,
        reason: ValidationReason.FLUID_INVOLVED,
        category: ValidationCategory.RESTRICTED
      };
      this.recipeValidationCache.set(cacheKey, result);
      return result;
    }

    // 2. 检查输出物品 - 黑名单和复杂设备检查
    if (recipe.out) {
      for (const itemId of Object.keys(recipe.out)) {
        // 检查黑名单
        if (this.MANUAL_CRAFTING_BLACKLIST.includes(itemId)) {
          const result = {
            canCraftManually: false,
            reason: ValidationReason.BLACKLISTED_ITEM,
            category: ValidationCategory.RESTRICTED
          };
          this.recipeValidationCache.set(cacheKey, result);
          return result;
        }
      }
    }

    // 3. 检查生产者类型 - 基于设备特征判断（优先级高于配方标志）
    if (recipe.producers && recipe.producers.length > 0) {
      const producerCheck = this.checkProducerRestrictions(recipe.producers);
      if (!producerCheck.canCraftManually) {
        this.recipeValidationCache.set(cacheKey, producerCheck);
        return producerCheck;
      }
    }

    // 4. 检查配方标志
    if (recipe.flags) {
      // 采矿配方 - 可以手动采集（但已排除流体和特殊设备限制）
      if (recipe.flags.includes('mining')) {
        const result = {
          canCraftManually: true,
          reason: ValidationReason.MINING_RECIPE,
          category: ValidationCategory.RAW_MATERIAL
        };
        this.recipeValidationCache.set(cacheKey, result);
        return result;
      }

      // 回收配方 - 需要回收设备，不能手动制作
      if (recipe.flags.includes('recycling')) {
        const result = {
          canCraftManually: false,
          reason: ValidationReason.RECYCLING_RECIPE,
          category: ValidationCategory.RESTRICTED
        };
        this.recipeValidationCache.set(cacheKey, result);
        return result;
      }

      // 研究配方 - 不能手动制作
      if (recipe.flags.includes('technology')) {
        const result = {
          canCraftManually: false,
          reason: ValidationReason.TECHNOLOGY_RECIPE,
          category: ValidationCategory.RESTRICTED
        };
        this.recipeValidationCache.set(cacheKey, result);
        return result;
      }

      // 种植配方 - 需要农业设备
      if (recipe.flags.includes('grow')) {
        const result = {
          canCraftManually: false,
          reason: ValidationReason.AGRICULTURE_RECIPE,
          category: ValidationCategory.RESTRICTED
        };
        this.recipeValidationCache.set(cacheKey, result);
        return result;
      }
    }

    // 5. 空输入配方 - 通常是采集类配方（流体已被排除）
    if (!recipe.in || Object.keys(recipe.in).length === 0) {
      const result = {
        canCraftManually: true,
        reason: ValidationReason.COLLECTION_RECIPE,
        category: ValidationCategory.RAW_MATERIAL
      };
      this.recipeValidationCache.set(cacheKey, result);
      return result;
    }

    // 6. 默认允许手动制作 - 基础制作配方
    const result = {
      canCraftManually: true,
      reason: ValidationReason.BASIC_CRAFTING,
      category: ValidationCategory.CRAFTABLE
    };
    this.recipeValidationCache.set(cacheKey, result);
    return result;
  }

  /**
   * 检查配方是否涉及流体（输入或输出）
   * 基于官方Wiki规则：任何涉及液体的配方都不能手动制作
   * @param recipe 配方
   * @returns 是否涉及流体
   */
  private hasFluidInRecipe(recipe: Recipe): boolean {
    // 检查输入和输出材料是否包含流体
    const checkItems = (items: Record<string, number>) => {
      for (const itemId of Object.keys(items)) {
        if (this.isFluidItem(itemId)) {
          return true;
        }
      }
      return false;
    };

    // 检查输入材料
    if (recipe.in && checkItems(recipe.in)) {
      return true;
    }

    // 检查输出产品
    if (recipe.out && checkItems(recipe.out)) {
      return true;
    }

    return false;
  }

  /**
   * 检查生产者限制
   * 基于设备类型特征自动判断
   * @param producers 生产者列表
   * @returns 验证结果
   */
  private checkProducerRestrictions(producers: string[]): ManualCraftingValidation {
    // 大型采矿机专用 - 不能手动采集
    // 根据Factorio Wiki：钨矿石等只能使用大型采矿机开采
    if (producers.includes('big-mining-drill') && producers.length === 1) {
      return {
        canCraftManually: false,
        reason: ValidationReason.SPECIAL_EQUIPMENT,
        category: ValidationCategory.RESTRICTED
      };
    }
    
    // 装配机类设备 - 这些设备通常表示物品可以手动制作或自动制作
    const assemblingMachines = producers.filter(p => 
      p.includes('assembling-machine') || p.includes('foundry')
    );
    
    // 如果只有装配机类设备，通常表示可以手动制作
    // 这符合Factorio中基础物品（传送带、插入机等）的制作规则
    if (assemblingMachines.length > 0 && assemblingMachines.length === producers.length) {
      return {
        canCraftManually: true,
        reason: ValidationReason.BASIC_CRAFTING,
        category: ValidationCategory.CRAFTABLE
      };
    }
    
    // 冶炼设备 - 官方Wiki明确：矿石必须在熔炉中冶炼
    const smeltingProducers = producers.filter(p => 
      p.includes('furnace') && !p.includes('foundry') // foundry已经在装配机类中处理
    );
    if (smeltingProducers.length > 0) {
      return {
        canCraftManually: false,
        reason: ValidationReason.SMELTING_REQUIRED,
        category: ValidationCategory.RESTRICTED
      };
    }

    // 特殊化工设备 - 不能手动制作
    const chemicalProducers = producers.filter(p => 
      ['chemical-plant', 'oil-refinery', 'centrifuge', 'cryogenic-plant'].includes(p)
    );
    if (chemicalProducers.length > 0) {
      return {
        canCraftManually: false,
        reason: ValidationReason.CHEMICAL_EQUIPMENT,
        category: ValidationCategory.RESTRICTED
      };
    }

    // 流体提取设备 - 不能手动制作
    const fluidProducers = producers.filter(p => 
      ['offshore-pump', 'pumpjack', 'water-pump'].includes(p)
    );
    if (fluidProducers.length > 0) {
      return {
        canCraftManually: false,
        reason: ValidationReason.FLUID_EXTRACTION,
        category: ValidationCategory.RESTRICTED
      };
    }

    // 回收设备 - 不能手动制作
    if (producers.includes('recycler')) {
      return {
        canCraftManually: false,
        reason: ValidationReason.RECYCLER_REQUIRED,
        category: ValidationCategory.RESTRICTED
      };
    }

    // 农业设备 - 不能手动制作
    if (producers.includes('agricultural-tower')) {
      return {
        canCraftManually: false,
        reason: ValidationReason.AGRICULTURE_EQUIPMENT,
        category: ValidationCategory.RESTRICTED
      };
    }

    // 实验室设备 - 不能手动制作
    if (producers.includes('lab')) {
      return {
        canCraftManually: false,
        reason: ValidationReason.LAB_REQUIRED,
        category: ValidationCategory.RESTRICTED
      };
    }

    // 生物室设备 - 不能手动制作
    if (producers.includes('biochamber')) {
      return {
        canCraftManually: false,
        reason: ValidationReason.SPECIAL_EQUIPMENT,
        category: ValidationCategory.RESTRICTED
      };
    }

    // 俘虏虫族生成器 - 不能手动制作
    if (producers.includes('captive-biter-spawner')) {
      return {
        canCraftManually: false,
        reason: ValidationReason.SPECIAL_EQUIPMENT,
        category: ValidationCategory.RESTRICTED
      };
    }

    // 星岩抓取臂 - 特殊的太空采集设备，不能手动制作
    if (producers.includes('asteroid-collector')) {
      return {
        canCraftManually: false,
        reason: ValidationReason.SPECIAL_EQUIPMENT,
        category: ValidationCategory.RESTRICTED
      };
    }

    // 破碎机 - 特殊的太空处理设备，不能手动制作
    if (producers.includes('crusher')) {
      return {
        canCraftManually: false,
        reason: ValidationReason.SPECIAL_EQUIPMENT,
        category: ValidationCategory.RESTRICTED
      };
    }

    // 腐败转化器 - 生物过程，不能手动制作
    if (producers.includes('spoilage')) {
      return {
        canCraftManually: false,
        reason: ValidationReason.SPECIAL_EQUIPMENT,
        category: ValidationCategory.RESTRICTED
      };
    }

    // 装配机配方 - 根据Factorio规则，基础物品可以手动制作
    // 这里不做限制，让后续逻辑处理
    return {
      canCraftManually: true,
      reason: ValidationReason.BASIC_CRAFTING,
      category: ValidationCategory.CRAFTABLE
    };
  }



  /**
   * 判断物品是否为流体
   * 基于物品分类准确识别，无需维护模式列表
   * @param itemId 物品ID
   * @returns 是否为流体
   */
  private isFluidItem(itemId: string): boolean {
    const dataService = this.getDataService();
    if (!dataService) return false;
    
    const item = dataService.getItem(itemId);
    if (!item) return false;
    
    // 基于分类判断 - 这是最准确的方法
    return item.category === 'fluids';
  }

  /**
   * 获取可手动采集的物品列表
   * @returns 可手动采集的物品ID列表
   */
  getManualCraftableItems(): string[] {
    return this.filterItemsByCondition(item => {
      const validation = this.validateManualCrafting(item.id);
      return validation.canCraftManually;
    });
  }

  /**
   * 获取原材料物品列表（无配方物品）
   * @returns 原材料物品ID列表
   */
  getRawMaterials(): string[] {
    return this.filterItemsByCondition(item => {
      const recipeService = this.getRecipeService();
    const recipes = recipeService ? RecipeService.getRecipesThatProduce(item.id) : [];
      return recipes.length === 0;
    });
  }

  /**
   * 通用物品过滤方法
   * @param condition 过滤条件函数
   * @returns 符合条件的物品ID列表
   */
  private filterItemsByCondition(condition: (item: import('../types').Item) => boolean): string[] {
    const dataService = this.getDataService();
    if (!dataService) return [];
    
    const allItems = dataService.getAllItems();
    const filteredItems: string[] = [];

    for (const item of allItems) {
      if (condition(item)) {
        filteredItems.push(item.id);
      }
    }

    return filteredItems;
  }

  /**
   * 获取采矿类物品列表
   * @returns 采矿物品ID列表
   */
  getMiningItems(): string[] {
    const recipeService = this.getRecipeService();
    const allRecipes = recipeService ? RecipeService.getAllRecipes() : [];
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

  // 添加缺失的方法
  isEntityMiningRecipe(recipe: Recipe): boolean {
    return recipe.flags?.includes('mining') || false;
  }
}

export default ManualCraftingValidator;

/**
 * 国际化工具函数 - 将验证原因转换为本地化文本
 * @param reason 验证原因
 * @param locale 语言代码，默认为 'zh'
 * @returns 本地化文本
 */
export function getValidationReasonText(reason: ValidationReasonType, locale: string = 'zh'): string {
  const reasonTexts: Record<string, Record<ValidationReasonType, string>> = {
    zh: {
      [ValidationReason.ITEM_NOT_FOUND]: '物品不存在',
      [ValidationReason.RAW_MATERIAL]: '原材料，可直接采集',
      [ValidationReason.RECIPE_AVAILABLE]: '可通过配方手动制作',
      [ValidationReason.FLUID_INVOLVED]: '配方涉及流体，无法手动制作',
      [ValidationReason.BLACKLISTED_ITEM]: '黑名单物品，无法手动制作',
      [ValidationReason.COMPLEX_MACHINE]: '复杂机械设备，无法手动制作',
      [ValidationReason.MINING_RECIPE]: '采矿配方，可手动采集',
      [ValidationReason.RECYCLING_RECIPE]: '回收配方，需要回收设备',
      [ValidationReason.TECHNOLOGY_RECIPE]: '研究配方，需要实验室',
      [ValidationReason.AGRICULTURE_RECIPE]: '农业配方，需要农业设备',
      [ValidationReason.SMELTING_REQUIRED]: '冶炼配方，必须使用熔炉',
      [ValidationReason.CHEMICAL_EQUIPMENT]: '化工配方，需要特殊设备',
      [ValidationReason.FLUID_EXTRACTION]: '流体提取，需要专用设备',
      [ValidationReason.RECYCLER_REQUIRED]: '回收配方，需要回收设备',
      [ValidationReason.AGRICULTURE_EQUIPMENT]: '农业配方，需要农业设备',
      [ValidationReason.LAB_REQUIRED]: '研究配方，需要实验室',
      [ValidationReason.COLLECTION_RECIPE]: '采集类配方，可手动操作',
      [ValidationReason.BASIC_CRAFTING]: '基础制作配方，可手动制作',
      [ValidationReason.SPECIAL_EQUIPMENT]: '需要特殊设备制作',
      [ValidationReason.DATA_SERVICE_UNAVAILABLE]: '数据服务不可用'
    },
    en: {
      [ValidationReason.ITEM_NOT_FOUND]: 'Item not found',
      [ValidationReason.RAW_MATERIAL]: 'Raw material, can be collected directly',
      [ValidationReason.RECIPE_AVAILABLE]: 'Can be crafted manually via recipe',
      [ValidationReason.FLUID_INVOLVED]: 'Recipe involves fluids, cannot be crafted manually',
      [ValidationReason.BLACKLISTED_ITEM]: 'Blacklisted item, cannot be crafted manually',
      [ValidationReason.COMPLEX_MACHINE]: 'Complex mechanical device, cannot be crafted manually',
      [ValidationReason.MINING_RECIPE]: 'Mining recipe, can be collected manually',
      [ValidationReason.RECYCLING_RECIPE]: 'Recycling recipe, requires recycling equipment',
      [ValidationReason.TECHNOLOGY_RECIPE]: 'Research recipe, requires laboratory',
      [ValidationReason.AGRICULTURE_RECIPE]: 'Agriculture recipe, requires agriculture equipment',
      [ValidationReason.SMELTING_REQUIRED]: 'Smelting recipe, must use furnace',
      [ValidationReason.CHEMICAL_EQUIPMENT]: 'Chemical recipe, requires special equipment',
      [ValidationReason.FLUID_EXTRACTION]: 'Fluid extraction, requires dedicated equipment',
      [ValidationReason.RECYCLER_REQUIRED]: 'Recycling recipe, requires recycling equipment',
      [ValidationReason.AGRICULTURE_EQUIPMENT]: 'Agriculture recipe, requires agriculture equipment',
      [ValidationReason.LAB_REQUIRED]: 'Research recipe, requires laboratory',
      [ValidationReason.COLLECTION_RECIPE]: 'Collection recipe, can be operated manually',
      [ValidationReason.BASIC_CRAFTING]: 'Basic crafting recipe, can be crafted manually',
      [ValidationReason.SPECIAL_EQUIPMENT]: 'Requires special equipment to craft',
      [ValidationReason.DATA_SERVICE_UNAVAILABLE]: 'Data service unavailable'
    }
  };

  return reasonTexts[locale]?.[reason] || reasonTexts.zh[reason] || reason;
}

/**
 * 获取验证类别的本地化文本
 * @param category 验证类别
 * @param locale 语言代码，默认为 'zh'
 * @returns 本地化文本
 */
export function getValidationCategoryText(category: ValidationCategoryType, locale: string = 'zh'): string {
  const categoryTexts: Record<string, Record<ValidationCategoryType, string>> = {
    zh: {
      [ValidationCategory.RAW_MATERIAL]: '原材料',
      [ValidationCategory.CRAFTABLE]: '可制作',
      [ValidationCategory.RESTRICTED]: '受限制',
      [ValidationCategory.DATA_ERROR]: '数据错误'
    },
    en: {
      [ValidationCategory.RAW_MATERIAL]: 'Raw Material',
      [ValidationCategory.CRAFTABLE]: 'Craftable',
      [ValidationCategory.RESTRICTED]: 'Restricted',
      [ValidationCategory.DATA_ERROR]: 'Data Error'
    }
  };

  return categoryTexts[locale]?.[category] || categoryTexts.zh[category] || category;
} 