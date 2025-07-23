import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import FactorioIcon from './FactorioIcon';
import DataService from '../../services/DataService';
import type { IconData } from '../../types/index';

const IconTestPage: React.FC = () => {
  const [icons, setIcons] = useState<IconData[]>([]);
  const [filteredIcons, setFilteredIcons] = useState<IconData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const dataService = DataService.getInstance();
        await dataService.loadGameData();
        
        // 获取所有图标
        const allIcons = dataService.getAllIcons();
        setIcons(allIcons);
        setFilteredIcons(allIcons);
        
        // 获取所有分类
        const allCategories = dataService.getAllCategories();
        const categoryIds = allCategories.map(cat => cat.id);
        setCategories(categoryIds);
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to load icon data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 过滤图标
  useEffect(() => {
    let filtered = icons;

    // 按搜索词过滤
    if (searchTerm) {
      filtered = filtered.filter(icon => 
        icon.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 按分类过滤
    if (selectedCategory !== 'all') {
      const dataService = DataService.getInstance();
      const categoryItems = dataService.getAllItemsByCategory(selectedCategory);
      const categoryItemIds = new Set(categoryItems.map(item => item.id));
      filtered = filtered.filter(icon => categoryItemIds.has(icon.id));
    }

    setFilteredIcons(filtered);
  }, [icons, searchTerm, selectedCategory]);

  // 获取本地化的物品名称
  const getLocalizedItemName = (itemId: string): string => {
    return DataService.getInstance().getLocalizedItemName(itemId);
  };

  // 获取本地化的分类名称
  const getLocalizedCategoryName = (categoryId: string): string => {
    return DataService.getInstance().getLocalizedCategoryName(categoryId);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleCategoryChange = (event: SelectChangeEvent<string>) => {
    setSelectedCategory(event.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Typography>Loading icons...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      p: 2,
      overflow: 'hidden'
    }}>
      {/* 标题 */}
      <Box sx={{ mb: 2, flexShrink: 0 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          图标测试页面
        </Typography>
        <Typography variant="body2" color="text.secondary">
          显示所有 Factorio 图标和对应名称 (共 {icons.length} 个图标)
        </Typography>
      </Box>

      {/* 搜索和过滤控件 */}
      <Box sx={{ mb: 2, flexShrink: 0 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              fullWidth
              placeholder="搜索图标名称..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={clearSearch}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>分类过滤</InputLabel>
              <Select
                value={selectedCategory}
                onChange={handleCategoryChange}
                label="分类过滤"
              >
                <MenuItem value="all">所有分类</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {getLocalizedCategoryName(category)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* 统计信息 */}
      <Box sx={{ mb: 2, flexShrink: 0 }}>
        <Chip 
          label={`显示 ${filteredIcons.length} / ${icons.length} 个图标`}
          color="primary"
          variant="outlined"
        />
      </Box>

      {/* 图标网格 */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        bgcolor: 'background.paper',
        borderRadius: 1,
        p: 1
      }}>
        {filteredIcons.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="200px">
            <Typography color="text.secondary">
              没有找到匹配的图标
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={1}>
            {filteredIcons.map((icon) => (
              <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={icon.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 1,
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <CardContent sx={{ 
                    p: 1, 
                    textAlign: 'center',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <FactorioIcon 
                      itemId={icon.id} 
                      size={48}
                      alt={icon.id}
                    />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {getLocalizedItemName(icon.id)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {icon.id}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.6rem',
                        color: 'text.disabled',
                        fontFamily: 'monospace'
                      }}
                    >
                      {icon.position}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default IconTestPage; 