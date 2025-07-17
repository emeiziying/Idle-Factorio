import { Recipe, RecipeCategory, MachineType } from '../../types';

export const craftingRecipes: Recipe[] = [
  {
    id: 'iron_gear_wheel',
    name: '铁齿轮',
    ingredients: [{ itemId: 'iron_plate', amount: 2 }],
    products: [{ itemId: 'iron_gear_wheel', amount: 1 }],
    time: 0.5,
    category: RecipeCategory.CRAFTING,
    allowedMachines: [MachineType.ASSEMBLING_MACHINE],
    handCraftable: true
  },
  {
    id: 'copper_cable',
    name: '铜线',
    ingredients: [{ itemId: 'copper_plate', amount: 1 }],
    products: [{ itemId: 'copper_cable', amount: 2 }],
    time: 0.5,
    category: RecipeCategory.CRAFTING,
    allowedMachines: [MachineType.ASSEMBLING_MACHINE],
    handCraftable: true
  },
  {
    id: 'electronic_circuit',
    name: '电路板',
    ingredients: [
      { itemId: 'iron_plate', amount: 1 },
      { itemId: 'copper_cable', amount: 3 }
    ],
    products: [{ itemId: 'electronic_circuit', amount: 1 }],
    time: 0.5,
    category: RecipeCategory.CRAFTING,
    allowedMachines: [MachineType.ASSEMBLING_MACHINE],
    handCraftable: true
  },
  {
    id: 'pipe',
    name: '管道',
    ingredients: [{ itemId: 'iron_plate', amount: 1 }],
    products: [{ itemId: 'pipe', amount: 1 }],
    time: 0.5,
    category: RecipeCategory.CRAFTING,
    allowedMachines: [MachineType.ASSEMBLING_MACHINE],
    handCraftable: true
  },
  {
    id: 'engine_unit',
    name: '内燃机',
    ingredients: [
      { itemId: 'steel_plate', amount: 1 },
      { itemId: 'iron_gear_wheel', amount: 1 },
      { itemId: 'pipe', amount: 2 }
    ],
    products: [{ itemId: 'engine_unit', amount: 1 }],
    time: 10,
    category: RecipeCategory.CRAFTING,
    allowedMachines: [MachineType.ASSEMBLING_MACHINE],
    handCraftable: true
  }
];