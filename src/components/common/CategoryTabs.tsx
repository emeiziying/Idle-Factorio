import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import FactorioIcon from './FactorioIcon';
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

  // 分类图标映射 - 根据分类id匹配对应的代表性物品图标
  const getCategoryIconId = (category: Category) => {
    return category.icon || category.id;
  };

  // 防止热重载时categories为空的情况
  if (!categories || categories.length === 0) {
    return (
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* 空状态占位 */}
      </Box>
    );
  }

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
      marginBottom: 0,
      width: '100%' 
    }}>
      <Tabs
        value={selectedCategory}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          width: '100%', // 确保Tabs占满容器宽度
          '& .MuiTab-root': {
            minWidth: isMobile ? 50 : 60, // 减小最小宽度，因为去掉了文字
            maxWidth: isMobile ? 80 : 100, // 减小最大宽度
            flex: '0 0 auto', // 不允许伸缩，保持固定大小
            fontSize: '0.75rem',
            textTransform: 'none',
            fontWeight: 500,
            color: 'text.secondary',
            padding: isMobile ? '8px 6px' : '12px 8px', // 调整内边距
            border: 'none', // 移除所有边框
            '&.Mui-selected': {
              color: 'primary.main',
              fontWeight: 600,
              border: 'none', // 确保选中时也没有边框
            }
          },
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0'
          },
          '& .MuiTabs-scroller': {
            // 确保滚动容器正常工作
            overflow: 'auto',
            scrollbarWidth: 'none', // Firefox隐藏滚动条
            '&::-webkit-scrollbar': {
              display: 'none' // Chrome/Safari隐藏滚动条
            }
          },
          '& .MuiTabs-flexContainer': {
            // 确保flex容器正常工作
            gap: 0,
            flexWrap: 'nowrap'
          }
        }}
      >
        {categories.map((category) => (
          <Tab
            key={category.id}
            icon={
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%'
              }}>
                <FactorioIcon itemId={getCategoryIconId(category)} size={isMobile ? 40 : 48} showBorder={false} />
              </Box>
            }
            value={category.id}
          />
        ))}
      </Tabs>
    </Box>
  );
};

export default CategoryTabs;