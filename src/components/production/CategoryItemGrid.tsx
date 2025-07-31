import React, { useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Divider
} from '@mui/material';
import ItemCard from './ItemCard';
import { DataService } from '@/services/DataService';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Item } from '@/types/index';

interface CategoryItemGridProps {
  categoryId: string;
  onItemClick?: (item: Item) => void;
}

const CategoryItemGrid: React.FC<CategoryItemGridProps> = React.memo(({ categoryId, onItemClick }) => {
  const isMobile = useIsMobile();

  const dataService = DataService.getInstance();
  
  // 使用useMemo缓存计算结果，避免每次渲染都重新计算
  const { itemsByRow, sortedRows } = useMemo(() => {
    const itemsByRow = dataService.getItemsByRow(categoryId);
    const sortedRows = Array.from(itemsByRow.keys()).sort((a, b) => a - b);
    return { itemsByRow, sortedRows };
  }, [categoryId, dataService]);


  if (sortedRows.length === 0) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="200px"
        color="text.secondary"
      >
        <Typography variant="body2">
          该分类下暂无已解锁物品
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      {sortedRows.map((row, index) => {
        const items = itemsByRow.get(row) || [];
        const rowName = dataService.getRowDisplayName(categoryId, row);

        return (
          <Box key={`${categoryId}-row-${row}`} sx={{ mb: 2, width: '100%' }}>
            {/* 小标题 */}
            <Box sx={{ mb: 1, px: 1 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  opacity: 0.8
                }}
              >
                {rowName}
                <Typography 
                  component="span" 
                  variant="caption" 
                  sx={{ 
                    fontSize: '0.65rem',
                    color: 'text.disabled',
                    fontWeight: 400,
                    opacity: 0.7
                  }}
                >
                  ({items.length})
                </Typography>
              </Typography>
            </Box>
            
            {/* 物品网格 */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fill, ${isMobile ? 44 : 52}px)`,
                gap: 1,
                justifyContent: 'start',
                width: '100%',
                px: 1
              }}
            >
              {items.map((item) => (
                <ItemCard
                  key={`${categoryId}-${item.id}`}
                  item={item}
                  onClick={() => onItemClick?.(item)}
                />
              ))}
            </Box>
            
            {/* 分隔线 */}
            {index < sortedRows.length - 1 && (
              <Divider sx={{ my: 1, opacity: 0.15 }} />
            )}
          </Box>
        );
      })}
    </Box>
  );
});

CategoryItemGrid.displayName = 'CategoryItemGrid';

export default CategoryItemGrid;