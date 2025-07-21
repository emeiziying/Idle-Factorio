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
import ProductionModule from './components/ProductionModule';
import FacilitiesModule from './components/FacilitiesModule';
import TechnologyModule from './components/TechnologyModule';
import CraftingQueue from './components/CraftingQueue';
import { useGameStore } from './store/gameStore';
import { CraftingService } from './services/CraftingService';
import './App.css';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ff6b35',
    },
    secondary: {
      main: '#4ecdc4',
    },
    background: {
      default: '#1a1a1a',
      paper: '#2a2a2a',
    },
  },
});

function App() {
  const [selectedTab, setSelectedTab] = useState(0);
  const initializeGame = useGameStore(state => state.initializeGame);
  const saveGame = useGameStore(state => state.saveGame);

  // 初始化游戏
  useEffect(() => {
    initializeGame();
    
    // 初始化制作服务
    const craftingService = CraftingService.getInstance();
    craftingService.initialize();
    
    // 设置自动保存
    const saveInterval = setInterval(() => {
      saveGame();
      console.log('Game saved');
    }, 30000); // 每30秒保存一次

    return () => {
      clearInterval(saveInterval);
      craftingService.cleanup();
    };
  }, [initializeGame, saveGame]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* 主内容区 */}
        <Box sx={{ flex: 1, overflow: 'auto', bgcolor: 'background.default' }}>
          {selectedTab === 0 && <ProductionModule />}
          {selectedTab === 1 && <FacilitiesModule />}
          {selectedTab === 2 && <TechnologyModule />}
        </Box>
        
        {/* 底部导航 */}
        <BottomNavigation
          value={selectedTab}
          onChange={(event, newValue) => {
            setSelectedTab(newValue);
          }}
          sx={{ 
            bgcolor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider'
          }}
        >
          <BottomNavigationAction 
            label="生产" 
            icon={<BuildIcon />}
            sx={{ color: selectedTab === 0 ? 'primary.main' : 'text.secondary' }}
          />
          <BottomNavigationAction 
            label="设施" 
            icon={<FactoryIcon />}
            sx={{ color: selectedTab === 1 ? 'primary.main' : 'text.secondary' }}
          />
          <BottomNavigationAction 
            label="科技" 
            icon={<ScienceIcon />}
            sx={{ color: selectedTab === 2 ? 'primary.main' : 'text.secondary' }}
          />
        </BottomNavigation>
      </Box>
      
      {/* 制作队列悬浮窗 */}
      <CraftingQueue />
    </ThemeProvider>
  );
}

export default App;