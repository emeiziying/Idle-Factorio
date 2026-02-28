import theme from '@/theme';
import { Error as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { Box, Button, CssBaseline, Stack, ThemeProvider, Typography } from '@mui/material';
import React from 'react';

interface ErrorScreenProps {
  /** 错误标题 */
  title?: string;
  /** 错误信息 */
  error: string;
  /** 是否显示重新加载按钮 */
  showReload?: boolean;
  /** 是否显示重试按钮 */
  showRetry?: boolean;
  /** 重试按钮文本 */
  retryText?: string;
  /** 重试回调 */
  onRetry?: () => void;
  /** 是否包含主题提供器（用于独立页面） */
  withTheme?: boolean;
  /** 额外的操作按钮 */
  children?: React.ReactNode;
}

// 错误内容组件
const ErrorContent: React.FC<Omit<ErrorScreenProps, 'withTheme'>> = ({
  title = '应用初始化失败',
  error,
  showReload = true,
  showRetry = false,
  retryText = '重试',
  onRetry,
  children,
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      padding: 3,
      textAlign: 'center',
      bgcolor: 'background.default',
    }}
  >
    <ErrorIcon
      sx={{
        fontSize: 64,
        color: 'error.main',
        mb: 2,
      }}
    />

    <Typography variant="h5" color="error" gutterBottom>
      {title}
    </Typography>

    <Typography
      variant="body1"
      sx={{
        mb: 3,
        maxWidth: 600,
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
      }}
    >
      {error}
    </Typography>

    <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
      {showReload && (
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={() => window.location.reload()}
        >
          重新加载页面
        </Button>
      )}

      {showRetry && onRetry && (
        <Button variant="outlined" onClick={onRetry}>
          {retryText}
        </Button>
      )}
    </Stack>

    {children}

    <Typography variant="caption" color="text.disabled" sx={{ mt: 2 }}>
      如果问题持续存在，请尝试清除浏览器缓存
    </Typography>
  </Box>
);

// 错误屏幕组件
const ErrorScreen: React.FC<ErrorScreenProps> = ({ withTheme = false, ...props }) => {
  if (withTheme) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ErrorContent {...props} />
      </ThemeProvider>
    );
  }

  return <ErrorContent {...props} />;
};

export default ErrorScreen;
