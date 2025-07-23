// 核心游戏类型定义

// 分类接口
export interface Category {
  id: string;
  name: string;
  icon?: string;
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
  fuel_value?: string;
  type?: string;
  unlocked?: boolean;
  container?: {
    size: number;
  };
  belt?: {
    speed: number;
  };
  machine?: any;
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
}

// 库存物品接口
export interface InventoryItem {
  itemId: string;
  currentAmount: number;
  maxCapacity: number;
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
    DataRawJson: string;
  };
  categories: Category[];
  items: Item[];
  recipes: Recipe[];
  icons: IconData[];
}

// 物品详情接口
export interface ItemDetails {
  item: Item;
  recipes: Recipe[];
  usedInRecipes: Recipe[];
}