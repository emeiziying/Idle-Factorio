import React from 'react';
import {
  Box,
  Typography,
  Snackbar,
  Alert,
  Divider
} from '@mui/material';
import type { Item } from '../../types/index';
import { useItemRecipes } from '../../hooks/useItemRecipes';
import { useCrafting } from '../../hooks/useCrafting';
import { useManualCraftingStatus } from '../../hooks/useManualCraftingStatus';
import ItemDetailHeader from '../detail/ItemDetailHeader';
import ManualCraftingCard from '../detail/ManualCraftingCard';
import RecipeFacilitiesCard from '../detail/RecipeFacilitiesCard';
import UsageCard from '../detail/UsageCard';
import InventoryManagementCard from '../detail/InventoryManagementCard';
import RecipeAnalysis from './RecipeAnalysis';

interface ItemDetailPanelProps {
  item: Item;
}

const ItemDetailPanel: React.FC<ItemDetailPanelProps> = ({ item }) => {
  const { 
    usedInRecipes, 
  } = useItemRecipes(item);
  
  const { handleManualCraft, showMessage, closeMessage } = useCrafting();
  const manualCraftingStatus = useManualCraftingStatus(item);

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.default'
    }}>
      {/* 头部 */}
      <Box sx={{ 
        flexShrink: 0,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}>
        <ItemDetailHeader 
          item={item} 
        />
      </Box>

      {/* 内容区域 */}
      <Box sx={{ 
        flex: 1,
        overflow: 'auto',
        p: 1,
        // 禁用过度滚动
        overscrollBehavior: 'none',
        // 平滑滚动
        scrollBehavior: 'smooth'
      }}>
        {/* 1. 手动合成配方（顶部） */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ 
            fontSize: '0.9rem',
            fontWeight: 600,
            color: manualCraftingStatus.color,
            mb: 1.5
          }}>
            {manualCraftingStatus.title}
          </Typography>
          
          <ManualCraftingCard 
            item={item} 
            onManualCraft={handleManualCraft}
          />
        </Box>

        {/* 2. 设施列表（显示当前物品配方的设施，带添加移除按钮） */}
        <RecipeFacilitiesCard item={item} />

        {/* 分隔线 */}
        <Divider sx={{ my: 2 }} />

        {/* 用途 */}
        <UsageCard usedInRecipes={usedInRecipes} />

        {/* 库存管理 */}
        <InventoryManagementCard item={item} />

        {/* 配方分析 */}
        <RecipeAnalysis 
          itemId={item.id} 
          unlockedItems={[]} // 这里可以传入已解锁的物品列表
        />
      </Box>

      {/* 消息提示 */}
      <Snackbar
        open={showMessage.open}
        autoHideDuration={4000}
        onClose={closeMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={closeMessage} 
          severity={showMessage.severity}
          sx={{ width: '100%' }}
        >
          {showMessage.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ItemDetailPanel;