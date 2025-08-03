import { Build as BuildIcon } from '@mui/icons-material';
import { Badge, Box, Fab, Typography } from '@mui/material';
import React, { useEffect, useMemo } from 'react';

import CategoryTabs from '@/components/common/CategoryTabs';
import CraftingQueue from '@/components/production/CraftingQueue';
import ItemDetailPanel from '@/components/production/ItemDetailPanel';
import ItemList from '@/components/production/ItemList';

import { useCategoriesWithItems } from '@/hooks/useCategoriesWithItems';
import { useDataService } from '@/hooks/useDIServices';
import { useIsMobile } from '@/hooks/useIsMobile';
import useGameStore from '@/store/gameStore';
import type { Item } from '@/types/index';
import { useMemoizedFn, useUpdateEffect } from 'ahooks';

// 常量定义
const RESET_DELAY = 50;
const BOTTOM_POSITION = '72px';
const LEFT_POSITION = '16px';
const Z_INDEX = 1000;

const ProductionModule: React.FC = React.memo(() => {
  // 使用自定义 hook 管理分类
  const { categories, loading } = useCategoriesWithItems();

  // 从store获取UI状态
  const selectedCategory = useGameStore(state => state.production.selectedCategory);
  const selectedItem = useGameStore(state => state.production.selectedItem);
  const isItemJump = useGameStore(state => state.production.isItemJump);
  const showCraftingQueue = useGameStore(state => state.production.showCraftingQueue);
  const { selectProductionCategory, selectProductionItem, setProductionSelectedItem, resetItemJump, toggleCraftingQueue, setCraftingQueueVisible, autoSelectFirstItemIfNeeded, getFirstItemInCategory } = useGameStore();

  // 获取制作队列状态
  const craftingQueue = useGameStore(state => state.craftingQueue);
  const isMobile = useIsMobile();

  // 设置默认分类
  useEffect(() => {
    if (
      !loading &&
      categories.length > 0 &&
      (!selectedCategory || !categories.find(cat => cat.id === selectedCategory))
    ) {
      selectProductionCategory(categories[0].id);
    }
  }, [loading, categories, selectedCategory, selectProductionCategory]);

  const handleCategoryChange = useMemoizedFn((categoryId: string) => {
    selectProductionCategory(categoryId);
  });

  const handleItemSelect = useMemoizedFn((item: Item) => {
    selectProductionItem(item);
  });

  const handleToggleCraftingQueue = useMemoizedFn(() => {
    toggleCraftingQueue();
  });

  // 获取服务实例
  const dataService = useDataService();

  // 验证并修复存储的selectedItem（防止数据更新后失效）
  useEffect(() => {
    if (!loading && dataService?.isDataLoaded() && selectedItem) {
      // 检查存储的item是否还存在于当前数据中
      const currentItem = dataService.getItem(selectedItem.id);
      if (!currentItem) {
        // 如果item不存在了，清空选择
        setProductionSelectedItem(null);
      } else if (JSON.stringify(currentItem) !== JSON.stringify(selectedItem)) {
        // 如果item数据有更新，使用最新数据
        setProductionSelectedItem(currentItem);
      }
    }
  }, [loading, dataService, selectedItem, setProductionSelectedItem]);

  // 使用store中的computed getter（响应selectedCategory变化）
  const firstItemInCategory = useMemo(() => {
    if (loading) return null;
    return getFirstItemInCategory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, selectedCategory, getFirstItemInCategory]);

  // 当分类变化时，自动选中第一个物品（仅在手动切换分类时）
  useEffect(() => {
    if (!loading) {
      autoSelectFirstItemIfNeeded(firstItemInCategory);
    }
  }, [firstItemInCategory, loading, autoSelectFirstItemIfNeeded]);

  // 重置isItemJump标识（跳过首次渲染）
  useUpdateEffect(() => {
    if (isItemJump && selectedItem && selectedItem.category === selectedCategory) {
      // 延迟重置，确保UI已经稳定
      const timer = setTimeout(() => {
        resetItemJump();
      }, RESET_DELAY);
      return () => clearTimeout(timer);
    }
  }, [isItemJump, selectedItem, selectedCategory, resetItemJump]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Typography>Loading items...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* 分类标签 - 顶部 */}
      <Box sx={{ flexShrink: 0 }}>
        <CategoryTabs
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />
      </Box>

      {/* 主要内容区域 - 左右分割 */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* 左侧物品列表 */}
        <Box
          sx={{
            width: '25%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRight: 1,
            borderColor: 'divider',
          }}
        >
          <ItemList
            categoryId={selectedCategory}
            selectedItem={selectedItem}
            onItemSelect={handleItemSelect}
          />
        </Box>

        {/* 右侧物品详情 */}
        <Box
          sx={{
            flex: 1,
            overflow: 'hidden',
          }}
        >
          {selectedItem ? (
            <ItemDetailPanel item={selectedItem} onItemSelect={handleItemSelect} />
          ) : (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="100%"
              color="text.secondary"
            >
              <Typography variant="body2">请选择一个物品查看详情</Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* 制作队列入口按钮 - 左下角 */}
      <Box
        sx={{
          position: 'fixed',
          bottom: BOTTOM_POSITION, // 与清除存档按钮相同高度
          left: LEFT_POSITION, // 与清除存档按钮对称
          zIndex: Z_INDEX,
        }}
      >
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
              transition: 'all 0.2s ease',
            }}
          >
            <BuildIcon />
          </Fab>
        </Badge>
      </Box>

      {/* 制作队列弹窗 */}
      <CraftingQueue open={showCraftingQueue} onClose={() => setCraftingQueueVisible(false)} />
    </Box>
  );
});

ProductionModule.displayName = 'ProductionModule';

export default ProductionModule;
