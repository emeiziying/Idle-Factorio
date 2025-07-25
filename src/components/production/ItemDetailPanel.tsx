import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Snackbar,
  Alert,
  useTheme
} from '@mui/material';
import type { Item } from '../../types/index';
import { useItemRecipes } from '../../hooks/useItemRecipes';
import { useCrafting } from '../../hooks/useCrafting';
import ItemDetailHeader from '../detail/ItemDetailHeader';
import ManualCraftingFlowCard from '../detail/ManualCraftingFlowCard';
import RecipeFlowCard from '../detail/RecipeFlowCard';
import UsageCard from '../detail/UsageCard';
import InventoryManagementCard from '../detail/InventoryManagementCard';
import RecipeAnalysis from './RecipeAnalysis';
import ManualCraftingValidator from '../../utils/manualCraftingValidator';

interface ItemDetailPanelProps {
  item: Item;
}

const ItemDetailPanel: React.FC<ItemDetailPanelProps> = ({ item }) => {
  const theme = useTheme();
  
  const { 
    recipes, 
    usedInRecipes, 
  } = useItemRecipes(item);
  
  const { handleCraft, handleManualCraft, showMessage, closeMessage } = useCrafting();

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column'
    }}>
      {/* 头部 */}
      <Box sx={{ 
        flexShrink: 0,
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <ItemDetailHeader 
          item={item} 
        />
      </Box>

      {/* 内容区域 */}
      <Box sx={{ 
        flex: 1,
        overflow: 'auto',
        p: 0.5,
        // 禁用过度滚动
        overscrollBehavior: 'none',
        // 平滑滚动
        scrollBehavior: 'smooth'
      }}>
        {/* 制作配方 */}
        <Card sx={theme.customStyles.layout.cardCompact}>
          <CardContent sx={{ p: theme.customStyles.spacing.compact }}>
            <Typography variant="subtitle2" gutterBottom sx={theme.customStyles.typography.subtitle}>
              制作配方
            </Typography>
            
            {/* 手动合成配方 */}
            <ManualCraftingFlowCard 
              item={item} 
              onManualCraft={handleManualCraft}
            />
            
            {/* 其他配方 - 排除已显示的手动合成配方 */}
            {recipes.filter(recipe => {
              const validator = ManualCraftingValidator.getInstance();
              const validation = validator.validateRecipe(recipe);
              return !validation.canCraftManually;
            }).map((recipe) => (
              <RecipeFlowCard 
                key={recipe.id}
                recipe={recipe}
                onCraft={handleCraft}
              />
            ))}
          </CardContent>
        </Card>

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