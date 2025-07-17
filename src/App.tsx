import React from 'react';
import {
  Container,
  Box,
  Tabs,
  Tab,
  Typography,
  AppBar,
  Toolbar,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Grid
} from '@mui/material';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppSelector, useAppDispatch, useGameLoop } from './hooks';
import { setSelectedTab } from './store/slices/uiSlice';
import { ItemCategory } from './types';
import { allItems } from './data';
import { ItemGrid } from './components/items/ItemGrid';
import { ItemDetailModal } from './components/items/ItemDetailModal';
import { CraftingQueue } from './components/crafting/CraftingQueue';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#FF6B00', // Factorio orange
    },
    secondary: {
      main: '#2E7D32',
    },
  },
});

// Tab 标签映射
const tabLabels: Record<ItemCategory, string> = {
  [ItemCategory.RESOURCES]: '资源',
  [ItemCategory.MATERIALS]: '材料',
  [ItemCategory.COMPONENTS]: '组件',
  [ItemCategory.PRODUCTS]: '产品',
  [ItemCategory.SCIENCE]: '科技',
  [ItemCategory.MILITARY]: '军事',
  [ItemCategory.LOGISTICS]: '物流',
  [ItemCategory.PRODUCTION]: '生产',
  [ItemCategory.POWER]: '电力',
};

function GameContent() {
  const dispatch = useAppDispatch();
  const selectedTab = useAppSelector(state => state.ui.selectedTab);
  
  // 启动游戏循环
  useGameLoop();
  
  const handleTabChange = (_: React.SyntheticEvent, newValue: ItemCategory) => {
    dispatch(setSelectedTab(newValue));
  };
  
  // 获取当前分类的物品
  const currentItems = allItems.filter(item => item.category === selectedTab);
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Factorio Idle
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="xl" sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          {/* 主要内容区域 */}
          <Grid xs={12} md={9}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs
                value={selectedTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
              >
                {Object.entries(tabLabels).map(([category, label]) => (
                  <Tab
                    key={category}
                    label={label}
                    value={category}
                  />
                ))}
              </Tabs>
            </Box>
            
            <ItemGrid items={currentItems} />
          </Grid>
          
          {/* 侧边栏 - 制作队列 */}
          <Grid xs={12} md={3}>
            <CraftingQueue />
          </Grid>
        </Grid>
      </Container>
      
      {/* 物品详情模态框 */}
      <ItemDetailModal />
    </Box>
  );
}

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GameContent />
      </ThemeProvider>
    </Provider>
  );
}

export default App;
