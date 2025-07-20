import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  styled,
  LinearProgress,
  Tooltip,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { simpleLogisticsService } from '../services/SimpleLogisticsService';
import { FacilityLogistics, LogisticsConfig, LOGISTICS_SPECS } from '../types/logistics';

const FacilityCard = styled(Box)(({ theme }) => ({
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '12px',
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
  // 初始化物流配置
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

  // 更新物流计算
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

  // 调整物流配置
  const adjustLogistics = (
    type: 'input' | 'output',
    device: 'conveyors' | 'inserters',
    delta: number
  ) => {
    const config = type === 'input' ? inputConfig : outputConfig;
    const setConfig = type === 'input' ? setInputConfig : setOutputConfig;
    
    const newCount = Math.max(0, config[device] + delta);
    setConfig({ ...config, [device]: newCount });
  };

  if (!logistics) return null;

  const totalBaseInput = baseConsumptionRate * facilityCount;
  const totalBaseOutput = baseProductionRate * facilityCount;

  // 生成推荐
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

      {/* 效率条 */}
      <Box mb={2}>
        <Box display="flex" justifyContent="space-between" mb={0.5}>
          <Typography variant="caption">基础产能: {totalBaseOutput.toFixed(1)}/秒</Typography>
          <Typography variant="caption" color={logistics.bottleneck !== 'none' ? 'error' : 'text.primary'}>
            实际产能: {logistics.actualProductionRate.toFixed(1)}/秒
          </Typography>
        </Box>
        <EfficiencyBar variant="determinate" value={logistics.efficiency * 100} efficiency={logistics.efficiency} />
      </Box>

      {/* 输入物流 */}
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
          
          {/* 传送带配置 */}
          <LogisticsRow>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2">传送带:</Typography>
              <Chip label={LOGISTICS_SPECS.conveyors[inputConfig.conveyorType].name} size="small" />
            </Box>
            <Box display="flex" alignItems="center">
              <IconButton size="small" onClick={() => adjustLogistics('input', 'conveyors', -1)}>
                <RemoveIcon fontSize="small" />
              </IconButton>
              <Typography variant="body2" sx={{ minWidth: 30, textAlign: 'center' }}>
                {inputConfig.conveyors}
              </Typography>
              <IconButton size="small" onClick={() => adjustLogistics('input', 'conveyors', 1)}>
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
          </LogisticsRow>

          {/* 机械臂配置 */}
          <LogisticsRow>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2">机械臂:</Typography>
              <Chip label={LOGISTICS_SPECS.inserters[inputConfig.inserterType].name} size="small" />
            </Box>
            <Box display="flex" alignItems="center">
              <IconButton size="small" onClick={() => adjustLogistics('input', 'inserters', -1)}>
                <RemoveIcon fontSize="small" />
              </IconButton>
              <Typography variant="body2" sx={{ minWidth: 30, textAlign: 'center' }}>
                {inputConfig.inserters}
              </Typography>
              <IconButton size="small" onClick={() => adjustLogistics('input', 'inserters', 1)}>
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
          </LogisticsRow>
        </Box>
      )}

      {/* 输出物流 */}
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
        
        {/* 传送带配置 */}
        <LogisticsRow>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2">传送带:</Typography>
            <Chip label={LOGISTICS_SPECS.conveyors[outputConfig.conveyorType].name} size="small" />
          </Box>
          <Box display="flex" alignItems="center">
            <IconButton size="small" onClick={() => adjustLogistics('output', 'conveyors', -1)}>
              <RemoveIcon fontSize="small" />
            </IconButton>
            <Typography variant="body2" sx={{ minWidth: 30, textAlign: 'center' }}>
              {outputConfig.conveyors}
            </Typography>
            <IconButton size="small" onClick={() => adjustLogistics('output', 'conveyors', 1)}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
        </LogisticsRow>

        {/* 机械臂配置 */}
        <LogisticsRow>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2">机械臂:</Typography>
            <Chip label={LOGISTICS_SPECS.inserters[outputConfig.inserterType].name} size="small" />
          </Box>
          <Box display="flex" alignItems="center">
            <IconButton size="small" onClick={() => adjustLogistics('output', 'inserters', -1)}>
              <RemoveIcon fontSize="small" />
            </IconButton>
            <Typography variant="body2" sx={{ minWidth: 30, textAlign: 'center' }}>
              {outputConfig.inserters}
            </Typography>
            <IconButton size="small" onClick={() => adjustLogistics('output', 'inserters', 1)}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
        </LogisticsRow>
      </Box>

      {/* 优化建议 */}
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