import React, { useState, useMemo, useEffect } from 'react';
import { 
  Box, 
  Typography,
  List,
  ListItem,
  ListItemButton,
  Avatar,
  Collapse,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import DataService from '../../services/DataService';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { Item } from '../../types/index';

interface CompactItemListProps {
  categoryId: string;
  selectedItem: Item | null;
  onItemSelect: (item: Item) => void;
}

const CompactItemList: React.FC<CompactItemListProps> = ({ 
  categoryId, 
  selectedItem, 
  onItemSelect 
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const isMobile = useIsMobile();
  const dataService = DataService.getInstance();
  
  // 默认显示的物品数量
  const DEFAULT_ITEMS_COUNT = 3;
  
  // 当分类改变时，重置展开状态
  useEffect(() => {
    setExpandedRows(new Set());
  }, [categoryId]);
  
  // 获取分组的物品数据
  const { itemsByRow, sortedRows } = useMemo(() => {
    const itemsByRow = dataService.getItemsByRow(categoryId);
    const sortedRows = Array.from(itemsByRow.keys()).sort((a, b) => a - b);
    return { itemsByRow, sortedRows };
  }, [categoryId, dataService]);

  // 切换行的展开状态
  const toggleRowExpanded = (row: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(row)) {
        newSet.delete(row);
      } else {
        newSet.add(row);
      }
      return newSet;
    });
  };

  if (sortedRows.length === 0) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100%"
        color="text.secondary"
        p={2}
      >
        <Typography variant="caption" align="center">
          该分类下暂无已解锁物品
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto', overscrollBehavior: 'contain' }}>
      <List dense sx={{ py: 0 }}>
        {sortedRows.map((row) => {
          const items = itemsByRow.get(row) || [];
          const rowName = dataService.getRowDisplayName(categoryId, row);
          const isExpanded = expandedRows.has(row);
          const displayItems = isExpanded ? items : items.slice(0, DEFAULT_ITEMS_COUNT);
          const hasMore = items.length > DEFAULT_ITEMS_COUNT;

          return (
            <Box key={`row-${row}`}>
              {/* 行标题 */}
              <ListItem sx={{ 
                py: 0.5, 
                px: 1,
                bgcolor: 'action.hover',
                position: 'sticky',
                top: 0,
                zIndex: 1
              }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    flex: 1,
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px'
                  }}
                >
                  {rowName}
                </Typography>
                <Chip
                  label={items.length}
                  size="small"
                  sx={{ 
                    height: 16,
                    fontSize: '0.6rem',
                    '& .MuiChip-label': { px: 0.5 }
                  }}
                />
              </ListItem>

              {/* 物品列表 */}
              {displayItems.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                const iconPath = `/icons/${item.icon}`;
                
                return (
                  <ListItemButton
                    key={item.id}
                    selected={isSelected}
                    onClick={() => onItemSelect(item)}
                    sx={{
                      py: 0.5,
                      px: 1,
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                        }
                      }
                    }}
                  >
                    <Avatar
                      src={iconPath}
                      alt={item.name}
                      sx={{ 
                        width: isMobile ? 24 : 28, 
                        height: isMobile ? 24 : 28,
                        mr: 1,
                        bgcolor: 'transparent'
                      }}
                    />
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontSize: isMobile ? '0.75rem' : '0.8rem',
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {item.name}
                    </Typography>
                  </ListItemButton>
                );
              })}

              {/* 展开/收起按钮 */}
              {hasMore && (
                <ListItem sx={{ py: 0, px: 1 }}>
                  <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <Tooltip title={isExpanded ? '收起' : `展开查看全部 ${items.length} 个物品`}>
                      <IconButton
                        size="small"
                        onClick={() => toggleRowExpanded(row)}
                        sx={{ 
                          py: 0.25,
                          color: 'primary.main',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItem>
              )}
            </Box>
          );
        })}
      </List>
    </Box>
  );
};

export default CompactItemList;