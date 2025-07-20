import { 
  LogisticsConnection, 
  ConveyorConnection, 
  InserterConnection,
  DeviceLogistics,
  LogisticsNetwork,
  LOGISTICS_SPECS
} from '../types/logistics';
import { dataService } from './DataService';

class LogisticsService {
  private network: LogisticsNetwork = {
    connections: [],
    devices: new Map(),
    totalFlow: 0,
    efficiency: 1
  };

  private updateInterval: NodeJS.Timer | null = null;

  // 启动物流系统更新
  startLogisticsSystem() {
    if (this.updateInterval) return;
    
    this.updateInterval = setInterval(() => {
      this.updateLogistics();
    }, 100); // 每100ms更新一次
  }

  // 停止物流系统
  stopLogisticsSystem() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // 添加传送带连接
  addConveyorConnection(params: {
    fromDevice: string;
    toDevice: string;
    conveyorType: 'transport-belt' | 'fast-transport-belt' | 'express-transport-belt';
  }): boolean {
    // 检查传送带库存
    const inventory = dataService.getInventoryItem(params.conveyorType);
    if (!inventory || inventory.currentAmount < 1) {
      console.log(`库存不足：需要${params.conveyorType}但当前库存不足`);
      return false;
    }

    // 消耗传送带
    dataService.updateInventory(params.conveyorType, {
      currentAmount: inventory.currentAmount - 1
    });

    // 创建连接
    const connection: ConveyorConnection = {
      id: `conveyor-${Date.now()}`,
      type: 'conveyor',
      conveyorType: params.conveyorType,
      fromDevice: params.fromDevice,
      toDevice: params.toDevice,
      flow: 0,
      status: 'idle',
      length: 1,
      capacity: LOGISTICS_SPECS.conveyors[params.conveyorType].speed
    };

    this.network.connections.push(connection);
    this.updateDeviceLogistics(params.fromDevice, params.toDevice, connection);
    
    console.log(`添加传送带连接：${params.fromDevice} -> ${params.toDevice}`);
    return true;
  }

  // 添加机械臂连接
  addInserterConnection(params: {
    fromDevice: string;
    toDevice: string;
    inserterType: 'inserter' | 'fast-inserter' | 'stack-inserter';
    filterItem?: string;
  }): boolean {
    // 检查机械臂库存
    const inventory = dataService.getInventoryItem(params.inserterType);
    if (!inventory || inventory.currentAmount < 1) {
      console.log(`库存不足：需要${params.inserterType}但当前库存不足`);
      return false;
    }

    // 消耗机械臂
    dataService.updateInventory(params.inserterType, {
      currentAmount: inventory.currentAmount - 1
    });

    // 创建连接
    const connection: InserterConnection = {
      id: `inserter-${Date.now()}`,
      type: 'inserter',
      inserterType: params.inserterType,
      fromDevice: params.fromDevice,
      toDevice: params.toDevice,
      itemType: params.filterItem,
      flow: 0,
      status: 'idle',
      speed: LOGISTICS_SPECS.inserters[params.inserterType].speed,
      progress: 0
    };

    this.network.connections.push(connection);
    this.updateDeviceLogistics(params.fromDevice, params.toDevice, connection);
    
    console.log(`添加机械臂连接：${params.fromDevice} -> ${params.toDevice}`);
    return true;
  }

  // 更新设备的物流连接信息
  private updateDeviceLogistics(fromDevice: string, toDevice: string, connection: LogisticsConnection) {
    // 更新源设备
    if (!this.network.devices.has(fromDevice)) {
      this.network.devices.set(fromDevice, {
        deviceId: fromDevice,
        inputs: [],
        outputs: []
      });
    }
    this.network.devices.get(fromDevice)!.outputs.push(connection);

    // 更新目标设备
    if (!this.network.devices.has(toDevice)) {
      this.network.devices.set(toDevice, {
        deviceId: toDevice,
        inputs: [],
        outputs: []
      });
    }
    this.network.devices.get(toDevice)!.inputs.push(connection);
  }

  // 移除连接
  removeConnection(connectionId: string): boolean {
    const index = this.network.connections.findIndex(c => c.id === connectionId);
    if (index === -1) return false;

    const connection = this.network.connections[index];
    this.network.connections.splice(index, 1);

    // 更新设备连接信息
    const fromDevice = this.network.devices.get(connection.fromDevice);
    const toDevice = this.network.devices.get(connection.toDevice);
    
    if (fromDevice) {
      fromDevice.outputs = fromDevice.outputs.filter(c => c.id !== connectionId);
    }
    if (toDevice) {
      toDevice.inputs = toDevice.inputs.filter(c => c.id !== connectionId);
    }

    return true;
  }

  // 获取设备的物流连接
  getDeviceLogistics(deviceId: string): DeviceLogistics | null {
    return this.network.devices.get(deviceId) || null;
  }

  // 获取所有连接
  getAllConnections(): LogisticsConnection[] {
    return [...this.network.connections];
  }

  // 更新物流系统
  private updateLogistics() {
    let totalFlow = 0;

    // 更新每个连接
    this.network.connections.forEach(connection => {
      if (connection.type === 'conveyor') {
        this.updateConveyor(connection as ConveyorConnection);
      } else if (connection.type === 'inserter') {
        this.updateInserter(connection as InserterConnection);
      }
      totalFlow += connection.flow;
    });

    this.network.totalFlow = totalFlow;
    this.network.efficiency = this.calculateEfficiency();
  }

