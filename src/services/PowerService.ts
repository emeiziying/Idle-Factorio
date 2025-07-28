// 电力系统服务 - 管理电力平衡和设施效率

import type { FacilityInstance } from '../types/facilities';
import { FacilityStatus } from '../types/facilities';
import { DataService } from './DataService';

export interface PowerBalance {
  // 发电能力
  generationCapacity: number;     // 最大发电能力 (kW)
  actualGeneration: number;       // 实际发电量 (kW)
  generationByType: Record<string, number>;
  
  // 耗电需求
  consumptionDemand: number;      // 总耗电需求 (kW)
  actualConsumption: number;      // 实际耗电量 (kW)
  consumptionByCategory: Record<string, number>;
  
  // 平衡状态
  satisfactionRatio: number;      // 满足率 (0-1)
  status: 'surplus' | 'balanced' | 'deficit';
}

export interface FacilityPowerInfo {
  facilityId: string;
  powerDemand: number;
  powerAllocated: number;
  efficiency: number;
}

export class PowerService {
  private static instance: PowerService;
  private dataService: DataService;
  
  // 发电设施ID
  private readonly POWER_GENERATORS = [
    'steam-engine',
    'steam-turbine', 
    'solar-panel',
    'accumulator'
  ];
  
  // 发电设施的基础功率 (kW)
  private readonly GENERATOR_POWER: Record<string, number> = {
    'steam-engine': 900,        // 900 kW
    'steam-turbine': 5800,      // 5.8 MW
    'solar-panel': 60,          // 60 kW (白天)
    'accumulator': 300          // 300 kW (放电)
  };
  
  // 耗电设施的基础功率 (kW)
  private readonly CONSUMER_POWER: Record<string, number> = {
    'electric-mining-drill': 90,      // 90 kW
    'electric-furnace': 180,          // 180 kW
    'assembling-machine-1': 75,       // 75 kW
    'assembling-machine-2': 150,      // 150 kW
    'assembling-machine-3': 375,      // 375 kW
    'chemical-plant': 210,            // 210 kW
    'oil-refinery': 420,              // 420 kW
    'lab': 60,                        // 60 kW
    'centrifuge': 350,                // 350 kW
    'beacon': 480                     // 480 kW
  };
  
  private constructor() {
    this.dataService = DataService.getInstance();
  }
  
  static getInstance(): PowerService {
    if (!PowerService.instance) {
      PowerService.instance = new PowerService();
    }
    return PowerService.instance;
  }
  
  /**
   * 计算电力平衡
   */
  calculatePowerBalance(facilities: FacilityInstance[]): PowerBalance {
    // 计算发电能力
    const generation = this.calculateGeneration(facilities);
    
    // 计算耗电需求
    const consumption = this.calculateConsumption(facilities);
    
    // 计算满足率
    const satisfactionRatio = generation.capacity > 0 
      ? Math.min(1, generation.capacity / consumption.demand)
      : 0;
    
    // 实际发电量 = min(发电能力, 耗电需求)
    const actualGeneration = Math.min(generation.capacity, consumption.demand);
    
    // 实际耗电量 = min(耗电需求, 发电能力)
    const actualConsumption = Math.min(consumption.demand, generation.capacity);
    
    // 判断状态
    let status: 'surplus' | 'balanced' | 'deficit';
    if (generation.capacity > consumption.demand * 1.1) {
      status = 'surplus';
    } else if (generation.capacity >= consumption.demand * 0.95) {
      status = 'balanced';
    } else {
      status = 'deficit';
    }
    
    return {
      generationCapacity: generation.capacity,
      actualGeneration,
      generationByType: generation.byType,
      consumptionDemand: consumption.demand,
      actualConsumption,
      consumptionByCategory: consumption.byCategory,
      satisfactionRatio,
      status
    };
  }
  
  /**
   * 更新设施的电力状态和效率
   */
  updateFacilityPowerStatus(
    facility: FacilityInstance, 
    powerBalance: PowerBalance
  ): FacilityInstance {
    const updatedFacility = { ...facility };
    
    // 检查是否是耗电设施
    const powerDemand = this.getFacilityPowerDemand(facility);
    if (powerDemand === 0) {
      // 非耗电设施，保持原效率
      return updatedFacility;
    }
    
    // 根据电力满足率调整效率
    if (powerBalance.satisfactionRatio >= 1) {
      // 电力充足
      updatedFacility.efficiency = 1.0;
      if (updatedFacility.status === FacilityStatus.NO_POWER) {
        updatedFacility.status = FacilityStatus.RUNNING;
      }
    } else if (powerBalance.satisfactionRatio > 0) {
      // 电力不足，降低效率
      updatedFacility.efficiency = powerBalance.satisfactionRatio;
      // 保持运行状态，但效率降低
      if (updatedFacility.status === FacilityStatus.NO_POWER) {
        updatedFacility.status = FacilityStatus.RUNNING;
      }
    } else {
      // 完全没电
      updatedFacility.efficiency = 0;
      updatedFacility.status = FacilityStatus.NO_POWER;
    }
    
    return updatedFacility;
  }
  
