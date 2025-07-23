import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import FactorioIcon from './FactorioIcon';
import type { Category } from '../../types/index';
import { useIsMobile } from '../../hooks/useIsMobile';
import DataService from '../../services/DataService';

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
  const [i18nLoaded, setI18nLoaded] = useState(false);

  // 检查国际化数据是否已加载
  useEffect(() => {
    const checkI18nLoaded = () => {
      const dataService = DataService.getInstance();
      try {
        // 尝试获取一个分类的中文名称来检查是否已加载
        const testName = dataService.getLocalizedCategoryName('logistics');
        setI18nLoaded(testName !== 'logistics'); // 如果返回的不是原始ID，说明已加载
      } catch {
        setI18nLoaded(false);
      }
    };

    checkI18nLoaded();
    // 定期检查直到加载完成
    const interval = setInterval(checkI18nLoaded, 100);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    onCategoryChange(newValue);
  };

  // 分类图标映射 - 根据分类id匹配对应的代表性物品图标
  const getCategoryIconId = (category: Category) => {
    return category.icon || category.id;
  };

  // 获取分类显示名称
  const getCategoryDisplayName = (categoryId: string): string => {
    if (!i18nLoaded) {
      return categoryId; // 如果国际化未加载，显示原始ID
    }
    return DataService.getInstance().getLocalizedCategoryName(categoryId);
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
            minWidth: isMobile ? 60 : 80, // 最小宽度，允许自适应
            maxWidth: isMobile ? 120 : 150, // 最大宽度，防止过宽
            flex: '0 0 auto', // 不允许伸缩，保持固定大小
            fontSize: '0.75rem',
            textTransform: 'none',
            fontWeight: 500,
            color: 'text.secondary',
            padding: isMobile ? '6px 8px' : '8px 12px',
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
                flexDirection: 'column', 
                alignItems: 'center',
                width: '100%' // 确保内容居中
              }}>
                <FactorioIcon itemId={getCategoryIconId(category)} size={32} />
                <span style={{ 
                  fontSize: 12, 
                  marginTop: 2,
                  textAlign: 'center',
                  width: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {getCategoryDisplayName(category.id)}
                </span>
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