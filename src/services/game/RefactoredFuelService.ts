/**
 * 燃料服务（重构版本）
 * 展示如何使用BaseService减少重复代码
 */
import { BaseService } from '../base/BaseService';
import type { GameConfig } from '../GameConfig';
import type { FacilityInstance, FuelBuffer } from '../../types/facilities';
import { FacilityStatus } from '../../types/facilities';
import type { InventoryItem } from '../../types/index';
import { msToSeconds } from '../../utils/common';

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
  burnProgress: number; // 当前燃烧进度 (0-100)
  estimatedRunTime: number; // 秒
  isEmpty: boolean;
  isFull: boolean;
}

interface FuelInfo {
  id: string;
  name: string;
  fuelValue: number;
  pollution: number;
  accelerationMultiplier?: number;
  topSpeedMultiplier?: number;
}





export class RefactoredFuelService extends BaseService {
  private gameConfig?: GameConfig;
  private customFuelPriority: string[] | null = null;
  
  // 声明依赖
  protected dependencies = ['GameConfig'];

  constructor() {
    super();
    
    // 从存储加载自定义优先级
    this.customFuelPriority = this.loadFromStorage<string[]>('fuelPriority');
  }

  /**
   * 初始化依赖（重写父类方法）
   */
  protected initializeDependencies(): void {
    super.initializeDependencies();
    
    // 使用父类的依赖注入
    this.injectDependencies({
      gameConfig: 'GameConfig'
    });
  }

  /**
   * 设置自定义燃料优先级
   */
  setFuelPriority(priority: string[]): void {
    this.safe(() => {
      this.customFuelPriority = priority;
      this.saveToStorage(priority, 'fuelPriority');
    }, 'setFuelPriority');
  }

  /**
   * 获取当前燃料优先级
   */
  getFuelPriority(): string[] {
    return this.safe(() => {
      if (this.customFuelPriority) {
        return this.customFuelPriority;
      }
      
      // 使用默认优先级
      return this.gameConfig?.getFuelPriority() || [];
    }, 'getFuelPriority', []);
  }

  /**
   * 获取燃料信息
   */
  getFuelInfo(itemId: string): FuelInfo | null {
    return this.safe(() => {
      const item = this.dataService?.getItem(itemId);
      if (!item?.fuel_value) return null;

      return {
        id: item.id,
        name: item.name,
        fuelValue: parseFloat(item.fuel_value),
        pollution: item.fuel_emissions_multiplier || 1,
        accelerationMultiplier: item.fuel_acceleration_multiplier,
        topSpeedMultiplier: item.fuel_top_speed_multiplier
      };
    }, 'getFuelInfo', null);
  }

  /**
   * 获取所有燃料物品
   */
  getAllFuels(): FuelInfo[] {
    return this.safe(() => {
      const items = this.dataService?.getAllItems() || [];
      return items
        .filter(item => item.fuel_value && parseFloat(item.fuel_value) > 0)
        .map(item => ({
          id: item.id,
          name: item.name,
          fuelValue: parseFloat(item.fuel_value!),
          pollution: item.fuel_emissions_multiplier || 1,
          accelerationMultiplier: item.fuel_acceleration_multiplier,
          topSpeedMultiplier: item.fuel_top_speed_multiplier
        }))
        .sort((a, b) => b.fuelValue - a.fuelValue);
    }, 'getAllFuels', []);
  }

  /**
   * 检查物品是否可作为燃料
   */
  isFuel(itemId: string): boolean {
    return this.safe(() => {
      const item = this.dataService?.getItem(itemId);
      return !!(item?.fuel_value && parseFloat(item.fuel_value) > 0);
    }, 'isFuel', false);
  }

  /**
   * 获取推荐的燃料
   */
  getRecommendedFuel(availableFuels: string[]): string | null {
    return this.safe(() => {
      const priority = this.getFuelPriority();
      
      // 按优先级查找
      for (const fuelId of priority) {
        if (availableFuels.includes(fuelId)) {
          return fuelId;
        }
      }
      
      // 如果没有匹配优先级，选择燃烧值最高的
      const fuels = availableFuels
        .map(id => this.getFuelInfo(id))
        .filter(info => info !== null)
        .sort((a, b) => b!.fuelValue - a!.fuelValue);
      
      return fuels[0]?.id || null;
    }, 'getRecommendedFuel', null);
  }

  /**
   * 计算燃料消耗
   */
  calculateFuelConsumption(facilityId: string, recipe?: { energy_required?: number }): number {
    return this.safe(() => {
      const facility = this.dataService?.getItem(facilityId);
      if (!facility?.energy_source?.type) return 0;

      const baseConsumption = facility.energy_source.usage_priority || 1;
      const recipeFactor = recipe?.energy_required || 1;
      
      return baseConsumption * recipeFactor;
    }, 'calculateFuelConsumption', 0);
  }

