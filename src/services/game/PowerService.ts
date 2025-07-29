/**
 * 电力系统服务（重构版）
 * 使用 BaseService 架构
 */
import { BaseService } from '../base/BaseService';
import type { FacilityInstance } from '../../types/facilities';
import { FacilityStatus } from '../../types/facilities';
import type { DataService } from '../core/DataService';
import type { GameConfig } from '../GameConfig';
import { ServiceLocator } from '../ServiceLocator';

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

/**
 * 电力系统服务类
 * 负责电力平衡计算和设施效率管理
 */
export class PowerService extends BaseService {
  protected declare dataService?: DataService;
  protected gameConfig?: GameConfig;
  
  // 发电设施ID
  private readonly POWER_GENERATORS = [
    'steam-engine',
    'steam-turbine', 
    'solar-panel',
    'accumulator'
  ];
  
  // 发电设施类型标识
  private readonly GENERATOR_TYPES = [
    'steam-engine', 'steam-turbine', 'solar-panel', 'accumulator'
  ];
  
  constructor() {
    super();
    this.serviceName = 'PowerService';
    this.dependencies = ['DataService', 'GameConfig'];
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    // 获取依赖服务
    this.dataService = ServiceLocator.get<DataService>('DataService');
    this.gameConfig = ServiceLocator.get<GameConfig>('GameConfig');
  }
  
