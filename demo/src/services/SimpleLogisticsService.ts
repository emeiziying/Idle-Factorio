import { 
  FacilityLogistics, 
  LogisticsConfig, 
  LogisticsRecommendation,
  LOGISTICS_SPECS 
} from '../types/logistics';
import { persistenceService } from './PersistenceService';

class SimpleLogisticsService {
  // 存储每个物品的设施物流配置
  private facilityLogistics: Map<string, FacilityLogistics> = new Map();

  constructor() {
    // 加载保存的物流配置
    this.loadSavedLogistics();
  }

  // 加载保存的物流配置
  private loadSavedLogistics() {
    const savedState = persistenceService.loadGameState();
    if (savedState?.logistics) {
      Object.entries(savedState.logistics).forEach(([key, logistics]) => {
        this.facilityLogistics.set(key, logistics);
      });
    }
  }

  // 保存物流配置
  private saveLogistics() {
    const logisticsObj: Record<string, FacilityLogistics> = {};
    this.facilityLogistics.forEach((value, key) => {
      logisticsObj[key] = value;
    });
    persistenceService.saveLogistics(logisticsObj);
  }

  // 计算物流配置的总运输能力
  calculateLogisticsCapacity(config: LogisticsConfig): number {
    const conveyorCapacity = config.conveyors * LOGISTICS_SPECS.conveyors[config.conveyorType].speed;
    const inserterCapacity = config.inserters * LOGISTICS_SPECS.inserters[config.inserterType].speed;
    return conveyorCapacity + inserterCapacity;
  }

  // 创建或更新设施的物流配置
  updateFacilityLogistics(
    itemId: string, 
    facilityType: string,
    facilityCount: number,
    baseInputRate: number,
    baseOutputRate: number,
    inputConfig: LogisticsConfig,
    outputConfig: LogisticsConfig
  ): FacilityLogistics {
    // 计算总的基础需求（所有设施）
    const totalBaseInput = baseInputRate * facilityCount;
    const totalBaseOutput = baseOutputRate * facilityCount;

    // 计算物流能力
    const inputCapacity = this.calculateLogisticsCapacity(inputConfig);
    const outputCapacity = this.calculateLogisticsCapacity(outputConfig);

    // 计算实际生产速率（受物流限制）
    let actualProductionRate = totalBaseOutput;
    let bottleneck: 'input' | 'output' | 'none' = 'none';

    // 如果需要输入但输入能力不足
    if (totalBaseInput > 0 && inputCapacity < totalBaseInput) {
      const inputRatio = inputCapacity / totalBaseInput;
      actualProductionRate = totalBaseOutput * inputRatio;
      bottleneck = 'input';
    }

    // 如果输出能力不足
    if (outputCapacity < actualProductionRate) {
      actualProductionRate = outputCapacity;
      bottleneck = 'output';
    }

    // 计算效率
    const efficiency = totalBaseOutput > 0 ? actualProductionRate / totalBaseOutput : 1;

    const logistics: FacilityLogistics = {
      facilityId: itemId,
      facilityType,
      facilityCount,
      baseInputRate,
      baseOutputRate,
      inputLogistics: inputConfig,
      outputLogistics: outputConfig,
      actualInputCapacity: inputCapacity,
      actualOutputCapacity: outputCapacity,
      actualProductionRate,
      efficiency,
      bottleneck
    };

    this.facilityLogistics.set(itemId, logistics);
    
    // 保存更新后的配置
    this.saveLogistics();
    
    return logistics;
  }

  // 获取设施的物流配置
  getFacilityLogistics(itemId: string): FacilityLogistics | null {
    return this.facilityLogistics.get(itemId) || null;
  }

  // 生成物流优化建议
  generateRecommendations(logistics: FacilityLogistics): LogisticsRecommendation[] {
    const recommendations: LogisticsRecommendation[] = [];
    const totalBaseInput = logistics.baseInputRate * logistics.facilityCount;
    const totalBaseOutput = logistics.baseOutputRate * logistics.facilityCount;

    // 检查输入物流
    if (totalBaseInput > 0 && logistics.actualInputCapacity < totalBaseInput) {
      const deficit = totalBaseInput - logistics.actualInputCapacity;
      recommendations.push({
        type: 'input',
        currentCapacity: logistics.actualInputCapacity,
        requiredCapacity: totalBaseInput,
        deficit,
        suggestions: this.calculateOptimalLogistics(deficit)
      });
    }

    // 检查输出物流
    if (logistics.actualOutputCapacity < totalBaseOutput) {
      const deficit = totalBaseOutput - logistics.actualOutputCapacity;
      recommendations.push({
        type: 'output',
        currentCapacity: logistics.actualOutputCapacity,
        requiredCapacity: totalBaseOutput,
        deficit,
        suggestions: this.calculateOptimalLogistics(deficit)
      });
    }

    return recommendations;
  }

