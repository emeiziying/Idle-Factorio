import React from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import { Category } from '../types';

interface CategoryTabsProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  selectedCategory,
  onCategoryChange
}) => {
  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    onCategoryChange(newValue);
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Tabs
        value={selectedCategory}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="物品分类"
        sx={{
          '& .MuiTab-root': {
            minHeight: 48,
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
          },
          '& .Mui-selected': {
            color: 'primary.main',
          },
        }}
      >
        {categories.map((category) => (
          <Tab
            key={category.id}
            label={category.name}
            value={category.id}
          />
        ))}
      </Tabs>
    </Box>
  );
};

export default CategoryTabs;