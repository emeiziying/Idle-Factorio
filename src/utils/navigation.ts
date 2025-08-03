/**
 * 导航工具函数
 * 提供全局的页面跳转和物品导航功能
 */

import type { Item } from '@/types/index';
import useGameStore from '@/store/gameStore';

/**
 * 跳转到生产模块查看指定物品
 * 这个函数可以从任何地方调用，实现跨模块物品跳转
 * 
 * @param item 要查看的物品
 * @param switchModule 是否同时切换到生产模块（需要外部实现）
 */
export const navigateToItem = (item: Item, switchModule?: () => void) => {
  const { selectProductionItem } = useGameStore.getState();
  
  // 使用智能方法选择物品（自动处理分类切换）
  selectProductionItem(item);
  
  // 如果提供了模块切换函数，执行切换
  if (switchModule) {
    switchModule();
  }
};

/**
 * 跳转到生产模块查看指定分类
 * 
 * @param categoryId 要查看的分类ID
 * @param switchModule 是否同时切换到生产模块（需要外部实现）
 */
export const navigateToCategory = (categoryId: string, switchModule?: () => void) => {
  const { selectProductionCategory } = useGameStore.getState();
  
  // 使用智能方法选择分类（自动清空物品选择）
  selectProductionCategory(categoryId);
  
  // 如果提供了模块切换函数，执行切换
  if (switchModule) {
    switchModule();
  }
};

/**
 * 创建通用的物品点击处理器
 * 返回一个可以直接用作onClick的函数
 * 
 * @param item 物品对象
 * @param switchModule 可选的模块切换函数
 * @returns 点击处理函数
 */
export const createItemClickHandler = (item: Item, switchModule?: () => void) => {
  return () => navigateToItem(item, switchModule);
};

/**
 * 检查当前是否在生产模块查看指定物品
 * 
 * @param itemId 物品ID
 * @returns 是否正在查看该物品
 */
export const isViewingItem = (itemId: string): boolean => {
  const { production } = useGameStore.getState();
  return production.selectedItem?.id === itemId;
};

/**
 * 检查当前是否在生产模块查看指定分类
 * 
 * @param categoryId 分类ID
 * @returns 是否正在查看该分类
 */
export const isViewingCategory = (categoryId: string): boolean => {
  const { production } = useGameStore.getState();
  return production.selectedCategory === categoryId;
};