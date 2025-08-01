import React from 'react';
import { Box, Typography, ThemeProvider, CssBaseline } from '@mui/material';
import theme from '@/theme';

interface LoadingScreenProps {
  /** 主标题 */
  title?: string;
  /** 加载状态文本 */
  message?: string;
  /** 副文本提示 */
  subtitle?: string;
  /** 是否显示加载动画 */
  showSpinner?: boolean;
  /** 是否包含主题提供器（用于独立页面） */
  withTheme?: boolean;
}

const LoadingContent: React.FC<Omit<LoadingScreenProps, 'withTheme'>> = ({
  title = '🏭 闲置工厂',
  message = '正在加载...',
  subtitle = '请稍候',
  showSpinner = true,
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      padding: 2,
      textAlign: 'center',
      bgcolor: 'background.default',
    }}
  >
    <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
      {title}
    </Typography>

    {showSpinner && (
      <Box
        sx={{
          width: 40,
          height: 40,
          border: '4px solid',
          borderColor: 'primary.main',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          mb: 2,
          '@keyframes spin': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' },
          },
        }}
      />
    )}

    <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
      {message}
    </Typography>

    {subtitle && (
      <Typography variant="caption" color="text.disabled">
        {subtitle}
      </Typography>
    )}
  </Box>
);

const LoadingScreen: React.FC<LoadingScreenProps> = ({ withTheme = false, ...props }) => {
  if (withTheme) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoadingContent {...props} />
      </ThemeProvider>
    );
  }

  return <LoadingContent {...props} />;
};

export default LoadingScreen;
