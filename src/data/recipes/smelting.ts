import type { Recipe } from '../../types'
import { MachineType, RecipeCategory } from '../../types'

export const smeltingRecipes: Recipe[] = [
  {
    id: 'iron_plate',
    name: '铁板',
    ingredients: [{ itemId: 'iron_ore', amount: 1 }],
    products: [{ itemId: 'iron_plate', amount: 1 }],
    time: 3.2,
    category: RecipeCategory.SMELTING,
    allowedMachines: [MachineType.FURNACE],
    handCraftable: false, // 只能在熔炉中制作
  },
  {
    id: 'copper_plate',
    name: '铜板',
    ingredients: [{ itemId: 'copper_ore', amount: 1 }],
    products: [{ itemId: 'copper_plate', amount: 1 }],
    time: 3.2,
    category: RecipeCategory.SMELTING,
    allowedMachines: [MachineType.FURNACE],
    handCraftable: false,
  },
  {
    id: 'steel_plate',
    name: '钢板',
    ingredients: [{ itemId: 'iron_plate', amount: 5 }],
    products: [{ itemId: 'steel_plate', amount: 1 }],
    time: 16,
    category: RecipeCategory.SMELTING,
    allowedMachines: [MachineType.FURNACE],
    handCraftable: false,
  },
  {
    id: 'stone_brick',
    name: '石砖',
    ingredients: [{ itemId: 'stone', amount: 2 }],
    products: [{ itemId: 'stone_brick', amount: 1 }],
    time: 3.2,
    category: RecipeCategory.SMELTING,
    allowedMachines: [MachineType.FURNACE],
    handCraftable: false,
  },
]
