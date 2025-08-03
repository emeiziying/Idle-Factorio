import { useDataService } from '@/hooks/useDIServices';
import useGameStore from '@/store/gameStore';
import type { Category } from '@/types/index';
import { useCallback, useEffect, useState } from 'react';

/**
 * 自定义 Hook 用于管理有可用物品的分类列表
 * 会根据数据加载状态和科技解锁状态自动更新分类列表
 */
export const useCategoriesWithItems = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const dataService = useDataService();

  // 监听科技解锁状态变化
  const unlockedTechs = useGameStore(state => state.unlockedTechs);

  // 获取分类的函数
  const updateCategories = useCallback(() => {
    const availableCategories = dataService.getCategoriesWithAvailableItems();
    setCategories(availableCategories);
  }, [dataService]);

  // 初始化和科技解锁时更新分类列表
  useEffect(() => {
    updateCategories();
  }, [updateCategories, unlockedTechs]);

  return {
    categories,
  };
};
