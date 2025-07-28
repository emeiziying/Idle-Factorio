import React from 'react';
import { Box, Typography, Tab, Tabs } from '@mui/material';
import PowerManagement from './PowerManagement';
import FuelPrioritySettings from './FuelPrioritySettings';
import { FuelService } from '../../services/FuelService';

const FacilitiesModule: React.FC = () => {
  const [currentTab, setCurrentTab] = React.useState(0);
  const fuelService = FuelService.getInstance();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleFuelPriorityChange = (newPriority: string[]) => {
    fuelService.setFuelPriority(newPriority);
  };

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
        <Tab label="燃料设置" />
        <Tab label="生产监控" disabled />
        <Tab label="效率优化" disabled />
      </Tabs>
      
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {currentTab === 0 && <PowerManagement />}
        {currentTab === 1 && (
          <FuelPrioritySettings onPriorityChange={handleFuelPriorityChange} />
        )}
        {currentTab === 2 && (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography color="text.secondary">
              生产监控功能开发中...
            </Typography>
          </Box>
        )}
        {currentTab === 3 && (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography color="text.secondary">
              效率优化功能开发中...
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default FacilitiesModule;