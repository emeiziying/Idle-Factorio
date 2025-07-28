// 燃料服务 - 管理所有燃料相关逻辑

import { DataService } from './DataService';
import type { FacilityInstance, FuelBuffer } from '../types/facilities';
import { FacilityStatus } from '../types/facilities';
import type { InventoryItem } from '../types/index';
import { FACILITY_FUEL_CONFIGS, FUEL_PRIORITY, getFuelCategory, type FuelConfig } from '../data/fuelConfigs';

// 燃料更新结果
export interface FuelUpdateResult {
  success: boolean;
  reason?: string;
  energyConsumed?: number;
}

// 添加燃料结果
export interface AddFuelResult {
  success: boolean;
  reason?: string;
  quantityAdded?: number;
  quantityRemaining?: number;
}

// 自动补充结果
export interface AutoRefuelResult {
  success: boolean;
  itemsConsumed: Record<string, number>;
}

// 燃料状态信息
export interface FuelStatus {
  totalEnergy: number;
  maxEnergy: number;
  fillPercentage: number;
  estimatedRunTime: number; // 秒
  isEmpty: boolean;
  isFull: boolean;
}

export class FuelService {
  private static instance: FuelService;
  private dataService: DataService;
  private customFuelPriority: string[] | null = null;
  
  private constructor() {
    this.dataService = DataService.getInstance();
    // 从本地存储加载自定义优先级
    const stored = localStorage.getItem('fuelPriority');
    if (stored) {
      try {
        this.customFuelPriority = JSON.parse(stored);
      } catch (e) {
        console.error('Failed to load fuel priority:', e);
      }
    }
  }
  
  static getInstance(): FuelService {
    if (!FuelService.instance) {
      FuelService.instance = new FuelService();
    }
    return FuelService.instance;
  }
  
  /**
   * 设置自定义燃料优先级
   */
  setFuelPriority(priority: string[]): void {
    this.customFuelPriority = priority;
    localStorage.setItem('fuelPriority', JSON.stringify(priority));
  }
  
  /**
   * 获取当前燃料优先级
   */
  getFuelPriority(): string[] {
    return this.customFuelPriority || FUEL_PRIORITY;
  }
  
  /**
   * 初始化设施的燃料缓存区
   */
  initializeFuelBuffer(facilityId: string): FuelBuffer | null {
    const config = FACILITY_FUEL_CONFIGS[facilityId];
    if (!config) {
      console.warn(`No fuel config found for facility: ${facilityId}`);
      return null;
    }
    
    return {
      slots: [],
      maxSlots: config.fuelSlots,
      totalEnergy: 0,
      maxEnergy: this.calculateMaxEnergy(config),
      consumptionRate: config.basePowerConsumption,
      lastUpdate: Date.now()
    };
  }
  
  /**
   * 更新燃料消耗
   */
  updateFuelConsumption(
    facility: FacilityInstance, 
    deltaTime: number,
    isProducing: boolean = true
  ): FuelUpdateResult {
    if (!facility.fuelBuffer) {
      return { success: false, reason: 'No fuel buffer' };
    }
    
    const buffer = facility.fuelBuffer;
    const currentTime = Date.now();
    const timeDelta = (currentTime - buffer.lastUpdate) / 1000; // 转换为秒
    
    // 更新时间戳
    buffer.lastUpdate = currentTime;
    
    // 如果不在生产，不消耗燃料
    if (!isProducing || facility.status === 'stopped') {
      return { success: true, energyConsumed: 0 };
    }
    
    // 计算需要消耗的能量
    const energyNeeded = buffer.consumptionRate * timeDelta * facility.efficiency;
    
    // 从燃料槽中消耗能量
    let remainingNeed = energyNeeded;
    const slotsToRemove: number[] = [];
    
    for (let i = 0; i < buffer.slots.length && remainingNeed > 0; i++) {
      const slot = buffer.slots[i];
      
      if (slot.remainingEnergy >= remainingNeed) {
        // 当前物品能量足够
        slot.remainingEnergy -= remainingNeed;
        remainingNeed = 0;
      } else {
        // 当前物品能量不足，消耗完并继续
        remainingNeed -= slot.remainingEnergy;
        slot.remainingEnergy = 0;
        slot.quantity--;
        
        if (slot.quantity <= 0) {
          // 该槽位已空
          slotsToRemove.push(i);
        } else {
          // 开始燃烧下一个物品
          const fuelItem = this.dataService.getItem(slot.itemId);
          if (fuelItem?.fuel?.value) {
            slot.remainingEnergy = fuelItem.fuel.value;
          }
        }
      }
    }
    
    // 移除空槽位
    slotsToRemove.reverse().forEach(index => {
      buffer.slots.splice(index, 1);
    });
    
    // 更新总能量
    buffer.totalEnergy = this.calculateTotalEnergy(buffer);
    
    // 如果燃料不足
    if (remainingNeed > 0) {
      return { 
        success: false, 
        reason: 'Insufficient fuel',
        energyConsumed: energyNeeded - remainingNeed 
      };
    }
    
    return { success: true, energyConsumed: energyNeeded };
  }
  
