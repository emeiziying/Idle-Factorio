// 燃料系统配置

export type FuelCategory = 'chemical' | 'nuclear';

export interface FuelConfig {
  // 可接受的燃料类别
  acceptedCategories: FuelCategory[];
  // 燃料槽位数
  fuelSlots: number;
  // 单个槽位最大堆叠
  maxStackPerSlot: number;
  // 基础能耗 (MW)
  basePowerConsumption: number;
}

// 设施燃料配置
export const FACILITY_FUEL_CONFIGS: Record<string, FuelConfig> = {
  'stone-furnace': {
    acceptedCategories: ['chemical'],
    fuelSlots: 1,
    maxStackPerSlot: 50,
    basePowerConsumption: 0.18  // 180kW
  },
  'steel-furnace': {
    acceptedCategories: ['chemical'],
    fuelSlots: 1,
    maxStackPerSlot: 50,
    basePowerConsumption: 0.36  // 360kW (2x stone furnace)
  },
  'burner-mining-drill': {
    acceptedCategories: ['chemical'],
    fuelSlots: 1,
    maxStackPerSlot: 50,
    basePowerConsumption: 0.15  // 150kW
  },
  'burner-inserter': {
    acceptedCategories: ['chemical'],
    fuelSlots: 1,
    maxStackPerSlot: 50,
    basePowerConsumption: 0.0134  // 13.4kW
  },
  'locomotive': {
    acceptedCategories: ['chemical'],
    fuelSlots: 3,
    maxStackPerSlot: 50,
    basePowerConsumption: 0.6  // 600kW
  }
};

// 燃料优先级（从低到高）
export const FUEL_PRIORITY = [
  'wood',           // 2 MJ
  'coal',           // 4 MJ
  'solid-fuel',     // 12 MJ
  'rocket-fuel',    // 100 MJ
  'nuclear-fuel'    // 1.21 GJ
];

// 获取物品的燃料类别
export function getFuelCategory(itemId: string): FuelCategory | null {
  // 核燃料
  if (itemId === 'uranium-fuel-cell' || itemId === 'nuclear-fuel') {
    return 'nuclear';
  }
  // 化学燃料
  if (FUEL_PRIORITY.includes(itemId)) {
    return 'chemical';
  }
  return null;
}