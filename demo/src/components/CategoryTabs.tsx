import React from 'react';
import { 
  Box, 
  Tabs, 
  Tab, 
  Typography,
  styled
} from '@mui/material';
import { categoryTabs } from '../types';

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-flexContainer': {
    gap: '8px',
  },
  '& .MuiTabs-indicator': {
    display: 'none',
  },
  '& .MuiTab-root': {
    minWidth: 'auto',
    padding: '8px 16px',
    borderRadius: '20px',
    backgroundColor: '#f5f5f5',
    color: '#666',
    textTransform: 'none',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    '&.Mui-selected': {
      color: 'white',
      fontWeight: 600,
    },
    '&:hover': {
      backgroundColor: '#e0e0e0',
    },
  },
}));

interface CategoryTabsProps {
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  selectedCategory,
  onCategoryChange,
}) => {
  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    onCategoryChange(newValue);
  };

  const selectedTab = categoryTabs.find(tab => tab.id === selectedCategory);

  return (
    <Box sx={{ 
      px: 2, 
      py: 1,
      backgroundColor: 'white',
      borderBottom: '1px solid #e0e0e0',
    }}>
      <StyledTabs
        value={selectedCategory}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
      >
        {categoryTabs.map((tab) => (
          <Tab
            key={tab.id}
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <Typography component="span" fontSize="16px">
                  {tab.icon}
                </Typography>
                <Typography component="span">
                  {tab.name}
                </Typography>
              </Box>
            }
            value={tab.id}
            sx={{
              '&.Mui-selected': {
                backgroundColor: tab.color,
              },
            }}
          />
        ))}
      </StyledTabs>
      
      {selectedTab && (
        <Box mt={1}>
          <Typography variant="body2" color="text.secondary">
            {selectedTab.description}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CategoryTabs; 