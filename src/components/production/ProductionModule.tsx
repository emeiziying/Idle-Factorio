import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Box, Typography, Fab, Badge } from '@mui/material';
import { Build as BuildIcon } from '@mui/icons-material';
import CategoryTabs from '../common/CategoryTabs';
import ItemList from './ItemList';
import ItemDetailPanel from './ItemDetailPanel';
import CraftingQueue from './CraftingQueue';

import { DataService } from '../../services/DataService';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useProductionLoop } from '../../hooks/useProductionLoop';
import useGameStore from '../../store/gameStore';
import type { Category, Item } from '../../types/index';

const ProductionModule: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = usePersistentState<string>('production-selected-category', '');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [isItemJump, setIsItemJump] = useState(false); // 标识是否是通过物品跳转切换的分类
  const [showCraftingQueue, setShowCraftingQueue] = useState(false); // 控制制作队列显示
  const selectedItemRef = useRef<Item | null>(null);
  const selectedCategoryRef = useRef<string>('');
  const loadingRef = useRef<boolean>(true);
  
  // 获取制作队列状态
  const craftingQueue = useGameStore((state) => state.craftingQueue);
  const isMobile = useIsMobile();
  
  // 启动生产循环
  useProductionLoop({ enabled: true });
  
  // Keep refs in sync with state
  useEffect(() => {
    selectedItemRef.current = selectedItem;
  }, [selectedItem]);
  
  useEffect(() => {
    selectedCategoryRef.current = selectedCategory;
  }, [selectedCategory]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  // 初始化数据加载 - 包含热重载时的数据重新加载
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const dataService = DataService.getInstance();
        
        // 先加载游戏数据
        await dataService.loadGameData();
        
        // 检查数据是否真正加载完成
        if (!dataService.isDataLoaded()) {
          console.warn('Data not fully loaded, retrying...');
          await new Promise(resolve => setTimeout(resolve, 100));
          await dataService.loadGameData();
        }
        
        // 加载分类（按推荐顺序），过滤掉没有可用物品的分类
        const allCategories = dataService.getAllCategories();
        // Categories loaded
        
        const categoriesWithAvailableItems = allCategories
          .filter(category => category.id !== 'technology') // 过滤掉科技分类
          .filter(category => {
            const items = dataService.getItemsByCategory(category.id);
            return items.some(item => dataService.isItemUnlocked(item.id));
          });
                  // Available categories filtered
        setCategories(categoriesWithAvailableItems);
        
                  // Loading complete
        setLoading(false);
      } catch (error) {
        console.error('Failed to load production data:', error);
        setLoading(false);
      }
    };

    loadData();
    
    // 热重载检测：监听DataService的数据变化
    const checkDataInterval = setInterval(() => {
      const dataService = DataService.getInstance();
      if (!dataService.isDataLoaded() && !loadingRef.current) {
        // Data lost during hot reload, reloading
        loadData();
      }
    }, 1000);

    return () => clearInterval(checkDataInterval);
  }, []); // 移除loading依赖，避免循环

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

  const handleToggleCraftingQueue = () => {
    setShowCraftingQueue(!showCraftingQueue);
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
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
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
      
      {/* 制作队列入口按钮 - 左下角 */}
      <Box sx={{ 
        position: 'fixed',
        bottom: isMobile ? '72px' : '72px', // 与清除存档按钮相同高度
        left: '16px', // 与清除存档按钮对称
        zIndex: 1000
      }}>
        <Badge 
          badgeContent={craftingQueue.length} 
          color="primary"
          invisible={craftingQueue.length === 0}
        >
          <Fab 
            color="primary" 
            size="small" // 与清除存档按钮相同尺寸
            aria-label="制作队列"
            onClick={handleToggleCraftingQueue}
            sx={{
              bgcolor: 'primary.main',
              width: isMobile ? '44px' : '48px', // 与清除存档按钮相同尺寸
              height: isMobile ? '44px' : '48px',
              '&:hover': {
                bgcolor: 'primary.dark',
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
              transition: 'all 0.2s ease'
            }}
          >
            <BuildIcon />
          </Fab>
        </Badge>
      </Box>

      {/* 制作队列弹窗 */}
      <CraftingQueue open={showCraftingQueue} onClose={() => setShowCraftingQueue(false)} />
    </Box>
  );
};

export default ProductionModule;