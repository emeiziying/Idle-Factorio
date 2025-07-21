import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography, Grid, useMediaQuery, useTheme } from '@mui/material';
import CategoryTabs from './CategoryTabs';
import ItemGrid from './ItemGrid';
import ProductionStats from './ProductionStats';
import { DataService } from '../services/DataService';
import { Category, Item } from '../types';

const ProductionModule: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dataService = DataService.getInstance();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadItems();
    }
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      const categoriesData = await dataService.getCategories();
      setCategories(categoriesData);
      if (categoriesData.length > 0) {
        setSelectedCategory(categoriesData[0].id);
      }
    } catch (err) {
      setError('加载数据失败');
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      const itemsData = await dataService.getItemsByCategory(selectedCategory);
      setItems(itemsData);
    } catch (err) {
      console.error('Failed to load items:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CategoryTabs
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Grid container spacing={2}>
          {!isMobile && (
            <Grid item xs={12} md={3}>
              <ProductionStats />
            </Grid>
          )}
          <Grid item xs={12} md={isMobile ? 12 : 9}>
            <ItemGrid items={items} />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default ProductionModule;