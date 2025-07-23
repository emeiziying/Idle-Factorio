import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const FacilitiesModule: React.FC = () => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        设施管理
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="body1" color="text.secondary">
            设施模块正在开发中...
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            即将包含：
          </Typography>
          <Box component="ul" sx={{ mt: 1, mb: 0 }}>
            <li>电力系统管理</li>
            <li>生产设施监控</li>
            <li>效率优化建议</li>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default FacilitiesModule;