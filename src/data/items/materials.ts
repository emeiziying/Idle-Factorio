import type { Item } from '../../types';
import { ItemCategory } from '../../types';

export const materials: Item[] = [
  {
    id: 'iron_plate',
    name: '铁板',
    category: ItemCategory.MATERIALS,
    stackSize: 100,
    icon: '/icons/iron-plate.png',
    description: '基础材料，由铁矿石冶炼而成'
  },
  {
    id: 'copper_plate',
    name: '铜板',
    category: ItemCategory.MATERIALS,
    stackSize: 100,
    icon: '/icons/copper-plate.png',
    description: '基础材料，由铜矿石冶炼而成'
  },
  {
    id: 'steel_plate',
    name: '钢板',
    category: ItemCategory.MATERIALS,
    stackSize: 100,
    icon: '/icons/steel-plate.png',
    description: '高级材料，由铁板进一步加工而成'
  },
  {
    id: 'stone_brick',
    name: '石砖',
    category: ItemCategory.MATERIALS,
    stackSize: 100,
    icon: '/icons/stone-brick.png',
    description: '建筑材料，由石头烧制而成'
  },
  {
    id: 'plastic_bar',
    name: '塑料',
    category: ItemCategory.MATERIALS,
    stackSize: 100,
    icon: '/icons/plastic-bar.png',
    description: '化工产品，用于高级制造'
  }
];