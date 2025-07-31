import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Assignment as AssignmentIcon,
  Build as BuildIcon,
  Block as BlockIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { DataService, RecipeService } from '@/services';
import ManualCraftingValidator from '@/utils/manualCraftingValidator';
import type { ManualCraftingValidation } from '@/utils/manualCraftingValidator';
import ItemCard from './ItemCard';
import type { Item, Recipe } from '@/types/index';
import { useLocalStorageState } from 'ahooks';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`crafting-tabpanel-${index}`}
      aria-labelledby={`crafting-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface ItemWithValidation {
  item: Item;
  validation: ManualCraftingValidation;
  recipes: Recipe[];
}

interface CategoryGroup {
  [category: string]: ItemWithValidation[];
}

interface ItemsData {
  craftable: CategoryGroup;
  notCraftable: CategoryGroup;
  statistics: {
    total: number;
    craftable: number;
    notCraftable: number;
    categories: { [key: string]: number };
  };
}

const ManualCraftingTestPage: React.FC = () => {
  const [tabValue, setTabValue] = useLocalStorageState('test-tab-value', { defaultValue: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useLocalStorageState('test-selected-category', {
    defaultValue: 'all',
  });
  const [itemsData, setItemsData] = useState<ItemsData>({
    craftable: {},
    notCraftable: {},
    statistics: { total: 0, craftable: 0, notCraftable: 0, categories: {} },
  });

  const dataService = DataService.getInstance();
  const validator = ManualCraftingValidator.getInstance();

  const analyzeItems = useCallback(() => {
    const allItems = dataService.getAllItems();
    const craftableItems: CategoryGroup = {};
    const notCraftableItems: CategoryGroup = {};
    const categoryStats: { [key: string]: number } = {};

    let craftableCount = 0;
    let notCraftableCount = 0;

    allItems.forEach((item) => {
      const validation = validator.validateManualCrafting(item.id);
      const recipes = RecipeService.getRecipesThatProduce(item.id);

      const itemData: ItemWithValidation = {
        item,
        validation,
        recipes,
      };

      // 统计分类
      categoryStats[item.category] = (categoryStats[item.category] || 0) + 1;

      if (validation.canCraftManually) {
        craftableCount++;
        const category = item.category;
        if (!craftableItems[category]) {
          craftableItems[category] = [];
        }
        craftableItems[category].push(itemData);
      } else {
        notCraftableCount++;
        const category = item.category;
        if (!notCraftableItems[category]) {
          notCraftableItems[category] = [];
        }
        notCraftableItems[category].push(itemData);
      }
    });

    // 按配方顺序排序（保持游戏数据中的原始顺序）
    Object.keys(craftableItems).forEach((category) => {
      craftableItems[category].sort((a, b) => {
        // 获取物品在游戏数据中的索引位置
        const aIndex = dataService.getAllItems().findIndex((item) => item.id === a.item.id);
        const bIndex = dataService.getAllItems().findIndex((item) => item.id === b.item.id);
        return aIndex - bIndex;
      });
    });

    Object.keys(notCraftableItems).forEach((category) => {
      notCraftableItems[category].sort((a, b) => {
        // 获取物品在游戏数据中的索引位置
        const aIndex = dataService.getAllItems().findIndex((item) => item.id === a.item.id);
        const bIndex = dataService.getAllItems().findIndex((item) => item.id === b.item.id);
        return aIndex - bIndex;
      });
    });

    setItemsData({
      craftable: craftableItems,
      notCraftable: notCraftableItems,
      statistics: {
        total: allItems.length,
        craftable: craftableCount,
        notCraftable: notCraftableCount,
        categories: categoryStats,
      },
    });
  }, [dataService, validator]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await dataService.loadGameData();
        await dataService.loadI18nData('zh');
        analyzeItems();
      } catch (error) {
        console.error('Failed to load game data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [analyzeItems, dataService]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 获取所有可用的分类
  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    Object.keys(itemsData.craftable).forEach((cat) => categories.add(cat));
    Object.keys(itemsData.notCraftable).forEach((cat) => categories.add(cat));
    return Array.from(categories).sort();
  }, [itemsData]);

  // 过滤数据
  const filteredData = useMemo(() => {
    const filterItems = (items: CategoryGroup) => {
      const filtered: CategoryGroup = {};

      Object.entries(items).forEach(([category, categoryItems]) => {
        if (selectedCategory !== 'all' && category !== selectedCategory) {
          return;
        }

        const filteredItems = categoryItems.filter(
          (item) =>
            item.item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.item.id.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filteredItems.length > 0) {
          filtered[category] = filteredItems;
        }
      });

      return filtered;
    };

    return {
      craftable: filterItems(itemsData.craftable),
      notCraftable: filterItems(itemsData.notCraftable),
    };
  }, [itemsData, searchTerm, selectedCategory]);

  const renderItemCard = (itemData: ItemWithValidation) => {
    return (
      <ItemCard
        key={itemData.item.id}
        item={itemData.item}
        validation={itemData.validation}
        recipes={itemData.recipes}
      />
    );
  };

  const renderCategorySection = (data: CategoryGroup) => {
    const categoryEntries = Object.entries(data).sort(([, a], [, b]) => b.length - a.length);

    if (categoryEntries.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          没有找到符合条件的物品
        </Alert>
      );
    }

    return (
      <Box>
        {categoryEntries.map(([category, items]) => (
          <Box key={category} sx={{ mb: 4 }}>
            {/* 分类小标题 */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 3,
                pb: 1,
                borderBottom: '2px solid',
                borderColor: 'primary.main',
                '&::before': {
                  content: '""',
                  width: '4px',
                  height: '20px',
                  backgroundColor: 'primary.main',
                  borderRadius: '2px',
                },
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {dataService.getLocalizedCategoryName(category)}
              </Typography>
              <Chip size="small" label={`${items.length}个`} variant="outlined" color="primary" />
            </Box>

            {/* 物品网格 - 按row分组 */}
            <Box>
              {(() => {
                // 按row分组
                const groupedByRow = items.reduce(
                  (groups, itemData) => {
                    const row = itemData.item.row || 0;
                    if (!groups[row]) {
                      groups[row] = [];
                    }
                    groups[row].push(itemData);
                    return groups;
                  },
                  {} as { [row: number]: ItemWithValidation[] }
                );

                // 按row排序
                const sortedRows = Object.keys(groupedByRow)
                  .map(Number)
                  .sort((a, b) => a - b);

                return sortedRows.map((row) => (
                  <Box key={row} sx={{ mb: 2 }}>
                    {/* 该行的物品网格 */}
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))',
                        gap: 1,
                      }}
                    >
                      {groupedByRow[row].map((itemData) => (
                        <Box key={itemData.item.id}>{renderItemCard(itemData)}</Box>
                      ))}
                    </Box>
                  </Box>
                ));
              })()}
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          加载游戏数据中...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        物品制作验证
      </Typography>

      <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
        基于官方Wiki规则和配方属性的自动判断逻辑
      </Typography>

      {/* 统计信息 */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          统计信息
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={3} justifyContent="space-around">
          <Box textAlign="center">
            <Typography variant="h4" color="primary">
              {itemsData.statistics.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              总物品数
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h4" color="success.main">
              {itemsData.statistics.craftable}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              可制作 ({((itemsData.statistics.craftable / itemsData.statistics.total) * 100).toFixed(1)}%)
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h4" color="error.main">
              {itemsData.statistics.notCraftable}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              不可制作 ({((itemsData.statistics.notCraftable / itemsData.statistics.total) * 100).toFixed(1)}%)
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h4" color="info.main">
              {allCategories.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              物品分类数
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* 筛选控件 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2}>
          <Box flex={1}>
            <TextField
              fullWidth
              variant="outlined"
              label="搜索物品"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Box>
          <Box flex={1}>
            <FormControl fullWidth>
              <InputLabel>分类筛选</InputLabel>
              <Select
                value={selectedCategory}
                label="分类筛选"
                onChange={(e) => setSelectedCategory(e.target.value)}
                startAdornment={<FilterIcon sx={{ mr: 1, color: 'text.secondary' }} />}
              >
                <MenuItem value="all">所有分类</MenuItem>
                {allCategories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category} ({itemsData.statistics.categories[category]}个)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Paper>

      {/* 标签页 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="crafting test tabs">
          <Tab
            icon={<BuildIcon />}
            label={`可制作 (${Object.values(filteredData.craftable).reduce((sum, items) => sum + items.length, 0)})`}
            id="crafting-tab-0"
            aria-controls="crafting-tabpanel-0"
          />
          <Tab
            icon={<BlockIcon />}
            label={`不可制作 (${Object.values(filteredData.notCraftable).reduce((sum, items) => sum + items.length, 0)})`}
            id="crafting-tab-1"
            aria-controls="crafting-tabpanel-1"
          />
          <Tab icon={<InfoIcon />} label="规则说明" id="crafting-tab-2" aria-controls="crafting-tabpanel-2" />
        </Tabs>
      </Box>

      {/* 可手动制作物品 */}
      <TabPanel value={tabValue} index={0}>
        {renderCategorySection(filteredData.craftable)}
      </TabPanel>

      {/* 不可手动制作物品 */}
      <TabPanel value={tabValue} index={1}>
        {renderCategorySection(filteredData.notCraftable)}
      </TabPanel>

      {/* 验证规则说明 */}
      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            规则说明
          </Typography>

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            🟢 可以制作的物品类型
          </Typography>

          <List>
            <ListItem>
              <ListItemText primary="原材料类物品" secondary="没有制作配方的物品，如矿石、木材等" />
            </ListItem>
            <ListItem>
              <ListItemText primary="采矿类物品" secondary="配方包含 'mining' 标志的物品" />
            </ListItem>
            <ListItem>
              <ListItemText primary="基础制作物品" secondary="使用基础材料制作，不需要特殊设备的物品" />
            </ListItem>
          </List>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" sx={{ mb: 2 }}>
            🔴 不可以制作的物品类型
          </Typography>

          <List>
            <ListItem>
              <ListItemText primary="冶炼配方" secondary="需要熔炉设备的配方，如铁板、铜板等" />
            </ListItem>
            <ListItem>
              <ListItemText primary="涉及流体的配方" secondary="输入或输出包含液体的配方" />
            </ListItem>
            <ListItem>
              <ListItemText primary="化工配方" secondary="需要化工设备、石油精炼厂等特殊设备" />
            </ListItem>
            <ListItem>
              <ListItemText primary="回收配方" secondary="配方包含 'recycling' 标志，需要回收设备" />
            </ListItem>
            <ListItem>
              <ListItemText primary="研究配方" secondary="配方包含 'technology' 标志，需要实验室" />
            </ListItem>
            <ListItem>
              <ListItemText primary="农业配方" secondary="配方包含 'grow' 标志，需要农业设备" />
            </ListItem>
          </List>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              自动判断规则
            </Typography>
            <Typography variant="body2">
              本系统完全基于配方的属性（flags、producers、输入输出等）进行自动判断，
              无需维护任何硬编码的物品白名单或黑名单。当游戏数据更新时， 验证逻辑会自动适应新的物品和配方。
            </Typography>
          </Alert>
        </Paper>
      </TabPanel>
    </Container>
  );
};

export default ManualCraftingTestPage;
