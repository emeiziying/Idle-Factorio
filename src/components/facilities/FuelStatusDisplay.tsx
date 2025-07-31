// 燃料状态显示组件

import React from 'react';
import { Box, Typography, LinearProgress, Tooltip, Chip } from '@mui/material';
import { LocalFireDepartment, Timer } from '@mui/icons-material';
import type { GenericFuelBuffer } from '@/services/FuelService';
import { FuelService } from '@/services/FuelService';
import FactorioIcon from '@/components/common/FactorioIcon';

interface FuelStatusDisplayProps {
  fuelBuffer: GenericFuelBuffer;
  compact?: boolean;
}

export const FuelStatusDisplay: React.FC<FuelStatusDisplayProps> = ({
  fuelBuffer,
  compact = false
}) => {
  const fuelService = FuelService.getInstance();
  const status = fuelService.getFuelStatus(fuelBuffer);
  
  const formatTime = (seconds: number): string => {
    if (seconds === Infinity) return '∞';
    if (seconds < 60) return `${Math.floor(seconds)}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分`;
    return `${Math.floor(seconds / 3600)}时`;
  };
  
  const getProgressColor = (percentage: number): 'error' | 'warning' | 'success' => {
    if (percentage < 20) return 'error';
    if (percentage < 50) return 'warning';
    return 'success';
  };
  
  if (compact) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <LocalFireDepartment 
          fontSize="small" 
          sx={{ 
            color: status.isEmpty ? 'error.main' : 'action.active' 
          }} 
        />
        <LinearProgress
          variant="determinate"
          value={status.burnProgress}
          color={getProgressColor(status.burnProgress)}
          sx={{ 
            width: 60, 
            height: 6,
            borderRadius: 1,
            backgroundColor: 'action.disabledBackground'
          }}
        />
        <Typography variant="caption" color="text.secondary">
          {formatTime(status.estimatedRunTime)}
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 1 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="subtitle2" display="flex" alignItems="center" gap={0.5}>
          <LocalFireDepartment fontSize="small" />
          燃料状态
        </Typography>
        <Chip
          icon={<Timer />}
          label={`剩余: ${formatTime(status.estimatedRunTime)}`}
          size="small"
          color={status.isEmpty ? 'error' : 'default'}
          variant={status.isEmpty ? 'filled' : 'outlined'}
        />
      </Box>
      
      <LinearProgress
        variant="determinate"
        value={status.burnProgress}
        color={getProgressColor(status.burnProgress)}
        sx={{ 
          height: 8, 
          borderRadius: 1, 
          mb: 1,
          backgroundColor: 'action.disabledBackground'
        }}
      />
      
      <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
        {fuelBuffer.slots?.map((slot, index) => (
          <Tooltip
            key={index}
            title={
              <Box>
                <Typography variant="caption">
                  {slot.quantity}个 - {slot.remainingEnergy.toFixed(1)} MJ
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  点击物品图标查看详情
                </Typography>
              </Box>
            }
          >
            <Box position="relative">
              <FactorioIcon
                itemId={slot.itemId}
                size={32}
                quantity={slot.quantity}
              />
              {/* 当前燃烧中的标记 */}
              {index === 0 && slot.remainingEnergy < (slot.quantity > 0 ? 4 : 0) && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: 'warning.main',
                    border: '1px solid',
                    borderColor: 'background.paper'
                  }}
                />
              )}
            </Box>
          </Tooltip>
        ))}
        
        {/* 空槽位 */}
        {Array.from({ length: (fuelBuffer.maxSlots || 0) - (fuelBuffer.slots?.length || 0) }).map((_, i) => (
          <Box
            key={`empty-${i}`}
            sx={{
              width: 32,
              height: 32,
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.5
            }}
          >
            <LocalFireDepartment fontSize="small" color="disabled" />
          </Box>
        ))}
      </Box>
      
      <Typography variant="caption" color="text.secondary">
        能量: {status.totalEnergy.toFixed(1)} / {status.maxEnergy.toFixed(0)} MJ
        {(fuelBuffer.consumptionRate || 0) > 0 && (
          <span> • 消耗: {((fuelBuffer.consumptionRate || 0) * 1000).toFixed(0)} kW</span>
        )}
      </Typography>
    </Box>
  );
};

export default FuelStatusDisplay;