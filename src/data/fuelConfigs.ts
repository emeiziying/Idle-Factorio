// 燃料系统配置

export type FuelCategory = 'chemical' | 'nuclear' | 'nutrients' | 'food';

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

// 燃料优先级（从低到高）
export const FUEL_PRIORITY = [
  'coal',           // 4 MJ - 优先使用煤炭
  'solid-fuel',     // 12 MJ - 其次使用固体燃料
  'rocket-fuel',    // 100 MJ - 高级燃料
  'nuclear-fuel',   // 1.21 GJ - 核燃料
  'wood'            // 2 MJ - 最后使用木材（通常另作他用）
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