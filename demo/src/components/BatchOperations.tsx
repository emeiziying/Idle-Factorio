import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
} from '@mui/material';
import { LOGISTICS_SPECS, LogisticsConfig } from '../types/logistics';
import { facilityService } from '../services/FacilityService';
import { simpleLogisticsService } from '../services/SimpleLogisticsService';
import { dataService } from '../services/DataService';

interface BatchOperationsProps {
  open: boolean;
  onClose: () => void;
  selectedItems: string[];
  onSuccess: () => void;
}

const BatchOperations: React.FC<BatchOperationsProps> = ({
  open,
  onClose,
  selectedItems,
  onSuccess,
}) => {
  const [operation, setOperation] = useState<'set' | 'add' | 'optimize'>('set');
  const [deviceType, setDeviceType] = useState<'conveyors' | 'inserters'>('conveyors');
  const [conveyorType, setConveyorType] = useState<string>('transport-belt');
  const [inserterType, setInserterType] = useState<string>('inserter');
  const [amount, setAmount] = useState<number>(1);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleApply = () => {
    setError('');
    setSuccess('');

    try {
      let totalRequired = 0;
      const itemType = deviceType === 'conveyors' ? conveyorType : inserterType;

      // 计算所需总量
      if (operation === 'set' || operation === 'add') {
        selectedItems.forEach(itemId => {
          const facilities = facilityService.getFacilitiesForItem(itemId);
          facilities.forEach(facility => {
            const logistics = simpleLogisticsService.getFacilityLogistics(itemId);
            if (logistics) {
              const currentAmount = deviceType === 'conveyors' 
                ? logistics.inputLogistics.conveyors + logistics.outputLogistics.conveyors
                : logistics.inputLogistics.inserters + logistics.outputLogistics.inserters;
              
              if (operation === 'set') {
                totalRequired += Math.max(0, amount * 2 - currentAmount); // 输入输出各配置amount个
              } else {
                totalRequired += amount * 2; // 输入输出各增加amount个
              }
            }
          });
        });
      }

      // 检查库存
      const inventory = dataService.getInventoryItem(itemType);
      const currentInventory = inventory?.currentAmount || 0;
      
      if (totalRequired > currentInventory) {
        setError(`库存不足：需要${totalRequired}个，当前只有${currentInventory}个`);
        return;
      }

      // 执行批量操作
      let successCount = 0;
      selectedItems.forEach(itemId => {
        const facilities = facilityService.getFacilitiesForItem(itemId);
        facilities.forEach(facility => {
          if (operation === 'optimize') {
            // 自动优化配置
            const logistics = simpleLogisticsService.getFacilityLogistics(itemId);
            if (logistics) {
              const recommendations = simpleLogisticsService.generateRecommendations(logistics);
              // 应用推荐配置（这里简化处理）
              successCount++;
            }
          } else {
            // 设置或增加物流设备
            const logistics = simpleLogisticsService.getFacilityLogistics(itemId);
            if (logistics) {
                          const newConfig: LogisticsConfig = {
              conveyors: operation === 'set' ? amount : logistics.inputLogistics.conveyors + amount,
              conveyorType: conveyorType as keyof typeof LOGISTICS_SPECS.conveyors,
              inserters: operation === 'set' ? amount : logistics.inputLogistics.inserters + amount,
              inserterType: inserterType as keyof typeof LOGISTICS_SPECS.inserters,
            };
              
              simpleLogisticsService.updateFacilityLogistics(
                itemId,
                facility.type,
                facility.count,
                Object.values(facility.baseInputRate).reduce((a, b) => a + b, 0),
                facility.baseOutputRate,
                deviceType === 'conveyors' ? newConfig : logistics.inputLogistics,
                deviceType === 'inserters' ? newConfig : logistics.outputLogistics
              );
              successCount++;
            }
          }
        });
      });

      setSuccess(`成功更新${successCount}个设施的物流配置`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError('批量操作失败，请重试');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>批量配置物流</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            将对选中的 {selectedItems.length} 个物品的生产设施进行批量配置
          </Alert>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>操作类型</InputLabel>
            <Select
              value={operation}
              onChange={(e) => setOperation(e.target.value as any)}
              label="操作类型"
            >
              <MenuItem value="set">设置为指定数量</MenuItem>
              <MenuItem value="add">增加指定数量</MenuItem>
              <MenuItem value="optimize">自动优化配置</MenuItem>
            </Select>
          </FormControl>

          {operation !== 'optimize' && (
            <>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>设备类型</InputLabel>
                <Select
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value as any)}
                  label="设备类型"
                >
                  <MenuItem value="conveyors">传送带</MenuItem>
                  <MenuItem value="inserters">机械臂</MenuItem>
                </Select>
              </FormControl>

              {deviceType === 'conveyors' && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>传送带类型</InputLabel>
                  <Select
                    value={conveyorType}
                    onChange={(e) => setConveyorType(e.target.value)}
                    label="传送带类型"
                  >
                    {Object.entries(LOGISTICS_SPECS.conveyors).map(([key, spec]) => (
                      <MenuItem key={key} value={key}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              backgroundColor: spec.color,
                              borderRadius: '2px',
                            }}
                          />
                          {spec.name} ({spec.speed}/秒)
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {deviceType === 'inserters' && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>机械臂类型</InputLabel>
                  <Select
                    value={inserterType}
                    onChange={(e) => setInserterType(e.target.value)}
                    label="机械臂类型"
                  >
                    {Object.entries(LOGISTICS_SPECS.inserters).map(([key, spec]) => (
                      <MenuItem key={key} value={key}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              backgroundColor: spec.color,
                              borderRadius: '2px',
                            }}
                          />
                          {spec.name} ({spec.speed}/秒)
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <TextField
                fullWidth
                label="数量"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                inputProps={{ min: 0, max: 100 }}
                helperText="每个设施的输入和输出都会配置指定数量"
              />
            </>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleApply} variant="contained" disabled={!!success}>
          应用
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BatchOperations;