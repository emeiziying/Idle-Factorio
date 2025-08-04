import InventoryManagementCard from '@/components/detail/InventoryManagementCard';
import ItemDetailHeader from '@/components/detail/ItemDetailHeader';
import ManualCraftingCard from '@/components/detail/ManualCraftingCard';
import RecipeFacilitiesCard from '@/components/detail/RecipeFacilitiesCard';
import UsageCard from '@/components/detail/UsageCard';
import { useCrafting } from '@/hooks/useCrafting';
import { useItemRecipes } from '@/hooks/useItemRecipes';
import type { Item } from '@/types/index';
import { Alert, Box, Divider, Snackbar } from '@mui/material';
import React from 'react';

interface ItemDetailPanelProps {
  item: Item;
  onItemSelect?: (item: Item) => void;
}

const ItemDetailPanel: React.FC<ItemDetailPanelProps> = ({ item, onItemSelect }) => {
  const { usedInRecipes, hasFacilityRecipes } = useItemRecipes(item);

  const { showMessage, closeMessage } = useCrafting();

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      {/* 头部 */}
      <Box
        sx={{
          flexShrink: 0,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <ItemDetailHeader item={item} />
      </Box>

      {/* 内容区域 */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 1,
          // 禁用过度滚动
          overscrollBehavior: 'none',
          // 平滑滚动
          scrollBehavior: 'smooth',
        }}
      >
        {/* 1. 手动合成配方（顶部） */}
        <ManualCraftingCard
          item={item}
          onItemSelect={onItemSelect}
        />

        {/* 2. 设施列表（显示当前物品配方的设施，带添加移除按钮） */}
        <RecipeFacilitiesCard item={item} onItemSelect={onItemSelect} />

        {/* 分隔线 - 只在有设施配方时显示 */}
        {hasFacilityRecipes && <Divider sx={{ my: 2 }} />}

        {/* 用途 */}
        <UsageCard usedInRecipes={usedInRecipes} onItemSelect={onItemSelect} />

        {/* 库存管理 */}
        <InventoryManagementCard item={item} onItemSelect={onItemSelect} />
      </Box>

      {/* 消息提示 */}
      <Snackbar
        open={showMessage.open}
        autoHideDuration={4000}
        onClose={closeMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={closeMessage} severity={showMessage.severity} sx={{ width: '100%' }}>
          {showMessage.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ItemDetailPanel;
