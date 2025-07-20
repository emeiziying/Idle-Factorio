// 简化版物流系统类型定义

// 物流设备规格
export const LOGISTICS_SPECS = {
  conveyors: {
    'transport-belt': { 
      speed: 15, 
      name: '基础传送带',
      color: '#716358' 
    },
    'fast-transport-belt': { 
      speed: 30, 
      name: '快速传送带',
      color: '#735a57' 
    },
    'express-transport-belt': { 
      speed: 45, 
      name: '极速传送带',
      color: '#626469' 
    }
  },
  inserters: {
    'inserter': { 
      speed: 0.83, 
      name: '基础机械臂',
      color: '#a18459' 
    },
    'fast-inserter': { 
      speed: 2.31, 
      name: '快速机械臂',
      color: '#5c8b9d' 
    },
    'stack-inserter': { 
      speed: 6.92, 
      name: '极速机械臂',
      color: '#80995c' 
    }
  }
};

// 物流配置
export interface LogisticsConfig {
  conveyors: number;         // 传送带数量
  conveyorType: keyof typeof LOGISTICS_SPECS.conveyors;
  inserters: number;         // 机械臂数量
  inserterType: keyof typeof LOGISTICS_SPECS.inserters;
}

// 设施的物流配置
export interface FacilityLogistics {
  facilityId: string;
  facilityType: string;      // 设施类型（如电力采掘机）
  facilityCount: number;     // 设施数量
  
  // 基础能力（单台设施）
  baseInputRate: number;     // 基础输入速率（物品/秒）
  baseOutputRate: number;    // 基础输出速率（物品/秒）
  
  // 物流配置
  inputLogistics: LogisticsConfig;
  outputLogistics: LogisticsConfig;
  
  // 计算后的实际能力
  actualInputCapacity: number;   // 实际输入能力
  actualOutputCapacity: number;  // 实际输出能力
  actualProductionRate: number;  // 实际生产速率
  efficiency: number;            // 效率（0-1）
  bottleneck: 'input' | 'output' | 'none';
}

// 物流推荐
export interface LogisticsRecommendation {
  type: 'input' | 'output';
  currentCapacity: number;
  requiredCapacity: number;
  deficit: number;
  suggestions: {
    conveyors?: {
      type: keyof typeof LOGISTICS_SPECS.conveyors;
      count: number;
    };
    inserters?: {
      type: keyof typeof LOGISTICS_SPECS.inserters;
      count: number;
    };
  }[];
}