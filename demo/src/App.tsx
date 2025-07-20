import React, { useState, useEffect } from 'react';
import {
  Box,
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { dataService } from './services/DataService';
import { facilityService } from './services/FacilityService';
import { GameData, Item, InventoryItem, CraftingTask } from './types';
import CategoryTabs from './components/CategoryTabs';
import ItemGrid from './components/ItemGrid';
import ItemDetailDialog from './components/ItemDetailDialog';
import CraftingQueue from './components/CraftingQueue';
import FacilityOverview from './components/FacilityOverview';

// 创建移动端友好的主题
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

function App() {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('logistics');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [craftingQueue, setCraftingQueue] = useState<CraftingTask[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await dataService.loadGameData();
        setGameData(data);
        
        // 初始化设施服务
        facilityService.initialize(data);
        
        // 初始化库存数据
        updateInventory();
        
        // 启动制作模拟
        dataService.startCraftingSimulation();
        
      } catch (error) {
        console.error('Failed to load game data:', error);
        setError('加载游戏数据失败，请刷新页面重试');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 定期更新库存和制作队列
  useEffect(() => {
    const interval = setInterval(() => {
      updateInventory();
      updateCraftingQueue();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const updateInventory = () => {
    try {
      const items = dataService.getAllInventoryItems();
      setInventory(items);
      
      // 更新设施的总产能和消耗
      items.forEach(item => {
        const production = facilityService.getTotalProductionForItem(item.itemId);
        const consumption = facilityService.getTotalConsumptionForItem(item.itemId);
        
        if (production !== item.productionRate || consumption !== item.consumptionRate) {
          dataService.updateInventory(item.itemId, {
            productionRate: production,
            consumptionRate: consumption,
          });
        }
      });
    } catch (error) {
      console.error('更新库存失败:', error);
    }
  };

  const updateCraftingQueue = () => {
    try {
      const queue = dataService.getCraftingQueue();
      setCraftingQueue(queue);
    } catch (error) {
      console.error('更新制作队列失败:', error);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
  };

  const handleCloseDetail = () => {
    setSelectedItem(null);
  };

  const handleCraft = (itemId: string, quantity: number) => {
    try {
      const success = dataService.addToCraftingQueue(itemId, quantity);
      if (success) {
        setSuccess(`已添加到制作队列：${quantity}个`);
        updateCraftingQueue();
      } else {
        setError('制作队列已满（最多10个任务）');
      }
    } catch (error) {
      setError('添加到制作队列失败');
      console.error('制作失败:', error);
    }
  };

  const handleCancelCraft = (taskId: string) => {
    try {
      const success = dataService.removeCraftingTask(taskId);
      if (success) {
        updateCraftingQueue();
      }
    } catch (error) {
      console.error('取消制作失败:', error);
    }
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  if (!gameData) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          p={2}
        >
          <Alert severity="error">
            加载游戏数据失败，请刷新页面重试
          </Alert>
        </Box>
      </ThemeProvider>
    );
  }

  const categoryItems = dataService.getItemsByCategory(selectedCategory);
  const inventoryMap = new Map(inventory.map(item => [item.itemId, item]));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              异星工厂
            </Typography>
          </Toolbar>
        </AppBar>
        
        <CategoryTabs
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />
        
        {selectedCategory === 'facilities' ? (
          <FacilityOverview />
        ) : (
          <ItemGrid
            items={categoryItems}
            inventory={inventoryMap}
            onItemClick={handleItemClick}
          />
        )}
        
        <ItemDetailDialog
          open={!!selectedItem}
          item={selectedItem}
          inventory={selectedItem ? inventoryMap.get(selectedItem.id) : undefined}
          onClose={handleCloseDetail}
          onCraft={handleCraft}
        />
        
        <CraftingQueue
          tasks={craftingQueue}
          onCancelTask={handleCancelCraft}
        />
        
        {/* 错误提示 */}
        <Snackbar
          open={!!error}
          autoHideDuration={4000}
          onClose={() => setError('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
        
        {/* 成功提示 */}
        <Snackbar
          open={!!success}
          autoHideDuration={2000}
          onClose={() => setSuccess('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
            {success}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App;
