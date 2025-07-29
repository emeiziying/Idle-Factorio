import React, { useMemo, useCallback } from 'react';
import { Box, Typography, Tab, Tabs } from '@mui/material';
import PowerManagement from './PowerManagement';
import FuelPrioritySettings from './FuelPrioritySettings';
import ProductionMonitor from './ProductionMonitor';
import EfficiencyOptimizer from './EfficiencyOptimizer';
import { RefactoredFuelService as FuelService } from '../../services/game/RefactoredFuelService';

const FacilitiesModule: React.FC = React.memo(() => {
  const [currentTab, setCurrentTab] = React.useState(0);
  const fuelService = FuelService.getInstance();

  // 使用useCallback缓存事件处理函数，避免重复创建
  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  }, []);

  const handleFuelPriorityChange = useCallback((newPriority: string[]) => {
    fuelService.setFuelPriority(newPriority);
  }, [fuelService]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" gutterBottom sx={{ px: 2, pt: 2 }}>
        设施管理
      </Typography>
      
      <Tabs 
        value={currentTab} 
        onChange={handleTabChange}
        sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
      >
        <Tab label="电力管理" />
        <Tab label="生产监控" />
        <Tab label="效率优化" />
        <Tab label="燃料设置" />
      </Tabs>
      
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {useMemo(() => {
          switch (currentTab) {
            case 0:
              return <PowerManagement />;
            case 1:
              return <ProductionMonitor />;
            case 2:
              return <EfficiencyOptimizer />;
            case 3:
              return <FuelPrioritySettings onPriorityChange={handleFuelPriorityChange} />;
            default:
              return <PowerManagement />;
          }
        }, [currentTab, handleFuelPriorityChange])}
      </Box>
    </Box>
  );
});

FacilitiesModule.displayName = 'FacilitiesModule';

export default FacilitiesModule;