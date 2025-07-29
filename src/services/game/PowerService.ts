// 电力系统服务 - 管理电力平衡和设施效率

import { BaseService } from '../base/BaseService';
import { CacheManager } from '../base/CacheManager';
import { ServiceLocator, SERVICE_NAMES } from '../utils/ServiceLocator';
import type { DataService } from '../core/DataService';
import type { FacilityInstance } from '../../types/facilities';
import { FacilityStatus } from '../../types/facilities';

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

export interface PowerStats {
  totalGenerators: number;
  totalConsumers: number;
  avgEfficiency: number;
  powerUtilization: number;
}

export class PowerService extends BaseService {
  private powerBalanceCache = new CacheManager<string, PowerBalance>();
  private facilityPowerCache = new CacheManager<string, FacilityPowerInfo>();
  

  
  // 发电设施类型标识
  private readonly GENERATOR_TYPES = [
    'steam-engine', 'steam-turbine', 'solar-panel', 'accumulator'
  ];

  protected constructor() {
    super();
    this.initializeDependencies();
  }

  /**
   * 计算电力平衡
   */
  calculatePowerBalance(facilities: FacilityInstance[]): PowerBalance {
    try {
      const cacheKey = this.generateFacilitiesHash(facilities);
      const cached = this.powerBalanceCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const generators = facilities.filter(f => this.isGenerator(f));
      const consumers = facilities.filter(f => this.isConsumer(f));

      // 计算发电能力
      const generationCapacity = this.calculateTotalGeneration(generators);
      const generationByType = this.calculateGenerationByType(generators);
      
      // 计算耗电需求
      const consumptionDemand = this.calculateTotalConsumption(consumers);
      const consumptionByCategory = this.calculateConsumptionByCategory(consumers);

      // 计算实际数值
      const satisfactionRatio = generationCapacity > 0 ? 
        Math.min(consumptionDemand / generationCapacity, 1) : 0;
      
      const actualGeneration = Math.min(generationCapacity, consumptionDemand);
      const actualConsumption = actualGeneration;

      // 确定状态
      let status: 'surplus' | 'balanced' | 'deficit';
      if (generationCapacity > consumptionDemand * 1.1) {
        status = 'surplus';
      } else if (generationCapacity >= consumptionDemand * 0.95) {
        status = 'balanced';
      } else {
        status = 'deficit';
      }

      const balance: PowerBalance = {
        generationCapacity,
        actualGeneration,
        generationByType,
        consumptionDemand,
        actualConsumption,
        consumptionByCategory,
        satisfactionRatio,
        status
      };

      this.powerBalanceCache.set(cacheKey, balance);
      return balance;
    } catch (error) {
      this.handleError(error, 'calculatePowerBalance');
      return this.getEmptyPowerBalance();
    }
  }

  /**
   * 更新设施电力效率
   */
  updateFacilityEfficiency(facilities: FacilityInstance[], powerBalance: PowerBalance): FacilityInstance[] {
    try {
      return facilities.map(facility => {
        if (this.isConsumer(facility)) {
          const powerInfo = this.getFacilityPowerInfo(facility, powerBalance);
          facility.efficiency = powerInfo.efficiency;
          
          // 根据电力供应调整设施状态
          if (powerInfo.efficiency < 0.1) {
            facility.status = FacilityStatus.NO_POWER;
          } else if (facility.status === FacilityStatus.NO_POWER && powerInfo.efficiency >= 0.1) {
            facility.status = FacilityStatus.RUNNING;
          }
        }
        return facility;
      });
    } catch (error) {
      this.handleError(error, 'updateFacilityEfficiency');
      return facilities;
    }
  }

  /**
   * 获取设施电力信息
   */
  getFacilityPowerInfo(facility: FacilityInstance, powerBalance: PowerBalance): FacilityPowerInfo {
    try {
      const cacheKey = `${facility.id}_${powerBalance.satisfactionRatio}`;
      const cached = this.facilityPowerCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const powerDemand = this.getFacilityPowerDemand(facility);
      const powerAllocated = powerDemand * powerBalance.satisfactionRatio;
      const efficiency = powerDemand > 0 ? powerAllocated / powerDemand : 1;

      const powerInfo: FacilityPowerInfo = {
        facilityId: facility.id,
        powerDemand,
        powerAllocated,
        efficiency: Math.min(efficiency, 1)
      };

      this.facilityPowerCache.set(cacheKey, powerInfo);
      return powerInfo;
    } catch (error) {
      this.handleError(error, 'getFacilityPowerInfo');
      return {
        facilityId: facility.id,
        powerDemand: 0,
        powerAllocated: 0,
        efficiency: 0
      };
    }
  }

