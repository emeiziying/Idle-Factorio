import InventoryManagementCard from '@/components/detail/InventoryManagementCard';
import ItemDetailHeader from '@/components/detail/ItemDetailHeader';
import ManualCraftingCard from '@/components/detail/ManualCraftingCard';
import RecipeFacilitiesCard from '@/components/detail/RecipeFacilitiesCard';
import UsageCard from '@/components/detail/UsageCard';
import { useCrafting } from '@/hooks/useCrafting';
import { useItemRecipes } from '@/hooks/useItemRecipes';
import type { Item, Recipe } from '@/types/index';
import { Alert, Box, Divider, Snackbar } from '@mui/material';
import { keyframes } from '@emotion/react';
import React, { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface ItemDetailPanelProps {
  item: Item;
  onItemSelect?: (item: Item) => void;
}

interface FloatingTextEntry {
  id: number;
  text: string;
  x: number;
  y: number;
}

const floatUp = keyframes`
  0%   { opacity: 1; transform: translateX(-50%) translateY(0);     }
  100% { opacity: 0; transform: translateX(-50%) translateY(-64px); }
`;

const ItemDetailPanel: React.FC<ItemDetailPanelProps> = ({ item, onItemSelect }) => {
  const { usedInRecipes, hasFacilityRecipes } = useItemRecipes(item);
  const { handleManualCraft, showMessage, closeMessage } = useCrafting();

  const [floatingTexts, setFloatingTexts] = useState<FloatingTextEntry[]>([]);
  const idRef = useRef(0);

  const addFloatingText = useCallback(
    (text: string, event?: React.MouseEvent<HTMLButtonElement>) => {
      if (!event) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const id = ++idRef.current;
      setFloatingTexts(prev => [...prev, { id, text, x: rect.left + rect.width / 2, y: rect.top }]);
      setTimeout(() => setFloatingTexts(prev => prev.filter(t => t.id !== id)), 800);
    },
    []
  );

  const onManualCraft = useCallback(
    (
      itemId: string,
      quantity: number,
      recipe: Recipe,
      event?: React.MouseEvent<HTMLButtonElement>
    ) => {
      const result = handleManualCraft(itemId, quantity, recipe);
      if (result !== null) {
        addFloatingText(`+${result}`, event);
      }
    },
    [handleManualCraft, addFloatingText]
  );

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
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
          minHeight: 0,
          overflow: 'auto',
          p: 1,
          overscrollBehavior: 'none',
          scrollBehavior: 'smooth',
        }}
      >
        {/* 1. 手动合成配方（顶部） */}
        <ManualCraftingCard item={item} onItemSelect={onItemSelect} onManualCraft={onManualCraft} />

        {/* 2. 设施列表（显示当前物品配方的设施，带添加移除按钮） */}
        <RecipeFacilitiesCard item={item} onItemSelect={onItemSelect} />

        {/* 分隔线 - 只在有设施配方时显示 */}
        {hasFacilityRecipes && <Divider sx={{ my: 2 }} />}

        {/* 用途 */}
        <UsageCard usedInRecipes={usedInRecipes} onItemSelect={onItemSelect} />

        {/* 库存管理 */}
        <InventoryManagementCard item={item} onItemSelect={onItemSelect} />
      </Box>

      {/* 错误/警告消息（成功时改用飘字，不再展示成功 toast） */}
      <Snackbar
        open={showMessage.open}
        autoHideDuration={3000}
        onClose={closeMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={closeMessage} severity={showMessage.severity} sx={{ width: '100%' }}>
          {showMessage.message}
        </Alert>
      </Snackbar>

      {/* 飘字动画 —— portal 到 body，避免被 overflow 容器裁剪 */}
      {floatingTexts.map(ft =>
        createPortal(
          <Box
            key={ft.id}
            sx={{
              position: 'fixed',
              left: ft.x,
              top: ft.y,
              zIndex: 9999,
              pointerEvents: 'none',
              animation: `${floatUp} 0.8s ease-out forwards`,
              color: 'success.main',
              fontWeight: 700,
              fontSize: '1.1rem',
              textShadow: '0 1px 4px rgba(0,0,0,0.8)',
              lineHeight: 1,
            }}
          >
            {ft.text}
          </Box>,
          document.body
        )
      )}
    </Box>
  );
};

export default ItemDetailPanel;
