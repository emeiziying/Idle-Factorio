import { facilityService } from './FacilityService';
import { dataService } from './DataService';

// 电力系统状态
interface PowerSystemState {
  totalGeneration: number;      // 总发电量(kW)
  totalConsumption: number;     // 总消耗量(kW)
  powerBalance: number;         // 电力平衡(kW)
  efficiency: number;           // 电网效率(0-1)
  powerStatus: 'surplus' | 'balanced' | 'deficit'; // 电力状态
}

// 发电设备状态
interface PowerFacilityState {
  facilityId: string;
  type: string;
  count: number;
  powerGeneration: number;      // 发电量
  powerConsumption: number;     // 消耗量
  fuelConsumption: number;      // 燃料消耗
  status: 'running' | 'stopped' | 'fuel-shortage';
}

class PowerService {
  private powerState: PowerSystemState = {
    totalGeneration: 0,
    totalConsumption: 0,
    powerBalance: 0,
    efficiency: 1.0,
    powerStatus: 'balanced'
  };

  // 获取电力系统状态
  getPowerSystemState(): PowerSystemState {
    this.updatePowerState();
    return { ...this.powerState };
  }

  // 更新电力系统状态
  private updatePowerState(): void {
    const allFacilities = facilityService.getAllFacilities();
    
    let totalGeneration = 0;
    let totalConsumption = 0;

    // 计算总发电量和总消耗量
    allFacilities.forEach(facility => {
      const facilityType = facilityService.getFacilityType(facility.type);
      
      if (facilityType?.powerGeneration) {
        // 发电设备
        totalGeneration += facilityType.powerGeneration * facility.count;
      }
      
      if (facilityType?.powerConsumption) {
        // 耗电设备
        totalConsumption += facilityType.powerConsumption * facility.count;
      }
    });

    const powerBalance = totalGeneration - totalConsumption;
    let powerStatus: 'surplus' | 'balanced' | 'deficit';
    
    if (powerBalance > 100) {
      powerStatus = 'surplus';
    } else if (powerBalance < -50) {
      powerStatus = 'deficit';
    } else {
      powerStatus = 'balanced';
    }

    this.powerState = {
      totalGeneration,
      totalConsumption,
      powerBalance,
      efficiency: totalGeneration > 0 ? Math.min(1.0, totalConsumption / totalGeneration) : 1.0,
      powerStatus
    };
  }

  // 获取所有发电设备状态
  getPowerFacilities(): PowerFacilityState[] {
    const allFacilities = facilityService.getAllFacilities();
    const powerFacilities: PowerFacilityState[] = [];

    allFacilities.forEach(facility => {
      const facilityType = facilityService.getFacilityType(facility.type);
      
      if (facilityType?.powerGeneration || facilityType?.category === 'power-generation') {
        const powerGeneration = (facilityType.powerGeneration || 0) * facility.count;
        const powerConsumption = (facilityType.powerConsumption || 0) * facility.count;
        
        // 计算燃料消耗 (蒸汽机消耗蒸汽，锅炉消耗煤炭)
        let fuelConsumption = 0;
        let status: 'running' | 'stopped' | 'fuel-shortage' = 'running';
        
        if (facility.type === 'steam-engine') {
          // 蒸汽机每900kW需要30单位/秒蒸汽
          fuelConsumption = (powerGeneration / 900) * 30;
          
          // 检查蒸汽库存
          const steamInventory = dataService.getInventoryItem('steam');
          if (steamInventory && steamInventory.currentAmount < fuelConsumption * 10) {
            status = 'fuel-shortage';
          }
        } else if (facility.type === 'boiler') {
          // 锅炉每产生60单位蒸汽需要1.8煤炭/秒
          fuelConsumption = facility.count * 1.8;
          
          // 检查煤炭库存
          const coalInventory = dataService.getInventoryItem('coal');
          if (coalInventory && coalInventory.currentAmount < fuelConsumption * 30) {
            status = 'fuel-shortage';
          }
        }

        powerFacilities.push({
          facilityId: facility.id,
          type: facility.type,
          count: facility.count,
          powerGeneration,
          powerConsumption,
          fuelConsumption,
          status
        });
      }
    });

    return powerFacilities;
  }

