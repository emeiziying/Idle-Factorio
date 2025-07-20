// 设施类型定义

export interface Facility {
  id: string;
  itemId: string;           // 生产的物品ID
  type: string;             // 设施类型（如"电力采掘机"）
  category: 'mining' | 'smelting' | 'crafting' | 'chemical' | 'research';
  count: number;            // 设施数量
  
  // 基础能力（单台设施）
  baseSpeed: number;        // 基础速度倍率
  baseInputRate: Record<string, number>;   // 输入需求 {物品ID: 数量/秒}
  baseOutputRate: number;   // 输出速率（物品/秒）
  
  // 能源需求
  powerType: 'electric' | 'fuel' | 'none';
  powerConsumption?: number; // 电力消耗（kW）
  fuelType?: string;        // 燃料类型
  
  // 配方信息
  recipeId?: string;        // 当前使用的配方
  canProduce: string[];     // 可以生产的物品列表
}

// 设施模板（从游戏数据加载）
export interface FacilityTemplate {
  id: string;
  name: string;
  category: string;
  baseSpeed: number;
  powerType: 'electric' | 'fuel' | 'none';
  powerConsumption?: number;
  fuelTypes?: string[];
  moduleSlots?: number;
  craftingCategories?: string[];
}

// 常见设施类型
export const FACILITY_TYPES = {
  // 采矿设施
  'burner-mining-drill': {
    name: '热力采掘机',
    category: 'mining' as const,
    baseSpeed: 0.25,
    powerType: 'fuel' as const,
    fuelTypes: ['coal', 'wood', 'solid-fuel'],
  },
  'electric-mining-drill': {
    name: '电力采掘机',
    category: 'mining' as const,
    baseSpeed: 0.5,
    powerType: 'electric' as const,
    powerConsumption: 90,
  },
  
  // 冶炼设施
  'stone-furnace': {
    name: '石质熔炉',
    category: 'smelting' as const,
    baseSpeed: 1,
    powerType: 'fuel' as const,
    fuelTypes: ['coal', 'wood', 'solid-fuel'],
  },
  'steel-furnace': {
    name: '钢质熔炉',
    category: 'smelting' as const,
    baseSpeed: 2,
    powerType: 'fuel' as const,
    fuelTypes: ['coal', 'wood', 'solid-fuel'],
  },
  'electric-furnace': {
    name: '电炉',
    category: 'smelting' as const,
    baseSpeed: 2,
    powerType: 'electric' as const,
    powerConsumption: 180,
  },
  
  // 装配设施
  'assembling-machine-1': {
    name: '装配机1型',
    category: 'crafting' as const,
    baseSpeed: 0.5,
    powerType: 'electric' as const,
    powerConsumption: 75,
  },
  'assembling-machine-2': {
    name: '装配机2型',
    category: 'crafting' as const,
    baseSpeed: 0.75,
    powerType: 'electric' as const,
    powerConsumption: 150,
  },
  'assembling-machine-3': {
    name: '装配机3型',
    category: 'crafting' as const,
    baseSpeed: 1.25,
    powerType: 'electric' as const,
    powerConsumption: 375,
  },
  
  // 化工设施
  'chemical-plant': {
    name: '化工厂',
    category: 'chemical' as const,
    baseSpeed: 1,
    powerType: 'electric' as const,
    powerConsumption: 210,
  },
  'oil-refinery': {
    name: '炼油厂',
    category: 'chemical' as const,
    baseSpeed: 1,
    powerType: 'electric' as const,
    powerConsumption: 420,
  },
  
  // 研究设施
  'lab': {
    name: '研究实验室',
    category: 'research' as const,
    baseSpeed: 1,
    powerType: 'electric' as const,
    powerConsumption: 60,
  },
};