  // 计算最优物流配置方案
  private calculateOptimalLogistics(requiredCapacity: number): LogisticsRecommendation['suggestions'] {
    const suggestions: LogisticsRecommendation['suggestions'] = [];

    // 方案1：只用传送带
    const fastBelts = Math.ceil(requiredCapacity / LOGISTICS_SPECS.conveyors['fast-transport-belt'].speed);
    const expressBelts = Math.ceil(requiredCapacity / LOGISTICS_SPECS.conveyors['express-transport-belt'].speed);

    if (expressBelts <= 2) {
      suggestions.push({
        conveyors: { type: 'express-transport-belt', count: expressBelts }
      });
    }

    if (fastBelts <= 3) {
      suggestions.push({
        conveyors: { type: 'fast-transport-belt', count: fastBelts }
      });
    }

    // 方案2：只用机械臂
    const fastInserters = Math.ceil(requiredCapacity / LOGISTICS_SPECS.inserters['fast-inserter'].speed);
    const stackInserters = Math.ceil(requiredCapacity / LOGISTICS_SPECS.inserters['stack-inserter'].speed);

    if (stackInserters <= 3) {
      suggestions.push({
        inserters: { type: 'stack-inserter', count: stackInserters }
      });
    }

    if (fastInserters <= 5) {
      suggestions.push({
        inserters: { type: 'fast-inserter', count: fastInserters }
      });
    }

    // 方案3：混合方案（1条传送带 + 补充机械臂）
    if (requiredCapacity > 15) {
      const remainingAfterBelt = requiredCapacity - LOGISTICS_SPECS.conveyors['transport-belt'].speed;
      const supplementInserters = Math.ceil(remainingAfterBelt / LOGISTICS_SPECS.inserters['fast-inserter'].speed);
      
      suggestions.push({
        conveyors: { type: 'transport-belt', count: 1 },
        inserters: { type: 'fast-inserter', count: supplementInserters }
      });
    }

    return suggestions;
  }

  // 检查是否有足够的物流设备库存
  checkLogisticsInventory(config: LogisticsConfig): {
    hasEnough: boolean;
    missing: { item: string; required: number; available: number }[];
  } {
    const missing: { item: string; required: number; available: number }[] = [];
    
    // 导入dataService以检查库存
    const { dataService } = require('./DataService');
    
    // 检查传送带库存
    if (config.conveyors > 0) {
      const conveyorInventory = dataService.getInventoryItem(config.conveyorType);
      const available = conveyorInventory?.currentAmount || 0;
      if (available < config.conveyors) {
        missing.push({
          item: config.conveyorType,
          required: config.conveyors,
          available
        });
      }
    }
    
    // 检查机械臂库存
    if (config.inserters > 0) {
      const inserterInventory = dataService.getInventoryItem(config.inserterType);
      const available = inserterInventory?.currentAmount || 0;
      if (available < config.inserters) {
        missing.push({
          item: config.inserterType,
          required: config.inserters,
          available
        });
      }
    }
    
    return {
      hasEnough: missing.length === 0,
      missing
    };
  }
  
  // 消耗物流设备库存
  consumeLogisticsInventory(config: LogisticsConfig): boolean {
    const { dataService } = require('./DataService');
    
    // 先检查库存
    const check = this.checkLogisticsInventory(config);
    if (!check.hasEnough) {
      return false;
    }
    
    // 消耗传送带
    if (config.conveyors > 0) {
      const conveyorInventory = dataService.getInventoryItem(config.conveyorType);
      if (conveyorInventory) {
        dataService.updateInventory(config.conveyorType, {
          currentAmount: conveyorInventory.currentAmount - config.conveyors
        });
      }
    }
    
    // 消耗机械臂
    if (config.inserters > 0) {
      const inserterInventory = dataService.getInventoryItem(config.inserterType);
      if (inserterInventory) {
        dataService.updateInventory(config.inserterType, {
          currentAmount: inserterInventory.currentAmount - config.inserters
        });
      }
    }
    
    return true;
  }
}

export const simpleLogisticsService = new SimpleLogisticsService();