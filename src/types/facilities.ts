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

export interface FacilityInstance {
  id: string;
  facilityId: string;
  count: number;
  status: FacilityStatus;
  efficiency: number;
  powerConsumption?: number;
  powerGeneration?: number;
  production?: ProductionData;
}

export const FacilityStatus = {
  RUNNING: 'running',
  STOPPED: 'stopped',
  NO_POWER: 'no_power',
  NO_RESOURCE: 'no_resource',
  OUTPUT_FULL: 'output_full'
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