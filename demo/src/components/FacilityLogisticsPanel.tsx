import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  styled,
  LinearProgress,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { simpleLogisticsService } from '../services/SimpleLogisticsService';
import { FacilityLogistics, LogisticsConfig, LOGISTICS_SPECS } from '../types/logistics';
import { dataService } from '../services/DataService';

const FacilityCard = styled(Box)(({ theme }) => ({
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: theme.spacing(2),
  marginBottom: theme.spacing(1.5),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5),
  },
}));

const LogisticsRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 0',
}));

const EfficiencyBar = styled(LinearProgress)<{ efficiency: number }>(({ efficiency }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: '#e0e0e0',
  '& .MuiLinearProgress-bar': {
    backgroundColor: efficiency >= 0.9 ? '#4caf50' : efficiency >= 0.7 ? '#ff9800' : '#f44336',
  },
}));

interface FacilityLogisticsPanelProps {
  itemId: string;
  facilityType: string;
  facilityCount: number;
  baseProductionRate: number;
  baseConsumptionRate: number;
  onProductionChange?: (actualRate: number) => void;
}

const FacilityLogisticsPanel: React.FC<FacilityLogisticsPanelProps> = ({
  itemId,
  facilityType,
  facilityCount,
  baseProductionRate,
  baseConsumptionRate,
  onProductionChange,
}) => {
  const [inputConfig, setInputConfig] = useState<LogisticsConfig>({
    conveyors: 0,
    conveyorType: 'transport-belt',
    inserters: 0,
    inserterType: 'inserter',
  });

  const [outputConfig, setOutputConfig] = useState<LogisticsConfig>({
    conveyors: 0,
    conveyorType: 'transport-belt',
    inserters: 0,
    inserterType: 'inserter',
  });

  const [logistics, setLogistics] = useState<FacilityLogistics | null>(null);
  const [inventoryError, setInventoryError] = useState<string>('');

  useEffect(() => {
    const updatedLogistics = simpleLogisticsService.updateFacilityLogistics(
      itemId,
      facilityType,
      facilityCount,
      baseConsumptionRate,
      baseProductionRate,
      inputConfig,
      outputConfig
    );
    
    setLogistics(updatedLogistics);
    onProductionChange?.(updatedLogistics.actualProductionRate);
  }, [itemId, facilityType, facilityCount, baseProductionRate, baseConsumptionRate, inputConfig, outputConfig]);

  const getInventoryAmount = (itemType: string): number => {
    const inventory = dataService.getInventoryItem(itemType);
    return inventory?.currentAmount || 0;
  };

  const adjustLogistics = (
    type: 'input' | 'output',
    device: 'conveyors' | 'inserters',
    delta: number
  ) => {
    setInventoryError('');
    
    const config = type === 'input' ? inputConfig : outputConfig;
    const setConfig = type === 'input' ? setInputConfig : setOutputConfig;
    
    const oldCount = config[device];
    const newCount = Math.max(0, oldCount + delta);
    
    if (newCount === oldCount) return;
    
    const itemType = device === 'conveyors' ? config.conveyorType : config.inserterType;
    const itemName = device === 'conveyors' 
      ? LOGISTICS_SPECS.conveyors[config.conveyorType].name
      : LOGISTICS_SPECS.inserters[config.inserterType].name;
    
    if (delta > 0) {
      const currentInventory = getInventoryAmount(itemType);
      
      if (currentInventory < delta) {
        setInventoryError(`库存不足：${itemName}只有${currentInventory}个`);
        return;
      }
      
      const inventory = dataService.getInventoryItem(itemType);
      if (inventory) {
        dataService.updateInventory(itemType, {
          currentAmount: inventory.currentAmount - delta
        });
      }
    } else if (delta < 0) {
      const returnCount = Math.min(Math.abs(delta), oldCount);
      const inventory = dataService.getInventoryItem(itemType);
      
      if (inventory) {
        dataService.updateInventory(itemType, {
          currentAmount: inventory.currentAmount + returnCount
        });
      }
    }
    
    setConfig({ ...config, [device]: newCount });
  };

  if (!logistics) return null;

  const totalBaseInput = baseConsumptionRate * facilityCount;
  const totalBaseOutput = baseProductionRate * facilityCount;
  const recommendations = simpleLogisticsService.generateRecommendations(logistics);

  return (
    <FacilityCard>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1" fontWeight="bold">
          🏭 {facilityType} ({facilityCount}台)
        </Typography>
        <Chip
          label={`效率: ${(logistics.efficiency * 100).toFixed(0)}%`}
          color={logistics.efficiency >= 0.9 ? 'success' : logistics.efficiency >= 0.7 ? 'warning' : 'error'}
          size="small"
        />
      </Box>

      <Box mb={2}>
        <Box display="flex" justifyContent="space-between" mb={0.5}>
          <Typography variant="caption">基础产能: {totalBaseOutput.toFixed(1)}/秒</Typography>
          <Typography variant="caption" color={logistics.bottleneck !== 'none' ? 'error' : 'text.primary'}>
            实际产能: {logistics.actualProductionRate.toFixed(1)}/秒
          </Typography>
        </Box>
        <EfficiencyBar variant="determinate" value={logistics.efficiency * 100} efficiency={logistics.efficiency} />
      </Box>

      {inventoryError && (
        <Alert severity="error" onClose={() => setInventoryError('')} sx={{ mb: 2 }}>
          {inventoryError}
        </Alert>
      )}

      {totalBaseInput > 0 && (
        <Box mb={2}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            📥 输入物流
          </Typography>
          <LogisticsRow>
            <Typography variant="body2">需求: {totalBaseInput.toFixed(1)}/秒</Typography>
            <Typography variant="body2" color={logistics.bottleneck === 'input' ? 'error' : 'success.main'}>
              当前: {logistics.actualInputCapacity.toFixed(1)}/秒
            </Typography>
          </LogisticsRow>
          
          <LogisticsRow>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2">传送带:</Typography>
              <Chip label={LOGISTICS_SPECS.conveyors[inputConfig.conveyorType].name} size="small" />
              <Typography variant="caption" color="text.secondary">
                (库存: {getInventoryAmount(inputConfig.conveyorType)})
              </Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <IconButton 
                size="small" 
                onClick={() => adjustLogistics('input', 'conveyors', -1)}
                disabled={inputConfig.conveyors === 0}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
              <Typography variant="body2" sx={{ minWidth: 30, textAlign: 'center' }}>
                {inputConfig.conveyors}
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => adjustLogistics('input', 'conveyors', 1)}
                disabled={getInventoryAmount(inputConfig.conveyorType) === 0}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
          </LogisticsRow>

          <LogisticsRow>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2">机械臂:</Typography>
              <Chip label={LOGISTICS_SPECS.inserters[inputConfig.inserterType].name} size="small" />
              <Typography variant="caption" color="text.secondary">
                (库存: {getInventoryAmount(inputConfig.inserterType)})
              </Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <IconButton 
                size="small" 
                onClick={() => adjustLogistics('input', 'inserters', -1)}
                disabled={inputConfig.inserters === 0}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
              <Typography variant="body2" sx={{ minWidth: 30, textAlign: 'center' }}>
                {inputConfig.inserters}
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => adjustLogistics('input', 'inserters', 1)}
                disabled={getInventoryAmount(inputConfig.inserterType) === 0}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
          </LogisticsRow>
        </Box>
      )}

      <Box mb={2}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          📤 输出物流
        </Typography>
        <LogisticsRow>
          <Typography variant="body2">需求: {totalBaseOutput.toFixed(1)}/秒</Typography>
          <Typography variant="body2" color={logistics.bottleneck === 'output' ? 'error' : 'success.main'}>
            当前: {logistics.actualOutputCapacity.toFixed(1)}/秒
          </Typography>
        </LogisticsRow>
        
        <LogisticsRow>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2">传送带:</Typography>
            <Chip label={LOGISTICS_SPECS.conveyors[outputConfig.conveyorType].name} size="small" />
            <Typography variant="caption" color="text.secondary">
              (库存: {getInventoryAmount(outputConfig.conveyorType)})
            </Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <IconButton 
              size="small" 
              onClick={() => adjustLogistics('output', 'conveyors', -1)}
              disabled={outputConfig.conveyors === 0}
            >
              <RemoveIcon fontSize="small" />
            </IconButton>
            <Typography variant="body2" sx={{ minWidth: 30, textAlign: 'center' }}>
              {outputConfig.conveyors}
            </Typography>
            <IconButton 
              size="small" 
              onClick={() => adjustLogistics('output', 'conveyors', 1)}
              disabled={getInventoryAmount(outputConfig.conveyorType) === 0}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
        </LogisticsRow>

        <LogisticsRow>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2">机械臂:</Typography>
            <Chip label={LOGISTICS_SPECS.inserters[outputConfig.inserterType].name} size="small" />
            <Typography variant="caption" color="text.secondary">
              (库存: {getInventoryAmount(outputConfig.inserterType)})
            </Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <IconButton 
              size="small" 
              onClick={() => adjustLogistics('output', 'inserters', -1)}
              disabled={outputConfig.inserters === 0}
            >
              <RemoveIcon fontSize="small" />
            </IconButton>
            <Typography variant="body2" sx={{ minWidth: 30, textAlign: 'center' }}>
              {outputConfig.inserters}
            </Typography>
            <IconButton 
              size="small" 
              onClick={() => adjustLogistics('output', 'inserters', 1)}
              disabled={getInventoryAmount(outputConfig.inserterType) === 0}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
        </LogisticsRow>
      </Box>

      {recommendations.length > 0 && (
        <Alert severity="info" variant="outlined" sx={{ mt: 2 }}>
          <Typography variant="caption" component="div">
            <strong>优化建议：</strong>
          </Typography>
          {recommendations.map((rec, index) => (
            <Typography key={index} variant="caption" component="div">
              {rec.type === 'input' ? '输入' : '输出'}不足 {rec.deficit.toFixed(1)}/秒
              {rec.suggestions[0] && (
                <>
                  ，建议添加：
                  {rec.suggestions[0].conveyors && ` ${rec.suggestions[0].conveyors.count}个${LOGISTICS_SPECS.conveyors[rec.suggestions[0].conveyors.type].name}`}
                  {rec.suggestions[0].inserters && ` ${rec.suggestions[0].inserters.count}个${LOGISTICS_SPECS.inserters[rec.suggestions[0].inserters.type].name}`}
                </>
              )}
            </Typography>
          ))}
        </Alert>
      )}
    </FacilityCard>
  );
};

export default FacilityLogisticsPanel;