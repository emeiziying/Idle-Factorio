import React, { useMemo } from 'react';
import { Box, Typography, Divider } from '@mui/material';
import ItemCard from '@/components/production/ItemCard';
import InlineLoading from '@/components/common/InlineLoading';
import { useDataService } from '@/hooks/useDIServices';
import type { Item } from '@/types/index';

interface ItemListProps {
  categoryId: string;
  selectedItem: Item | null;
  onItemSelect: (item: Item) => void;
}

const ItemList: React.FC<ItemListProps> = React.memo(
  ({ categoryId, selectedItem, onItemSelect }) => {
    const dataService = useDataService();

    // 使用useMemo缓存计算结果
    const { itemsByRow, sortedRows, loadError } = useMemo(() => {
      // 只有在服务就绪时才计算
      if (!dataService) {
        return {
          itemsByRow: new Map(),
          sortedRows: [],
          loadError: null,
        };
      }

      try {
        const itemsByRow = dataService.getItemsByRow(categoryId);
        const sortedRows = Array.from(itemsByRow.keys()).sort((a, b) => a - b);
        return { itemsByRow, sortedRows, loadError: null };
      } catch (error) {
        console.error('Error loading items for category', categoryId, ':', error);
        return {
          itemsByRow: new Map(),
          sortedRows: [],
          loadError: error instanceof Error ? error.message : String(error),
        };
      }
    }, [categoryId, dataService]);

    // 如果服务还未就绪，显示加载状态
    if (!dataService) {
      return <InlineLoading message="加载物品数据中..." showSpinner={true} />;
    }

    // 如果有加载错误，显示错误信息
    if (loadError) {
      return <InlineLoading message={`加载失败: ${loadError}`} showSpinner={false} color="error" />;
    }

    if (sortedRows.length === 0) {
      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="200px"
          color="text.secondary"
        >
          <Typography variant="body2">该分类下暂无已解锁物品</Typography>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          overflow: 'auto',
          // 禁用过度滚动
          overscrollBehavior: 'none',
          // 平滑滚动
          scrollBehavior: 'smooth',
        }}
      >
        {sortedRows.map((row, index) => {
          const items = itemsByRow.get(row) || [];
          const rowName = dataService?.getRowDisplayName(categoryId, row) || '';

          return (
            <Box key={`${categoryId}-row-${row}`} sx={{ mb: 0.5, width: '100%' }}>
              {/* 小标题 */}
              <Box sx={{ mb: 0.5, px: 0.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    opacity: 0.8,
                  }}
                >
                  {rowName}
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{
                      fontSize: '0.6rem',
                      color: 'text.disabled',
                      fontWeight: 400,
                      opacity: 0.7,
                    }}
                  >
                    ({items.length})
                  </Typography>
                </Typography>
              </Box>

              {/* 物品网格 */}
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  width: '100%',
                  gap: 0.5,
                  px: 0.5,
                }}
              >
                {items.map((item: Item) => (
                  <ItemCard
                    key={`${categoryId}-${item.id}`}
                    item={item}
                    onClick={() => onItemSelect(item)}
                    selected={selectedItem?.id === item.id}
                  />
                ))}
              </Box>

              {/* 分隔线 */}
              {index < sortedRows.length - 1 && <Divider sx={{ my: 0.5, opacity: 0.15 }} />}
            </Box>
          );
        })}
      </Box>
    );
  }
);

ItemList.displayName = 'ItemList';

export default ItemList;
