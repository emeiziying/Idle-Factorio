import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  LinearProgress,
  styled,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import GridLegacy from '@mui/material/GridLegacy';
import AddIcon from '@mui/icons-material/Add';
import BoltIcon from '@mui/icons-material/Bolt';
import FireplaceIcon from '@mui/icons-material/Fireplace';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import { powerService } from '../services/PowerService';

const PowerCard = styled(Card)(({ theme }) => ({
  height: '100%',
  background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
  color: 'white',
}));

const StatusCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  backgroundColor: '#f8f9fa',
}));

const PowerBar = styled(LinearProgress)<{ status: string }>(({ status }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: '#e0e0e0',
  '& .MuiLinearProgress-bar': {
    backgroundColor: 
      status === 'surplus' ? '#4caf50' : 
      status === 'deficit' ? '#f44336' : '#2196f3',
  },
}));

interface PowerManagementPanelProps {
  onBack?: () => void;
}

const PowerManagementPanel: React.FC<PowerManagementPanelProps> = ({ onBack }) => {
  const [powerState, setPowerState] = useState(powerService.getPowerSystemState());
  const [powerFacilities, setPowerFacilities] = useState(powerService.getPowerFacilities());
  const [recommendations, setRecommendations] = useState(powerService.getPowerBalanceRecommendations());

  useEffect(() => {
    updatePowerData();
    const interval = setInterval(updatePowerData, 3000);
    return () => clearInterval(interval);
  }, []);

  const updatePowerData = () => {
    setPowerState(powerService.getPowerSystemState());
    setPowerFacilities(powerService.getPowerFacilities());
    setRecommendations(powerService.getPowerBalanceRecommendations());
  };

  const handleAddPowerFacility = (facilityType: string, itemId: string) => {
    const success = powerService.addPowerFacility(facilityType, itemId, 1);
    if (success) {
      updatePowerData();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'surplus': return 'success';
      case 'deficit': return 'error';
      case 'balanced': return 'primary';
      default: return 'default';
    }
  };

  const getFacilityStatusColor = (status: string) => {
    switch (status) {
      case 'running': return '#4caf50';
      case 'fuel-shortage': return '#ff9800';
      case 'stopped': return '#757575';
      default: return '#757575';
    }
  };

  return (
    <Box p={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5">
          <BoltIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          电力管理中心
        </Typography>
        {onBack && (
          <Button variant="outlined" onClick={onBack}>
            返回设施总览
          </Button>
        )}
      </Box>

      {/* 电力状态总览 */}
      <GridLegacy container spacing={2} sx={{ mb: 3 }}>
        <GridLegacy item xs={12} md={4}>
          <PowerCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ⚡ 总发电量
              </Typography>
              <Typography variant="h4">
                {powerState.totalGeneration.toFixed(0)} kW
              </Typography>
            </CardContent>
          </PowerCard>
        </GridLegacy>
        
        <GridLegacy item xs={12} md={4}>
          <PowerCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🔌 总消耗量
              </Typography>
              <Typography variant="h4">
                {powerState.totalConsumption.toFixed(0)} kW
              </Typography>
            </CardContent>
          </PowerCard>
        </GridLegacy>
        
        <GridLegacy item xs={12} md={4}>
          <PowerCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 电力平衡
              </Typography>
              <Typography 
                variant="h4" 
                color={powerState.powerBalance >= 0 ? '#4caf50' : '#f44336'}
              >
                {powerState.powerBalance >= 0 ? '+' : ''}{powerState.powerBalance.toFixed(0)} kW
              </Typography>
              <Chip 
                label={
                  powerState.powerStatus === 'surplus' ? '供电充足' :
                  powerState.powerStatus === 'deficit' ? '电力不足' : '供需平衡'
                }
                color={getStatusColor(powerState.powerStatus) as any}
                size="small"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </PowerCard>
        </GridLegacy>
      </GridLegacy>

      {/* 电力效率指示器 */}
      <StatusCard>
        <Typography variant="subtitle2" color="primary" gutterBottom>
          ⚡ 电网效率
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <PowerBar 
            variant="determinate" 
            value={powerState.efficiency * 100}
            status={powerState.powerStatus}
            sx={{ flexGrow: 1 }}
          />
          <Typography variant="body2" fontWeight={600}>
            {(powerState.efficiency * 100).toFixed(1)}%
          </Typography>
        </Box>
      </StatusCard>

      {/* 发电设备管理 */}
      <StatusCard>
        <Typography variant="subtitle2" color="primary" gutterBottom>
          🏭 发电设备
        </Typography>
        
        {/* 快速添加按钮 */}
        <Box display="flex" gap={1} mb={2}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<WaterDropIcon />}
            onClick={() => handleAddPowerFacility('offshore-pump', 'water')}
          >
            添加海水泵
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FireplaceIcon />}
            onClick={() => handleAddPowerFacility('boiler', 'steam')}
          >
            添加锅炉
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<BoltIcon />}
            onClick={() => handleAddPowerFacility('steam-engine', 'power')}
          >
            添加蒸汽机
          </Button>
        </Box>

        {/* 设备列表 */}
        <List>
          {powerFacilities.map((facility, index) => (
            <ListItem key={`${facility.facilityId}-${index}`}>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle2">
                      {facility.type === 'offshore-pump' ? '海水泵' :
                       facility.type === 'boiler' ? '锅炉' :
                       facility.type === 'steam-engine' ? '蒸汽机' : facility.type}
                    </Typography>
                    <Chip
                      label={`${facility.count}台`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={
                        facility.status === 'running' ? '运行中' :
                        facility.status === 'fuel-shortage' ? '燃料不足' : '停止'
                      }
                      size="small"
                      sx={{
                        backgroundColor: getFacilityStatusColor(facility.status),
                        color: 'white',
                      }}
                    />
                  </Box>
                }
                secondary={
                  <Box mt={0.5}>
                    <Typography variant="caption" display="block">
                      {facility.powerGeneration > 0 && 
                        `发电: ${facility.powerGeneration.toFixed(0)}kW `}
                      {facility.powerConsumption > 0 && 
                        `耗电: ${facility.powerConsumption.toFixed(0)}kW `}
                      {facility.fuelConsumption > 0 && 
                        `燃料消耗: ${facility.fuelConsumption.toFixed(1)}/秒`}
                    </Typography>
                  </Box>
                }
              />
              <IconButton edge="end" size="small">
                <AddIcon />
              </IconButton>
            </ListItem>
          ))}
          
          {powerFacilities.length === 0 && (
            <ListItem>
              <ListItemText 
                primary="暂无发电设备"
                secondary="点击上方按钮添加发电设备"
              />
            </ListItem>
          )}
        </List>
      </StatusCard>

      {/* 系统建议 */}
      <StatusCard>
        <Typography variant="subtitle2" color="primary" gutterBottom>
          💡 系统建议
        </Typography>
        {recommendations.map((recommendation, index) => (
          <Typography 
            key={index} 
            variant="body2" 
            color="text.secondary"
            sx={{ mb: 0.5 }}
          >
            • {recommendation}
          </Typography>
        ))}
      </StatusCard>
    </Box>
  );
};

export default PowerManagementPanel;