  /**
   * 检查是否为发电设施
   */
  isGenerator(facility: FacilityInstance): boolean {
    return this.GENERATOR_TYPES.includes(facility.facilityId);
  }

  /**
   * 检查是否为耗电设施
   */
  isConsumer(facility: FacilityInstance): boolean {
    try {
      if (this.isGenerator(facility)) return false;
      
      const dataService = ServiceLocator.get<DataService>(SERVICE_NAMES.DATA);
      const building = dataService.getItemById(facility.facilityId);
      
      // 检查建筑是否有电力消耗
      return !!(building && (building as { energy_consumption?: number }).energy_consumption);
    } catch (error) {
      this.handleError(error, 'isConsumer');
      return false;
    }
  }

  /**
   * 获取设施电力需求
   */
  getFacilityPowerDemand(facility: FacilityInstance): number {
    try {
      if (this.isGenerator(facility)) return 0;
      
      const dataService = ServiceLocator.get<DataService>(SERVICE_NAMES.DATA);
      const building = dataService.getItemById(facility.facilityId);
      
      if (!building) return 0;
      
      // 从建筑数据获取电力消耗，如果没有则默认为0
      const powerConsumption = (building as { energy_consumption?: number }).energy_consumption || 0;
      
      // 根据设施状态调整
      if (facility.status === FacilityStatus.STOPPED) return 0;
      if (facility.status === FacilityStatus.NO_POWER) return powerConsumption;
      
      return powerConsumption;
    } catch (error) {
      this.handleError(error, 'getFacilityPowerDemand');
      return 0;
    }
  }

  /**
   * 获取发电设施的发电量
   */
  getFacilityPowerGeneration(facility: FacilityInstance): number {
    try {
      if (!this.isGenerator(facility)) return 0;
      if (facility.status !== FacilityStatus.RUNNING) return 0;
      
      const dataService = ServiceLocator.get<DataService>(SERVICE_NAMES.DATA);
      const building = dataService.getItemById(facility.facilityId);
      
      if (!building) return 0;
      
      // 从建筑数据获取发电量
      const powerGeneration = (building as { energy_production?: number }).energy_production || 0;
      
      // 太阳能板特殊处理（白天/夜晚效率不同）
      if (facility.facilityId === 'solar-panel') {
        const timeOfDay = this.getTimeOfDay();
        const solarEfficiency = this.getSolarEfficiency(timeOfDay);
        return powerGeneration * solarEfficiency;
      }
      
      return powerGeneration;
    } catch (error) {
      this.handleError(error, 'getFacilityPowerGeneration');
      return 0;
    }
  }

  /**
   * 获取电力统计信息
   */
  getPowerStats(facilities: FacilityInstance[]): PowerStats {
    try {
      const generators = facilities.filter(f => this.isGenerator(f));
      const consumers = facilities.filter(f => this.isConsumer(f));
      
      const totalEfficiency = consumers.reduce((sum, f) => sum + (f.efficiency || 0), 0);
      const avgEfficiency = consumers.length > 0 ? totalEfficiency / consumers.length : 1;
      
      const powerBalance = this.calculatePowerBalance(facilities);
      const powerUtilization = powerBalance.generationCapacity > 0 ? 
        powerBalance.actualGeneration / powerBalance.generationCapacity : 0;

      return {
        totalGenerators: generators.length,
        totalConsumers: consumers.length,
        avgEfficiency,
        powerUtilization
      };
    } catch (error) {
      this.handleError(error, 'getPowerStats');
      return {
        totalGenerators: 0,
        totalConsumers: 0,
        avgEfficiency: 0,
        powerUtilization: 0
      };
    }
  }

  /**
   * 计算总发电量
   */
  private calculateTotalGeneration(generators: FacilityInstance[]): number {
    return generators.reduce((total, facility) => {
      return total + this.getFacilityPowerGeneration(facility);
    }, 0);
  }

  /**
   * 按类型计算发电量
   */
  private calculateGenerationByType(generators: FacilityInstance[]): Record<string, number> {
    const byType: Record<string, number> = {};
    
    generators.forEach(facility => {
      const generation = this.getFacilityPowerGeneration(facility);
      byType[facility.facilityId] = (byType[facility.facilityId] || 0) + generation;
    });
    
    return byType;
  }

