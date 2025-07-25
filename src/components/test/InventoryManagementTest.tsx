import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import ItemDetailPanel from '../production/ItemDetailPanel';
import DataService from '../../services/DataService';
import useGameStore from '../../store/gameStore';

const InventoryManagementTest: React.FC = () => {
  const [selectedItemId, setSelectedItemId] = useState('wooden-chest');
  const dataService = DataService.getInstance();
  const { updateInventory } = useGameStore();
  
  const testItems = [
    'wooden-chest',
    'iron-chest', 
    'steel-chest',
    'storage-tank',
    'water',
    'crude-oil'
  ];

  const item = dataService.getItem(selectedItemId);
  if (!item) return <Typography>物品不存在</Typography>;

  // 添加一些测试数据
  const addTestData = () => {
    // 添加一些存储设备到库存
    updateInventory('wooden-chest', 5);
    updateInventory('iron-chest', 3);
    updateInventory('steel-chest', 2);
    updateInventory('storage-tank', 1);
  };

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>
        库存管理测试
      </Typography>
      
      {/* 测试数据按钮 */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            测试数据
          </Typography>
          <Button variant="outlined" onClick={addTestData}>
            添加测试存储设备
          </Button>
        </CardContent>
      </Card>
      
      {/* 物品选择 */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            选择测试物品
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {testItems.map(itemId => {
              const testItem = dataService.getItem(itemId);
              if (!testItem) return null;
              
              return (
                <Button
                  key={itemId}
                  variant={selectedItemId === itemId ? "contained" : "outlined"}
                  size="small"
                  onClick={() => setSelectedItemId(itemId)}
                >
                  {dataService.getLocalizedItemName(itemId)}
                </Button>
              );
            })}
          </Box>
        </CardContent>
      </Card>
      
      {/* 物品详情面板 */}
      <Box sx={{ height: '600px', border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <ItemDetailPanel item={item} />
      </Box>
    </Box>
  );
};

export default InventoryManagementTest; 