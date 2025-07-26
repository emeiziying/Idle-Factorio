import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Divider } from '@mui/material';
import CategoryTabs from '../common/CategoryTabs';
import ItemList from './ItemList';
import ItemDetailPanel from './ItemDetailPanel';
import CraftingQueue from './CraftingQueue';

import { DataService } from '../../services/DataService';
import { usePersistentState } from '../../hooks/usePersistentState';
import type { Category, Item } from '../../types/index';

const ProductionModule: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = usePersistentState<string>('production-selected-category', '');
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
        
        // 如果没有保存的分类或保存的分类不存在，则选择第一个分类
        if (allCategories.length > 0 && (!selectedCategory || !allCategories.find(cat => cat.id === selectedCategory))) {
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

  // 获取当前分类的第一个物品作为默认选中项
  const firstItemInCategory = useMemo(() => {
    if (!selectedCategory) return null;
    
    const dataService = DataService.getInstance();
    const itemsByRow = dataService.getItemsByRow(selectedCategory);
    const sortedRows = Array.from(itemsByRow.keys()).sort((a, b) => a - b);
    
    for (const row of sortedRows) {
      const items = itemsByRow.get(row) || [];
      if (items.length > 0) {
        return items[0];
      }
    }
    return null;
  }, [selectedCategory]);

  // 当分类变化时，自动选中第一个物品
  useEffect(() => {
    if (firstItemInCategory && !selectedItem) {
      setSelectedItem(firstItemInCategory);
    }
  }, [firstItemInCategory, selectedItem]);

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
      
      {/* 主要内容区域 - 左右分割 */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex',
        mt: 0.5,
        overflow: 'hidden'
      }}>
        {/* 左侧物品列表 */}
        <Box sx={{ 
          width: '100px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <ItemList
            categoryId={selectedCategory}
            selectedItem={selectedItem}
            onItemSelect={handleItemSelect}
          />
        </Box>
        
        {/* 分割线 */}
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        
        {/* 右侧物品详情 */}
        <Box sx={{ 
          flex: 1,
          overflow: 'hidden'
        }}>
          {selectedItem ? (
            <ItemDetailPanel item={selectedItem} />
          ) : (
            <Box 
              display="flex" 
              justifyContent="center" 
              alignItems="center" 
              height="100%"
              color="text.secondary"
            >
              <Typography variant="body2">
                请选择一个物品查看详情
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
      
      {/* 制作队列 - 底部 */}
      <Box sx={{ flexShrink: 0, mt: 1 }}>
        <CraftingQueue />
      </Box>
    </Box>
  );
};

export default ProductionModule;