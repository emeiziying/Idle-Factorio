import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Chip,
  styled,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { logisticsService } from '../services/LogisticsService';
import { LogisticsConnection, LOGISTICS_SPECS } from '../types/logistics';
import { dataService } from '../services/DataService';

const ConnectionCard = styled(Box)(({ theme }) => ({
  backgroundColor: '#f5f5f5',
  borderRadius: '8px',
  padding: '12px',
  marginBottom: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const FlowIndicator = styled(Box)<{ active: boolean }>(({ active }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 8px',
  borderRadius: '4px',
  backgroundColor: active ? '#e8f5e9' : '#f5f5f5',
  color: active ? '#2e7d32' : '#757575',
  fontSize: '14px',
  fontWeight: 500,
}));

interface LogisticsPanelProps {
  itemId: string;
  onUpdate?: () => void;
}

const LogisticsPanel: React.FC<LogisticsPanelProps> = ({ itemId, onUpdate }) => {
  const [connections, setConnections] = useState<LogisticsConnection[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<'conveyor' | 'inserter'>('conveyor');
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedLogisticsItem, setSelectedLogisticsItem] = useState('');
  const [availableDevices, setAvailableDevices] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadConnections();
    loadAvailableDevices();
  }, [itemId]);

  const loadConnections = () => {
    const deviceLogistics = logisticsService.getDeviceLogistics(itemId);
    if (deviceLogistics) {
      setConnections([...deviceLogistics.inputs, ...deviceLogistics.outputs]);
    }
  };

  const loadAvailableDevices = () => {
    // 获取所有库存物品作为可连接的设备
    const allItems = dataService.getAllInventoryItems();
    const devices = allItems
      .filter(item => item.itemId !== itemId) // 排除自己
      .map(item => item.itemId);
    setAvailableDevices(devices);
  };

  const handleAddConnection = () => {
    setError('');
    
    if (!selectedDevice || !selectedLogisticsItem) {
      setError('请选择设备和物流设备类型');
      return;
    }

    let success = false;
    
    if (selectedType === 'conveyor') {
      success = logisticsService.addConveyorConnection({
        fromDevice: itemId,
        toDevice: selectedDevice,
        conveyorType: selectedLogisticsItem as any,
      });
    } else {
      success = logisticsService.addInserterConnection({
        fromDevice: itemId,
        toDevice: selectedDevice,
        inserterType: selectedLogisticsItem as any,
      });
    }

    if (success) {
      loadConnections();
      setShowAddDialog(false);
      setSelectedDevice('');
      setSelectedLogisticsItem('');
      onUpdate?.();
    } else {
      setError('添加失败：库存不足或连接无效');
    }
  };

  const handleRemoveConnection = (connectionId: string) => {
    if (logisticsService.removeConnection(connectionId)) {
      loadConnections();
      onUpdate?.();
    }
  };

  const getConnectionDisplay = (connection: LogisticsConnection) => {
    const isInput = connection.toDevice === itemId;
    const otherDevice = isInput ? connection.fromDevice : connection.toDevice;
    const direction = isInput ? '←' : '→';
    const deviceName = otherDevice; // 简化：使用ID作为名称
    
    let typeName = '';
    if (connection.type === 'conveyor') {
      const conveyor = connection as any;
      typeName = conveyor.conveyorType;
    } else {
      const inserter = connection as any;
      typeName = inserter.inserterType;
    }

    return {
      direction,
      deviceName,
      typeName,
      flow: connection.flow.toFixed(1),
      active: connection.status === 'active',
    };
  };

  const conveyorOptions = Object.keys(LOGISTICS_SPECS.conveyors);
  const inserterOptions = Object.keys(LOGISTICS_SPECS.inserters);

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="subtitle1" fontWeight="bold">
          📦 物流连接
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setShowAddDialog(!showAddDialog)}
          variant="outlined"
        >
          添加连接
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {showAddDialog && (
        <Box sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            添加物流连接
          </Typography>
          
          <FormControl fullWidth size="small" sx={{ mb: 1 }}>
            <InputLabel>连接类型</InputLabel>
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              label="连接类型"
            >
              <MenuItem value="conveyor">传送带</MenuItem>
              <MenuItem value="inserter">机械臂</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" sx={{ mb: 1 }}>
            <InputLabel>物流设备</InputLabel>
            <Select
              value={selectedLogisticsItem}
              onChange={(e) => setSelectedLogisticsItem(e.target.value)}
              label="物流设备"
            >
              {selectedType === 'conveyor' ? (
                conveyorOptions.map(item => (
                  <MenuItem key={item} value={item}>
                    {item} (速度: {LOGISTICS_SPECS.conveyors[item].speed}/秒)
                  </MenuItem>
                ))
              ) : (
                inserterOptions.map(item => (
                  <MenuItem key={item} value={item}>
                    {item} (速度: {LOGISTICS_SPECS.inserters[item].speed}/秒)
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" sx={{ mb: 1 }}>
            <InputLabel>目标设备</InputLabel>
            <Select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              label="目标设备"
            >
              {availableDevices.map(device => (
                <MenuItem key={device} value={device}>
                  {device}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box display="flex" gap={1}>
            <Button
              size="small"
              variant="contained"
              onClick={handleAddConnection}
              disabled={!selectedDevice || !selectedLogisticsItem}
            >
              确认添加
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setShowAddDialog(false);
                setSelectedDevice('');
                setSelectedLogisticsItem('');
              }}
            >
              取消
            </Button>
          </Box>
        </Box>
      )}

      <Box>
        {connections.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
            暂无物流连接
          </Typography>
        ) : (
          connections.map(connection => {
            const display = getConnectionDisplay(connection);
            return (
              <ConnectionCard key={connection.id}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" fontWeight="bold">
                    {display.direction}
                  </Typography>
                  <Typography variant="body2">
                    {display.deviceName}
                  </Typography>
                  <Chip
                    label={display.typeName}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <FlowIndicator active={display.active}>
                    {display.flow}/秒
                  </FlowIndicator>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveConnection(connection.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </ConnectionCard>
            );
          })
        )}
      </Box>

      <Divider sx={{ my: 2 }} />
      
      <Box>
        <Typography variant="caption" color="text.secondary">
          物流统计：
        </Typography>
        <Box display="flex" gap={2} mt={1}>
          <Typography variant="caption">
            输入连接: {connections.filter(c => c.toDevice === itemId).length}
          </Typography>
          <Typography variant="caption">
            输出连接: {connections.filter(c => c.fromDevice === itemId).length}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default LogisticsPanel;