  /**
   * 获取服务状态信息（重写父类方法）
   */
  getServiceInfo() {
    const baseInfo = super.getServiceInfo();
    return {
      ...baseInfo,
      storageKeys: ['fuelPriority'],
      customSettings: {
        hasFuelPriority: !!this.customFuelPriority,
        priorityCount: this.customFuelPriority?.length || 0
      }
    };
  }

  /**
   * 健康检查（重写父类方法）
   */
  async healthCheck() {
    const fuels = this.getAllFuels();
    return {
      healthy: fuels.length > 0,
      message: `Found ${fuels.length} fuel types`
    };
  }

  /**
   * 初始化设施的燃料缓存区
   */
  initializeFuelBuffer(facilityId: string): FuelBuffer | null {
    return this.safe(() => {
      // 从data.json获取机器信息
      const itemData = this.dataService?.getItem(facilityId);
      if (!itemData || !itemData.machine) {
        console.warn(`No machine data found for facility: ${facilityId}`);
        return null;
      }

      const machineData = itemData.machine;
      
      // 只有burner类型的机器需要燃料
      if (machineData.type !== 'burner') {
        return null;
      }

      // 从data.json读取燃料类别
      const fuelCategories = machineData.fuelCategories || [];
      if (fuelCategories.length === 0) {
        console.warn(`No fuel categories found for burner machine: ${facilityId}`);
        return null;
      }

      // 从data.json读取功率消耗（kW转换为MW）
      const powerConsumption = (machineData.usage || 0) / 1000; // kW to MW

      const constants = this.gameConfig?.getConstants();
      return {
        slots: [],
        maxSlots: constants?.fuel.defaultFuelSlots || 1,
        totalEnergy: 0,
        maxEnergy: this.gameConfig?.calculateMaxFuelStorage(powerConsumption) || 100,
        consumptionRate: powerConsumption,
        lastUpdate: Date.now()
      };
    }, 'initializeFuelBuffer', null);
  }

