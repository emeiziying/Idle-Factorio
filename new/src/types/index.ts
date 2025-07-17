// 物品类别
export enum ItemCategory {
  RESOURCES = 'resources',      // 资源
  MATERIALS = 'materials',      // 材料
  COMPONENTS = 'components',    // 组件
  PRODUCTS = 'products',        // 产品
  SCIENCE = 'science',          // 科技
  MILITARY = 'military',        // 军事
  LOGISTICS = 'logistics',      // 物流
  PRODUCTION = 'production',    // 生产
  POWER = 'power'              // 电力
}

// 机器类型
export enum MachineType {
  FURNACE = 'furnace',
  ASSEMBLING_MACHINE = 'assembling_machine',
  CHEMICAL_PLANT = 'chemical_plant',
  REFINERY = 'refinery',
  CENTRIFUGE = 'centrifuge'
}

// 配方类别
export enum RecipeCategory {
  SMELTING = 'smelting',
  CRAFTING = 'crafting',
  CHEMISTRY = 'chemistry',
  OIL_PROCESSING = 'oil_processing',
  CENTRIFUGING = 'centrifuging'
}

// 物品数据模型
export interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  stackSize: number;
  icon: string;
  description?: string;
}

// 原料
export interface Ingredient {
  itemId: string;
  amount: number;
}

// 产品
export interface Product {
  itemId: string;
  amount: number;
  probability?: number;  // 可选，默认为1
}

// 配方数据模型
export interface Recipe {
  id: string;
  name: string;
  ingredients: Ingredient[];
  products: Product[];
  time: number;  // 秒
  category: RecipeCategory;
  allowedMachines: MachineType[];
  handCraftable: boolean;
}

// 机器数据模型
export interface Machine {
  id: string;
  name: string;
  type: MachineType;
  craftingSpeed: number;
  moduleSlots: number;
  energyUsage: number;  // kW
  pollution: number;
  dimensions: {
    width: number;
    height: number;
  };
}

// 生产者信息
export interface ProducerInfo {
  machineId: string;
  machineType: MachineType;
  count: number;
  rate: number;  // 每秒产量
  efficiency: number;
}

// 消费者信息
export interface ConsumerInfo {
  recipeId: string;
  productName: string;
  machineType: MachineType;
  rate: number;  // 每秒消耗量
  percentage: number;  // 占总消耗的百分比
}

// 生产数据模型
export interface ProductionData {
  itemId: string;
  producers: ProducerInfo[];
  consumers: ConsumerInfo[];
  productionRate: number;
  consumptionRate: number;
  currentStock: number;
  storageCapacity: number;
}

// 制作队列项
export interface CraftingQueueItem {
  id: string;
  recipeId: string;
  quantity: number;
  startTime: number;
  progress: number;
  status: 'waiting' | 'crafting' | 'completed';
}

// 放置的机器
export interface PlacedMachine {
  id: string;
  machineId: string;
  position: { x: number; y: number };
  recipeId: string | null;
  modules: string[];
}

// 生产速率
export interface ProductionRate {
  production: number;
  consumption: number;
  net: number;
}