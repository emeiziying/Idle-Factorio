import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import CategoryTabs from '../common/CategoryTabs';
import CompactItemList from './CompactItemList';
import CompactItemDetail from './CompactItemDetail';
import CraftingQueue from './CraftingQueue';

import DataService from '../../services/DataService';
import type { Category, Item } from '../../types/index';

const ProductionModule: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const dataService = DataService.getInstance();
        
        // 先加载游戏数据
        await dataService.loadGameData();
        
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
    setSelectedItem(null); // 切换分类时清空选中的物品
  };

  const handleItemSelect = (item: Item) => {
    setSelectedItem(item);
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
      <Box sx={{ flexShrink: 0, borderBottom: 1, borderColor: 'divider' }}>
        <CategoryTabs
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />
      </Box>
      
      {/* 主要内容区域 - 左右分栏 */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* 左侧 - 物品列表 */}
        <Box sx={{ 
          width: { xs: '140px', sm: '200px', md: '240px' },
          flexShrink: 0,
          borderRight: 1,
          borderColor: 'divider',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <CompactItemList
            categoryId={selectedCategory}
            selectedItem={selectedItem}
            onItemSelect={handleItemSelect}
          />
        </Box>
        
        {/* 右侧 - 物品详情 */}
        <Box sx={{ 
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {selectedItem ? (
            <CompactItemDetail item={selectedItem} />
          ) : (
            <Box 
              display="flex" 
              justifyContent="center" 
              alignItems="center" 
              height="100%"
              color="text.secondary"
            >
              <Typography variant="body2">
                请从左侧选择一个物品查看详情
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
      
      {/* 制作队列 - 底部 */}
      <Box sx={{ flexShrink: 0, borderTop: 1, borderColor: 'divider' }}>
        <CraftingQueue />
      </Box>
    </Box>
  );
};

export default ProductionModule;