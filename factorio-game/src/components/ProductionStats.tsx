import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Divider,
  LinearProgress
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Inventory as InventoryIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import { useGameStore } from '../store/gameStore';
import { CraftingService } from '../services/CraftingService';
import { formatNumber, formatRate } from '../utils/format';

interface ProductionStat {
  itemId: string;
  productionRate: number;
  consumptionRate: number;
  netRate: number;
}

const ProductionStats: React.FC = () => {
  const inventory = useGameStore(state => state.inventory);
  const craftingQueue = useGameStore(state => state.craftingQueue);
  const [stats, setStats] = useState<ProductionStat[]>([]);
  const [queueSummary, setQueueSummary] = useState({
    totalTasks: 0,
    totalProgress: 0,
    estimatedTotalTime: 0
  });

  const craftingService = CraftingService.getInstance();

  useEffect(() => {
    updateStats();
  }, [inventory, craftingQueue]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const summary = await craftingService.getCraftingQueueSummary();
      setQueueSummary(summary);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const updateStats = () => {
    const productionStats: ProductionStat[] = [];
    
    inventory.forEach((item, itemId) => {
      if (item.productionRate > 0 || item.consumptionRate > 0) {
        productionStats.push({
          itemId,
          productionRate: item.productionRate * 60, // 转换为每分钟
          consumptionRate: item.consumptionRate * 60,
          netRate: (item.productionRate - item.consumptionRate) * 60
        });
      }
    });

    // 按净产率排序
    productionStats.sort((a, b) => Math.abs(b.netRate) - Math.abs(a.netRate));
    setStats(productionStats.slice(0, 5)); // 只显示前5个
  };

  const totalItems = Array.from(inventory.values()).reduce((sum, item) => sum + item.currentAmount, 0);
  const itemTypes = inventory.size;

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        生产统计
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        {/* 库存总览 */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InventoryIcon color="primary" />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary">
                库存总量
              </Typography>
              <Typography variant="h5">
                {formatNumber(totalItems)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {itemTypes} 种物品
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* 制作队列 */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BuildIcon color="primary" />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary">
                制作队列
              </Typography>
              <Typography variant="h5">
                {queueSummary.totalTasks}
              </Typography>
              {queueSummary.totalTasks > 0 && (
                <LinearProgress 
                  variant="determinate" 
                  value={queueSummary.totalProgress} 
                  sx={{ mt: 1, height: 4, borderRadius: 1 }}
                />
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {stats.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" gutterBottom>
            生产速率（前5项）
          </Typography>
          
          {stats.map(stat => (
            <Box key={stat.itemId} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="body2" sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {stat.itemId}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {stat.netRate > 0 ? (
                  <TrendingUpIcon color="success" fontSize="small" />
                ) : stat.netRate < 0 ? (
                  <TrendingDownIcon color="error" fontSize="small" />
                ) : null}
                <Typography 
                  variant="caption" 
                  color={stat.netRate > 0 ? 'success.main' : stat.netRate < 0 ? 'error.main' : 'text.secondary'}
                  sx={{ minWidth: 60, textAlign: 'right' }}
                >
                  {stat.netRate > 0 ? '+' : ''}{formatRate(stat.netRate)}
                </Typography>
              </Box>
            </Box>
          ))}
        </>
      )}
    </Paper>
  );
};

export default ProductionStats;