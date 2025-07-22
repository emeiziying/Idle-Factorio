import { Facility } from './facilities';

// 分类类型
export interface Category {
  id: string;
  name: string;
  icon?: string;
  order?: number;
}

// 物品类型
export interface Item {
  id: string;
  name: string;
  category: string;
  subgroup?: string;
  description?: string;
  icon?: string;
  stack_size?: number;
  fuel_value?: string;
  type?: string;
  unlocked?: boolean;
  order?: string;
}

// 配方类型
export interface Recipe {
  id: string;
  name: string;
  category: string;
  time: number;
  in: { [itemId: string]: number };
  out: { [itemId: string]: number };
  unlocked?: boolean;
  order?: string;
}

// 库存物品类型
export interface InventoryItem {
  itemId: string;
  currentAmount: number;
  maxCapacity: number;
  productionRate: number;
  consumptionRate: number;
  status: 'producing' | 'stopped' | 'insufficient' | 'inventory_full' | 'researching' | 'normal';
}

// 游戏数据类型
export interface GameData {
  categories: Category[];
  items: Item[];
  recipes: Recipe[];
  technologies: Technology[];
  hash?: string;
}

// 科技类型
export interface Technology {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  prerequisites: string[];
  effects: TechnologyEffect[];
  unit: {
    count: number;
    time: number;
    ingredients: { [itemId: string]: number };
  };
  unlocked?: boolean;
  researched?: boolean;
  order?: string;
}

// 科技效果类型
export interface TechnologyEffect {
  type: 'unlock-recipe' | 'unlock-item' | 'modifier';
  recipe?: string;
  item?: string;
  modifier?: {
    type: string;
    value: number;
  };
}

// 制作任务类型
export interface CraftingTask {
  id: string;
  recipeId: string;
  quantity: number;
  progress: number;
  startTime: number;
}

// 游戏状态类型
export interface GameState {
  inventory: Map<string, InventoryItem>;
  facilities: Facility[];
  technologies: Map<string, Technology>;
  craftingQueue: CraftingTask[];
  currentResearch?: ResearchTask;
  lastUpdateTime: number;
}

// 研究任务类型
export interface ResearchTask {
  technologyId: string;
  progress: number;
  startTime: number;
}