import React from 'react';
import { 
  Typography, 
  Box,
  Tooltip
} from '@mui/material';
import type { Item } from '../../types/index';
import useGameStore from '../../store/gameStore';
import FactorioIcon from '../common/FactorioIcon';
import { useIsMobile } from '../../hooks/useIsMobile';

interface ItemCardProps {
  item: Item;
  onClick: () => void;
  selected?: boolean;
}

const ItemCard: React.FC<ItemCardProps> = React.memo(({ item, onClick, selected = false }) => {
  const getInventoryItem = useGameStore((state) => state.getInventoryItem);
  const inventoryItem = getInventoryItem(item.id);
  const isMobile = useIsMobile();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'producing': return 'success';
      case 'stopped': return 'error';
      case 'insufficient': return 'warning';
      case 'inventory_full': return 'info';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'producing': return '生产中';
      case 'stopped': return '已停止';
      case 'insufficient': return '材料不足';
      case 'inventory_full': return '库存已满';
      default: return '';
    }
  };

  return (
    <Tooltip 
      title={
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {item.name}
          </Typography>
          <Typography variant="caption" color="inherit">
            库存: {inventoryItem.currentAmount.toLocaleString()}
          </Typography>
          {inventoryItem.status !== 'normal' && (
            <Typography variant="caption" color="inherit" display="block">
              状态: {getStatusLabel(inventoryItem.status)}
            </Typography>
          )}
        </Box>
      }
      placement="top"
      arrow
      enterDelay={500}
    >
      <Box
        sx={{
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.15s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // 去除移动端点击高亮
          WebkitTapHighlightColor: 'transparent',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          KhtmlUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          userSelect: 'none',
          '&:hover': {
            transform: 'scale(1.05)',
            zIndex: 10,
          },
          '&:active': {
            transform: 'scale(1.02)',
          },
        }}
        onClick={onClick}
      >
      {/* 物品图标 */}
      <FactorioIcon 
        itemId={item.id} 
        size={isMobile ? 36 : 48} 
        quantity={inventoryItem.currentAmount > 0 ? inventoryItem.currentAmount : undefined}
        selected={selected}
      />

      {/* 状态指示器 - 左上角小点 */}
      {inventoryItem.status !== 'normal' && (
        <Box
          sx={{
            position: 'absolute',
            top: 2,
            left: 2,
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: getStatusColor(inventoryItem.status) === 'success' ? '#4CAF50' :
                     getStatusColor(inventoryItem.status) === 'warning' ? '#FFC107' :
                     getStatusColor(inventoryItem.status) === 'error' ? '#F44336' : '#2196F3',
          }}
        />
      )}
      </Box>
    </Tooltip>
  );
});

ItemCard.displayName = 'ItemCard';

export default ItemCard;