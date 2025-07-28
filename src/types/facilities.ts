// 设施相关类型定义

export interface Facility {
  id: string;
  itemId: string;
  type: string;
  category: 'mining' | 'smelting' | 'crafting' | 'chemical' | 'research' | 'power-generation';
  count: number;
  baseSpeed: number;
  baseInputRate: Record<string, number>;
  baseOutputRate: number;
  powerType: 'electric' | 'fuel' | 'none';
  powerConsumption?: number;
  powerGeneration?: number;
}

// 燃料缓存区相关接口
export interface FuelBuffer {
  // 当前燃料槽
  slots: FuelSlot[];
  // 最大槽位数（石炉1个，钢炉1个）
  maxSlots: number;
  // 当前总能量 (MJ)
  totalEnergy: number;
  // 最大能量存储 (MJ)
  maxEnergy: number;
  // 能量消耗率 (MW)
  consumptionRate: number;
  // 上次更新时间
  lastUpdate: number;
}

export interface FuelSlot {
  // 燃料物品ID
  itemId: string;
  // 数量
  quantity: number;
  // 剩余能量 (MJ) - 当前正在燃烧的物品剩余能量
  remainingEnergy: number;
}

export interface FacilityInstance {
  id: string;
  facilityId: string;
  count: number;
  status: FacilityStatus;
  efficiency: number;
  powerConsumption?: number;
  powerGeneration?: number;
  production?: ProductionData;
  fuelBuffer?: FuelBuffer;  // 新增：燃料缓存区
}

export const FacilityStatus = {
  RUNNING: 'running',
  STOPPED: 'stopped',
  NO_POWER: 'no_power',
  NO_RESOURCE: 'no_resource',
  OUTPUT_FULL: 'output_full',
  NO_FUEL: 'no_fuel'  // 新增：无燃料状态
} as const;

export type FacilityStatus = typeof FacilityStatus[keyof typeof FacilityStatus];

export interface ProductionData {
  currentRecipeId?: string;
  progress: number;
  inputBuffer: ItemStack[];
  outputBuffer: ItemStack[];
}

export interface ItemStack {
  itemId: string;
  quantity: number;
}

// 电力系统类型
export interface PowerSystemState {
  totalGeneration: number;
  totalConsumption: number;
  efficiency: number;
  balance: number;
  status: 'surplus' | 'balanced' | 'deficit';
}

export interface PowerFacilityState {
  id: string;
  type: string;
  itemId: string;
  count: number;
  powerOutput?: number;
  powerConsumption?: number;
  fuelType?: string;
  fuelAvailable?: number;
  status: 'running' | 'fuel_shortage' | 'stopped';
}