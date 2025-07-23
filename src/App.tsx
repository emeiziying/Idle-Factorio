import React, { useState, useEffect } from 'react';
import { 
  Box, 
  BottomNavigation, 
  BottomNavigationAction,
  ThemeProvider,
  createTheme,
  CssBaseline
} from '@mui/material';
import {
  Build as BuildIcon,
  Factory as FactoryIcon,
  Science as ScienceIcon
} from '@mui/icons-material';

import ProductionModule from './components/production/ProductionModule';
import FacilitiesModule from './components/facilities/FacilitiesModule';
import TechnologyModule from './components/technology/TechnologyModule';
import DataService from './services/DataService';
import CraftingEngine from './utils/craftingEngine';
import useGameStore from './store/gameStore';
import { useSwipeGesture } from './hooks/useSwipeGesture';
import { useIsMobile } from './hooks/useIsMobile';

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
    // 移动端优化
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          minWidth: 'auto',
          paddingTop: 8,
          paddingBottom: 8,
          '&.Mui-selected': {
            fontSize: '0.75rem',
          },
        },
        label: {
          fontSize: '0.75rem',
          '&.Mui-selected': {
            fontSize: '0.8rem',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          // 移动端更小的圆角
          '@media (max-width: 600px)': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          // 移动端全屏对话框
          '@media (max-width: 600px)': {
            margin: 8,
            width: 'calc(100% - 16px)',
            maxHeight: 'calc(100% - 16px)',
          },
        },
      },
    },
  },
});

function App() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // 移动端滑动切换标签页
  const swipeRef = useSwipeGesture({
    onSwipeLeft: () => {
      if (isMobile && selectedTab < 2) {
        setSelectedTab(selectedTab + 1);
      }
    },
    onSwipeRight: () => {
      if (isMobile && selectedTab > 0) {
        setSelectedTab(selectedTab - 1);
      }
    },
    threshold: 100
  });

  // 初始化游戏数据
  useEffect(() => {
    const initializeGame = async () => {
      try {
        const dataService = DataService.getInstance();
        await dataService.loadGameData();
        
        // 启动制作引擎
        const craftingEngine = CraftingEngine.getInstance();
        craftingEngine.start();
        
        // 添加一些初始库存物品用于测试
        const gameStore = useGameStore.getState();
        gameStore.updateInventory('coal', 100);
        gameStore.updateInventory('iron-ore', 100);
        gameStore.updateInventory('copper-ore', 100);
        gameStore.updateInventory('stone', 50);
        gameStore.updateInventory('wood', 50);
        gameStore.updateInventory('iron-plate', 20);
        gameStore.updateInventory('copper-plate', 20);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize game:', err);
        setError('Failed to load game data');
        setIsLoading(false);
      }
    };

    initializeGame();
  }, []);

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          height="100vh"
          bgcolor="background.default"
        >
          Loading game data...
        </Box>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          height="100vh"
          bgcolor="background.default"
          color="error.main"
        >
          {error}
        </Box>
      </ThemeProvider>
    );
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box 
        ref={swipeRef}
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100vh',
          bgcolor: 'background.default'
        }}
      >
        {/* 主内容区 */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'hidden', 
          p: isMobile ? 0.5 : 1,
          // 禁用页面缩放和过度滚动
          overscrollBehavior: 'none',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {selectedTab === 0 && <ProductionModule />}
          {selectedTab === 1 && <FacilitiesModule />}
          {selectedTab === 2 && <TechnologyModule />}
        </Box>
        
        {/* 底部导航 */}
        <BottomNavigation 
          value={selectedTab} 
          onChange={handleTabChange}
          sx={{ 
            bgcolor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
            height: isMobile ? 70 : 56,
            // 移动端安全区域适配
            ...(isMobile && {
              paddingBottom: 'env(safe-area-inset-bottom)'
            })
          }}
        >
          <BottomNavigationAction 
            label="生产" 
            icon={<BuildIcon sx={{ fontSize: isMobile ? '1.5rem' : '1.25rem' }} />} 
            sx={{ 
              color: 'text.primary',
              minWidth: isMobile ? 60 : 80,
              '&.Mui-selected': {
                color: 'primary.main'
              }
            }}
          />
          <BottomNavigationAction 
            label="设施" 
            icon={<FactoryIcon sx={{ fontSize: isMobile ? '1.5rem' : '1.25rem' }} />} 
            sx={{ 
              color: 'text.primary',
              minWidth: isMobile ? 60 : 80,
              '&.Mui-selected': {
                color: 'primary.main'
              }
            }}
          />
          <BottomNavigationAction 
            label="科技" 
            icon={<ScienceIcon sx={{ fontSize: isMobile ? '1.5rem' : '1.25rem' }} />} 
            sx={{ 
              color: 'text.primary',
              minWidth: isMobile ? 60 : 80,
              '&.Mui-selected': {
                color: 'primary.main'
              }
            }}
          />
        </BottomNavigation>
      </Box>
    </ThemeProvider>
  );
}

export default App;
