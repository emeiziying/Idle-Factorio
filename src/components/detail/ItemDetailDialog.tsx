import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Snackbar,
  Alert
} from '@mui/material';
import { Analytics as AnalyticsIcon } from '@mui/icons-material';
import type { Item } from '../../types/index';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useItemRecipes } from '../../hooks/useItemRecipes';
import { useCrafting } from '../../hooks/useCrafting';
import ItemDetailHeader from './ItemDetailHeader';
import InventoryCard from './InventoryCard';
import ManualCraftingFlowCard from './ManualCraftingFlowCard';
import ProducerRecipeCard from './ProducerRecipeCard';
import RecipeFlowCard from './RecipeFlowCard';
import UsageCard from './UsageCard';
import RecipeAnalysis from '../production/RecipeAnalysis';

interface ItemDetailDialogProps {
  item: Item;
  open: boolean;
  onClose: () => void;
}

const ItemDetailDialog: React.FC<ItemDetailDialogProps> = ({
  item,
  open,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const isMobile = useIsMobile();
  
  const { 
    recipes, 
    usedInRecipes, 
    producerRecipes 
  } = useItemRecipes(item);
  
  const { handleCraft, handleManualCraft, showMessage, closeMessage } = useCrafting();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={isMobile ? false : "sm"}
      fullWidth={!isMobile}
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          ...(isMobile && {
            margin: 0,
            maxHeight: '100vh',
            height: '100vh',
            borderRadius: 0,
          })
        }
      }}
    >
      <ItemDetailHeader item={item} onClose={onClose} />

      <DialogContent 
        dividers 
        sx={{ 
          p: isMobile ? 1.5 : 2,
          '&.MuiDialogContent-dividers': {
            borderTop: isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
            borderBottom: isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
          }
        }}
      >
        {/* 标签页 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={activeTab} 
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
          >
            <Tab label="基本信息" />
            <Tab label="配方分析" icon={<AnalyticsIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <>
            {/* 库存信息 */}
            <InventoryCard item={item} />

            {/* 制作配方 */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  制作配方
                </Typography>
                
                {/* 手动合成配方 */}
                <ManualCraftingFlowCard 
                  item={item} 
                  onManualCraft={handleManualCraft}
                />
                
                {/* 生产设备配方 */}
                {producerRecipes.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom color="secondary.main">
                      生产设备配方
                    </Typography>
                    
                    {producerRecipes.map((recipe) => (
                      <ProducerRecipeCard 
                        key={recipe.id}
                        recipe={recipe}
                        onCraft={handleCraft}
                      />
                    ))}
                  </Box>
                )}
                
                {/* 其他配方 */}
                {recipes.map((recipe) => (
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
          </>
        )}

        {activeTab === 1 && (
          <RecipeAnalysis 
            itemId={item.id} 
            unlockedItems={[]} // 这里可以传入已解锁的物品列表
          />
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: isMobile ? 2 : 3,
        pt: isMobile ? 1 : 2,
        gap: isMobile ? 1 : 0
      }}>
        <Button 
          onClick={onClose}
          size={isMobile ? "large" : "medium"}
          sx={{ 
            fontSize: isMobile ? '0.9rem' : '0.875rem',
            minWidth: isMobile ? 120 : 'auto'
          }}
        >
          关闭
        </Button>
      </DialogActions>

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
    </Dialog>
  );
};

export default ItemDetailDialog; 