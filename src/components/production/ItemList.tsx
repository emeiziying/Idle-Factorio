import React, { useState, useEffect } from 'react';
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
    
    // 使用 useState + useEffect 处理异步数据
    const [itemsByRow, setItemsByRow] = useState<Map<number, Item[]>>(new Map());
    const [sortedRows, setSortedRows] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
      if (!dataService) {
        setLoading(false);
        return;
      }

      const loadItems = async () => {
        try {
          setLoading(true);
          setLoadError(null);
          
          // 使用异步版本等待服务初始化
          const itemsByRowResult = await dataService.getItemsByRowAsync(categoryId);
          const sortedRowsResult = Array.from(itemsByRowResult.keys()).sort((a, b) => a - b);
          
          setItemsByRow(itemsByRowResult);
          setSortedRows(sortedRowsResult);
        } catch (error) {
          console.error('Error loading items for category', categoryId, ':', error);
          setLoadError(error instanceof Error ? error.message : String(error));
          setItemsByRow(new Map());
          setSortedRows([]);
        } finally {
          setLoading(false);
        }
      };

      loadItems();
    }, [categoryId, dataService]);

    // 如果服务还未就绪或正在加载，显示加载状态
    if (!dataService || loading) {
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