  /**
   * 计算总耗电量
   */
  private calculateTotalConsumption(consumers: FacilityInstance[]): number {
    return consumers.reduce((total, facility) => {
      return total + this.getFacilityPowerDemand(facility);
    }, 0);
  }

  /**
   * 按类别计算耗电量
   */
  private calculateConsumptionByCategory(consumers: FacilityInstance[]): Record<string, number> {
    const byCategory: Record<string, number> = {};
    
    consumers.forEach(facility => {
      const consumption = this.getFacilityPowerDemand(facility);
      const category = this.getFacilityCategory(facility);
      byCategory[category] = (byCategory[category] || 0) + consumption;
    });
    
    return byCategory;
  }

  /**
   * 获取设施类别
   */
  private getFacilityCategory(facility: FacilityInstance): string {
    // 简化分类
    if (facility.facilityId.includes('assembling')) return 'manufacturing';
    if (facility.facilityId.includes('mining')) return 'mining';
    if (facility.facilityId.includes('lab')) return 'research';
    return 'other';
  }

  /**
   * 生成设施Hash用于缓存
   */
  private generateFacilitiesHash(facilities: FacilityInstance[]): string {
    const relevant = facilities.map(f => `${f.facilityId}:${f.status}:${f.count || 1}`);
    return relevant.sort().join('|');
  }

  /**
   * 获取一天中的时间（0-1，0为午夜，0.5为正午）
   */
  private getTimeOfDay(): number {
    // 简化实现，实际应该从游戏状态获取
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000; // 一天的毫秒数
    return (now % dayMs) / dayMs;
  }

  /**
   * 获取太阳能效率
   */
  private getSolarEfficiency(timeOfDay: number): number {
    // 简化的太阳能效率曲线
    if (timeOfDay < 0.25 || timeOfDay > 0.75) {
      return 0; // 夜晚
    } else if (timeOfDay >= 0.45 && timeOfDay <= 0.55) {
      return 1; // 正午
    } else {
      // 晨昏时段，线性插值
      const distanceFromNoon = Math.abs(timeOfDay - 0.5);
      return Math.max(0, 1 - distanceFromNoon * 4);
    }
  }

  /**
   * 获取空的电力平衡对象
   */
  private getEmptyPowerBalance(): PowerBalance {
    return {
      generationCapacity: 0,
      actualGeneration: 0,
      generationByType: {},
      consumptionDemand: 0,
      actualConsumption: 0,
      consumptionByCategory: {},
      satisfactionRatio: 0,
      status: 'deficit'
    };
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.powerBalanceCache.clear();
    this.facilityPowerCache.clear();
  }

  /**
   * 更新设施电力状态（向后兼容）
   */
  updateFacilityPowerStatus(facility: FacilityInstance, powerBalance: PowerBalance): FacilityInstance {
    try {
      const powerInfo = this.getFacilityPowerInfo(facility, powerBalance);
      facility.efficiency = powerInfo.efficiency;
      
      // 根据电力供应调整设施状态
      if (powerInfo.efficiency < 0.1) {
        facility.status = FacilityStatus.NO_POWER;
      } else if (facility.status === FacilityStatus.NO_POWER && powerInfo.efficiency >= 0.1) {
        facility.status = FacilityStatus.RUNNING;
      }
      
      return facility;
    } catch (error) {
      this.handleError(error, 'updateFacilityPowerStatus');
      return facility;
    }
  }

  /**
   * 获取电力优先级建议（向后兼容）
   */
  getPowerPriorityRecommendations(facilities: FacilityInstance[], powerBalance: PowerBalance): any[] {
    try {
      const recommendations: any[] = [];
      
      if (powerBalance.status === 'deficit') {
        // 建议优先级调整
        const consumers = facilities.filter(f => this.isConsumer(f));
        consumers.forEach(facility => {
          const powerInfo = this.getFacilityPowerInfo(facility, powerBalance);
          if (powerInfo.efficiency < 0.5) {
            recommendations.push({
              facilityId: facility.id,
              type: 'reduce_priority',
              reason: 'Low power efficiency',
              priority: 'low'
            });
          }
        });
      }
      
      return recommendations;
    } catch (error) {
      this.handleError(error, 'getPowerPriorityRecommendations');
      return [];
    }
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      powerBalance: this.powerBalanceCache.getStats(),
      facilityPower: this.facilityPowerCache.getStats()
    };
  }
}