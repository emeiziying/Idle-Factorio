import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  Tabs,
  Tab,
  Grid,
  Divider,
  Stack,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Analytics as AnalyticsIcon,
  Inventory as InventoryIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import type { Item } from '../../types/index';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useItemRecipes } from '../../hooks/useItemRecipes';
import { useCrafting } from '../../hooks/useCrafting';
import { usePlayer } from '../../contexts/PlayerContext';
import ManualCraftingFlowCard from '../detail/ManualCraftingFlowCard';
import RecipeFlowCard from '../detail/RecipeFlowCard';
import UsageCard from '../detail/UsageCard';
import RecipeAnalysis from './RecipeAnalysis';

interface CompactItemDetailProps {
  item: Item;
}

const CompactItemDetail: React.FC<CompactItemDetailProps> = ({ item }) => {
  const [activeTab, setActiveTab] = useState(0);
  const isMobile = useIsMobile();
  const { player } = usePlayer();
  
  const { 
    recipes, 
    usedInRecipes, 
  } = useItemRecipes(item);
  
  const { handleCraft, handleManualCraft, showMessage, closeMessage } = useCrafting();

  const iconPath = `/icons/${item.icon}`;
  const inventory = player.inventory[item.id] || { count: 0 };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* 头部信息 - 更紧凑 */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar 
            src={iconPath} 
            alt={item.name}
            sx={{ 
              width: 48, 
              height: 48,
              bgcolor: 'action.hover'
            }} 
          />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
              {item.name}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip 
                icon={<InventoryIcon />}
                label={`库存: ${inventory.count}`}
                size="small"
                color={inventory.count > 0 ? "success" : "default"}
                sx={{ height: 20, fontSize: '0.75rem' }}
              />
              {item.stackSize && (
                <Typography variant="caption" color="text.secondary">
                  堆叠: {item.stackSize}
                </Typography>
              )}
            </Stack>
          </Box>
        </Stack>
      </Box>

      {/* 标签页 - 更紧凑 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{
            minHeight: 36,
            '& .MuiTab-root': {
              minHeight: 36,
              py: 0,
              fontSize: '0.875rem'
            }
          }}
        >
          <Tab label="配方" icon={<BuildIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
          <Tab label="分析" icon={<AnalyticsIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* 内容区域 */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {activeTab === 0 && (
          <Stack spacing={2}>
            {/* 手动制作配方 - 紧凑版 */}
            <Card variant="outlined">
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                  手动制作
                </Typography>
                <ManualCraftingFlowCard
                  item={item}
                  onCraft={handleManualCraft}
                />
              </CardContent>
            </Card>

            {/* 自动化配方 - 紧凑版 */}
            {recipes.length > 0 && (
              <Card variant="outlined">
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    自动化配方
                  </Typography>
                  <Stack spacing={1}>
                    {recipes.map((recipe, index) => (
                      <Box key={index}>
                        <RecipeFlowCard
                          recipe={recipe}
                          item={item}
                          onCraft={handleCraft}
                        />
                        {index < recipes.length - 1 && <Divider sx={{ my: 1 }} />}
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* 用途 - 紧凑版 */}
            {usedInRecipes.length > 0 && (
              <Card variant="outlined">
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    用途 ({usedInRecipes.length})
                  </Typography>
                  <UsageCard 
                    usedInRecipes={usedInRecipes} 
                    currentItemId={item.id}
                  />
                </CardContent>
              </Card>
            )}
          </Stack>
        )}

        {activeTab === 1 && (
          <Box>
            <RecipeAnalysis itemId={item.id} />
          </Box>
        )}
      </Box>

      {/* 消息提示 */}
      <Snackbar
        open={showMessage.open}
        autoHideDuration={3000}
        onClose={closeMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={closeMessage} 
          severity={showMessage.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {showMessage.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CompactItemDetail;