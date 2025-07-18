// 物品类型定义
export interface Item {
  id: string;
  name: string;
  category: string;
  stack: number;
  row: number;
  fuel?: {
    category: string;
    value: number;
  };
}

// 配方类型定义
export interface Recipe {
  id: string;
  name: string;
  category: string;
  row: number;
  time: number;
  producers: string[];
  in: {[itemId: string]: number};
  out: {[itemId: string]: number};
  unlockedBy?: string;
  isMining?: boolean;
  cost?: number;
}

// 游戏状态类型定义
export interface GameState {
  resources: {[itemId: string]: number};
  equipment: {[itemId: string]: {[equipmentType: string]: any[]}};
  craftingQueue: CraftingTask[];
  unlockedTechnologies: string[];
  selectedCategory: string;
}

// 制作任务类型定义
export interface CraftingTask {
  id: string;
  type: 'mining' | 'crafting';
  itemId: string;
  quantity: number;
  progress: number;
  totalTime: number;
  createdAt: number;
  startedAt?: number;
  estimatedCompletion?: number;
}

// 存储设备类型定义
export interface StorageDevice {
  id: string;
  name: string;
  capacity: number;
  itemType: 'solid' | 'fluid';
  unlockedBy?: string;
}

// 库存上限类型定义
export interface InventoryLimit {
  itemId: string;
  currentAmount: number;
  maxCapacity: number;
  storageDevices: StorageDeviceInstance[];
  isFull: boolean;
}

export interface StorageDeviceInstance {
  type: string;
  capacity: number;
}

// 分类类型定义
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
} 