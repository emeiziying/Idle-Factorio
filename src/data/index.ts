import { resources } from './items/resources';
import { materials } from './items/materials';
import { components } from './items/components';
import { smeltingRecipes } from './recipes/smelting';
import { craftingRecipes } from './recipes/crafting';
import { Item, Recipe } from '../types';

// 汇总所有物品
export const allItems: Item[] = [
  ...resources,
  ...materials,
  ...components
];

// 创建物品ID映射
export const itemsById: Record<string, Item> = allItems.reduce((acc, item) => {
  acc[item.id] = item;
  return acc;
}, {} as Record<string, Item>);

// 汇总所有配方
export const allRecipes: Recipe[] = [
  ...smeltingRecipes,
  ...craftingRecipes
];

// 创建配方ID映射
export const recipesById: Record<string, Recipe> = allRecipes.reduce((acc, recipe) => {
  acc[recipe.id] = recipe;
  return acc;
}, {} as Record<string, Recipe>);

// 获取物品的所有配方
export const getRecipesForItem = (itemId: string): Recipe[] => {
  return allRecipes.filter(recipe => 
    recipe.products.some(product => product.itemId === itemId)
  );
};

// 获取使用某物品的所有配方
export const getRecipesUsingItem = (itemId: string): Recipe[] => {
  return allRecipes.filter(recipe => 
    recipe.ingredients.some(ingredient => ingredient.itemId === itemId)
  );
};