  /**
   * 添加燃料到缓存区
   */
  addFuel(
    buffer: FuelBuffer, 
    itemId: string, 
    quantity: number,
    facilityId: string
  ): AddFuelResult {
    const item = this.dataService.getItem(itemId);
    if (!item?.fuel) {
      return { success: false, reason: 'Not a fuel item' };
    }
    
    const config = FACILITY_FUEL_CONFIGS[facilityId];
    if (!config) {
      return { success: false, reason: 'No facility config' };
    }
    
    const fuelCategory = getFuelCategory(itemId);
    if (!fuelCategory || !config.acceptedCategories.includes(fuelCategory)) {
      return { success: false, reason: 'Fuel type not accepted' };
    }
    
    // 查找现有槽位
    let slot = buffer.slots.find(s => s.itemId === itemId);
    
    if (!slot && buffer.slots.length >= buffer.maxSlots) {
      return { success: false, reason: 'No empty fuel slots' };
    }
    
    if (!slot) {
      // 创建新槽位
      slot = {
        itemId,
        quantity: 0,
        remainingEnergy: item.fuel.value
      };
      buffer.slots.push(slot);
    }
    
    // 计算可以添加的数量
    const maxStack = config.maxStackPerSlot;
    const canAdd = Math.min(quantity, maxStack - slot.quantity);
    
    if (canAdd <= 0) {
      return { success: false, reason: 'Fuel slot is full' };
    }
    
    // 添加燃料
    slot.quantity += canAdd;
    
    // 更新总能量
    buffer.totalEnergy = this.calculateTotalEnergy(buffer);
    
    return { 
      success: true, 
      quantityAdded: canAdd,
      quantityRemaining: quantity - canAdd
    };
  }
  
  /**
   * 自动补充燃料
   */
  autoRefuel(
    facility: FacilityInstance,
    getInventoryItem: (itemId: string) => InventoryItem
  ): AutoRefuelResult {
    if (!facility.fuelBuffer) {
      return { success: false, itemsConsumed: {} };
    }
    
    const buffer = facility.fuelBuffer;
    const itemsConsumed: Record<string, number> = {};
    const config = FACILITY_FUEL_CONFIGS[facility.facilityId];
    
    if (!config) {
      return { success: false, itemsConsumed: {} };
    }
    
    // 检查是否需要补充
    const status = this.getFuelStatus(buffer);
    if (status.fillPercentage > 80) {
      // 燃料充足，不需要补充
      return { success: false, itemsConsumed: {} };
    }
    
    // 按优先级尝试添加燃料
    const fuelPriority = this.getFuelPriority();
    for (const fuelId of fuelPriority) {
      const inventory = getInventoryItem(fuelId);
      if (inventory.currentAmount <= 0) continue;
      
      // 尝试添加燃料，每次最多添加10个
      const toAdd = Math.min(inventory.currentAmount, 10);
      const result = this.addFuel(buffer, fuelId, toAdd, facility.facilityId);
      
      if (result.success && result.quantityAdded) {
        itemsConsumed[fuelId] = result.quantityAdded;
      }
      
      // 如果燃料槽已满，停止添加
      if (this.isFuelBufferFull(buffer, config)) {
        break;
      }
    }
    
    return { 
      success: Object.keys(itemsConsumed).length > 0,
      itemsConsumed 
    };
  }
  
