// 物流系统类型定义

export interface LogisticsConnection {
  id: string;
  type: 'conveyor' | 'inserter';
  fromDevice: string;      // 起始设备ID
  toDevice: string;        // 目标设备ID
  itemType?: string;       // 可选的物品过滤
  flow: number;            // 当前流量（物品/秒）
  status: 'active' | 'idle' | 'blocked';
}

export interface ConveyorConnection extends LogisticsConnection {
  type: 'conveyor';
  conveyorType: 'transport-belt' | 'fast-transport-belt' | 'express-transport-belt';
  length: number;          // 传送带段数
  capacity: number;        // 最大流量
}

export interface InserterConnection extends LogisticsConnection {
  type: 'inserter';
  inserterType: 'inserter' | 'fast-inserter' | 'stack-inserter';
  speed: number;           // 搬运速度（物品/秒）
  progress: number;        // 当前搬运进度 0-1
  currentItem?: string;    // 当前搬运的物品ID
}

// 物流设备属性
export const LOGISTICS_SPECS = {
  conveyors: {
    'transport-belt': { speed: 15, color: '#716358' },
    'fast-transport-belt': { speed: 30, color: '#735a57' },
    'express-transport-belt': { speed: 45, color: '#626469' }
  },
  inserters: {
    'inserter': { speed: 0.83, range: 1, stack: 1, color: '#a18459' },
    'fast-inserter': { speed: 2.31, range: 1, stack: 1, color: '#5c8b9d' },
    'stack-inserter': { speed: 6.92, range: 1, stack: 3, color: '#80995c' }
  }
};

// 设备的物流接口
export interface DeviceLogistics {
  deviceId: string;
  inputs: LogisticsConnection[];
  outputs: LogisticsConnection[];
  maxInputRate?: number;   // 最大输入速率
  maxOutputRate?: number;  // 最大输出速率
}

// 物流网络状态
export interface LogisticsNetwork {
  connections: LogisticsConnection[];
  devices: Map<string, DeviceLogistics>;
  totalFlow: number;
  efficiency: number;
}