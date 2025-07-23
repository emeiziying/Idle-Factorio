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
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onClick }) => {
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
          width: isMobile ? 44 : 52,
          height: isMobile ? 44 : 52,
          cursor: 'pointer',
          position: 'relative',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          transition: 'all 0.15s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '&:hover': {
            bgcolor: 'action.hover',
            borderColor: 'primary.main',
            transform: 'scale(1.05)',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(33, 150, 243, 0.2)',
          },
          '&:active': {
            transform: 'scale(1.02)',
          },
        }}
        onClick={onClick}
      >
      {/* 物品图标 */}
      <FactorioIcon itemId={item.id} size={isMobile ? 24 : 32} />
      
      {/* 库存数量 - 右下角显示 */}
      {inventoryItem.currentAmount > 0 && (
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            bottom: 1,
            right: 2,
            fontSize: isMobile ? '8px' : '10px',
            lineHeight: 1,
            color: '#fff',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            fontWeight: 'bold',
          }}
        >
          {inventoryItem.currentAmount > 999 
            ? `${Math.floor(inventoryItem.currentAmount / 1000)}k` 
            : inventoryItem.currentAmount
          }
        </Typography>
      )}

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
};

export default ItemCard;