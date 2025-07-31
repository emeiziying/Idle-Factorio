// 燃料服务 - 管理所有燃料相关逻辑

import { DataService } from './DataService';
import { RecipeService } from './RecipeService';
import { GameConfig } from './GameConfig';
import type { FacilityInstance } from '@/types/facilities';
import { FacilityStatus } from '@/types/facilities';
import type { InventoryItem } from '@/types/index';
import { warn as logWarn, error as logError } from '@/utils/logger';
import { msToSeconds } from '@/utils/common';

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
// 燃料缓冲区类型 - 使用新的 slots 结构
export interface GenericFuelBuffer {
  slots: Array<{ itemId: string; quantity: number; remainingEnergy: number }>;
  totalEnergy: number;
  maxCapacity?: number;
  maxSlots?: number;
  burnRate?: number;
  consumptionRate?: number;
  maxEnergy?: number;
  lastUpdate?: number;
  acceptedCategories?: string[];
}

export interface FuelStatus {
  totalEnergy: number;
  maxEnergy: number;
  fillPercentage: number;
  burnProgress: number; // 当前燃烧进度 (0-100)
  estimatedRunTime: number; // 秒
  isEmpty: boolean;
  isFull: boolean;
}

export class FuelService {
  private static instance: FuelService;
  private dataService: DataService;
  private gameConfig: GameConfig;
  private customFuelPriority: string[] | null = null;
  
