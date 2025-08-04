// 核心游戏类型定义

import type { Technology } from '@/types/technology';

// 分类接口
export interface Category {
  id: string;
  name: string;
  icon?: string;
}

// 机器接口
export interface Machine {
  speed: number;
  type: 'burner' | 'electric';
  fuelCategories?: string[];
  usage: number; // 功率消耗（kW）
  pollution?: number;
  size: [number, number];
  entityType: string;
  locations?: string[];
  modules?: number;
  drain?: number;
  disallowedEffects?: string[];
  baseEffect?: {
    productivity?: number;
  };
}

// 物品接口
export interface Item {
  id: string;
  name: string;
  category: string;
  stack: number;
  row: number;
  subgroup?: string;
  description?: string;
  icon?: string;
  iconText?: string; // 图标文本（如温度标识 "165°"）
  fuel_value?: string;
  fuel?: {
    value: number;
    category?: string;
  };
  type?: string;
  unlocked?: boolean;
  container?: {
    size: number;
  };
  belt?: {
    speed: number;
  };
  machine?: Machine;
  technology?: {
    prerequisites?: string[];
    unlockedRecipes?: string[];
  };
}

// 研究触发器接口
export interface ResearchTrigger {
  type: 'craft-item' | 'build-entity' | 'mine-entity' | 'create-space-platform' | 'capture-spawner';
  item?: string; // craft-item类型使用
  entity?: string; // build-entity和mine-entity类型使用
  count?: number; // 需要的数量（默认为1）
}

// 配方接口
export interface Recipe {
  id: string;
  name: string;
  category: string;
  time: number;
  in: { [itemId: string]: number };
  out: { [itemId: string]: number };
  enabled?: boolean;
  energy_required?: number;
  producers?: string[];
  flags?: string[]; // 配方标志，如 'mining', 'recycling' 等
  locations?: string[]; // 生产位置
  cost?: number; // 生产成本
  disallowedEffects?: string[]; // 不允许的效果
  icon?: string; // 图标ID
  iconText?: string; // 图标文本（如温度标识 "500°"）

  // 科技相关新字段
  row?: number; // 科技树中的行位置
  count?: number; // 研究单位数量（配合time字段计算总时间）
  researchTrigger?: ResearchTrigger; // 研究触发条件
}

// 库存物品接口
export interface InventoryItem {
  itemId: string;
  currentAmount: number;

  // 堆叠系统
  stackSize: number; // 单堆叠大小（来自物品数据）
  baseStacks: number; // 基础堆叠数（默认1）
  additionalStacks: number; // 箱子提供的额外堆叠
  totalStacks: number; // 总堆叠数 = base + additional
  maxCapacity: number; // 总容量 = totalStacks × stackSize

  productionRate: number;
  consumptionRate: number;
  status: 'producing' | 'stopped' | 'insufficient' | 'inventory_full' | 'researching' | 'normal';
}

// 制作任务接口
export interface CraftingTask {
  id: string;
  recipeId: string;
  itemId: string;
  quantity: number;
  progress: number;
  startTime: number;
  craftingTime: number;
  status?: 'pending' | 'crafting' | 'completed';
  isManual?: boolean; // 是否为手动制作任务
  // 链式任务相关字段
  chainId?: string; // 所属任务链ID
  isIntermediateProduct?: boolean; // 是否为中间产物（不显示在库存中）
  dependsOnTasks?: string[]; // 依赖的任务ID列表
}

// 任务链接口
export interface CraftingChain {
  id: string;
  name: string; // 链式任务的显示名称（如"制作石炉(含依赖)"）
  tasks: CraftingTask[]; // 任务列表，按执行顺序排列
  finalProduct: {
    // 最终产物信息
    itemId: string;
    quantity: number;
  };
  status: 'pending' | 'crafting' | 'completed';
  totalProgress: number; // 整个链的总进度 (0-1)
  rawMaterialsConsumed?: Map<string, number>; // 已预先消耗的基础材料
}

// 图标数据接口
export interface IconData {
  id: string;
  position: string;
  color: string;
}

// 游戏数据结构
export interface GameData {
  version: {
    base: string;
    'elevated-rails': string;
    quality: string;
    'space-age': string;
  };
  categories: Category[];
  items: Item[];
  recipes: Recipe[];
  icons: IconData[];
  technologies?: Technology[]; // 科技数据（可选，向后兼容）
}

// 物品详情接口
export interface ItemDetails {
  item: Item;
  recipes: Recipe[];
  usedInRecipes: Recipe[];
}

// 存储配置接口 - 支持固体和液体存储
export interface StorageConfig {
  itemId: string; // 存储设备作为物品的ID
  name: string;
  category: 'solid' | 'liquid'; // 存储类型：固体或液体
  additionalStacks?: number; // 固体存储：提供的额外堆叠数
  fluidCapacity?: number; // 液体存储：液体容量（单位）
  recipe: { [itemId: string]: number }; // 制造配方
  craftingTime: number; // 制造时间（秒）
  description: string;
  dimensions?: string; // 尺寸（如 "3×3"）
  requiredTechnology?: string; // 需要的科技
}

// 向后兼容的别名
export type ChestConfig = StorageConfig;

// 已部署的存储容器
export interface DeployedContainer {
  id: string;
  chestType: string; // 箱子类型
  chestItemId: string; // 箱子物品ID
  targetItemId: string; // 为哪个物品提供存储
  additionalStacks: number; // 提供的堆叠数
  deployedAt: number; // 部署时间
}

// 操作结果接口
export interface OperationResult {
  success: boolean;
  reason?: string;
  message: string;
}

// 导出科技系统相关类型
export * from './technology';
