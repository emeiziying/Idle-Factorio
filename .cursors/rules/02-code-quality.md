# Code Quality Rule - 代码质量规则

## 规则概述
确保代码质量和一致性，遵循 TypeScript 严格模式和 React 最佳实践。

## 规则详情

### 1. TypeScript 严格模式
- 所有代码必须通过 TypeScript 严格模式检查
- 不允许使用 `any` 类型，除非有充分理由并添加注释说明
- 优先使用 `type` 而非 `interface`，除非需要继承或声明合并

### 2. React 最佳实践

#### 组件定义
```typescript
// ✅ 正确 - 使用函数组件和明确的类型定义
import type { FC } from 'react'

interface ButtonProps {
  onClick: () => void
  children: React.ReactNode
  disabled?: boolean
}

export const Button: FC<ButtonProps> = ({ onClick, children, disabled = false }) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

// ❌ 错误 - 避免使用 React.FC，避免默认导出
export default React.FC<any> = (props) => {
  return <button>{props.children}</button>
}
```

#### Hooks 使用规范
```typescript
// ✅ 正确 - 自定义 Hook 以 use 开头，有明确的返回类型
import { useState, useEffect } from 'react'
import type { User } from '@/types/user'

export function useUser(userId: string): {
  user: User | null
  loading: boolean
  error: Error | null
} {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    // 实现逻辑
  }, [userId])
  
  return { user, loading, error }
}

// ❌ 错误 - 没有类型定义，命名不规范
export function getUser(id) {
  const [user, setUser] = useState()
  return user
}
```

### 3. Redux Toolkit 使用规范

#### Slice 定义
```typescript
// ✅ 正确 - 使用 Redux Toolkit 的标准模式
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

interface CounterState {
  value: number
}

const initialState: CounterState = {
  value: 0,
}

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload
    },
  },
})

export const { increment, incrementByAmount } = counterSlice.actions
export const selectCount = (state: RootState) => state.counter.value
export default counterSlice.reducer
```

### 4. 导入顺序规范
```typescript
// 1. React 相关导入
import React, { useState, useEffect } from 'react'
import type { FC } from 'react'

// 2. 第三方库导入
import { Box, Button } from '@mui/material'
import { useDispatch } from 'react-redux'

// 3. 本地导入 - 使用 @/ 别名
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/services/api'
import type { User } from '@/types/user'

// 4. 样式导入
import styles from './Component.module.css'
```

### 5. 文件命名规范
- 组件文件：PascalCase，如 `UserProfile.tsx`
- Hook 文件：camelCase，如 `useAuth.ts`
- 工具文件：camelCase，如 `dateFormatter.ts`
- 类型文件：camelCase，如 `user.types.ts` 或直接 `user.ts`
- 测试文件：与源文件同名 + `.test`，如 `UserProfile.test.tsx`

### 6. 注释规范
```typescript
/**
 * 计算物品的实际产出率
 * @param baseRate - 基础产出率
 * @param efficiency - 设备效率倍数
 * @returns 实际产出率（物品/秒）
 */
export function calculateProductionRate(baseRate: number, efficiency: number): number {
  return baseRate * efficiency
}

// TODO: 实现批量生产逻辑
// FIXME: 修复生产队列溢出问题
// NOTE: 这里使用了优化算法提升性能
```

### 7. 错误处理
```typescript
// ✅ 正确 - 明确的错误处理
try {
  const result = await api.fetchData()
  return result
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API错误:', error.message)
    throw error
  }
  console.error('未知错误:', error)
  throw new Error('数据获取失败')
}

// ❌ 错误 - 忽略错误或使用 console.log
try {
  const result = await api.fetchData()
} catch (e) {
  console.log(e)
}
```

### 8. 性能优化
- 使用 `React.memo` 优化组件渲染
- 使用 `useMemo` 和 `useCallback` 优化计算和函数引用
- 避免在渲染过程中创建新对象或函数
- 使用虚拟化处理长列表

## 执行优先级
**高优先级** - 代码质量直接影响项目的可维护性和稳定性。