  /**
   * 获取燃料状态信息
   */
  getFuelStatus(buffer: FuelBuffer): FuelStatus {
    const totalEnergy = this.calculateTotalEnergy(buffer);
    const runTime = buffer.consumptionRate > 0 
      ? totalEnergy / buffer.consumptionRate 
      : Infinity;
    
    return {
      totalEnergy,
      maxEnergy: buffer.maxEnergy,
      fillPercentage: buffer.maxEnergy > 0 ? (totalEnergy / buffer.maxEnergy) * 100 : 0,
      estimatedRunTime: runTime,
      isEmpty: buffer.slots.length === 0 || totalEnergy === 0,
      isFull: this.isFuelBufferFull(buffer)
    };
  }
  
  /**
   * 计算缓存区总能量
   */
  private calculateTotalEnergy(buffer: FuelBuffer): number {
    return buffer.slots.reduce((total, slot) => {
      const item = this.dataService.getItem(slot.itemId);
      const energyPerItem = item?.fuel?.value || 0;
      // 当前物品的剩余能量 + 剩余物品的总能量
      return total + slot.remainingEnergy + (energyPerItem * (slot.quantity - 1));
    }, 0);
  }
  
  /**
   * 计算最大能量存储
   */
  private calculateMaxEnergy(config: FuelConfig): number {
    // 假设使用火箭燃料（100MJ）作为参考
    return config.fuelSlots * config.maxStackPerSlot * 100;
  }
  
  /**
   * 检查燃料缓存是否已满
   */
  private isFuelBufferFull(buffer: FuelBuffer, config?: FuelConfig): boolean {
    if (!config && buffer.slots.length > 0) {
      // 使用默认最大堆叠数
      const maxStack = 50; // 默认值
      return buffer.slots.length >= buffer.maxSlots && 
             buffer.slots.every(s => s.quantity >= maxStack);
    }
    
    if (config) {
      return buffer.slots.length >= buffer.maxSlots && 
             buffer.slots.every(s => s.quantity >= config.maxStackPerSlot);
    }
    
    return false;
  }
  
  /**
   * 智能燃料分配（可选实现）
   */
  smartFuelDistribution(
    facilities: FacilityInstance[],
    getInventoryItem: (itemId: string) => InventoryItem,
    updateInventory: (itemId: string, amount: number) => void
  ): void {
    // 获取需要燃料的设施，按剩余运行时间排序
    const needsFuel = facilities
      .filter(f => f.fuelBuffer && f.status !== FacilityStatus.STOPPED)
      .sort((a, b) => {
        const aTime = this.getFuelStatus(a.fuelBuffer!).estimatedRunTime;
        const bTime = this.getFuelStatus(b.fuelBuffer!).estimatedRunTime;
        return aTime - bTime; // 剩余时间少的优先
      });
    
    // 分配燃料
    const fuelPriority = this.getFuelPriority();
    for (const fuelType of fuelPriority) {
      let available = getInventoryItem(fuelType).currentAmount;
      if (available <= 0) continue;
      
      for (const facility of needsFuel) {
        if (available <= 0) break;
        
        // 每次只添加1个，确保公平分配
        const result = this.addFuel(facility.fuelBuffer!, fuelType, 1, facility.facilityId);
        if (result.success && result.quantityAdded) {
          available -= result.quantityAdded;
          updateInventory(fuelType, -result.quantityAdded);
        }
      }
    }
  }
}