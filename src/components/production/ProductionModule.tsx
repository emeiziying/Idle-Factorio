import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Box, Typography, Fab, Badge } from '@mui/material';
import { Build as BuildIcon } from '@mui/icons-material';
import CategoryTabs from '../common/CategoryTabs';
import ItemList from './ItemList';
import ItemDetailPanel from './ItemDetailPanel';
import CraftingQueue from './CraftingQueue';

import { DataService } from '../../services/DataService';
import { useLocalStorageState } from 'ahooks';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useProductionLoop } from '../../hooks/useProductionLoop';
import useGameStore from '../../store/gameStore';
import type { Category, Item } from '../../types/index';

const ProductionModule: React.FC = React.memo(() => {
  // 智能初始categories状态：如果数据已加载则直接设置
  const [categories, setCategories] = useState<Category[]>(() => {
    const dataService = DataService.getInstance();
    if (dataService.isDataLoaded()) {
      const allCategories = dataService.getAllCategories();
      return allCategories.filter(category => category.id !== 'technology');
    }
    return [];
  });
  const [selectedCategory, setSelectedCategory] = useLocalStorageState<string>('production-selected-category', { defaultValue: '' });
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  // 智能初始loading状态：如果数据已加载则不显示loading
  const [loading, setLoading] = useState(() => {
    const dataService = DataService.getInstance();
    return !dataService.isDataLoaded();
  });
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

  // 初始化数据加载 - 优化版本，避免重复加载
  useEffect(() => {
    const loadData = async () => {
      try {
        const dataService = DataService.getInstance();
        
        // 优化：如果数据已经加载，直接加载分类而不显示loading
        if (dataService.isDataLoaded()) {
          // 数据已存在，直接加载分类
          const allCategories = dataService.getAllCategories();
          const nonTechCategories = allCategories.filter(category => category.id !== 'technology');
          setCategories(nonTechCategories);
          setLoading(false);
          return;
        }
        
        // 只有在需要加载数据时才显示loading
        setLoading(true);
        
        // 先加载游戏数据
        await dataService.loadGameData();
        
        // 检查数据是否真正加载完成
        if (!dataService.isDataLoaded()) {
          console.warn('Data not fully loaded, retrying...');
          await new Promise(resolve => setTimeout(resolve, 100));
          await dataService.loadGameData();
        }
        
        // 加载分类（按推荐顺序），优化性能
        const allCategories = dataService.getAllCategories();
        // Categories loaded
        
        // 性能优化：直接过滤科技分类，避免进一步的昂贵检查
        const nonTechCategories = allCategories.filter(category => category.id !== 'technology');
        
        // Available categories filtered (performance optimized)
        setCategories(nonTechCategories);
        
                  // Loading complete
        setLoading(false);
      } catch (error) {
        console.error('Failed to load production data:', error);
        setLoading(false);
      }
    };

    loadData();
    
    // 移除持续的数据检查定时器以提升性能
    // 如果需要热重载检测，可以通过其他更高效的方式实现
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
    
    // 确保数据已加载
    if (!dataService.isDataLoaded()) {
      return null;
    }
    
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
});

ProductionModule.displayName = 'ProductionModule';

export default ProductionModule;