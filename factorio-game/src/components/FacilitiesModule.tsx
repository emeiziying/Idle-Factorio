import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const FacilitiesModule: React.FC = () => {
  return (
    <Box sx={{ p: 3, height: '100%' }}>
      <Typography variant="h4" gutterBottom>
        设施管理
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1" color="text.secondary">
          设施模块正在开发中...
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          这里将包括：
        </Typography>
        <ul>
          <li>电力设施管理（海水泵、锅炉、蒸汽机）</li>
          <li>采矿设施管理</li>
          <li>生产设施管理</li>
          <li>电力系统监控</li>
          <li>设施效率优化</li>
        </ul>
      </Paper>
    </Box>
  );
};

export default FacilitiesModule;