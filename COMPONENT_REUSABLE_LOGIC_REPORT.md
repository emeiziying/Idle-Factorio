# 组件可复用逻辑分析报告

## 发现的重复模式

### 1. 服务实例获取（高频重复）
**出现次数**: 30+ 次
**模式**:
```typescript
const dataService = DataService.getInstance();
```

**涉及组件**: 几乎所有组件都有这个模式

**建议解决方案**:
创建自定义 Hook：
```typescript
// hooks/useServices.ts
export const useDataService = () => {
  return useMemo(() => DataService.getInstance(), []);
};

export const useRecipeService = () => {
  return useMemo(() => RecipeService.getInstance(), []);
};

// 或者一个通用的服务获取 hook
export const useService = <T>(serviceName: string): T => {
  return useMemo(() => ServiceLocator.get<T>(serviceName), [serviceName]);
};
```

### 2. 物品点击处理逻辑（中频重复）
**出现次数**: 6+ 次
**模式**:
```typescript
const handleItemClick = (itemId: string) => {
  if (onItemSelect) {
    const clickedItem = dataService.getItem(itemId);
    if (clickedItem) {
      onItemSelect(clickedItem);
    } else {
      console.warn('ComponentName: Item not found:', itemId);
    }
  } else {
    console.warn('ComponentName: onItemSelect callback not provided');
  }
};
```

**涉及组件**:
- `InventoryManagementCard`
- `UsageCard`
- `ManualCraftingCard`
- `RecipeFlowDisplay`
- 其他多个组件

**建议解决方案**:
```typescript
// hooks/useItemClick.ts
export const useItemClick = (
  componentName: string,
  onItemSelect?: (item: Item) => void
) => {
  const dataService = useDataService();
  
  return useCallback((itemId: string) => {
    if (onItemSelect) {
      const clickedItem = dataService.getItem(itemId);
      if (clickedItem) {
        onItemSelect(clickedItem);
      } else {
        logger.warn(`${componentName}: Item not found:`, itemId);
      }
    } else {
      logger.warn(`${componentName}: onItemSelect callback not provided`);
    }
  }, [componentName, onItemSelect, dataService]);
};
```

### 3. 可点击样式（中频重复）
**出现次数**: 5+ 次
**模式**:
```typescript
sx={{ cursor: onItemSelect ? 'pointer' : 'default' }}
// 或
cursor: onItemSelect ? 'pointer' : 'default',
'&:hover': onItemSelect ? { opacity: 0.8 } : {},
```

**建议解决方案**:
```typescript
// utils/styleHelpers.ts
export const getClickableStyles = (isClickable: boolean) => ({
  cursor: isClickable ? 'pointer' : 'default',
  '&:hover': isClickable ? { opacity: 0.8 } : {},
});

// 或创建一个可点击的包装组件
// components/common/ClickableWrapper.tsx
export const ClickableWrapper: React.FC<{
  onClick?: () => void;
  children: React.ReactNode;
  sx?: SxProps;
}> = ({ onClick, children, sx }) => (
  <Box
    onClick={onClick}
    sx={{
      cursor: onClick ? 'pointer' : 'default',
      '&:hover': onClick ? { opacity: 0.8 } : {},
      ...sx
    }}
  >
    {children}
  </Box>
);
```

### 4. 国际化名称获取（高频重复）
**模式**:
```typescript
dataService.getI18nName(item) || item.name || item.id
// 或
dataService.getCategoryI18nName(categoryId)
```

**建议解决方案**:
```typescript
// hooks/useI18n.ts
export const useItemName = (item?: Item) => {
  const dataService = useDataService();
  return useMemo(() => {
    if (!item) return '';
    return dataService.getI18nName(item) || item.name || item.id;
  }, [item, dataService]);
};

export const useCategoryName = (categoryId: string) => {
  const dataService = useDataService();
  return useMemo(() => {
    return dataService.getCategoryI18nName(categoryId);
  }, [categoryId, dataService]);
};
```

### 5. 错误处理和日志（中频重复）
**模式**:
```typescript
console.error('Failed to load data:', error);
console.warn('Component: Something not found');
```

**建议解决方案**:
```typescript
// hooks/useErrorHandler.ts
export const useErrorHandler = (componentName: string) => {
  const logger = useLogger(componentName);
  
  return {
    logError: (message: string, error?: any) => {
      logger.error(message, error);
    },
    logWarning: (message: string, ...args: any[]) => {
      logger.warn(message, ...args);
    },
    handleError: (error: Error, fallback?: () => void) => {
      logger.error('Operation failed:', error);
      fallback?.();
    }
  };
};
```

### 6. 加载状态管理（中频重复）
**模式**:
```typescript
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true);
      // 加载数据
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, []);
```

**建议解决方案**:
```typescript
// hooks/useAsyncData.ts
export const useAsyncData = <T>(
  asyncFunction: () => Promise<T>,
  deps: DependencyList = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await asyncFunction();
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();
    
    return () => {
      cancelled = true;
    };
  }, deps);

  return { data, loading, error, refetch: fetchData };
};
```

### 7. 物品图标渲染（高频重复）
**模式**:
```typescript
<FactorioIcon itemId={item.id} size={size} />
// 配合获取物品名称
```

**建议解决方案**:
```typescript
// components/common/ItemIcon.tsx
export const ItemIcon: React.FC<{
  item: Item | string;
  size?: number;
  showTooltip?: boolean;
  onClick?: () => void;
}> = ({ item, size = 24, showTooltip = true, onClick }) => {
  const itemData = typeof item === 'string' 
    ? useDataService().getItem(item) 
    : item;
  const itemName = useItemName(itemData);
  
  return (
    <Tooltip title={showTooltip ? itemName : ''}>
      <Box onClick={onClick} sx={getClickableStyles(!!onClick)}>
        <FactorioIcon 
          itemId={typeof item === 'string' ? item : item.id} 
          size={size} 
        />
      </Box>
    </Tooltip>
  );
};
```

## 建议的重构步骤

### 第一阶段：创建基础 Hooks
1. `useServices.ts` - 服务获取
2. `useI18n.ts` - 国际化
3. `useItemClick.ts` - 物品点击处理
4. `useErrorHandler.ts` - 错误处理

### 第二阶段：创建通用组件
1. `ClickableWrapper` - 可点击容器
2. `ItemIcon` - 物品图标组件
3. `LoadingContainer` - 加载状态容器
4. `ErrorBoundary` - 错误边界组件

### 第三阶段：创建高级 Hooks
1. `useAsyncData` - 异步数据加载
2. `useItemData` - 物品数据获取和缓存
3. `useRecipeData` - 配方数据获取和缓存

## 预期收益

1. **代码复用率提升**: 减少约 30-40% 的重复代码
2. **维护性提升**: 统一的逻辑修改只需要在一处进行
3. **测试便利性**: 可以集中测试共享逻辑
4. **性能优化**: 通过 useMemo 和统一缓存减少重复计算
5. **类型安全**: 更好的 TypeScript 类型推导

## 优先级建议

1. **高优先级**: 
   - 服务获取 Hooks（使用频率最高）
   - 物品点击处理 Hook（逻辑复杂度高）

2. **中优先级**:
   - 国际化 Hooks
   - 错误处理 Hooks
   - 通用样式工具

3. **低优先级**:
   - 高级数据加载 Hooks
   - 特定场景的组件封装