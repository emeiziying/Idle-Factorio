// 科技页面头部组件 - 简化版

import React from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import type { TechSearchFilter } from '../../types/technology';

interface TechPageHeaderProps {
  /** 当前搜索筛选条件 */
  searchFilter: TechSearchFilter;
  
  /** 搜索条件变化回调 */
  onSearchFilterChange: (filter: TechSearchFilter) => void;
  
  /** 科技统计信息 */
  techStats?: {
    total: number;
    unlocked: number;
    available: number;
    locked: number;
    researching: number;
  };
}

const TechPageHeader: React.FC<TechPageHeaderProps> = ({
  searchFilter,
  onSearchFilterChange,
  techStats
}) => {
  const theme = useTheme();

  // 处理搜索查询
  const handleQueryChange = (query: string) => {
    onSearchFilterChange({
      ...searchFilter,
      query: query.trim() || undefined
    });
  };

  // 清除搜索
  const clearSearch = () => {
    onSearchFilterChange({
      ...searchFilter,
      query: undefined
    });
  };

  return (
    <Box sx={{ p: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* 标题 */}
        <Typography variant="h6" sx={{ fontWeight: 600, flexShrink: 0 }}>
          🧪 科技研究
        </Typography>

        {/* 搜索框 */}
        <Box sx={{ flex: 1, maxWidth: 300 }}>
          <TextField
            size="small"
            placeholder="搜索科技..."
            value={searchFilter.query || ''}
            onChange={(e) => handleQueryChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchFilter.query ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={clearSearch}
                    edge="end"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
        </Box>

        {/* 统计信息 */}
        {techStats && (
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            <Typography variant="caption" color="text.secondary">
              总计: {techStats.total}
            </Typography>
            <Typography variant="caption" color="success.main">
              已解锁: {techStats.unlocked}
            </Typography>
            <Typography variant="caption" color="warning.main">
              可研究: {techStats.available}
            </Typography>
            <Typography variant="caption" color="info.main">
              研究中: {techStats.researching}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TechPageHeader;