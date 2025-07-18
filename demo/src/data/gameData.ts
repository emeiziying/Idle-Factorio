import {Item, Recipe, Category, StorageDevice} from '../types';

// 分类数据
export const categories: Category[] = [
  {
    id: 'logistics',
    name: '物流系统',
    icon: '📦',
    color: '#22C55E',
    description: '传送带、机械臂、箱子等物流设备',
  },
  {
    id: 'production',
    name: '生产系统',
    icon: '🏭',
    color: '#EAB308',
    description: '熔炉、装配机、采掘机等生产设备',
  },
  {
    id: 'intermediate-products',
    name: '中间产品',
    icon: '⚙️',
    color: '#3B82F6',
    description: '铁板、铜板、电路板等中间产品',
  },
  {
    id: 'combat',
    name: '战斗系统',
    icon: '⚔️',
    color: '#EF4444',
    description: '武器、弹药、护甲等军事装备',
  },
  {
    id: 'fluids',
    name: '流体系统',
    icon: '🌊',
    color: '#06B6D4',
    description: '水、油、蒸汽等流体资源',
  },
  {
    id: 'technology',
    name: '科技系统',
    icon: '🧪',
    color: '#8B5CF6',
    description: '科技包、实验室等研究设施',
  },
];

// 物品数据
export const items: {[id: string]: Item} = {
  'wood': {
    id: 'wood',
    name: '木材',
    category: 'intermediate-products',
    stack: 100,
    row: 0,
    fuel: {
      category: 'chemical',
      value: 2,
    },
  },
  'iron-ore': {
    id: 'iron-ore',
    name: '铁矿石',
    category: 'intermediate-products',
    stack: 50,
    row: 0,
  },
  'iron-plate': {
    id: 'iron-plate',
    name: '铁板',
    category: 'intermediate-products',
    stack: 100,
    row: 1,
  },
  'iron-chest': {
    id: 'iron-chest',
    name: '铁箱子',
    category: 'logistics',
    stack: 50,
    row: 1,
  },
  'coal': {
    id: 'coal',
    name: '煤炭',
    category: 'intermediate-products',
    stack: 50,
    row: 0,
    fuel: {
      category: 'chemical',
      value: 4,
    },
  },
  'stone': {
    id: 'stone',
    name: '石头',
    category: 'intermediate-products',
    stack: 50,
    row: 0,
  },
  'copper-ore': {
    id: 'copper-ore',
    name: '铜矿石',
    category: 'intermediate-products',
    stack: 50,
    row: 0,
  },
  'copper-plate': {
    id: 'copper-plate',
    name: '铜板',
    category: 'intermediate-products',
    stack: 100,
    row: 1,
  },
  'iron-gear-wheel': {
    id: 'iron-gear-wheel',
    name: '铁齿轮',
    category: 'intermediate-products',
    stack: 100,
    row: 2,
  },
  'electronic-circuit': {
    id: 'electronic-circuit',
    name: '电子电路',
    category: 'intermediate-products',
    stack: 200,
    row: 2,
  },
};

// 配方数据
export const recipes: {[id: string]: Recipe} = {
  'wood': {
    id: 'wood',
    name: '木材',
    category: 'intermediate-products',
    row: 0,
    time: 0.55,
    producers: [],
    in: {},
    out: {
      wood: 4,
    },
    cost: 25,
    isMining: true,
  },
  'iron-ore': {
    id: 'iron-ore',
    name: '铁矿石',
    category: 'intermediate-products',
    row: 0,
    time: 1,
    producers: ['burner-mining-drill', 'electric-mining-drill'],
    in: {},
    out: {
      'iron-ore': 1,
    },
    cost: 100,
    isMining: true,
  },
  'iron-plate': {
    id: 'iron-plate',
    name: '铁板',
    category: 'intermediate-products',
    row: 1,
    time: 3.5,
    producers: ['stone-furnace', 'steel-furnace', 'electric-furnace'],
    in: {
      'iron-ore': 1,
    },
    out: {
      'iron-plate': 1,
    },
  },
  'iron-chest': {
    id: 'iron-chest',
    name: '铁箱子',
    category: 'logistics',
    row: 1,
    time: 0.5,
    producers: ['assembling-machine-1', 'assembling-machine-2', 'assembling-machine-3'],
    in: {
      'iron-plate': 8,
    },
    out: {
      'iron-chest': 1,
    },
  },
  'iron-gear-wheel': {
    id: 'iron-gear-wheel',
    name: '铁齿轮',
    category: 'intermediate-products',
    row: 2,
    time: 0.5,
    producers: ['assembling-machine-1', 'assembling-machine-2', 'assembling-machine-3'],
    in: {
      'iron-plate': 2,
    },
    out: {
      'iron-gear-wheel': 1,
    },
  },
  'electronic-circuit': {
    id: 'electronic-circuit',
    name: '电子电路',
    category: 'intermediate-products',
    row: 2,
    time: 0.5,
    producers: ['assembling-machine-1', 'assembling-machine-2', 'assembling-machine-3'],
    in: {
      'copper-plate': 1,
      'iron-plate': 1,
    },
    out: {
      'electronic-circuit': 1,
    },
  },
};

// 存储设备数据
export const storageDevices: {[id: string]: StorageDevice} = {
  'iron-chest': {
    id: 'iron-chest',
    name: '铁箱子',
    capacity: 1000,
    itemType: 'solid',
    unlockedBy: 'automation',
  },
  'steel-chest': {
    id: 'steel-chest',
    name: '钢箱子',
    capacity: 2000,
    itemType: 'solid',
    unlockedBy: 'steel-processing',
  },
  'storage-tank': {
    id: 'storage-tank',
    name: '储液罐',
    capacity: 25000,
    itemType: 'fluid',
    unlockedBy: 'fluid-handling',
  },
};

// 初始游戏状态
export const initialGameState = {
  resources: {
    'wood': 10,
    'iron-ore': 5,
    'iron-plate': 0,
    'iron-chest': 2,
    'coal': 20,
    'stone': 10,
    'copper-ore': 5,
    'copper-plate': 0,
    'iron-gear-wheel': 0,
    'electronic-circuit': 0,
  },
  equipment: {},
  craftingQueue: [],
  unlockedTechnologies: ['automation'],
  selectedCategory: 'intermediate-products',
}; 