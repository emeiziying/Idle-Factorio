import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Box, Typography } from '@mui/material';
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
  const [isItemJump, setIsItemJump] = useState(false); // 标识是否是通过物品跳转切换的分类
  const selectedItemRef = useRef<Item | null>(null);
  const selectedCategoryRef = useRef<string>('');
  
  // Keep refs in sync with state
  useEffect(() => {
    selectedItemRef.current = selectedItem;
  }, [selectedItem]);
  
  useEffect(() => {
    selectedCategoryRef.current = selectedCategory;
  }, [selectedCategory]);

  // 初始化数据加载
  useEffect(() => {
    const loadData = async () => {
      try {
        const dataService = DataService.getInstance();
        
        // 先加载游戏数据
        await dataService.loadGameData();
        
        // 加载分类（按推荐顺序），过滤掉没有可用物品的分类
        const allCategories = dataService.getAllCategories();
        const categoriesWithAvailableItems = allCategories
          .filter(category => category.id !== 'technology') // 过滤掉科技分类
          .filter(category => {
            const items = dataService.getItemsByCategory(category.id);
            return items.some(item => dataService.isItemUnlocked(item.id));
          });
        setCategories(categoriesWithAvailableItems);
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to load production data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []); // 只在组件挂载时执行一次

  // 设置默认分类
  useEffect(() => {
    if (!loading && categories.length > 0 && (!selectedCategory || !categories.find(cat => cat.id === selectedCategory))) {
      setSelectedCategory(categories[0].id);
    }
  }, [loading, categories, selectedCategory, setSelectedCategory]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedItem(null); // 切换分类时清空选中的物品
    setIsItemJump(false); // 手动切换分类，不是物品跳转
  };

  const handleItemSelect = (item: Item) => {
    // 设置选中的物品
    setSelectedItem(item);
    
    // 自动切换到该物品所属的分类
    if (item.category && item.category !== selectedCategory) {
      setIsItemJump(true); // 标记这是物品跳转引起的分类切换
      setSelectedCategory(item.category);
    }
  };

  // 获取当前分类的第一个物品作为默认选中项
  const firstItemInCategory = useMemo(() => {
    if (!selectedCategory || loading) {
      return null;
    }
    
    const dataService = DataService.getInstance();
    
    try {
      const itemsByRow = dataService.getItemsByRow(selectedCategory);
      const sortedRows = Array.from(itemsByRow.keys()).sort((a, b) => a - b);
      
      for (const row of sortedRows) {
        const items = itemsByRow.get(row) || [];
        if (items.length > 0) {
          return items[0];
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting first item for category', selectedCategory, ':', error);
      return null;
    }
  }, [selectedCategory, loading]);

  // 当分类变化时，自动选中第一个物品（仅在手动切换分类时）
  useEffect(() => {
    const currentSelectedItem = selectedItemRef.current;
    const currentSelectedCategory = selectedCategoryRef.current;
    
    // 只有在不是物品跳转的情况下才自动选择第一个物品
    if (firstItemInCategory && !loading && !isItemJump) {
      // 额外检查：如果当前选中的物品已经在正确的分类中，就不要覆盖它
      if (currentSelectedItem && currentSelectedItem.category === currentSelectedCategory) {
        return;
      }
      setSelectedItem(firstItemInCategory);
    }
  }, [firstItemInCategory, loading, isItemJump]);

  // 单独的useEffect来重置isItemJump标识
  useEffect(() => {
    if (isItemJump && selectedItem && selectedItem.category === selectedCategory) {
      // 延迟重置，确保UI已经稳定
      const timer = setTimeout(() => {
        setIsItemJump(false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isItemJump, selectedItem, selectedCategory]);

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
        overflow: 'hidden'
      }}>
        {/* 左侧物品列表 */}
        <Box sx={{ 
          width: '105px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRight: 1,
          borderColor: 'divider'
        }}>
          <ItemList
            categoryId={selectedCategory}
            selectedItem={selectedItem}
            onItemSelect={handleItemSelect}
          />
        </Box>
        
        {/* 右侧物品详情 */}
        <Box sx={{ 
          flex: 1,
          overflow: 'hidden'
        }}>
          {selectedItem ? (
            <ItemDetailPanel 
              item={selectedItem} 
              onItemSelect={handleItemSelect}
            />
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
      <Box sx={{ flexShrink: 0, borderTop: 1, borderColor: 'divider' }}>
        <CraftingQueue />
      </Box>
    </Box>
  );
};

export default ProductionModule;