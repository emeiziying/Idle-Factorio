import { Facility, FACILITY_TYPES } from '../types/facilities';
import { GameData, Recipe } from '../types';

class FacilityService {
  private facilities: Map<string, Facility[]> = new Map(); // itemId -> facilities
  private recipes: Recipe[] = [];
  private gameData: GameData | null = null;

  // 初始化设施数据
  initialize(gameData: GameData) {
    this.gameData = gameData;
    this.recipes = gameData.recipes || [];
    
    // 初始化一些示例设施
    this.initializeSampleFacilities();
  }

  // 初始化示例设施
  private initializeSampleFacilities() {
    if (!this.gameData) return;
    
    // 基于配方数据自动创建设施
    this.recipes.forEach(recipe => {
      // 获取配方的主要产出物品
      const mainProduct = Object.keys(recipe.out)[0];
      if (!mainProduct) return;
      
      // 根据配方类别创建合适的设施
      const facilityType = this.getDefaultFacilityForRecipe(recipe);
      if (!facilityType) return;
      
      const facilityTemplate = FACILITY_TYPES[facilityType];
      if (!facilityTemplate) return;
      
      // 计算基础输入输出率
      const craftTime = recipe.time || 0.5;
      const baseInputRate: Record<string, number> = {};
      for (const [item, amount] of Object.entries(recipe.in)) {
        baseInputRate[item] = amount / craftTime;
      }
      const baseOutputRate = (recipe.out[mainProduct] || 1) / craftTime;
      
      // 创建设施
      this.addFacility(mainProduct, {
        id: `${mainProduct}-facility-1`,
        itemId: mainProduct,
        type: facilityType,
        category: facilityTemplate.category,
        count: 1, // 默认1台设施
        baseSpeed: facilityTemplate.baseSpeed,
        baseInputRate,
        baseOutputRate,
        powerType: facilityTemplate.powerType,
        powerConsumption: facilityTemplate.powerConsumption,
        recipeId: recipe.id,
        canProduce: [mainProduct],
      });
    });
    
    // 为采矿物品创建采矿设施
    const miningItems = ['iron-ore', 'copper-ore', 'coal', 'stone'];
    miningItems.forEach(itemId => {
      const item = this.gameData?.items.find(i => i.id === itemId);
      if (!item) return;
      
      this.addFacility(itemId, {
        id: `${itemId}-mining-1`,
        itemId: itemId,
        type: 'electric-mining-drill',
        category: 'mining',
        count: itemId === 'iron-ore' ? 3 : itemId === 'copper-ore' ? 2 : 1,
        baseSpeed: 0.5,
        baseInputRate: {},
        baseOutputRate: 0.5,
        powerType: 'electric',
        powerConsumption: 90,
        canProduce: [itemId],
      });
    });
  }
  
  // 根据配方获取默认设施类型
  private getDefaultFacilityForRecipe(recipe: Recipe): string | null {
    switch (recipe.category) {
      case 'smelting':
        return 'electric-furnace';
      case 'crafting':
        return 'assembling-machine-2';
      case 'advanced-crafting':
        return 'assembling-machine-3';
      case 'chemistry':
        return 'chemical-plant';
      case 'oil-processing':
        return 'oil-refinery';
      default:
        return null;
    }
  }

  // 添加设施
  addFacility(itemId: string, facility: Facility) {
    if (!this.facilities.has(itemId)) {
      this.facilities.set(itemId, []);
    }
    this.facilities.get(itemId)!.push(facility);
  }

  // 获取物品的生产设施
  getFacilitiesForItem(itemId: string): Facility[] {
    return this.facilities.get(itemId) || [];
  }

  // 获取设施类型信息
  getFacilityType(typeId: string) {
    return FACILITY_TYPES[typeId] || null;
  }

  // 计算设施的实际产能（考虑基础速度和设施数量）
  calculateFacilityProduction(facility: Facility): {
    inputRate: Record<string, number>;
    outputRate: number;
  } {
    const totalSpeed = facility.baseSpeed * facility.count;
    
    // 计算输入需求
    const inputRate: Record<string, number> = {};
    for (const [item, rate] of Object.entries(facility.baseInputRate)) {
      inputRate[item] = rate * totalSpeed;
    }
    
    // 计算输出速率
    const outputRate = facility.baseOutputRate * totalSpeed;
    
    return { inputRate, outputRate };
  }

  // 根据配方获取可能的生产设施类型
  getFacilityTypesForRecipe(recipeId: string): string[] {
    const recipe = this.recipes.find(r => r.id === recipeId);
    if (!recipe) return [];
    
    // 根据配方类别返回合适的设施类型
    switch (recipe.category) {
      case 'smelting':
        return ['stone-furnace', 'steel-furnace', 'electric-furnace'];
      case 'crafting':
      case 'advanced-crafting':
        return ['assembling-machine-1', 'assembling-machine-2', 'assembling-machine-3'];
      case 'chemistry':
        return ['chemical-plant'];
      case 'oil-processing':
        return ['oil-refinery'];
      default:
        return [];
    }
  }

  // 获取物品的配方
  getRecipeForItem(itemId: string): Recipe | null {
    return this.recipes.find(r => r.out[itemId]) || null;
  }

  // 更新设施数量
  updateFacilityCount(facilityId: string, newCount: number) {
    for (const facilities of this.facilities.values()) {
      const facility = facilities.find(f => f.id === facilityId);
      if (facility) {
        facility.count = Math.max(0, newCount);
        break;
      }
    }
  }

  // 获取所有设施的总览
  getAllFacilities(): Facility[] {
    const allFacilities: Facility[] = [];
    for (const facilities of this.facilities.values()) {
      allFacilities.push(...facilities);
    }
    return allFacilities;
  }

  // 计算物品的总产能
  getTotalProductionForItem(itemId: string): number {
    const facilities = this.getFacilitiesForItem(itemId);
    let totalProduction = 0;
    
    for (const facility of facilities) {
      const { outputRate } = this.calculateFacilityProduction(facility);
      totalProduction += outputRate;
    }
    
    return totalProduction;
  }

  // 计算物品的总消耗
  getTotalConsumptionForItem(itemId: string): number {
    let totalConsumption = 0;
    
    // 遍历所有设施，查找消耗该物品的设施
    for (const facilities of this.facilities.values()) {
      for (const facility of facilities) {
        const { inputRate } = this.calculateFacilityProduction(facility);
        if (inputRate[itemId]) {
          totalConsumption += inputRate[itemId];
        }
      }
    }
    
    return totalConsumption;
  }
}

export const facilityService = new FacilityService();