import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  ThemeProvider,
  CssBaseline,
  BottomNavigation,
  BottomNavigationAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Alert,
  Fab,
  Typography
} from '@mui/material';
import {
  Build as BuildIcon,
  Factory as FactoryIcon,
  Science as ScienceIcon,
  BugReport as TestIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

import ProductionModule from './components/production/ProductionModule';
import FacilitiesModule from './components/facilities/FacilitiesModule';
import TechnologyModule from './components/technology/TechnologyModule';
import ManualCraftingTestPage from './components/test/ManualCraftingTestPage';

import { DataService } from './services/DataService';
import CraftingEngine from './utils/craftingEngine';
import useGameStore from './store/gameStore';
import { useIsMobile } from './hooks/useIsMobile';
import { usePersistentState } from './hooks/usePersistentState';
import theme from './theme';

const App: React.FC = () => {
  const [currentModule, setCurrentModule] = usePersistentState('app-current-module', 0);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const isMobile = useIsMobile();
  const { clearGameData } = useGameStore();
  
  // 使用ref来跟踪初始化状态，避免重复初始化
  const initializationRef = useRef<{
    isInitialized: boolean;
    initPromise: Promise<void> | null;
  }>({
    isInitialized: false,
    initPromise: null
  });

  // 初始化游戏数据
  useEffect(() => {
    const initializeApp = async () => {
      // 如果已经初始化过，直接返回
      if (initializationRef.current.isInitialized) {
        return;
      }

      // 如果正在初始化中，返回同一个Promise
      if (initializationRef.current.initPromise) {
        return initializationRef.current.initPromise;
      }

      // 开始新的初始化过程
      initializationRef.current.initPromise = (async () => {
        try {
          // 加载游戏数据
          await DataService.getInstance().loadGameData();

          // 加载国际化数据
          await DataService.getInstance().loadI18nData('zh');

          // 启动制作引擎
          CraftingEngine.getInstance().start();

          console.log('App initialized successfully');
          
          // 标记为已初始化
          initializationRef.current.isInitialized = true;
        } catch (error) {
          console.error('Failed to initialize app:', error);
          // 初始化失败时重置状态，允许重试
          initializationRef.current.isInitialized = false;
        } finally {
          // 清除Promise缓存
          initializationRef.current.initPromise = null;
        }
      })();

      return initializationRef.current.initPromise;
    };

    initializeApp();

    // 清理函数：组件卸载时停止制作引擎
    return () => {
      CraftingEngine.getInstance().stop();
    };
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
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          paddingBottom: { xs: '56px', sm: '0px' } // 移动端为底部导航留空间，桌面端不需要
        }}>
          {currentModule === 0 && <ProductionModule />}
          {currentModule === 1 && <FacilitiesModule />}
          {currentModule === 2 && <TechnologyModule />}
          {currentModule === 3 && <ManualCraftingTestPage />}
        </Box>

        {/* 底部导航 */}
        <BottomNavigation
          value={currentModule}
          onChange={handleTabChange}
          showLabels // 确保显示标签
          sx={{
            width: '100%',
            position: { xs: 'fixed', sm: 'static' }, // 移动端固定定位，桌面端静态定位
            bottom: { xs: 0, sm: 'auto' },
            left: { xs: 0, sm: 'auto' },
            right: { xs: 0, sm: 'auto' },
            zIndex: { xs: 1200, sm: 'auto' }, // 移动端高z-index
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            minHeight: '56px', // 确保最小高度
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
              flex: 1,
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.65rem',
                opacity: 1, // 确保未选中时也显示
                '&.Mui-selected': {
                  fontSize: '0.7rem',
                  fontWeight: 600,
                },
              },
              '& .MuiSvgIcon-root': {
                fontSize: '1.3rem',
                marginBottom: '1px',
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
          {import.meta.env.DEV && (
            <BottomNavigationAction
              label="测试"
              icon={<TestIcon />}
              showLabel={true} // 强制显示标签
            />
          )}
        </BottomNavigation>

        {/* 清空存档按钮 - 仅在开发模式下显示 */}
        {import.meta.env.DEV && (
          <Fab
            color="error"
            size="small"
            aria-label="clear-game"
            sx={{
              position: 'fixed',
              bottom: isMobile ? '72px' : '72px', // 为固定底部导航留出更多空间
              right: '16px',
              zIndex: 1000,
              bgcolor: 'error.main',
              width: isMobile ? '44px' : '48px',
              height: isMobile ? '44px' : '48px',
              '&:hover': {
                bgcolor: 'error.dark',
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
              transition: 'all 0.2s ease',
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
