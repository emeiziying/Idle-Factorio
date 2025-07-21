// 设施类型
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
  efficiency: number;
  status: 'running' | 'stopped' | 'no-fuel' | 'no-power' | 'no-input';
  fuelTypes?: string[];
  currentFuel?: string;
  produces?: string;
}

// 电力设施状态
export interface PowerFacilityState {
  facilityId: string;
  type: 'water-pump' | 'boiler' | 'steam-engine' | 'solar-panel' | 'nuclear-reactor';
  count: number;
  powerGeneration: number;
  powerConsumption: number;
  efficiency: number;
  status: 'running' | 'stopped' | 'no-fuel' | 'no-water';
  fuelConsumption?: number;
  waterConsumption?: number;
  steamConsumption?: number;
  steamProduction?: number;
  waterProduction?: number;
}

// 电力系统状态
export interface PowerSystemState {
  totalGeneration: number;
  totalConsumption: number;
  balance: number;
  efficiency: number;
  hasFuelShortage: boolean;
  hasWaterShortage: boolean;
  gridStatus: 'normal' | 'low-power' | 'no-power' | 'excess-power';
}

// 设施配置
export interface FacilityConfig {
  type: string;
  category: 'mining' | 'smelting' | 'crafting' | 'chemical' | 'research' | 'power-generation';
  baseSpeed: number;
  powerType: 'electric' | 'fuel' | 'none';
  powerConsumption?: number;
  powerGeneration?: number;
  fuelTypes?: string[];
}

// 设施生产状态
export interface FacilityProductionState {
  facilityId: string;
  itemId: string;
  productionRate: number;
  efficiency: number;
  inputItems: { [itemId: string]: number };
  outputItems: { [itemId: string]: number };
  bottleneck?: string;
}