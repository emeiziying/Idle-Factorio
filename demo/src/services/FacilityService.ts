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
    // 铁矿开采
    this.addFacility('iron-ore', {
      id: 'iron-ore-mining-1',
      itemId: 'iron-ore',
      type: 'electric-mining-drill',
      category: 'mining',
      count: 3,
      baseSpeed: 0.5,
      baseInputRate: {}, // 采矿不需要输入
      baseOutputRate: 0.5, // 每秒0.5个铁矿
      powerType: 'electric',
      powerConsumption: 90,
      canProduce: ['iron-ore'],
    });

    // 铜矿开采
    this.addFacility('copper-ore', {
      id: 'copper-ore-mining-1',
      itemId: 'copper-ore',
      type: 'electric-mining-drill',
      category: 'mining',
      count: 2,
      baseSpeed: 0.5,
      baseInputRate: {},
      baseOutputRate: 0.5,
      powerType: 'electric',
      powerConsumption: 90,
      canProduce: ['copper-ore'],
    });

    // 铁板冶炼
    this.addFacility('iron-plate', {
      id: 'iron-plate-smelting-1',
      itemId: 'iron-plate',
      type: 'electric-furnace',
      category: 'smelting',
      count: 2,
      baseSpeed: 2,
      baseInputRate: { 'iron-ore': 1 }, // 每秒1个铁矿
      baseOutputRate: 1, // 每秒1个铁板
      powerType: 'electric',
      powerConsumption: 180,
      recipeId: 'iron-plate',
      canProduce: ['iron-plate'],
    });
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