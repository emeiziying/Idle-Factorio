import { Box, Typography } from '@mui/material';
import React, { useEffect } from 'react';

import CategoryTabs from '@/components/common/CategoryTabs';
import CraftingQueue from '@/components/production/CraftingQueue';
import ItemDetailPanel from '@/components/production/ItemDetailPanel';
import ItemList from '@/components/production/ItemList';

import { useCategoriesWithItems } from '@/hooks/useCategoriesWithItems';
import useGameStore from '@/store/gameStore';

const ProductionModule: React.FC = React.memo(() => {
  // 使用自定义 hook 管理分类
  const { categories } = useCategoriesWithItems();

  // 从store获取UI状态
  const selectedCategory = useGameStore(state => state.production.selectedCategory);
  const selectedItem = useGameStore(state => state.production.selectedItem);
  const isItemJump = useGameStore(state => state.production.isItemJump);
  const showCraftingQueue = useGameStore(state => state.production.showCraftingQueue);
  const selectProductionCategory = useGameStore(state => state.selectProductionCategory);
  const selectProductionItem = useGameStore(state => state.selectProductionItem);
  const resetItemJump = useGameStore(state => state.resetItemJump);
  const setCraftingQueueVisible = useGameStore(state => state.setCraftingQueueVisible);
  const autoSelectFirstItemIfNeeded = useGameStore(state => state.autoSelectFirstItemIfNeeded);
  const getFirstItemInCategory = useGameStore(state => state.getFirstItemInCategory);

  // 设置默认分类
  useEffect(() => {
    if (
      categories.length > 0 &&
      (!selectedCategory || !categories.find(cat => cat.id === selectedCategory))
    ) {
      selectProductionCategory(categories[0].id);
    }
  }, [categories, selectedCategory, selectProductionCategory]);

  // 当分类变化时，自动选中第一个物品（仅在手动切换分类时）
  useEffect(() => {
    const firstItem = getFirstItemInCategory();
    autoSelectFirstItemIfNeeded(firstItem);
  }, [selectedCategory, getFirstItemInCategory, autoSelectFirstItemIfNeeded]);

  // 重置isItemJump标识
  useEffect(() => {
    if (isItemJump && selectedItem?.category === selectedCategory) {
      const timer = setTimeout(resetItemJump, 50);
      return () => clearTimeout(timer);
    }
  }, [isItemJump, selectedItem?.category, selectedCategory, resetItemJump]);

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
          onCategoryChange={selectProductionCategory}
        />
      </Box>

      {/* 主要内容区域 - 左右分割 */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
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
            onItemSelect={selectProductionItem}
          />
        </Box>

        {/* 右侧物品详情 */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          {selectedItem ? (
            <ItemDetailPanel item={selectedItem} onItemSelect={selectProductionItem} />
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

      {/* 制作队列弹窗 */}
      <CraftingQueue open={showCraftingQueue} onClose={() => setCraftingQueueVisible(false)} />
    </Box>
  );
});

ProductionModule.displayName = 'ProductionModule';

export default ProductionModule;
