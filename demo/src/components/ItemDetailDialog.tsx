import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Divider,
  styled,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { Item, InventoryItem } from '../types';
import { dataService } from '../services/DataService';
import LogisticsPanel from './LogisticsPanel';

const ItemIcon = styled(Box)<{ 
  iconposition: string; 
  backgroundcolor: string; 
}>(({ iconposition, backgroundcolor }) => ({
  width: 48,
  height: 48,
  borderRadius: '6px',
  backgroundColor: backgroundcolor,
  backgroundImage: 'url(/data/1.1/icons.webp)',
  backgroundPosition: iconposition,
  backgroundSize: 'auto',
  flexShrink: 0,
}));

const DataCard = styled(Box)(({ theme }) => ({
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '12px',
  marginBottom: '12px',
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: '20px',
  textTransform: 'none',
  fontWeight: 600,
  minWidth: '80px',
}));

interface ItemDetailDialogProps {
  open: boolean;
  item: Item | null;
  inventory?: InventoryItem;
  onClose: () => void;
  onCraft?: (itemId: string, quantity: number) => void;
}

const ItemDetailDialog: React.FC<ItemDetailDialogProps> = ({
  open,
  item,
  inventory,
  onClose,
  onCraft,
}) => {
  if (!item) return null;

  const iconPosition = dataService.getItemIconPosition(item.id);
  const iconColor = dataService.getItemIconColor(item.id);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'producing': return '生产中';
      case 'stopped': return '停产中';
      case 'insufficient': return '缺料中';
      case 'inventory_full': return '库存已满';
      case 'researching': return '研究中';
      default: return '正常';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'producing': return '#22C55E';
      case 'stopped': return '#6B7280';
      case 'insufficient': return '#F59E0B';
      case 'inventory_full': return '#EF4444';
      case 'researching': return '#8B5CF6';
      default: return '#333';
    }
  };

  const handleCraft = (quantity: number) => {
    onCraft?.(item.id, quantity);
  };

  const netGrowth = inventory ? 
    inventory.productionRate - inventory.consumptionRate : 0;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '16px' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <ItemIcon 
              iconposition={iconPosition}
              backgroundcolor={iconColor}
            />
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {item.name || item.id}
              </Typography>
              {inventory && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: getStatusColor(inventory.status),
                    fontWeight: 500 
                  }}
                >
                  {getStatusText(inventory.status)}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* 核心数据区域 */}
        {inventory && (
          <DataCard>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              📊 核心数据
            </Typography>
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  库存数量
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {inventory.currentAmount}/{inventory.maxCapacity}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  净增长
                </Typography>
                <Typography 
                  variant="body1" 
                  fontWeight={600}
                  color={netGrowth >= 0 ? 'success.main' : 'error.main'}
                >
                  {netGrowth >= 0 ? '+' : ''}{netGrowth.toFixed(1)}/秒
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  产量
                </Typography>
                <Typography variant="body1" fontWeight={600} color="success.main">
                  +{inventory.productionRate.toFixed(1)}/秒
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  消耗
                </Typography>
                <Typography variant="body1" fontWeight={600} color="warning.main">
                  -{inventory.consumptionRate.toFixed(1)}/秒
                </Typography>
              </Box>
            </Box>
          </DataCard>
        )}

        {/* 存储管理区域 */}
        <DataCard>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            📦 存储管理
          </Typography>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="body2">
                存储设备: 铁箱子 × 1
              </Typography>
              <Typography variant="caption" color="text.secondary">
                当前容量: {inventory?.maxCapacity || 1000}
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <IconButton size="small" color="primary">
                <RemoveIcon />
              </IconButton>
              <IconButton size="small" color="primary">
                <AddIcon />
              </IconButton>
            </Box>
          </Box>
        </DataCard>

        {/* 手动操作区域 */}
        <DataCard>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            🔨 手动制作
          </Typography>
          <Box display="flex" gap={1} mb={1}>
            <ActionButton 
              variant="contained" 
              size="small"
              onClick={() => handleCraft(1)}
            >
              制作1个
            </ActionButton>
            <ActionButton 
              variant="outlined" 
              size="small"
              onClick={() => handleCraft(5)}
            >
              制作5个
            </ActionButton>
            <ActionButton 
              variant="outlined" 
              size="small"
              onClick={() => handleCraft(10)}
            >
              最多制造
            </ActionButton>
          </Box>
          <Typography variant="caption" color="success.main">
            材料充足 ✓ 预计时间: 2.5秒
          </Typography>
        </DataCard>

        {/* 物流连接管理 */}
        <Divider sx={{ my: 2 }} />
        <LogisticsPanel itemId={item.id} onUpdate={() => {}} />

        {/* 物品信息 */}
        <Box mt={2}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            📋 物品信息
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {item.description || '暂无描述'}
          </Typography>
          
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                分类
              </Typography>
              <Typography variant="body2">
                {item.category}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                堆叠大小
              </Typography>
              <Typography variant="body2">
                {item.stack_size || 100}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ItemDetailDialog; 