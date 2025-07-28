/**
 * 物品点击处理相关的自定义 Hook
 * 提供统一的物品点击处理逻辑
 */

import { useCallback } from 'react';
import type { Item } from '../types/index';
import { useDataService } from './useServices';
import Logger from '../utils/logger';

const logger = new Logger();
logger.configure({ prefix: '[Game] [UI]' });

/**
 * 物品点击处理 Hook
 * @param componentName 组件名称，用于日志
 * @param onItemSelect 物品选择回调函数
 * @returns 处理物品点击的函数
 */
export const useItemClick = (
  componentName: string,
  onItemSelect?: (item: Item) => void
) => {
  const dataService = useDataService();

  return useCallback((itemId: string) => {
    if (!itemId) {
      logger.warn(`${componentName}: No itemId provided`);
      return;
    }

    if (onItemSelect) {
      const clickedItem = dataService.getItem(itemId);
      if (clickedItem) {
        onItemSelect(clickedItem);
      } else {
        logger.warn(`${componentName}: Item not found:`, itemId);
      }
    } else {
      logger.debug(`${componentName}: onItemSelect callback not provided`);
    }
  }, [componentName, onItemSelect, dataService]);
};

/**
 * 批量物品点击处理 Hook
 * 处理多个物品的点击事件
 */
export const useItemsClick = (
  componentName: string,
  onItemSelect?: (item: Item) => void
) => {
  const handleItemClick = useItemClick(componentName, onItemSelect);

  return useCallback((itemIds: string[]) => {
    itemIds.forEach(itemId => handleItemClick(itemId));
  }, [handleItemClick]);
};

/**
 * 物品点击处理 Hook（带额外数据）
 * 在点击时可以传递额外的上下文数据
 */
export const useItemClickWithContext = <T = unknown>(
  componentName: string,
  onItemSelect?: (item: Item, context?: T) => void
) => {
  const dataService = useDataService();

  return useCallback((itemId: string, context?: T) => {
    if (!itemId) {
      logger.warn(`${componentName}: No itemId provided`);
      return;
    }

    if (onItemSelect) {
      const clickedItem = dataService.getItem(itemId);
      if (clickedItem) {
        onItemSelect(clickedItem, context);
      } else {
        logger.warn(`${componentName}: Item not found:`, itemId);
      }
    } else {
      logger.debug(`${componentName}: onItemSelect callback not provided`);
    }
  }, [componentName, onItemSelect, dataService]);
};

/**
 * 安全的物品点击处理 Hook
 * 包含错误边界和加载状态
 */
export const useSafeItemClick = (
  componentName: string,
  onItemSelect?: (item: Item) => void,
  onError?: (error: Error) => void
) => {
  const dataService = useDataService();

  return useCallback(async (itemId: string) => {
    try {
      if (!itemId) {
        throw new Error('No itemId provided');
      }

      if (!onItemSelect) {
        logger.debug(`${componentName}: onItemSelect callback not provided`);
        return;
      }

      const clickedItem = dataService.getItem(itemId);
      if (!clickedItem) {
        throw new Error(`Item not found: ${itemId}`);
      }

      onItemSelect(clickedItem);
    } catch (error) {
      logger.error(`${componentName}: Error handling item click:`, error);
      onError?.(error as Error);
    }
  }, [componentName, onItemSelect, onError, dataService]);
};