  // 添加发电设备
  addPowerFacility(facilityType: string, itemId: string, count: number = 1): boolean {
    try {
      const facilityTemplate = facilityService.getFacilityType(facilityType);
      if (!facilityTemplate || facilityTemplate.category !== 'power-generation') {
        return false;
      }

      // 计算基础输入输出率
      const baseInputRate: Record<string, number> = {};
      let baseOutputRate = 0;

      if (facilityType === 'offshore-pump') {
        // 海水泵产生水
        baseOutputRate = 1200; // 每秒1200单位水
      } else if (facilityType === 'boiler') {
        // 锅炉消耗煤炭和水，产生蒸汽
        baseInputRate['coal'] = 1.8; // 每秒1.8煤炭
        baseInputRate['water'] = 60; // 每秒60单位水
        baseOutputRate = 60; // 每秒60单位蒸汽
      } else if (facilityType === 'steam-engine') {
        // 蒸汽机消耗蒸汽，产生电力
        baseInputRate['steam'] = 30; // 每秒30单位蒸汽
        baseOutputRate = 0; // 电力不作为物品计算
      }

      facilityService.addFacility(itemId, {
        id: `${facilityType}-${Date.now()}`,
        itemId,
        type: facilityType,
        category: 'power-generation',
        count,
        baseSpeed: facilityTemplate.baseSpeed,
        baseInputRate,
        baseOutputRate,
        powerType: facilityTemplate.powerType,
        powerConsumption: facilityTemplate.powerConsumption,
        powerGeneration: facilityTemplate.powerGeneration,
        canProduce: [itemId],
      });

      return true;
    } catch (error) {
      console.error('Failed to add power facility:', error);
      return false;
    }
  }

  // 模拟电力生产循环
  simulatePowerProduction(): void {
    const powerFacilities = this.getPowerFacilities();
    
    powerFacilities.forEach(facility => {
      if (facility.status !== 'running') return;

      // 海水泵产生水
      if (facility.type === 'offshore-pump') {
        const waterProduced = facility.count * 20; // 每秒20单位水
        dataService.updateInventory('water', {
          productionRate: waterProduced
        });
      }
      
      // 锅炉消耗煤炭和水，产生蒸汽
      else if (facility.type === 'boiler') {
        const coalNeeded = facility.fuelConsumption;
        const waterNeeded = facility.count * 60;
        const steamProduced = facility.count * 60;

        // 检查资源是否充足
        const coalInventory = dataService.getInventoryItem('coal');
        const waterInventory = dataService.getInventoryItem('water');

        if (coalInventory && waterInventory && 
            coalInventory.currentAmount >= coalNeeded &&
            waterInventory.currentAmount >= waterNeeded) {
          
          // 消耗资源，产生蒸汽
          dataService.updateInventory('coal', {
            consumptionRate: coalNeeded
          });
          dataService.updateInventory('water', {
            consumptionRate: waterNeeded
          });
          dataService.updateInventory('steam', {
            productionRate: steamProduced
          });
        }
      }
      
      // 蒸汽机消耗蒸汽，产生电力
      else if (facility.type === 'steam-engine') {
        const steamNeeded = facility.fuelConsumption;
        const steamInventory = dataService.getInventoryItem('steam');

        if (steamInventory && steamInventory.currentAmount >= steamNeeded) {
          // 消耗蒸汽，产生电力
          dataService.updateInventory('steam', {
            consumptionRate: steamNeeded
          });
          
          // 电力生产记录在设施状态中，不作为库存物品
        }
      }
    });
  }

  // 获取电力平衡建议
  getPowerBalanceRecommendations(): string[] {
    const state = this.getPowerSystemState();
    const recommendations: string[] = [];

    if (state.powerStatus === 'deficit') {
      recommendations.push(`电力不足！缺少${Math.abs(state.powerBalance).toFixed(0)}kW`);
      recommendations.push('建议：增加蒸汽机数量或检查燃料供应');
    } else if (state.powerStatus === 'surplus') {
      recommendations.push(`电力过剩！多余${state.powerBalance.toFixed(0)}kW`);
      recommendations.push('建议：可以增加更多用电设备');
    } else {
      recommendations.push('电力供需平衡良好');
    }

    // 检查燃料状态
    const powerFacilities = this.getPowerFacilities();
    const fuelShortage = powerFacilities.filter(f => f.status === 'fuel-shortage');
    
    if (fuelShortage.length > 0) {
      recommendations.push(`${fuelShortage.length}个发电设备燃料不足`);
      recommendations.push('建议：检查煤炭和水的供应');
    }

    return recommendations;
  }
}

export const powerService = new PowerService();