  // 更新传送带
  private updateConveyor(conveyor: ConveyorConnection) {
    // 获取源设备的输出能力
    const sourceOutput = this.getDeviceOutputRate(conveyor.fromDevice);
    // 获取目标设备的输入能力
    const targetInput = this.getDeviceInputRate(conveyor.toDevice);
    
    // 实际流量 = 最小值(传送带容量, 源输出, 目标输入)
    const actualFlow = Math.min(conveyor.capacity, sourceOutput, targetInput);
    
    conveyor.flow = actualFlow;
    conveyor.status = actualFlow > 0 ? 'active' : 'idle';

    // 如果有实际流量，进行物品传输
    if (actualFlow > 0) {
      this.transferItems(conveyor.fromDevice, conveyor.toDevice, actualFlow * 0.1); // 0.1秒的传输量
    }
  }

  // 更新机械臂
  private updateInserter(inserter: InserterConnection) {
    const deltaTime = 0.1; // 100ms

    // 如果没有正在搬运的物品，尝试抓取
    if (!inserter.currentItem) {
      const item = this.tryGrabItem(inserter);
      if (item) {
        inserter.currentItem = item;
        inserter.progress = 0;
        inserter.status = 'active';
      } else {
        inserter.status = 'idle';
        inserter.flow = 0;
      }
      return;
    }

    // 更新搬运进度
    inserter.progress += (inserter.speed * deltaTime);

    // 完成搬运
    if (inserter.progress >= 1) {
      if (this.deliverItem(inserter)) {
        inserter.flow = inserter.speed;
      } else {
        inserter.status = 'blocked';
        inserter.flow = 0;
      }
      inserter.currentItem = undefined;
      inserter.progress = 0;
    }
  }

  // 尝试从源设备抓取物品
  private tryGrabItem(inserter: InserterConnection): string | null {
    const sourceInventory = dataService.getInventoryItem(inserter.fromDevice);
    if (!sourceInventory || sourceInventory.currentAmount < 1) {
      return null;
    }

    // 如果有过滤设置，检查是否匹配
    if (inserter.itemType && inserter.itemType !== inserter.fromDevice) {
      return null;
    }

    return inserter.fromDevice; // 简化：返回源设备ID作为物品ID
  }

  // 投递物品到目标设备
  private deliverItem(inserter: InserterConnection): boolean {
    const targetInventory = dataService.getInventoryItem(inserter.toDevice);
    if (!targetInventory) {
      return false;
    }

    // 检查目标是否有空间
    if (targetInventory.currentAmount >= targetInventory.maxCapacity) {
      return false;
    }

    // 执行物品传输
    this.transferItems(inserter.fromDevice, inserter.toDevice, 1);
    return true;
  }

  // 执行物品传输
  private transferItems(fromDevice: string, toDevice: string, amount: number) {
    const sourceInventory = dataService.getInventoryItem(fromDevice);
    const targetInventory = dataService.getInventoryItem(toDevice);

    if (!sourceInventory || !targetInventory) return;

    // 计算实际可传输量
    const actualAmount = Math.min(
      amount,
      sourceInventory.currentAmount,
      targetInventory.maxCapacity - targetInventory.currentAmount
    );

    if (actualAmount > 0) {
      // 更新库存
      dataService.updateInventory(fromDevice, {
        currentAmount: sourceInventory.currentAmount - actualAmount
      });
      dataService.updateInventory(toDevice, {
        currentAmount: targetInventory.currentAmount + actualAmount
      });
    }
  }

  // 获取设备输出速率
  private getDeviceOutputRate(deviceId: string): number {
    const inventory = dataService.getInventoryItem(deviceId);
    if (!inventory) return 0;
    
    // 如果有库存且正在生产，返回生产速率
    if (inventory.currentAmount > 0 && inventory.status === 'producing') {
      return inventory.productionRate;
    }
    
    return inventory.currentAmount > 0 ? 100 : 0; // 有库存时返回高速率
  }

  // 获取设备输入速率
  private getDeviceInputRate(deviceId: string): number {
    const inventory = dataService.getInventoryItem(deviceId);
    if (!inventory) return 0;
    
    // 如果未满，返回消耗速率或默认速率
    if (inventory.currentAmount < inventory.maxCapacity) {
      return inventory.consumptionRate > 0 ? inventory.consumptionRate : 100;
    }
    
    return 0; // 已满时返回0
  }

  // 计算物流效率
  private calculateEfficiency(): number {
    if (this.network.connections.length === 0) return 1;
    
    const activeConnections = this.network.connections.filter(c => c.status === 'active').length;
    return activeConnections / this.network.connections.length;
  }

  // 获取物流统计
  getLogisticsStats() {
    const conveyors = this.network.connections.filter(c => c.type === 'conveyor');
    const inserters = this.network.connections.filter(c => c.type === 'inserter');
    
    return {
      totalConveyors: conveyors.length,
      totalInserters: inserters.length,
      totalFlow: this.network.totalFlow,
      efficiency: this.network.efficiency,
      activeConnections: this.network.connections.filter(c => c.status === 'active').length,
      blockedConnections: this.network.connections.filter(c => c.status === 'blocked').length
    };
  }
}

export const logisticsService = new LogisticsService();