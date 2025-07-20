import { 
  FacilityLogistics, 
  LogisticsConfig, 
  LogisticsRecommendation,
  LOGISTICS_SPECS 
} from '../types/logistics';

class SimpleLogisticsService {
  // 存储每个物品的设施物流配置
  private facilityLogistics: Map<string, FacilityLogistics> = new Map();

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
    const basicBelts = Math.ceil(requiredCapacity / LOGISTICS_SPECS.conveyors['transport-belt'].speed);
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
    const basicInserters = Math.ceil(requiredCapacity / LOGISTICS_SPECS.inserters['inserter'].speed);
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
    // 这里需要与DataService集成来检查实际库存
    // 简化版本暂时返回true
    return {
      hasEnough: true,
      missing: []
    };
  }
}

export const simpleLogisticsService = new SimpleLogisticsService();