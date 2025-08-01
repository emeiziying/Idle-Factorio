# Project Specific Rule - 项目特定规则

## 规则概述

针对 Idle Factorio 游戏项目的特定规则和最佳实践。

## 规则详情

### 1. 游戏状态管理

#### Store 结构规范

```typescript
// ✅ 正确 - 使用 Redux Toolkit 和明确的类型定义
import { createSlice } from '@reduxjs/toolkit'

import type { Inventory, Item } from '@/types/inventory'

interface InventoryState {
  items: Record<string, number> // 物品ID -> 数量
  capacity: number
  isLoading: boolean
}

// ❌ 错误 - 避免直接修改状态，使用不明确的类型
interface BadState {
  items: any[]
  // 直接在组件中修改
}
```

#### 服务层使用

```typescript
// ✅ 正确 - 通过服务层处理业务逻辑
import { ServiceLocator } from '@/services/ServiceLocator'

const craftingService = ServiceLocator.getInstance().getCraftingService()
const canCraft = craftingService.canCraft(recipeId, quantity)

// ❌ 错误 - 在组件中直接实现复杂逻辑
const canCraft = items[recipe.input] >= recipe.quantity && ...
```

### 2. 游戏循环和性能

#### 使用 GameLoop Hook

```typescript
// ✅ 正确 - 使用集中的游戏循环
import { useGameLoop } from '@/hooks/useGameLoop'

export const GameComponent = () => {
  useGameLoop() // 自动处理游戏逻辑更新

  return <div>游戏内容</div>
}

// ❌ 错误 - 在组件中使用多个 setInterval
useEffect(() => {
  const interval = setInterval(() => {
    // 更新逻辑
  }, 1000)
}, [])
```

#### 性能敏感操作

```typescript
// ✅ 正确 - 使用 memo 和虚拟化处理大量数据
import { memo } from 'react'
import { FixedSizeGrid } from 'react-window'

export const ItemGrid = memo(({ items }: { items: Item[] }) => {
  return (
    <FixedSizeGrid
      columnCount={5}
      rowCount={Math.ceil(items.length / 5)}
      // ...
    />
  )
})

// ❌ 错误 - 直接渲染大量元素
items.map(item => <ItemCard key={item.id} item={item} />)
```

### 3. 数据文件和配置

#### 游戏数据导入

```typescript
// ✅ 正确 - 从数据服务获取
import { DataService } from '@/services/DataService'

const items = DataService.getInstance().getItems()
const recipes = DataService.getInstance().getRecipes()

// ❌ 错误 - 直接导入 JSON 文件
import items from '@/data/items.json'
```

### 4. UI/UX 规范

#### Material-UI 使用

```typescript
// ✅ 正确 - 使用主题和一致的样式
import { Box, Card, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'

export const GameCard = () => {
  const theme = useTheme()

  return (
    <Card sx={{
      p: 2,
      backgroundColor: theme.palette.background.paper
    }}>
      <Typography variant="h6">标题</Typography>
    </Card>
  )
}

// ❌ 错误 - 硬编码样式
<div style={{ padding: '16px', backgroundColor: '#fff' }}>
```

#### 图标使用

```typescript
// ✅ 正确 - 使用 FactorioIcon 组件
import { FactorioIcon } from '@/components/common/FactorioIcon'

<FactorioIcon itemId="iron-plate" size={32} />

// ❌ 错误 - 直接使用图片路径
<img src="/icons/iron-plate.png" />
```

### 5. 国际化支持

```typescript
// ✅ 正确 - 使用 i18n hook
import { useI18n } from '@/hooks/useI18n'

const ItemCard = ({ item }: { item: Item }) => {
  const t = useI18n()

  return (
    <Card>
      <Typography>{t(item.locName)}</Typography>
    </Card>
  )
}

// ❌ 错误 - 硬编码中文
<Typography>铁板</Typography>
```

### 6. 游戏特定的类型定义

```typescript
// ✅ 正确 - 使用项目中定义的类型
import type { Item, Recipe, Technology } from '@/types'
import type { Facility, FuelConfig } from '@/types/facilities'

// ❌ 错误 - 使用 any 或不完整的类型
const recipe: any = {}
const item = { id: 'iron', name: 'Iron' } // 缺少必要字段
```

### 7. 测试规范

```typescript
// ✅ 正确 - 为关键逻辑编写测试
import { describe, expect, it } from 'vitest'

import { calculateProductionRate } from '@/utils/production'

describe('Production Utils', () => {
  it('should calculate production rate correctly', () => {
    expect(calculateProductionRate(1, 2)).toBe(2)
  })
})

// 特别注意测试游戏核心逻辑：
// - 配方验证
// - 库存管理
// - 生产计算
// - 科技解锁
```

### 8. 状态持久化

```typescript
// ✅ 正确 - 使用 GameStorageService
import { GameStorageService } from '@/services/GameStorageService'

const storage = GameStorageService.getInstance()
storage.saveGame(gameState)
const savedState = storage.loadGame()

// ❌ 错误 - 直接使用 localStorage
localStorage.setItem('game', JSON.stringify(state))
```

## 特殊注意事项

1. **性能优化**：游戏循环中的计算要高效，避免阻塞主线程
2. **数据一致性**：确保游戏状态的原子性更新
3. **用户体验**：保持流畅的动画和及时的反馈 [[memory:4419747]]
4. **存档兼容**：更新数据结构时考虑向后兼容性

## 执行优先级

**高优先级** - 这些规则确保游戏的稳定性和良好的用户体验。
