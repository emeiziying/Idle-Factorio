import type { Item } from '../../types'
import { ItemCategory } from '../../types'

export const resources: Item[] = [
  {
    id: 'iron_ore',
    name: '铁矿石',
    category: ItemCategory.RESOURCES,
    stackSize: 50,
    icon: '/icons/iron-ore.png',
    description: '基础资源，用于冶炼铁板',
  },
  {
    id: 'copper_ore',
    name: '铜矿石',
    category: ItemCategory.RESOURCES,
    stackSize: 50,
    icon: '/icons/copper-ore.png',
    description: '基础资源，用于冶炼铜板',
  },
  {
    id: 'coal',
    name: '煤矿',
    category: ItemCategory.RESOURCES,
    stackSize: 50,
    icon: '/icons/coal.png',
    description: '燃料和化工原料',
  },
  {
    id: 'stone',
    name: '石头',
    category: ItemCategory.RESOURCES,
    stackSize: 50,
    icon: '/icons/stone.png',
    description: '用于制作石砖和混凝土',
  },
  {
    id: 'wood',
    name: '木材',
    category: ItemCategory.RESOURCES,
    stackSize: 100,
    icon: '/icons/wood.png',
    description: '基础建筑材料',
  },
]
