import { useState, useEffect, useCallback } from 'react';
import { DataService } from '@/services/core/DataService';
import useGameStore from '@/store/gameStore';
import type { Category } from '@/types/index';

/**
 * 自定义 Hook 用于管理有可用物品的分类列表
 * 会根据数据加载状态和科技解锁状态自动更新分类列表
 */
export const useCategoriesWithItems = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // 监听科技解锁状态变化
  const unlockedTechs = useGameStore(state => state.unlockedTechs);

  // 获取分类的函数
  const updateCategories = useCallback(() => {
    const dataService = DataService.getInstance();

    if (!dataService.isDataLoaded()) {
      setCategories([]);
      setLoading(true);
      return;
    }

    const availableCategories = dataService.getCategoriesWithAvailableItems();
    setCategories(availableCategories);
    setLoading(false);
  }, []);

  // 初始化和数据加载
  useEffect(() => {
    const loadCategories = async () => {
      const dataService = DataService.getInstance();

      // 如果数据已加载，直接更新分类
      if (dataService.isDataLoaded()) {
        updateCategories();
        return;
      }

      // 如果数据未加载，先加载数据
      setLoading(true);
      try {
        await dataService.loadGameData();
        updateCategories();
      } catch (error) {
        console.error('Failed to load categories:', error);
        setCategories([]);
        setLoading(false);
      }
    };

    loadCategories();
  }, [updateCategories]);

  // 当科技解锁时，更新分类列表
  useEffect(() => {
    if (!loading) {
      updateCategories();
    }
  }, [unlockedTechs, loading, updateCategories]);

  return {
    categories,
    loading,
    refreshCategories: updateCategories,
  };
};
