import { useState, useEffect, useCallback } from 'react';
import { useDataService } from '@/hooks/useDIServices';
import useGameStore from '@/store/gameStore';
import type { Category } from '@/types/index';

/**
 * 自定义 Hook 用于管理有可用物品的分类列表
 * 会根据科技解锁状态自动更新分类列表
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

  // 初始化
  useEffect(() => {
    updateCategories();
  }, [updateCategories]);

  // 当科技解锁时，更新分类列表
  useEffect(() => {
    updateCategories();
  }, [unlockedTechs, updateCategories]);

  return {
    categories,
    loading: false, // 服务已初始化，不需要 loading 状态
    refreshCategories: updateCategories,
  };
};
