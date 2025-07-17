import { Item, ItemCategory } from '../../types';

export const components: Item[] = [
  {
    id: 'iron_gear_wheel',
    name: '铁齿轮',
    category: ItemCategory.COMPONENTS,
    stackSize: 100,
    icon: '/icons/iron-gear-wheel.png',
    description: '基础机械部件'
  },
  {
    id: 'copper_cable',
    name: '铜线',
    category: ItemCategory.COMPONENTS,
    stackSize: 200,
    icon: '/icons/copper-cable.png',
    description: '电子元件的基础材料'
  },
  {
    id: 'electronic_circuit',
    name: '电路板',
    category: ItemCategory.COMPONENTS,
    stackSize: 200,
    icon: '/icons/electronic-circuit.png',
    description: '基础电子元件'
  },
  {
    id: 'advanced_circuit',
    name: '高级电路板',
    category: ItemCategory.COMPONENTS,
    stackSize: 200,
    icon: '/icons/advanced-circuit.png',
    description: '高级电子元件'
  },
  {
    id: 'processing_unit',
    name: '处理器',
    category: ItemCategory.COMPONENTS,
    stackSize: 100,
    icon: '/icons/processing-unit.png',
    description: '顶级电子元件'
  },
  {
    id: 'engine_unit',
    name: '内燃机',
    category: ItemCategory.COMPONENTS,
    stackSize: 50,
    icon: '/icons/engine-unit.png',
    description: '动力装置'
  },
  {
    id: 'pipe',
    name: '管道',
    category: ItemCategory.COMPONENTS,
    stackSize: 100,
    icon: '/icons/pipe.png',
    description: '流体传输部件'
  }
];