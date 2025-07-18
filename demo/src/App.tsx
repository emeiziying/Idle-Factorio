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
} from '@mui/material';
import { dataService } from './services/DataService';
import { GameData, Item, InventoryItem, CraftingTask } from './types';
import CategoryTabs from './components/CategoryTabs';
import ItemGrid from './components/ItemGrid';
import ItemDetailDialog from './components/ItemDetailDialog';
import CraftingQueue from './components/CraftingQueue';

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
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
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
  const [inventory, setInventory] = useState<Map<string, InventoryItem>>(new Map());
  const [craftingTasks, setCraftingTasks] = useState<CraftingTask[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // 加载游戏数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await dataService.loadGameData();
        setGameData(data);
        
        // 初始化库存数据
        updateInventory();
        
        // 启动制作模拟
        dataService.startCraftingSimulation();
        
      } catch (error) {
        console.error('Failed to load game data:', error);
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
    const inventoryItems = dataService.getAllInventoryItems();
    const inventoryMap = new Map();
    inventoryItems.forEach(item => {
      inventoryMap.set(item.itemId, item);
    });
    setInventory(inventoryMap);
  };

  const updateCraftingQueue = () => {
    const tasks = dataService.getCraftingQueue();
    setCraftingTasks(tasks);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
    setDetailDialogOpen(true);
  };

  const handleCraft = (itemId: string, quantity: number) => {
    const success = dataService.addToCraftingQueue(itemId, quantity);
    if (success) {
      updateCraftingQueue();
    }
  };

  const handleCancelTask = (taskId: string) => {
    const success = dataService.removeCraftingTask(taskId);
    if (success) {
      updateCraftingQueue();
    }
  };

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedItem(null);
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          height="100vh"
          flexDirection="column"
          gap={2}
        >
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary">
            加载异星工厂数据中...
          </Typography>
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
          height="100vh"
        >
          <Typography variant="h6" color="error">
            加载失败，请刷新页面重试
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  const categoryItems = dataService.getItemsByCategory(selectedCategory);
  const selectedInventory = selectedItem ? inventory.get(selectedItem.id) : undefined;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* 应用标题栏 */}
        <AppBar position="static" elevation={1}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              异星工厂移动版 Demo
            </Typography>
            <Typography variant="body2" color="inherit" sx={{ opacity: 0.8 }}>
              v{gameData.version.base}
            </Typography>
          </Toolbar>
        </AppBar>

        {/* 分类标签 */}
        <CategoryTabs
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />

        {/* 物品网格 */}
        <Box sx={{ flex: 1, overflow: 'auto', backgroundColor: 'background.default' }}>
          <ItemGrid
            items={categoryItems}
            inventory={inventory}
            onItemClick={handleItemClick}
          />
        </Box>

        {/* 物品详情对话框 */}
        <ItemDetailDialog
          open={detailDialogOpen}
          item={selectedItem}
          inventory={selectedInventory}
          onClose={handleCloseDetailDialog}
          onCraft={handleCraft}
        />

        {/* 制作队列浮动按钮 */}
        <CraftingQueue
          tasks={craftingTasks}
          onCancelTask={handleCancelTask}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;
