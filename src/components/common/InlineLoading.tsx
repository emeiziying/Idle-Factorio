import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

interface InlineLoadingProps {
  /** 加载信息 */
  message?: string;
  /** 高度 */
  height?: number | string;
  /** 是否显示加载动画 */
  showSpinner?: boolean;
  /** 文字颜色 */
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

const InlineLoading: React.FC<InlineLoadingProps> = ({
  message = '加载中...',
  height = 200,
  showSpinner = true,
  color = 'text.secondary',
}) => (
  <Box
    display="flex"
    flexDirection="column"
    justifyContent="center"
    alignItems="center"
    height={height}
    color={color}
  >
    {showSpinner && (
      <CircularProgress
        size={24}
        sx={{ mb: 1 }}
        color={
          color === 'text.secondary'
            ? 'primary'
            : (color as 'error' | 'primary' | 'secondary' | 'info' | 'success' | 'warning')
        }
      />
    )}
    <Typography variant="body2">{message}</Typography>
  </Box>
);

export default InlineLoading;
