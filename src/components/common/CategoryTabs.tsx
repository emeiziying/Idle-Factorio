import React from 'react';
import { Tabs, Tab, Box, Tooltip, Typography } from '@mui/material';
import {
  Build as BuildIcon,
  Factory as FactoryIcon,
  LocalShipping as LogisticsIcon,
  Security as CombatIcon,
  WaterDrop as FluidsIcon,
  Science as TechnologyIcon
} from '@mui/icons-material';
import type { Category } from '../../types/index';
import { useIsMobile } from '../../hooks/useIsMobile';

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
  const isMobile = useIsMobile();
  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    onCategoryChange(newValue);
  };

  // 分类图标和名称映射
  const getCategoryInfo = (category: Category) => {
    const categoryInfo: Record<string, { icon: React.ReactNode; name: string; tooltip: string }> = {
      'intermediate-products': {
        icon: <BuildIcon />,
        name: '中间产品',
        tooltip: '中间产品'
      },
      'production': {
        icon: <FactoryIcon />,
        name: '生产设施',
        tooltip: '生产设施'
      },
      'logistics': {
        icon: <LogisticsIcon />,
        name: '物流设施',
        tooltip: '物流设施'
      },
      'combat': {
        icon: <CombatIcon />,
        name: '战斗装备',
        tooltip: '战斗装备'
      },
      'fluids': {
        icon: <FluidsIcon />,
        name: '流体',
        tooltip: '流体'
      },
      'technology': {
        icon: <TechnologyIcon />,
        name: '科技',
        tooltip: '科技'
      }
    };
    
    return categoryInfo[category.id] || {
      icon: <BuildIcon />,
      name: category.name,
      tooltip: category.name
    };
  };

  return (
    <Box sx={{ 
      borderBottom: 1, 
      borderColor: 'divider',
      bgcolor: 'background.paper',
      position: 'sticky',
      top: 0,
      zIndex: 10,
      // 确保sticky定位不会导致页面滚动
      marginTop: 0,
      marginBottom: 0
    }}>
      <Tabs
        value={selectedCategory}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          '& .MuiTab-root': {
            minWidth: isMobile ? 50 : 60,
            maxWidth: isMobile ? 70 : 80,
            fontSize: '0.75rem',
            textTransform: 'none',
            fontWeight: 500,
            color: 'text.secondary',
            padding: isMobile ? '6px 8px' : '8px 12px',
            '&.Mui-selected': {
              color: 'primary.main',
              fontWeight: 600,
            }
          },
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0'
          }
        }}
      >
        {categories.map((category) => {
          const categoryInfo = getCategoryInfo(category);
          return (
            <Tooltip
              key={category.id}
              title={categoryInfo.tooltip}
              placement="bottom"
              arrow
            >
              <Tab
                label={
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ fontSize: isMobile ? '1rem' : '1.2rem' }}>
                      {categoryInfo.icon}
                    </Box>
                    <Typography variant="caption" sx={{ 
                      fontSize: isMobile ? '0.6rem' : '0.65rem', 
                      lineHeight: 1,
                      textAlign: 'center'
                    }}>
                      {categoryInfo.name}
                    </Typography>
                  </Box>
                }
                value={category.id}
              />
            </Tooltip>
          );
        })}
      </Tabs>
    </Box>
  );
};

export default CategoryTabs;