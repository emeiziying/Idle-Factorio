import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const TechnologyModule: React.FC = () => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        科技研究
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="body1" color="text.secondary">
            科技模块正在开发中...
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            即将包含：
          </Typography>
          <Box component="ul" sx={{ mt: 1, mb: 0 }}>
            <li>科技树可视化</li>
            <li>研究队列管理</li>
            <li>科技瓶生产</li>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TechnologyModule;