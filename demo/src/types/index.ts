// 基于Factorio的核心类型定义

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export interface Icon {
  id: string;
  position: string;
  color: string;
}

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
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  row: number;
  time: number;
  producers: string[];
  in: { [itemId: string]: number };
  out: { [itemId: string]: number };
  unlockedBy?: string;
}

export interface EquipmentType {
  id: string;
  name: string;
  category: "mining" | "smelting" | "assembly" | "chemical" | "research";
  baseSpeed: number;
  powerType: "fuel" | "electric";
  powerConsumption?: number;
  fuelType?: "coal" | "wood" | "solid-fuel";
  cost: { [itemId: string]: number };
  canProduce: string[];
  efficiency: number;
  unlockedBy?: string;
}

export interface InventoryItem {
  itemId: string;
  currentAmount: number;
  maxCapacity: number;
  productionRate: number;
  consumptionRate: number;
  status: 'producing' | 'stopped' | 'insufficient' | 'inventory_full' | 'researching' | 'normal';
}

export interface CraftingTask {
  id: string;
  itemId: string;
  quantity: number;
  progress: number;
  totalTime: number;
  status: 'in_progress' | 'waiting' | 'blocked';
  startTime: number;
}

// 六大分类配置
export const categoryTabs = [
  {
    id: "logistics",
    name: "物流系统",
    icon: "📦",
    color: "#22C55E",
    description: "传送带、机械臂、箱子等物流设备",
  },
  {
    id: "production",
    name: "生产系统", 
    icon: "🏭",
    color: "#EAB308",
    description: "熔炉、装配机、采掘机等生产设备",
  },
  {
    id: "intermediate-products",
    name: "中间产品",
    icon: "⚙️",
    color: "#3B82F6",
    description: "铁板、铜板、电路板等中间产品",
  },
  {
    id: "combat",
    name: "战斗系统",
    icon: "⚔️",
    color: "#EF4444",
    description: "武器、弹药、护甲等军事装备",
  },
  {
    id: "fluids",
    name: "流体系统",
    icon: "🌊",
    color: "#06B6D4",
    description: "水、油、蒸汽等流体资源",
  },
  {
    id: "technology",
    name: "科技系统",
    icon: "🧪",
    color: "#8B5CF6",
    description: "科技包、实验室等研究设施",
  },
  {
    id: "facilities",
    name: "设施管理",
    icon: "🏭",
    color: "#EC4899",
    description: "查看和管理所有生产设施",
  },
];

export interface GameData {
  version: {
    base: string;
    DataRawJson: string;
  };
  categories: Category[];
  icons: Icon[];
  items: Item[];
  recipes?: Recipe[];
} 