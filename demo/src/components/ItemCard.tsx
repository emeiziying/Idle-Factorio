import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  styled,
  CircularProgress,
} from '@mui/material';
import { Item, InventoryItem } from '../types';
import { dataService } from '../services/DataService';

const StyledCard = styled(Card)<{ status?: string }>(({ theme, status }) => ({
  width: 80,
  height: 100,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  position: 'relative',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
}));

const ItemIcon = styled(Box)<{ 
  iconposition: string; 
  backgroundcolor: string; 
}>(({ iconposition, backgroundcolor }) => ({
  width: 32,
  height: 32,
  borderRadius: '4px',
  backgroundColor: backgroundcolor,
  backgroundImage: 'url(/data/1.1/icons.webp)',
  backgroundPosition: iconposition,
  backgroundSize: 'auto',
  margin: '0 auto',
}));

const StatusBadge = styled(Box)<{ status: string }>(({ status }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'producing': return '#22C55E';
      case 'stopped': return '#6B7280';
      case 'insufficient': return '#F59E0B';
      case 'inventory_full': return '#EF4444';
      case 'researching': return '#8B5CF6';
      default: return 'transparent';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'producing': return '●';
      case 'stopped': return '○';
      case 'insufficient': return '⚠';
      case 'inventory_full': return '🔴';
      case 'researching': return '🔬';
      default: return '';
    }
  };

  return {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: '50%',
    backgroundColor: getStatusColor(status),
    color: 'white',
    fontSize: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    '&::after': {
      content: `"${getStatusIcon(status)}"`,
      fontSize: '10px',
    },
  };
});

interface ItemCardProps {
  item: Item;
  inventory?: InventoryItem;
  onClick?: (item: Item) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({
  item,
  inventory,
  onClick,
}) => {
  const iconPosition = dataService.getItemIconPosition(item.id);
  const iconColor = dataService.getItemIconColor(item.id);

  const handleClick = () => {
    onClick?.(item);
  };

  const formatAmount = (amount: number): string => {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}k`;
    }
    return amount.toString();
  };

  return (
    <StyledCard 
      onClick={handleClick}
      status={inventory?.status}
    >
      {/* 状态徽章 */}
      {inventory?.status && inventory.status !== 'normal' && (
        <StatusBadge status={inventory.status} />
      )}

      <CardContent sx={{ 
        p: 1, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        '&:last-child': { pb: 1 }
      }}>
        {/* 物品图标 */}
        <ItemIcon 
          iconposition={iconPosition}
          backgroundcolor={iconColor}
        />

        {/* 物品名称 */}
        <Typography 
          variant="caption" 
          sx={{ 
            fontSize: '10px',
            textAlign: 'center',
            lineHeight: 1.2,
            color: '#333',
            fontWeight: 500,
          }}
        >
          {item.name || item.id}
        </Typography>

        {/* 库存数量 */}
        {inventory && (
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: '9px',
              color: '#666',
              fontWeight: 600,
            }}
          >
            {formatAmount(inventory.currentAmount)}个
          </Typography>
        )}

        {/* 生产速率指示 */}
        {inventory?.productionRate && inventory.productionRate > 0 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 2,
              left: 2,
              fontSize: '8px',
              color: '#22C55E',
              fontWeight: 'bold',
            }}
          >
            +{inventory.productionRate.toFixed(1)}/s
          </Box>
        )}
      </CardContent>
    </StyledCard>
  );
};

export default ItemCard; 