import React, { useState, useEffect } from 'react';
import { 
  Box, 
  BottomNavigation, 
  BottomNavigationAction,
  ThemeProvider,
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
  Delete as DeleteIcon,
  BugReport as TestIcon
} from '@mui/icons-material';

import ProductionModule from './components/production/ProductionModule';
import FacilitiesModule from './components/facilities/FacilitiesModule';
import TechnologyModule from './components/technology/TechnologyModule';
import ManualCraftingTestPage from './components/test/ManualCraftingTestPage';
import DataService from './services/DataService';
import CraftingEngine from './utils/craftingEngine';
import useGameStore from './store/gameStore';
import { useIsMobile } from './hooks/useIsMobile';
import theme from './theme';

const App: React.FC = () => {
  const [currentModule, setCurrentModule] = useState(0);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const isMobile = useIsMobile();
  const { clearGameData } = useGameStore();

  // 初始化游戏数据
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 加载游戏数据
        await DataService.getInstance().loadGameData();
        
        // 加载国际化数据
        await DataService.getInstance().loadI18nData('zh');
        
        // 启动制作引擎
        CraftingEngine.getInstance().start();
        
        console.log('App initialized successfully');
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
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
          boxSizing: 'border-box'
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
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
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
              bottom: isMobile ? '68px' : '72px', // 移动端稍微靠近一点
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
