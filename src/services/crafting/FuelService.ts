// 燃料服务 - 管理所有燃料相关逻辑

import { DataService } from '@/services/core/DataService';
import { GameConfig } from '@/services/core/GameConfig';
import { RecipeService } from '@/services/crafting/RecipeService';
import type { FacilityInstance } from '@/types/facilities';
import { FacilityStatus } from '@/types/facilities';
import type { InventoryItem } from '@/types/index';
import { msToSeconds } from '@/utils/common';
import { error as logError, warn as logWarn } from '@/utils/logger';

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
  /** 归属的设施ID，用于计算最大容量等配置 */
  facilityId?: string;
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
  private dataService: DataService;
  private gameConfig: GameConfig;
  private recipeService: RecipeService;
  private customFuelPriority: string[] | null = null;

  constructor(dataService: DataService, gameConfig: GameConfig, recipeService: RecipeService) {
    this.dataService = dataService;
    this.gameConfig = gameConfig;
    this.recipeService = recipeService;
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

    // 从data.json读取功率消耗（kW）
    const powerConsumption = machineData.usage || 0; // kW

    // 每个设施只需要1个燃料槽，不设置最大容量限制
    return {
      facilityId,
      slots: [
        {
          itemId: '',
          quantity: 0,
          remainingEnergy: 0,
        },
      ],
      acceptedCategories: machineData.fuelCategories || [],
      burnRate: powerConsumption,
      maxCapacity: 0, // 每个设施只有1个燃料，不限制容量
      totalEnergy: 0,
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
    if (!facility.fuelBuffer) {
      return { success: false, reason: 'No fuel buffer' };
    }
    const buffer = facility.fuelBuffer;
    const timeDelta = msToSeconds(_deltaTime);
    buffer.lastUpdate = Date.now();

    if (!isProducing || facility.status === 'stopped' || facility.isActive === false) {
      return { success: true, energyConsumed: 0 };
    }

    if (getInventoryItem && facility.production?.currentRecipeId) {
      const recipe = this.recipeService.getRecipeById(facility.production.currentRecipeId);
      if (recipe?.in) {
        for (const [itemId, required] of Object.entries(recipe.in)) {
          if (getInventoryItem(itemId).currentAmount < (required as number)) {
            return { success: true, energyConsumed: 0 };
          }
        }
      }
    }

    const burnRate = buffer.burnRate || buffer.consumptionRate || 0; // kW
    const energyNeeded = (burnRate * timeDelta * facility.efficiency) / 1000; // MJ

    let remainingNeed = energyNeeded;
    let energyConsumed = 0;

    if (buffer.slots.length > 0 && buffer.slots[0].itemId) {
      const slot = buffer.slots[0];
      const fuelItem = this.dataService.getItem(slot.itemId);
      const fuelValue = fuelItem?.fuel?.value || 0;

      while (remainingNeed > 0 && slot.quantity > 0) {
        const energyAvailable = slot.remainingEnergy;
        const energyToConsume = Math.min(remainingNeed, energyAvailable);

        slot.remainingEnergy -= energyToConsume;
        remainingNeed -= energyToConsume;
        energyConsumed += energyToConsume;

        if (slot.remainingEnergy <= 0) {
          slot.quantity--;
          if (slot.quantity > 0) {
            slot.remainingEnergy = fuelValue; // Refill from next item in stack
          } else {
            // Last item in stack consumed
            slot.itemId = '';
            slot.remainingEnergy = 0;
            break; // Exit loop, slot is empty
          }
        }
      }
    }

    buffer.totalEnergy = this.calculateTotalEnergy(buffer);

    if (energyConsumed === 0 && energyNeeded > 0) {
      return { success: false, reason: 'No fuel available', energyConsumed: 0 };
    }

    return { success: true, energyConsumed };
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
      return {
        success: false,
        reason: fuelCategory
          ? `Fuel category not accepted: ${fuelCategory}`
          : `Item is not a fuel: ${itemId}`,
      };
    }

    // 获取燃料能量值和设施配置
    const fuelItem = this.dataService.getItem(itemId);
    // TODO: This is a temporary fix, we should inject GameConfig properly
    const facilityConfig = this.gameConfig.getFacilityFuelConfig
      ? this.gameConfig.getFacilityFuelConfig(facilityId)
      : null;

    if (!fuelItem?.fuel || !facilityConfig) {
      return { success: false, reason: `Invalid fuel or facility config: ${itemId}` };
    }
    const fuelValue = fuelItem.fuel.value; // MJ
    const maxStack = facilityConfig.maxStackPerSlot;

    // 假设只有一个燃料槽
    const slot = buffer.slots[0];

    // 如果槽位为空，或燃料类型相同且未满
    if (!slot || !slot.itemId || (slot.itemId === itemId && slot.quantity < maxStack)) {
      if (!slot || !slot.itemId) {
        // 槽位为空，直接设置
        buffer.slots[0] = {
          itemId,
          quantity: 0,
          remainingEnergy: 0,
        };
      }

      const currentSlot = buffer.slots[0];
      const canAdd = maxStack - currentSlot.quantity;
      const quantityToAdd = Math.min(quantity, canAdd);

      if (quantityToAdd <= 0) {
        return { success: false, reason: 'Fuel slot is full', quantityRemaining: quantity };
      }

      // 如果是第一次添加燃料到空槽，设置当前燃烧的能量
      if (currentSlot.quantity === 0) {
        currentSlot.remainingEnergy = fuelValue;
      }
      currentSlot.quantity += quantityToAdd;

      buffer.totalEnergy = this.calculateTotalEnergy(buffer);
      buffer.lastUpdate = Date.now();

      return {
        success: true,
        quantityAdded: quantityToAdd,
        quantityRemaining: quantity - quantityToAdd,
      };
    }

    // 槽位被不同类型的燃料占满
    if (slot.itemId !== itemId) {
      return {
        success: false,
        reason: 'Fuel slot occupied by different fuel type',
        quantityRemaining: quantity,
      };
    }

    // 槽位已满
    return { success: false, reason: 'Fuel slot is full', quantityRemaining: quantity };
  }

  /**
   * 自动补充燃料
   */
  autoRefuel(
    facility: FacilityInstance,
    getInventoryItem: (itemId: string) => InventoryItem,
    updateInventory?: (itemId: string, amount: number) => void
  ): AutoRefuelResult {
    const buffer = facility.fuelBuffer;
    if (!buffer) return { success: false, itemsConsumed: {} };

    const facilityId = facility.facilityId || facility.itemId;
    if (!facilityId) return { success: false, itemsConsumed: {} };

    const itemData = this.dataService.getItem(facilityId);
    if (itemData?.machine?.type !== 'burner') return { success: false, itemsConsumed: {} };

    // TODO: This is a temporary fix, we should inject GameConfig properly
    const facilityConfig = this.gameConfig.getFacilityFuelConfig
      ? this.gameConfig.getFacilityFuelConfig(facilityId)
      : null;
    if (!facilityConfig) return { success: false, itemsConsumed: {} };

    const maxStack = facilityConfig.maxStackPerSlot;
    const slot = buffer.slots[0];

    // 如果燃料槽已满，则无需补充
    if (slot && slot.quantity >= maxStack) {
      return { success: true, itemsConsumed: {} };
    }

    const itemsConsumed: Record<string, number> = {};
    const priority = this.getFuelPriority();

    // 确定要补充的燃料类型和数量
    const fuelToRefill =
      slot && slot.itemId
        ? slot.itemId
        : priority.find(
            fuelItemId =>
              this.isFuelCompatible(facilityId, fuelItemId) &&
              getInventoryItem(fuelItemId).currentAmount > 0
          );

    if (!fuelToRefill) {
      return { success: false, itemsConsumed: {} }; // 没有兼容且可用的燃料
    }

    const currentQuantity = slot && slot.itemId === fuelToRefill ? slot.quantity : 0;
    const needed = maxStack - currentQuantity;
    if (needed <= 0) {
      return { success: true, itemsConsumed: {} };
    }

    const available = getInventoryItem(fuelToRefill).currentAmount;
    const quantityToAdd = Math.min(needed, available);

    if (quantityToAdd > 0) {
      const result = this.addFuel(buffer, fuelToRefill, quantityToAdd, facilityId);
      if (result.success && result.quantityAdded) {
        itemsConsumed[fuelToRefill] = (itemsConsumed[fuelToRefill] || 0) + result.quantityAdded;
        if (updateInventory) {
          updateInventory(fuelToRefill, -result.quantityAdded);
        }
      }
    }

    return { success: Object.keys(itemsConsumed).length > 0, itemsConsumed };
  }

  /**
   * 获取燃料状态信息
   */
  getFuelStatus(buffer: GenericFuelBuffer): FuelStatus {
    const totalEnergy = this.calculateTotalEnergy(buffer);
    const burnRate = buffer.burnRate || buffer.consumptionRate || 0;
    const runTime = burnRate > 0 ? totalEnergy / (burnRate / 1000) : 0; // burnRate is kW, need MW for MJ

    let burnProgress = 0;
    let maxEnergy = 0;

    if (buffer.slots && buffer.slots.length > 0 && buffer.slots[0].itemId) {
      const slot = buffer.slots[0];
      const item = this.dataService.getItem(slot.itemId);
      if (item) {
        // Check if item is defined
        const fuelValue = item?.fuel?.value || 0;
        if (fuelValue > 0) {
          burnProgress = (slot.remainingEnergy / fuelValue) * 100;
        }
        // 依据设施ID获取配置（buffer.facilityId 在初始化时注入）
        const facilityConfig = this.gameConfig.getFacilityFuelConfig
          ? this.gameConfig.getFacilityFuelConfig(buffer.facilityId || '')
          : null;
        if (facilityConfig) {
          maxEnergy = facilityConfig.maxStackPerSlot * fuelValue;
        }
      }
    }

    return {
      totalEnergy,
      maxEnergy,
      fillPercentage: maxEnergy > 0 ? (totalEnergy / maxEnergy) * 100 : 0,
      burnProgress,
      estimatedRunTime: runTime,
      isEmpty: totalEnergy === 0,
      isFull: totalEnergy >= maxEnergy && maxEnergy > 0,
    };
  }

  /**
   * 计算缓存区总能量
   */
  private calculateTotalEnergy(buffer: GenericFuelBuffer): number {
    if (buffer.slots.length === 0 || !buffer.slots[0].itemId) {
      return 0;
    }
    const slot = buffer.slots[0];
    const fuelItem = this.dataService.getItem(slot.itemId);
    if (!fuelItem?.fuel) {
      return 0;
    }
    const fuelValue = fuelItem.fuel.value; // MJ

    if (slot.quantity <= 0) {
      return 0;
    }

    // 总能量 = (满能量的物品数量 * 单个能量值) + 当前正在燃烧的物品的剩余能量
    return (slot.quantity - 1) * fuelValue + slot.remainingEnergy;
  }

  // 注意：曾有 isFuelBufferFull 方法，但当前逻辑不再需要，已移除以减少未使用警告

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
        const itemData = this.dataService.getItem(f.facilityId);
        return (
          f.fuelBuffer &&
          f.status !== FacilityStatus.STOPPED &&
          itemData?.machine?.type === 'burner'
        );
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
   * 燃料充足时的正常分配（每个设施只需覄1个燃料）
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
        // 为设施分配1个燃料
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
   * 燃料短缺时的智能分配（每个设施只需覄1个燃料）
   */
  private distributeFuelWithShortage(
    facilities: FacilityInstance[],
    fuelPriority: string[],
    fuelAvailable: Record<string, number>,
    updateInventory: (itemId: string, amount: number) => void
  ): void {
    // 按优先级（已在调用方排序）分配燃料
    for (const facility of facilities) {
      if (!facility.fuelBuffer) continue;

      const status = this.getFuelStatus(facility.fuelBuffer);
      if (status.isEmpty) {
        // 尝试为该高优先级设施找到任何可用燃料
        for (const fuelType of fuelPriority) {
          if (fuelAvailable[fuelType] > 0 && this.isFuelCompatible(facility.facilityId, fuelType)) {
            const result = this.addFuel(facility.fuelBuffer, fuelType, 1, facility.facilityId);
            if (result.success) {
              fuelAvailable[fuelType]--;
              updateInventory(fuelType, -1);
              // 成功为该设施添加燃料后，继续处理下一个设施
              // 而不是继续为同一个设施添加其他类型的燃料
              break;
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

// 示例用法
// const fuelService = new FuelService(dataService, gameConfig, recipeService);
// const buffer = fuelService.initializeFuelBuffer('stone-furnace');
// if (buffer) {
//   fuelService.addFuel(buffer, 'coal', 10, 'stone-furnace');
//   const status = fuelService.getFuelStatus(buffer);
//   console.log(status);
// }