  /**
   * 获取设施的电力需求
   */
  getFacilityPowerDemand(facility: FacilityInstance): number {
    if (facility.status === FacilityStatus.STOPPED) {
      return 0;
    }
    
    const basePower = this.CONSUMER_POWER[facility.facilityId] || 0;
    return basePower * facility.count;
  }
  
  /**
   * 获取设施的发电量
   */
  getFacilityPowerGeneration(facility: FacilityInstance): number {
    if (facility.status !== FacilityStatus.RUNNING) {
      return 0;
    }
    
    const basePower = this.GENERATOR_POWER[facility.facilityId] || 0;
    
    // 特殊处理太阳能板（考虑昼夜）
    if (facility.facilityId === 'solar-panel') {
      // 简化：假设白天70%时间，平均发电量
      return basePower * facility.count * 0.7;
    }
    
    // 蒸汽机和汽轮机需要有蒸汽供应
    if (facility.facilityId === 'steam-engine' || facility.facilityId === 'steam-turbine') {
      // 这里应该检查蒸汽供应，暂时假设满负荷运行
      return basePower * facility.count * facility.efficiency;
    }
    
    return basePower * facility.count;
  }
  
  /**
   * 计算总发电能力
   */
  private calculateGeneration(facilities: FacilityInstance[]): {
    capacity: number;
    byType: Record<string, number>;
  } {
    const byType: Record<string, number> = {};
    let totalCapacity = 0;
    
    facilities
      .filter(f => this.POWER_GENERATORS.includes(f.facilityId))
      .forEach(facility => {
        const power = this.getFacilityPowerGeneration(facility);
        byType[facility.facilityId] = (byType[facility.facilityId] || 0) + power;
        totalCapacity += power;
      });
    
    return { capacity: totalCapacity, byType };
  }
  
  /**
   * 计算总耗电需求
   */
  private calculateConsumption(facilities: FacilityInstance[]): {
    demand: number;
    byCategory: Record<string, number>;
  } {
    const byCategory: Record<string, number> = {
      mining: 0,
      smelting: 0,
      crafting: 0,
      chemical: 0,
      research: 0,
      other: 0
    };
    
    let totalDemand = 0;
    
    facilities.forEach(facility => {
      const demand = this.getFacilityPowerDemand(facility);
      if (demand === 0) return;
      
      // 分类统计
      const category = this.getFacilityCategory(facility.facilityId);
      byCategory[category] = (byCategory[category] || 0) + demand;
      totalDemand += demand;
    });
    
    return { demand: totalDemand, byCategory };
  }
  
  /**
   * 获取设施类别
   */
  private getFacilityCategory(facilityId: string): string {
    if (facilityId.includes('mining-drill')) return 'mining';
    if (facilityId.includes('furnace')) return 'smelting';
    if (facilityId.includes('assembling-machine')) return 'crafting';
    if (facilityId.includes('chemical') || facilityId.includes('refinery')) return 'chemical';
    if (facilityId.includes('lab')) return 'research';
    return 'other';
  }
  
  /**
   * 获取电力优先级建议
   */
  getPowerPriorityRecommendations(
    facilities: FacilityInstance[],
    powerBalance: PowerBalance
  ): string[] {
    if (powerBalance.status !== 'deficit') {
      return [];
    }
    
    const recommendations: string[] = [];
    
    // 建议增加发电
    const deficit = powerBalance.consumptionDemand - powerBalance.generationCapacity;
    const steamEnginesNeeded = Math.ceil(deficit / this.GENERATOR_POWER['steam-engine']);
    recommendations.push(`需要增加 ${steamEnginesNeeded} 台蒸汽机或等效发电设施`);
    
    // 建议关闭低优先级设施
    if (powerBalance.consumptionByCategory.research > 0) {
      recommendations.push('可以暂时关闭研究设施以节省电力');
    }
    
    // 建议优化
    if (powerBalance.satisfactionRatio < 0.5) {
      recommendations.push('电力严重不足，生产效率仅为 ' + (powerBalance.satisfactionRatio * 100).toFixed(0) + '%');
    }
    
    return recommendations;
  }
}

export default PowerService;