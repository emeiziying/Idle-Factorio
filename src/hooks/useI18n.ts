/**
 * 国际化相关的自定义 Hooks
 * 提供统一的名称获取和翻译功能
 */

import { useMemo } from 'react';
import type { Item, Recipe } from '@/types/index';
import { useDataService } from './useServices';

/**
 * 获取物品的国际化名称
 * @param item 物品对象或物品ID
 * @returns 物品的显示名称
 */
export const useItemName = (item?: Item | string | null): string => {
  const dataService = useDataService();

  return useMemo(() => {
    if (!item) return '';

    // 如果是字符串ID，先获取物品对象
    const itemObj = typeof item === 'string' ? dataService.getItem(item) : item;

    if (!itemObj) return typeof item === 'string' ? item : '';

    // 优先使用国际化名称，其次是原始名称，最后是ID
    return dataService.getI18nName(itemObj) || itemObj.name || itemObj.id;
  }, [item, dataService]);
};

/**
 * 获取分类的国际化名称
 * @param categoryId 分类ID
 * @returns 分类的显示名称
 */
export const useCategoryName = (categoryId?: string | null): string => {
  const dataService = useDataService();

  return useMemo(() => {
    if (!categoryId) return '';
    return dataService.getCategoryI18nName(categoryId) || categoryId;
  }, [categoryId, dataService]);
};

/**
 * 获取配方的国际化名称
 * @param recipe 配方对象或配方ID
 * @returns 配方的显示名称
 */
export const useRecipeName = (recipe?: Recipe | string | null): string => {
  const dataService = useDataService();

  return useMemo(() => {
    if (!recipe) return '';

    // 如果是字符串ID，先获取配方对象
    const recipeObj = typeof recipe === 'string' ? dataService.getRecipe(recipe) : recipe;

    if (!recipeObj) return typeof recipe === 'string' ? recipe : '';

    // 配方名称通常基于其主要产出物
    const mainOutput = Object.keys(recipeObj.out || {})[0];
    if (mainOutput) {
      const outputItem = dataService.getItem(mainOutput);
      if (outputItem) {
        return dataService.getI18nName(outputItem) || outputItem.name || outputItem.id;
      }
    }

    return recipeObj.name || recipeObj.id;
  }, [recipe, dataService]);
};

/**
 * 批量获取物品名称
 * @param items 物品列表或物品ID列表
 * @returns 物品名称映射
 */
export const useItemNames = (items: (Item | string)[]): Record<string, string> => {
  const dataService = useDataService();

  return useMemo(() => {
    const names: Record<string, string> = {};

    items.forEach((item) => {
      const itemId = typeof item === 'string' ? item : item.id;
      const itemObj = typeof item === 'string' ? dataService.getItem(item) : item;

      if (itemObj) {
        names[itemId] = dataService.getI18nName(itemObj) || itemObj.name || itemObj.id;
      }
    });

    return names;
  }, [items, dataService]);
};

/**
 * 获取带数量的物品名称
 * @param itemId 物品ID
 * @param quantity 数量
 * @returns 格式化的名称，如 "铁板 x5"
 */
export const useItemNameWithQuantity = (itemId?: string | null, quantity: number = 1): string => {
  const itemName = useItemName(itemId);

  return useMemo(() => {
    if (!itemName) return '';
    return quantity > 1 ? `${itemName} x${quantity}` : itemName;
  }, [itemName, quantity]);
};

/**
 * 获取本地化的数字格式
 * @param value 数值
 * @param decimals 小数位数
 * @returns 格式化的数字字符串
 */
export const useFormattedNumber = (value: number, decimals: number = 2): string => {
  return useMemo(() => {
    // 未来可以根据用户的语言设置使用不同的数字格式
    return value.toFixed(decimals);
  }, [value, decimals]);
};

/**
 * 获取本地化的时间格式
 * @param seconds 秒数
 * @returns 格式化的时间字符串，如 "1分30秒"
 */
export const useFormattedTime = (seconds: number): string => {
  return useMemo(() => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}秒`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes < 60) {
      return remainingSeconds > 0 ? `${minutes}分${remainingSeconds.toFixed(0)}秒` : `${minutes}分钟`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分` : `${hours}小时`;
  }, [seconds]);
};
