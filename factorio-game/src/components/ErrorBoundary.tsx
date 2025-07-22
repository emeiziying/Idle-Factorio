import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'background.default' }}>
          <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h4" color="error" gutterBottom>
              出现错误
            </Typography>
            <Typography variant="body1" paragraph>
              应用程序遇到了一个错误。错误详情如下：
            </Typography>
            <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, mb: 2 }}>
              <Typography variant="h6" color="error">
                {this.state.error?.toString()}
              </Typography>
              {this.state.errorInfo && (
                <pre style={{ fontSize: '0.8rem', overflow: 'auto' }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </Box>
            <Button variant="contained" onClick={this.handleReset}>
              重新加载
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;