  /**
   * 更新燃料消耗
   */
  updateFuelConsumption(
    facility: FacilityInstance, 
    _deltaTime: number,
    isProducing: boolean = true
  ): FuelUpdateResult {
    return this.safe(() => {
      if (!facility.fuelBuffer) {
        return { success: false, reason: 'No fuel buffer' };
      }
      
      const buffer = facility.fuelBuffer;
      const currentTime = Date.now();
      const timeDelta = msToSeconds(currentTime - buffer.lastUpdate);
      
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
          slot.remainingEnergy -= remainingNeed;
          remainingNeed = 0;
        } else {
          remainingNeed -= slot.remainingEnergy;
          slot.remainingEnergy = 0;
          slot.quantity--;
          
          if (slot.quantity <= 0) {
            slotsToRemove.push(i);
          } else {
            const fuelItem = this.dataService?.getItem(slot.itemId);
            if (fuelItem?.fuel_value) {
              slot.remainingEnergy = parseFloat(fuelItem.fuel_value);
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
    }, 'updateFuelConsumption', { success: false, reason: 'Failed to update fuel consumption' });
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
    return this.safe(() => {
      if (!buffer) {
        return { success: false, reason: 'No fuel buffer' };
      }
      
      // 检查燃料是否兼容
      if (!this.isFuelCompatible(facilityId, itemId)) {
        return { success: false, reason: 'Incompatible fuel type' };
      }

      // 获取燃料能量值
      const fuelItem = this.dataService?.getItem(itemId);
      if (!fuelItem || !fuelItem.fuel_value) {
        return { success: false, reason: 'Not a fuel item' };
      }

      const fuelValue = parseFloat(fuelItem.fuel_value);
      const energyToAdd = fuelValue * quantity;

      // 检查是否有空间
      if (buffer.totalEnergy + energyToAdd > buffer.maxEnergy) {
        return { 
          success: false, 
          reason: 'Fuel buffer full',
          quantityRemaining: quantity
        };
      }

      // 添加到燃料槽
      const existingSlot = buffer.slots.find(slot => slot.itemId === itemId);
      if (existingSlot) {
        existingSlot.quantity += quantity;
        existingSlot.remainingEnergy = fuelValue * existingSlot.quantity;
      } else {
        buffer.slots.push({
          itemId,
          quantity,
          remainingEnergy: fuelValue * quantity
        });
      }

      buffer.totalEnergy += energyToAdd;
      buffer.lastUpdate = Date.now();

      return { 
        success: true, 
        quantityAdded: quantity,
        quantityRemaining: 0
      };
    }, 'addFuel', { success: false, reason: 'Failed to add fuel' });
  }

  /**
   * 自动补充燃料
   */
  autoRefuel(
    facility: FacilityInstance,
    getInventoryItem: (itemId: string) => InventoryItem
  ): AutoRefuelResult {
    return this.safe(() => {
      if (!facility.fuelBuffer) {
        return { success: false, itemsConsumed: {} };
      }
      
      const buffer = facility.fuelBuffer;
      const itemsConsumed: Record<string, number> = {};
      
      // 检查燃料缓存区是否已满
      const status = this.getFuelStatus(facility.fuelBuffer);
      if (status.isFull) {
        return { success: true, itemsConsumed: {} };
      }

      // 尝试添加燃料
      const priority = this.getFuelPriority();
      for (const fuelItemId of priority) {
        const fuelInventory = getInventoryItem(fuelItemId);
        if (fuelInventory.currentAmount > 0) {
          // 检查燃料是否兼容
          if (this.isFuelCompatible(facility.facilityId, fuelItemId)) {
            const result = this.addFuel(buffer, fuelItemId, 1, facility.facilityId);
            if (result.success) {
              itemsConsumed[fuelItemId] = 1;
              return { success: true, itemsConsumed };
            }
          }
        }
      }

      return { success: false, itemsConsumed: {} };
    }, 'autoRefuel', { success: false, itemsConsumed: {} });
  }

  /**
   * 获取燃料状态信息
   */
  getFuelStatus(buffer: FuelBuffer): FuelStatus {
    return this.safe(() => {
      const totalEnergy = this.calculateTotalEnergy(buffer);
      const runTime = buffer.consumptionRate > 0 ? totalEnergy / buffer.consumptionRate : 0;
      
      // 计算当前燃烧进度
      let burnProgress = 0;
      if (buffer.slots.length > 0) {
        const currentSlot = buffer.slots[0];
        const item = this.dataService?.getItem(currentSlot.itemId);
        const totalItemEnergy = (item?.fuel_value ? parseFloat(item.fuel_value) : 0) * currentSlot.quantity;
        const remainingEnergy = currentSlot.remainingEnergy;
        burnProgress = totalItemEnergy > 0 ? (remainingEnergy / totalItemEnergy) * 100 : 0;
      }
      
      const constants = this.gameConfig?.getConstants();
      const fullThreshold = constants?.fuel.fuelBufferFullThreshold || 90;
      
      return {
        totalEnergy,
        maxEnergy: buffer.maxEnergy,
        fillPercentage: buffer.maxEnergy > 0 ? (totalEnergy / buffer.maxEnergy) * 100 : 0,
        burnProgress,
        estimatedRunTime: runTime,
        isEmpty: buffer.slots.length === 0 || totalEnergy === 0,
        isFull: totalEnergy >= buffer.maxEnergy * (fullThreshold / 100)
      };
    }, 'getFuelStatus', {
      totalEnergy: 0,
      maxEnergy: 0,
      fillPercentage: 0,
      burnProgress: 0,
      estimatedRunTime: 0,
      isEmpty: true,
      isFull: false
    });
  }

  /**
   * 智能燃料分配
   */
  smartFuelDistribution(
    facilities: FacilityInstance[],
    getInventoryItem: (itemId: string) => InventoryItem,
    updateInventory: (itemId: string, amount: number) => void
  ): void {
    this.safe(() => {
      // 获取需要燃料的burner设施
      const needsFuel = facilities
        .filter(f => {
          const itemData = this.dataService?.getItem(f.facilityId);
          return f.fuelBuffer && 
                 f.status !== FacilityStatus.STOPPED && 
                 itemData?.machine?.type === 'burner';
        });
      
      // 分配燃料
      for (const facility of needsFuel) {
        if (!facility.fuelBuffer) continue;
        
        const status = this.getFuelStatus(facility.fuelBuffer);
        if (status.isEmpty) {
          const result = this.autoRefuel(facility, getInventoryItem);
          if (result.success) {
            Object.entries(result.itemsConsumed).forEach(([itemId, amount]) => {
              updateInventory(itemId, -amount);
            });
          }
        }
      }
    }, 'smartFuelDistribution');
  }

  /**
   * 检查燃料是否与机器兼容
   */
  isFuelCompatible(facilityId: string, fuelItemId: string): boolean {
    return this.safe(() => {
      const itemData = this.dataService?.getItem(facilityId);
      if (!itemData || !itemData.machine) {
        return false;
      }

      const machineData = itemData.machine;
      
      // 只有burner类型的机器需要燃料
      if (machineData.type !== 'burner') {
        return false;
      }

      // 从data.json读取燃料类别
      const fuelCategories = machineData.fuelCategories || [];
      if (fuelCategories.length === 0) {
        return false;
      }

      // 获取燃料的类别
      const fuelCategory = this.gameConfig?.getFuelCategory(fuelItemId);
      if (!fuelCategory) {
        return false;
      }

      // 检查燃料类别是否匹配
      return fuelCategories.includes(fuelCategory);
    }, 'isFuelCompatible', false);
  }

  /**
   * 计算缓存区总能量
   */
  private calculateTotalEnergy(buffer: FuelBuffer): number {
    return buffer.slots.reduce((total, slot) => {
      const item = this.dataService?.getItem(slot.itemId);
      const energyPerItem = item?.fuel_value ? parseFloat(item.fuel_value) : 0;
      return total + slot.remainingEnergy + (energyPerItem * (slot.quantity - 1));
    }, 0);
  }
}