  /**
   * 计算电力平衡
   */
  calculatePowerBalance(facilities: FacilityInstance[]): PowerBalance {
    return this.safe(() => {
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
      
      // 判断状态（使用配置的阈值）
      const constants = this.gameConfig!.getConstants();
      let status: 'surplus' | 'balanced' | 'deficit';
      if (generation.capacity > consumption.demand * (constants.power.surplusThreshold / 100)) {
        status = 'surplus';
      } else if (generation.capacity >= consumption.demand * (constants.power.balancedThreshold / 100)) {
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
    }, 'calculatePowerBalance', {
      generationCapacity: 0,
      actualGeneration: 0,
      generationByType: {},
      consumptionDemand: 0,
      actualConsumption: 0,
      consumptionByCategory: {},
      satisfactionRatio: 0,
      status: 'deficit'
    });
  }
  
  /**
   * 更新设施的电力状态和效率
   */
  updateFacilityPowerStatus(
    facility: FacilityInstance, 
    powerBalance: PowerBalance
  ): FacilityInstance {
    return this.safe(() => {
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
    }, 'updateFacilityPowerStatus', facility);
  }
  
  /**
   * 获取设施的电力需求
   */
  getFacilityPowerDemand(facility: FacilityInstance): number {
    return this.safe(() => {
      if (facility.status === FacilityStatus.STOPPED) {
        return 0;
      }
      
      const itemData = this.dataService!.getItem(facility.facilityId);
      if (!itemData || !itemData.machine) {
        return 0;
      }
      
      const machine = itemData.machine;
      
      // 检查是否需要电力
      if (machine.type !== 'electric') {
        return 0;
      }
      
      // 返回功率需求（已经是kW单位）
      return (machine.usage || 0) * facility.count;
    }, 'getFacilityPowerDemand', 0);
  }
  
  /**
   * 获取设施的电力信息
   */
  getFacilityPowerInfo(
    facility: FacilityInstance, 
    powerBalance: PowerBalance
  ): FacilityPowerInfo {
    return this.safe(() => {
      const powerDemand = this.getFacilityPowerDemand(facility);
      const powerAllocated = powerDemand * powerBalance.satisfactionRatio;
      
      return {
        facilityId: facility.facilityId,
        powerDemand,
        powerAllocated,
        efficiency: facility.efficiency
      };
    }, 'getFacilityPowerInfo', {
      facilityId: facility.facilityId,
      powerDemand: 0,
      powerAllocated: 0,
      efficiency: 0
    });
  }
  
  /**
   * 检查设施是否是发电设施
   */
  isPowerGenerator(facilityId: string): boolean {
    return this.safe(() => {
      // 先检查硬编码的发电设施列表
      if (this.POWER_GENERATORS.includes(facilityId)) {
        return true;
      }
      
      // 然后检查是否是锅炉或其他发电设施
      const itemData = this.dataService!.getItem(facilityId);
      if (!itemData || !itemData.machine) {
        return false;
      }
      
      const machine = itemData.machine;
      
      // 检查是否是锅炉（产生蒸汽但本身是burner类型）
      if (machine.entityType === 'boiler' && machine.type === 'burner') {
        return false; // 锅炉不直接发电
      }
      
      // 检查是否包含发电类型标识
      return this.GENERATOR_TYPES.some(type => 
        facilityId.includes(type) || machine.entityType === type
      );
    }, 'isPowerGenerator', false);
  }
  
  /**
   * 检查设施是否是耗电设施
   */
  isPowerConsumer(facilityId: string): boolean {
    return this.safe(() => {
      const itemData = this.dataService!.getItem(facilityId);
      if (!itemData || !itemData.machine) {
        return false;
      }
      
      const machine = itemData.machine;
      
      // electric类型的设施耗电
      if (machine.type === 'electric') {
        return true;
      }
      
      // burner类型不耗电
      if (machine.type === 'burner') {
        return false;
      }
      
      // furnace类型的电炉也耗电
      if (machine.type === 'furnace' && facilityId.includes('electric')) {
        return true;
      }
      
      return false;
    }, 'isPowerConsumer', false);
  }
  
  /**
   * 计算发电能力
   */
  private calculateGeneration(facilities: FacilityInstance[]): {
    capacity: number;
    byType: Record<string, number>;
  } {
    const byType: Record<string, number> = {};
    let totalCapacity = 0;
    
    facilities.forEach(facility => {
      if (this.isPowerGenerator(facility.facilityId) && 
          facility.status !== FacilityStatus.STOPPED) {
        const power = this.getGeneratorPower(facility);
        byType[facility.facilityId] = (byType[facility.facilityId] || 0) + power;
        totalCapacity += power;
      }
    });
    
    return { capacity: totalCapacity, byType };
  }
  
  /**
   * 计算耗电需求
   */
  private calculateConsumption(facilities: FacilityInstance[]): {
    demand: number;
    byCategory: Record<string, number>;
  } {
    const byCategory: Record<string, number> = {};
    let totalDemand = 0;
    
    facilities.forEach(facility => {
      const demand = this.getFacilityPowerDemand(facility);
      if (demand > 0) {
        const category = this.getFacilityCategory(facility.facilityId);
        byCategory[category] = (byCategory[category] || 0) + demand;
        totalDemand += demand;
      }
    });
    
    return { demand: totalDemand, byCategory };
  }
  
  /**
   * 获取发电设施的发电量
   */
  private getGeneratorPower(facility: FacilityInstance): number {
    const itemData = this.dataService!.getItem(facility.facilityId);
    if (!itemData || !itemData.machine) {
      return 0;
    }
    
    // 蒸汽机和涡轮机
    if (facility.facilityId === 'steam-engine' || facility.facilityId === 'steam-turbine') {
      // 使用固定值或从配置获取
      const basePower = facility.facilityId === 'steam-engine' ? 900 : 5800; // kW
      return basePower * facility.count * facility.efficiency;
    }
    
    // 太阳能板
    if (facility.facilityId === 'solar-panel') {
      // 太阳能板的发电量可能需要考虑昼夜循环
      const basePower = 60; // 60kW
      const constants = this.gameConfig?.getConstants();
      const dayRatio = constants?.power.solarPanelDayRatio || 0.42;
      return basePower * facility.count * dayRatio;
    }
    
    // 蓄电池
    if (facility.facilityId === 'accumulator') {
      // 蓄电池根据储能状态输出电力
      const basePower = 300; // 300kW
      return basePower * facility.count * facility.efficiency;
    }
    
    return 0;
  }
  
  /**
   * 获取设施分类
   */
  private getFacilityCategory(facilityId: string): string {
    const itemData = this.dataService!.getItem(facilityId);
    if (!itemData) {
      return 'other';
    }
    
    // 使用物品的category字段
    return itemData.category || 'other';
  }

  // ========== 服务信息 ==========

  getServiceInfo() {
    return {
      ...super.getServiceInfo(),
      storageKeys: ['power_settings']
    };
  }

  async healthCheck() {
    const isHealthy = !!this.dataService && !!this.gameConfig;
    return {
      healthy: isHealthy,
      message: isHealthy ? 'Service is running' : 'Dependencies not loaded'
    };
  }

  /**
   * 获取设施的发电量（向后兼容方法）
   */
  getFacilityPowerGeneration(facility: FacilityInstance, _steamSupply?: number): number {
    return this.safe(() => {
      if (facility.status !== FacilityStatus.RUNNING) {
        return 0;
      }
      
      if (!this.isPowerGenerator(facility.facilityId)) {
        return 0;
      }
      
      return this.getGeneratorPower(facility);
    }, 'getFacilityPowerGeneration', 0);
  }

  /**
   * 获取电力优先级建议
   */
  getPowerPriorityRecommendations(
    _facilities: FacilityInstance[],
    powerBalance: PowerBalance
  ): string[] {
    return this.safe(() => {
      if (powerBalance.status !== 'deficit') {
        return [];
      }
      
      const recommendations: string[] = [];
      
      // 建议增加发电
      const deficit = powerBalance.consumptionDemand - powerBalance.generationCapacity;
      const steamEnginePower = 900; // 蒸汽机功率
      const steamEnginesNeeded = Math.ceil(deficit / steamEnginePower);
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
    }, 'getPowerPriorityRecommendations', []);
  }
}

// 导出单例实例以保持向后兼容
export const powerService = PowerService.getInstance();