  private constructor() {
    this.dataService = DataService.getInstance();
    this.gameConfig = GameConfig.getInstance();
    // 从本地存储加载自定义优先级
    const stored = localStorage.getItem('fuelPriority');
    if (stored) {
      try {
        this.customFuelPriority = JSON.parse(stored);
      } catch (e) {
        logError('Failed to load fuel priority:', e);
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
    return this.customFuelPriority || this.gameConfig.getFuelPriority();
  }
  
  /**
   * 初始化设施的燃料缓存区
   */
  initializeFuelBuffer(facilityId: string): GenericFuelBuffer | null {
    // 从data.json获取机器信息
    const itemData = this.dataService.getItem(facilityId);
    if (!itemData || !itemData.machine) {
      logWarn(`No machine data found for facility: ${facilityId}`);
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
      logWarn(`No fuel categories found for burner machine: ${facilityId}`);
      return null;
    }

    // 从data.json读取功率消耗（W）
    const powerConsumption = machineData.usage || 0; // W

    const constants = this.gameConfig.getConstants();
    return {
      slots: Array(constants.fuel.defaultFuelSlots).fill(null).map(() => ({
        itemId: '',
        quantity: 0,
        remainingEnergy: 0
      })),
      acceptedCategories: machineData.fuelCategories || [],
      burnRate: powerConsumption,
      maxCapacity: this.gameConfig.calculateMaxFuelStorage(powerConsumption),
      totalEnergy: 0
    };
  }
  
  /**
   * 更新燃料消耗
   */
  updateFuelConsumption(
    facility: FacilityInstance, 
    _deltaTime: number,
    isProducing: boolean = true,
    getInventoryItem?: (itemId: string) => { currentAmount: number }
  ): FuelUpdateResult {
    // 检查燃料缓存区
    if (!facility.fuelBuffer) {
      return { success: false, reason: 'No fuel buffer' };
    }
    
    const buffer = facility.fuelBuffer;
    if (!buffer) {
      return { success: false, reason: 'No fuel available' };
    }
    // 使用传入的时间增量，而不是计算时间差
    const timeDelta = msToSeconds(_deltaTime);
    
    // 更新时间戳
    buffer.lastUpdate = Date.now();
    
    // 如果不在生产，不消耗燃料
    if (!isProducing || facility.status === 'stopped' || facility.isActive === false) {
      return { success: true, energyConsumed: 0 };
    }
    
    // 检查是否有足够的输入材料
    if (getInventoryItem && facility.production?.currentRecipeId) {
      const recipe = RecipeService.getRecipeById(facility.production.currentRecipeId);
      if (recipe && recipe.in) {
        // 检查所有输入材料是否充足
        for (const [itemId, required] of Object.entries(recipe.in)) {
          const inventory = getInventoryItem(itemId);
          if (inventory.currentAmount < (required as number)) {
            // 材料不足，不消耗燃料
            return { success: true, energyConsumed: 0 };
          }
        }
      }
    }
    
    // 计算需要消耗的能量
    const burnRate = buffer.burnRate || buffer.consumptionRate || 0;
    const energyNeeded = burnRate * timeDelta * facility.efficiency;
    
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
    
    // 计算实际消耗的能量
    const actualEnergyConsumed = energyNeeded - remainingNeed;
    
    // 如果完全没有燃料，返回失败
    if (actualEnergyConsumed === 0) {
      return { 
        success: false, 
        reason: 'No fuel available',
        energyConsumed: 0
      };
    }
    
    // 即使燃料不足，也返回成功，但返回实际消耗的能量
    return { 
      success: true, 
      energyConsumed: actualEnergyConsumed
    };
  }
  
  /**
   * 添加燃料到缓存区
   */
  addFuel(
    buffer: GenericFuelBuffer,
    itemId: string, 
    quantity: number,
    facilityId: string
  ): AddFuelResult {
    if (!buffer) {
      return { success: false, reason: 'No fuel buffer' };
    }
    
    // 检查燃料是否兼容
    if (!this.isFuelCompatible(facilityId, itemId)) {
      const fuelCategory = this.gameConfig.getFuelCategory(itemId);
      if (fuelCategory) {
        return { success: false, reason: `Fuel category not accepted: ${fuelCategory}` };
      } else {
        return { success: false, reason: `Item is not a fuel: ${itemId}` };
      }
    }

    // 获取燃料能量值
    const fuelItem = this.dataService.getItem(itemId);
    if (!fuelItem || !fuelItem.fuel) {
      return { success: false, reason: `Item is not a fuel: ${itemId}` };
    }

    const fuelValue = fuelItem.fuel.value;
    const energyToAdd = fuelValue * quantity;

    // 检查槽位限制
    if (buffer.slots.length >= (buffer.maxSlots || 1) && !buffer.slots.find(slot => slot.itemId === itemId)) {
      return { 
        success: false, 
        reason: 'No available fuel slots',
        quantityRemaining: quantity
      };
    }

    // 检查是否有空间
    if (buffer.totalEnergy + energyToAdd > (buffer.maxCapacity || 0)) {
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
  }
  
  /**
   * 自动补充燃料
   */
  autoRefuel(
    facility: FacilityInstance,
    getInventoryItem: (itemId: string) => InventoryItem,
    updateInventory?: (itemId: string, amount: number) => void
  ): AutoRefuelResult {
    // 检查燃料缓存区
    const buffer = facility.fuelBuffer;
    if (!buffer) {
      return { success: false, itemsConsumed: {} };
    }
    const itemsConsumed: Record<string, number> = {};
    
    // 从data.json获取机器信息
    const facilityId = facility.facilityId || facility.itemId;
    if (!facilityId) {
      return { success: false, itemsConsumed: {} };
    }
    const itemData = this.dataService.getItem(facilityId);
    if (!itemData || !itemData.machine) {
      return { success: false, itemsConsumed: {} };
    }

    const machineData = itemData.machine;
    
    // 只有burner类型的机器需要燃料
    if (machineData.type !== 'burner') {
      return { success: false, itemsConsumed: {} };
    }

    // 检查燃料缓存区是否已满
    if (this.isFuelBufferFull(facility)) {
      return { success: true, itemsConsumed: {} };
    }

    // 尝试添加燃料
    const priority = this.getFuelPriority();
    for (const fuelItemId of priority) {
      const fuelInventory = getInventoryItem(fuelItemId);
      if (fuelInventory.currentAmount > 0) {
        // 检查燃料是否兼容
        if (this.isFuelCompatible(facilityId!, fuelItemId)) {
          // 尝试添加所有可用的燃料
          const result = this.addFuel(buffer, fuelItemId, fuelInventory.currentAmount, facilityId!);
          if (result.success) {
            itemsConsumed[fuelItemId] = fuelInventory.currentAmount;
            // 更新库存
            if (updateInventory) {
              updateInventory(fuelItemId, -fuelInventory.currentAmount);
            }
            return { success: true, itemsConsumed };
          }
        }
      }
    }

    return { success: false, itemsConsumed: {} };
  }
  
  /**
   * 获取燃料状态信息
   */
  getFuelStatus(buffer: GenericFuelBuffer): FuelStatus {
    const totalEnergy = buffer.totalEnergy;
    const burnRate = buffer.burnRate || buffer.consumptionRate || 0;
    const runTime = burnRate > 0 ? totalEnergy / burnRate : 0;
    
    // 计算当前燃烧进度
    let burnProgress = 0;
    if (buffer.slots && buffer.slots.length > 0) {
      const currentSlot = buffer.slots[0]; // 假设第一个槽位是正在燃烧的
      const item = this.dataService.getItem(currentSlot.itemId);
      const totalItemEnergy = (item?.fuel?.value || 0) * currentSlot.quantity;
      const remainingEnergy = currentSlot.remainingEnergy;
      burnProgress = totalItemEnergy > 0 ? (remainingEnergy / totalItemEnergy) * 100 : 0;
    }
    
    const maxEnergy = buffer.maxEnergy || buffer.maxCapacity || 0;
    const threshold = this.gameConfig.getConstants().fuel.fuelBufferFullThreshold;
    
    return {
      totalEnergy,
      maxEnergy,
      fillPercentage: maxEnergy > 0 ? (totalEnergy / maxEnergy) * 100 : 0,
      burnProgress,
      estimatedRunTime: runTime,
      isEmpty: (!buffer.slots || buffer.slots.length === 0) || totalEnergy === 0,
      isFull: totalEnergy >= maxEnergy * (threshold / 100) // 使用配置的已满阈值
    };
  }
  
  /**
   * 计算缓存区总能量
   */
  private calculateTotalEnergy(buffer: GenericFuelBuffer): number {
    return buffer.slots.reduce((total: number, slot: { itemId: string; quantity: number; remainingEnergy: number }) => {
      const item = this.dataService.getItem(slot.itemId);
      const energyPerItem = item?.fuel?.value || 0;
      // 当前物品的剩余能量 + 剩余物品的总能量
      return total + slot.remainingEnergy + (energyPerItem * (slot.quantity - 1));
    }, 0);
  }
  


  
  /**
   * 检查燃料缓存区是否已满
   */
  private isFuelBufferFull(facility: FacilityInstance): boolean {
    const buffer = facility.fuelBuffer;
    if (!buffer) {
      return false;
    }
    
    const constants = this.gameConfig.getConstants();
    const status = this.getFuelStatus(buffer);
    return status.fillPercentage >= constants.fuel.fuelBufferFullThreshold; // 使用配置的已满阈值
  }
  
  // 设施优先级缓存 - 动态从data.json计算
  private facilityPriorityCache = new Map<string, number>();

  /**
   * 获取设施优先级 - 基于data.json中的设施属性动态计算
   */
  private getFacilityPriority(facilityId: string): number {
    // 检查缓存
    if (this.facilityPriorityCache.has(facilityId)) {
      return this.facilityPriorityCache.get(facilityId)!;
    }

    const itemData = this.dataService.getItem(facilityId);
    if (!itemData || !itemData.machine || itemData.machine.type !== 'burner') {
      // 非burner设施优先级最低
      this.facilityPriorityCache.set(facilityId, 100);
      return 100;
    }

    const machine = itemData.machine;
    let priority = 50; // 默认中等优先级

    // 根据entityType确定基础优先级
    switch (machine.entityType) {
      case 'mining-drill':
        // 采矿机 - 生产原材料，最高优先级
        priority = 1;
        break;
      case 'furnace':
        // 熔炉 - 冶炼基础材料，高优先级
        priority = 10;
        break;
      case 'boiler':
        // 锅炉 - 发电设备，中等优先级
        priority = 20;
        break;
      case 'inserter':
        // 机械臂 - 物流设备，低优先级
        priority = 30;
        break;
      default:
        // 其他设施 - 根据category调整
        if (itemData.category === 'production') {
          priority = 15; // 生产类设施中等偏高
        } else if (itemData.category === 'logistics') {
          priority = 35; // 物流类设施较低
        } else {
          priority = 40; // 其他类别较低
        }
    }

    // 根据设施速度微调优先级（速度越快优先级越高）
    if (machine.speed) {
      const speedAdjustment = Math.max(0, (1 - machine.speed) * 5);
      priority += speedAdjustment;
    }

    // 确保优先级在合理范围内
    priority = Math.max(1, Math.min(priority, 100));

    // 缓存结果
    this.facilityPriorityCache.set(facilityId, priority);
    return priority;
  }
  
  /**
   * 智能燃料分配
   * 基于设施优先级和燃料短缺情况
   * 只考虑burner类型的设施
   */
  smartFuelDistribution(
    facilities: FacilityInstance[],
    getInventoryItem: (itemId: string) => InventoryItem,
    updateInventory: (itemId: string, amount: number) => void
  ): void {
    // 获取需要燃料的burner设施，按优先级排序
    const needsFuel = facilities
      .filter(f => {
        // 只考虑burner类型的设施
        const itemData = DataService.getInstance().getItem(f.facilityId);
        return f.fuelBuffer && 
               f.status !== FacilityStatus.STOPPED && 
               itemData?.machine?.type === 'burner';
      })
      .sort((a, b) => {
        const aPriority = this.getFacilityPriority(a.facilityId);
        const bPriority = this.getFacilityPriority(b.facilityId);
        return aPriority - bPriority; // 优先级高的在前
      });
    
    // 计算总燃料需求和可用燃料
    const fuelPriority = this.getFuelPriority();
    const fuelDemand: Record<string, number> = {};
    const fuelAvailable: Record<string, number> = {};
    
    // 统计每个燃料类型的需求和可用量
    fuelPriority.forEach(fuelType => {
      fuelAvailable[fuelType] = getInventoryItem(fuelType).currentAmount;
      fuelDemand[fuelType] = 0;
    });
    
    // 计算每个burner设施需要的燃料
    needsFuel.forEach(facility => {
      if (!facility.fuelBuffer) return;
      
      const status = this.getFuelStatus(facility.fuelBuffer);
      if (status.isEmpty) {
        // 设施没有燃料，需要补充
        const facilityPriority = this.getFacilityPriority(facility.facilityId);
        
        // 根据设施优先级分配燃料需求
        for (const fuelType of fuelPriority) {
          if (this.isFuelCompatible(facility.facilityId, fuelType)) {
            // 高优先级设施获得更多燃料分配
            const demandMultiplier = facilityPriority <= 5 ? 3 : facilityPriority <= 15 ? 2 : 1;
            fuelDemand[fuelType] += demandMultiplier;
            break; // 只分配一种燃料类型
          }
        }
      }
    });
    
    // 检查是否有燃料短缺
    let hasShortage = false;
    for (const fuelType of fuelPriority) {
      if (fuelDemand[fuelType] > fuelAvailable[fuelType]) {
        hasShortage = true;
        break;
      }
    }
    
    if (hasShortage) {
      // 燃料短缺时的分配策略
      this.distributeFuelWithShortage(needsFuel, fuelPriority, fuelAvailable, updateInventory);
    } else {
      // 燃料充足时的正常分配
      this.distributeFuelNormally(needsFuel, fuelPriority, fuelAvailable, updateInventory);
    }
  }
  
  /**
   * 燃料充足时的正常分配
   */
  private distributeFuelNormally(
    facilities: FacilityInstance[],
    fuelPriority: string[],
    fuelAvailable: Record<string, number>,
    updateInventory: (itemId: string, amount: number) => void
  ): void {
    for (const facility of facilities) {
      if (!facility.fuelBuffer) continue;
      
      const status = this.getFuelStatus(facility.fuelBuffer);
      if (status.isEmpty) {
        // 为设施分配燃料
        for (const fuelType of fuelPriority) {
          if (fuelAvailable[fuelType] > 0 && this.isFuelCompatible(facility.facilityId, fuelType)) {
            const result = this.addFuel(facility.fuelBuffer!, fuelType, 1, facility.facilityId);
            if (result.success) {
              fuelAvailable[fuelType]--;
              updateInventory(fuelType, -1);
              break;
            }
          }
        }
      }
    }
  }
  
  /**
   * 燃料短缺时的智能分配
   */
  private distributeFuelWithShortage(
    facilities: FacilityInstance[],
    fuelPriority: string[],
    fuelAvailable: Record<string, number>,
    updateInventory: (itemId: string, amount: number) => void
  ): void {
    // 按优先级分配燃料
    for (const facility of facilities) {
      if (!facility.fuelBuffer) continue;
      
      const status = this.getFuelStatus(facility.fuelBuffer);
      if (status.isEmpty) {
        const facilityPriority = this.getFacilityPriority(facility.facilityId);
        
        // 为设施分配燃料
        for (const fuelType of fuelPriority) {
          if (fuelAvailable[fuelType] > 0 && this.isFuelCompatible(facility.facilityId, fuelType)) {
            // 高优先级设施获得更多燃料
            const allocationAmount = facilityPriority <= 5 ? Math.min(3, fuelAvailable[fuelType]) : 1;
            
            if (allocationAmount > 0) {
              const result = this.addFuel(facility.fuelBuffer!, fuelType, allocationAmount, facility.facilityId);
              if (result.success) {
                fuelAvailable[fuelType] -= allocationAmount;
                updateInventory(fuelType, -allocationAmount);
                break;
              }
            }
          }
        }
      }
    }
  }

  /**
   * 检查燃料是否与机器兼容
   */
  isFuelCompatible(facilityId: string, fuelItemId: string): boolean {
    return this.canUseFuel(facilityId, fuelItemId);
  }

  /**
   * 检查燃料是否与机器兼容（别名方法）
   */
  canUseFuel(facilityId: string, fuelItemId: string): boolean {
    // 从data.json获取机器信息
    const itemData = this.dataService.getItem(facilityId);
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
    const fuelCategory = this.gameConfig.getFuelCategory(fuelItemId);
    if (!fuelCategory) {
      return false;
    }

    // 检查燃料类别是否匹配
    return fuelCategories.includes(fuelCategory);
  }
}