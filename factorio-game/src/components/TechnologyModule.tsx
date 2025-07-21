import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const TechnologyModule: React.FC = () => {
  return (
    <Box sx={{ p: 3, height: '100%' }}>
      <Typography variant="h4" gutterBottom>
        科技研究
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1" color="text.secondary">
          科技模块正在开发中...
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          这里将包括：
        </Typography>
        <ul>
          <li>科技树展示</li>
          <li>科技研究进度</li>
          <li>研究队列管理</li>
          <li>科技效果说明</li>
          <li>科技包消耗</li>
        </ul>
      </Paper>
    </Box>
  );
};

export default TechnologyModule;