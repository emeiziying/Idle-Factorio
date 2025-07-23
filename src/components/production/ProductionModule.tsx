import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import CategoryTabs from '../common/CategoryTabs';
import CategoryItemGrid from './CategoryItemGrid';
import CraftingQueue from './CraftingQueue';

import DataService from '../../services/DataService';
import type { Category } from '../../types/index';

const ProductionModule: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const dataService = DataService.getInstance();
        
        // 加载分类（按推荐顺序）
        const allCategories = dataService.getAllCategories();
        setCategories(allCategories);
        
        // 默认选择第一个分类（中间产品）
        if (allCategories.length > 0) {
          setSelectedCategory(allCategories[0].id);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to load production data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Typography>Loading items...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>

      
      {/* 分类标签 - 顶部 */}
      <Box sx={{ flexShrink: 0 }}>
        <CategoryTabs
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />
      </Box>
      
      {/* 物品网格 - 主要区域 */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        mt: 1,
        // 禁用过度滚动
        overscrollBehavior: 'none',
        // 平滑滚动
        scrollBehavior: 'smooth'
      }}>
        {selectedCategory && (
          <CategoryItemGrid categoryId={selectedCategory} />
        )}
      </Box>
      
      {/* 制作队列 - 底部 */}
      <Box sx={{ flexShrink: 0, mt: 1 }}>
        <CraftingQueue />
      </Box>
    </Box>
  );
};

export default ProductionModule;