import React, { useState, useEffect } from 'react';
import { 
  Box, 
  BottomNavigation, 
  BottomNavigationAction,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Build as BuildIcon,
  Factory as FactoryIcon,
  Science as ScienceIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

import ProductionModule from './components/production/ProductionModule';
import FacilitiesModule from './components/facilities/FacilitiesModule';
import TechnologyModule from './components/technology/TechnologyModule';
import DataService from './services/DataService';
import useGameStore from './store/gameStore';

// 创建移动端优化的深色主题
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ff9800',
    },
    secondary: {
      main: '#2196f3',
    },
    background: {
      default: '#2a2a2a',
      paper: '#3a3a3a',
    },
  },
  components: {
    // 全局移除outline
    MuiButtonBase: {
      styleOverrides: {
        root: {
          outline: 'none',
          '&:focus': {
            outline: 'none',
          },
          '&:focus-visible': {
            outline: 'none',
          },
        },
      },
    },
    // 移动端优化
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          minWidth: 'auto',
          paddingTop: 8,
          paddingBottom: 8,
          outline: 'none',
          '&:focus': {
            outline: 'none',
          },
          '&.Mui-selected': {
            fontSize: '0.75rem',
          },
        },
        label: {
          fontSize: '0.75rem',
          // 确保未选中时也显示文字
          opacity: 1,
          '&.Mui-selected': {
            fontSize: '0.8rem',
            fontWeight: 600,
          },
        },
        // 图标样式
        iconOnly: {
          // 确保图标和文字都显示
          '& .MuiBottomNavigationAction-label': {
            opacity: 1,
          },
        },
      },
    },
    // Tab组件移除outline
    MuiTab: {
      styleOverrides: {
        root: {
          outline: 'none',
          '&:focus': {
            outline: 'none',
          },
          '&:focus-visible': {
            outline: 'none',
          },
        },
      },
    },
    // 卡片组件移除outline
    MuiCard: {
      styleOverrides: {
        root: {
          outline: 'none',
          '&:focus': {
            outline: 'none',
          },
          // 移动端更小的圆角
          '@media (max-width: 600px)': {
            borderRadius: 8,
          },
        },
      },
    },
    // 对话框组件移除outline
    MuiDialog: {
      styleOverrides: {
        paper: {
          outline: 'none',
          '&:focus': {
            outline: 'none',
          },
          // 移动端全屏对话框
          '@media (max-width: 600px)': {
            margin: 8,
            width: 'calc(100% - 16px)',
            maxHeight: 'calc(100% - 16px)',
          },
        },
      },
    },
    // 图标按钮移除outline
    MuiIconButton: {
      styleOverrides: {
        root: {
          outline: 'none',
          '&:focus': {
            outline: 'none',
          },
          '&:focus-visible': {
            outline: 'none',
          },
        },
      },
    },
  },
});

const App: React.FC = () => {
  const [currentModule, setCurrentModule] = useState(0);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const { clearGameData } = useGameStore();

  // 初始化游戏数据
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 加载游戏数据
        await DataService.getInstance().loadGameData();
        
        // 加载国际化数据
        await DataService.getInstance().loadI18nData('zh');
        
        console.log('App initialized successfully');
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentModule(newValue);
  };

  const handleClearGame = () => {
    clearGameData();
    setIsClearDialogOpen(false);
    setShowSuccessMessage(true);
    // 3秒后重新加载页面
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        bgcolor: 'background.default'
      }}>
        {/* 主内容区域 */}
        <Box sx={{ 
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}>
          {currentModule === 0 && <ProductionModule />}
          {currentModule === 1 && <FacilitiesModule />}
          {currentModule === 2 && <TechnologyModule />}
        </Box>
        
        {/* 底部导航 */}
        <BottomNavigation 
          value={currentModule} 
          onChange={handleTabChange}
          showLabels // 确保显示标签
          sx={{ 
            width: '100%',
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
              flex: 1,
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.75rem',
                opacity: 1, // 确保未选中时也显示
                '&.Mui-selected': {
                  fontSize: '0.8rem',
                  fontWeight: 600,
                },
              },
              '& .MuiSvgIcon-root': {
                fontSize: '1.5rem',
                marginBottom: '2px',
              },
            },
          }}
        >
          <BottomNavigationAction 
            label="生产" 
            icon={<BuildIcon />} 
            showLabel={true} // 强制显示标签
          />
          <BottomNavigationAction 
            label="设施" 
            icon={<FactoryIcon />} 
            showLabel={true} // 强制显示标签
          />
          <BottomNavigationAction 
            label="科技" 
            icon={<ScienceIcon />} 
            showLabel={true} // 强制显示标签
          />
        </BottomNavigation>

        {/* 清空存档按钮 - 仅在开发模式下显示 */}
        {import.meta.env.DEV && (
          <Fab
            color="error"
            size="small"
            aria-label="clear-game"
            sx={{
              position: 'fixed',
              top: '16px',
              right: '16px',
              zIndex: 1000,
              bgcolor: 'error.main',
              '&:hover': {
                bgcolor: 'error.dark',
              },
            }}
            onClick={() => setIsClearDialogOpen(true)}
          >
            <DeleteIcon />
          </Fab>
        )}

        {/* 清空存档对话框 */}
        <Dialog 
          open={isClearDialogOpen} 
          onClose={() => setIsClearDialogOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ color: 'error.main' }}>
            确认清空存档
          </DialogTitle>
          <DialogContent>
            <Typography>
              您确定要清空所有游戏数据吗？这将删除所有已保存的进度和设置。
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsClearDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleClearGame} color="error" variant="contained">
              清空存档
            </Button>
          </DialogActions>
        </Dialog>

        {/* 成功提示 */}
        <Snackbar
          open={showSuccessMessage}
          autoHideDuration={3000}
          onClose={() => setShowSuccessMessage(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{
            '& .MuiSnackbarContent-root': {
              bgcolor: 'success.main',
              color: 'white',
            }
          }}
        >
          <Alert 
            onClose={() => setShowSuccessMessage(false)} 
            severity="success" 
            sx={{ 
              width: '100%',
              bgcolor: 'success.main',
              color: 'white',
              '& .MuiAlert-icon': {
                color: 'white',
              }
            }}
          >
            存档已清空！页面将在3秒后重新加载...
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App;
