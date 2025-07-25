import React from 'react';
import { Box, Typography, Card, CardContent, Chip } from '@mui/material';
import { getSolidStorageTypes, getLiquidStorageTypes, getStorageConfig } from '../../data/storageConfigs';
import FactorioIcon from '../common/FactorioIcon';

const StorageConfigTest: React.FC = () => {
  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>
        存储配置测试
      </Typography>
      
      {/* 固体存储 */}
      <Typography variant="h5" gutterBottom>
        固体存储 (箱子)
      </Typography>
      <Box display="flex" gap={2} mb={3}>
        {getSolidStorageTypes().map(storageType => {
          const config = getStorageConfig(storageType);
          if (!config) return null;
          return (
            <Card key={storageType} sx={{ minWidth: 200 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <FactorioIcon itemId={config.itemId} size={32} />
                  <Typography variant="h6">{config.name}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {config.description}
                </Typography>
                <Box mt={1}>
                  <Chip 
                    label={`+${config.additionalStacks || 0} 堆叠`} 
                    size="small" 
                    color="primary" 
                  />
                </Box>
                <Typography variant="caption" display="block" mt={1}>
                  制作时间: {config.craftingTime}秒
                </Typography>
              </CardContent>
            </Card>
          );
        })}
      </Box>
      
      {/* 液体存储 */}
      <Typography variant="h5" gutterBottom>
        液体存储 (储液罐)
      </Typography>
      <Box display="flex" gap={2}>
        {getLiquidStorageTypes().map(storageType => {
          const config = getStorageConfig(storageType);
          if (!config) return null;
          return (
            <Card key={storageType} sx={{ minWidth: 200 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <FactorioIcon itemId={config.itemId} size={32} />
                  <Typography variant="h6">{config.name}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {config.description}
                </Typography>
                <Box mt={1}>
                  <Chip 
                    label={`${config.fluidCapacity || 0} 单位`} 
                    size="small" 
                    color="secondary" 
                  />
                </Box>
                <Typography variant="caption" display="block" mt={1}>
                  尺寸: {config.dimensions || 'N/A'} | 制作时间: {config.craftingTime}秒
                </Typography>
                {config.requiredTechnology && (
                  <Typography variant="caption" display="block" color="warning.main">
                    需要科技: {config.requiredTechnology}
                  </Typography>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
};

export default StorageConfigTest; 