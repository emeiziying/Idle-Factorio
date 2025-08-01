import React, { useState, useEffect } from 'react';
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
  Typography,
} from '@mui/material';
import {
  Build as BuildIcon,
  Factory as FactoryIcon,
  Science as ScienceIcon,
  BugReport as TestIcon,
  Delete as DeleteIcon,
  Compress as CompressIcon,
} from '@mui/icons-material';

import ProductionModule from '@/components/production/ProductionModule';
import FacilitiesModule from '@/components/facilities/FacilitiesModule';
import TechnologyModule from '@/components/technology/TechnologyModule';
import ManualCraftingTestPage from '@/components/test/ManualCraftingTestPage';
import LoadingScreen from '@/components/common/LoadingScreen';
import ErrorScreen from '@/components/common/ErrorScreen';
import { useGameLoop } from '@/hooks/useGameLoop';

import { ServiceInitializer } from '@/services/core/ServiceInitializer';
import useGameStore from '@/store/gameStore';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useLocalStorageState } from 'ahooks';
import { useInventoryRepair } from '@/hooks/useInventoryRepair';
import { useUnlockedTechsRepair } from '@/hooks/useUnlockedTechsRepair';
import { useFacilityRepair } from '@/hooks/useFacilityRepair';
import theme from '@/theme';
import { error as logError } from '@/utils/logger';

const App: React.FC = () => {
  const [currentModule, setCurrentModule] = useLocalStorageState('app-current-module', {
    defaultValue: 0,
  });
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { clearGameData } = useGameStore();

  // 启动游戏循环
  useGameLoop();

  // 安全修复inventory状态
  useInventoryRepair();

  // 安全修复unlockedTechs状态
  useUnlockedTechsRepair();

  // 安全修复设施状态
  useFacilityRepair();

  // 简化：不再需要本地状态跟踪，ServiceInitializer会处理

  // 页面卸载时强制存档
  useEffect(() => {
    const handleBeforeUnload = async () => {
      const { forceSaveGame } = useGameStore.getState();
      try {
        // 强制存档（不等待，避免阻塞页面关闭）
        forceSaveGame().catch(console.error);
      } catch (error) {
        console.error('页面卸载时存档失败:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // 初始化游戏数据 - ServiceInitializer已处理防重复逻辑
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setInitError(null);
        console.time('[App] 应用启动');

        // ServiceInitializer 内部已处理防重复和Promise缓存
        await ServiceInitializer.initialize();

        console.timeEnd('[App] 应用启动');
        console.log('[App] 应用初始化完成，UI即将就绪');
        setIsAppReady(true);
      } catch (error) {
        logError('Failed to initialize app:', error);
        setInitError(`初始化失败: ${error instanceof Error ? error.message : String(error)}`);
        setIsAppReady(false);
      }
    };

    initializeApp();

    // 清理函数：组件卸载时停止游戏循环
    return () => {
      ServiceInitializer.cleanup();
    };
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentModule(newValue);
  };

  const handleClearGame = async () => {
    await clearGameData();
    // clearGameData() 已经包含立即重载，无需额外处理
  };

  // 如果初始化出错，显示错误页面
  if (initError) {
    return (
      <ErrorScreen
        withTheme
        error={initError}
        showRetry
        retryText="重试初始化"
        onRetry={() => {
          setInitError(null);
          setIsAppReady(false);
          // 重置ServiceInitializer状态，重新初始化
          ServiceInitializer.reset();
          // 触发重新初始化
          ServiceInitializer.initialize()
            .then(() => setIsAppReady(true))
            .catch(error =>
              setInitError(`重试失败: ${error instanceof Error ? error.message : String(error)}`)
            );
        }}
      />
    );
  }

  // 如果还在初始化中，显示加载页面
  if (!isAppReady) {
    return (
      <LoadingScreen
        withTheme
        message="正在初始化游戏系统..."
        subtitle="请稍候，首次加载可能需要几秒钟"
      />
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          width: '100vw',
          bgcolor: 'background.default',
        }}
      >
        {/* 主内容区域 */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            paddingBottom: { xs: '56px', sm: '0px' }, // 移动端为底部导航留空间，桌面端不需要
          }}
        >
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
          {import.meta.env.DEV && (
            <BottomNavigationAction
              label="优化"
              icon={<CompressIcon />}
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
          <DialogTitle sx={{ color: 'error.main' }}>确认清空存档</DialogTitle>
          <DialogContent>
            <Typography>您确定要清空所有游戏数据吗？这将删除所有已保存的进度和设置。</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsClearDialogOpen(false)}>取消</Button>
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
            },
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
              },
            }}
          >
            存档已清空！页面将在3秒后重新加载...
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default App;
