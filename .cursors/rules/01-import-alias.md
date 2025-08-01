# Import Alias Rule - 导入别名规则

## 规则概述

在本项目中，所有的导入路径必须使用 `@/` 别名来引用 `src` 目录下的文件。

## 规则详情

### 1. 强制使用 @/ 别名

- **正确**: `import { Component } from '@/components/Component'`
- **错误**: `import { Component } from '../components/Component'`
- **错误**: `import { Component } from '../../components/Component'`
- **错误**: `import { Component } from './components/Component'`

### 2. 适用范围

- 所有 TypeScript (.ts, .tsx) 文件
- 所有 JavaScript (.js, .jsx) 文件
- 包括测试文件 (.test.ts, .test.tsx)

### 3. 例外情况

- 第三方库导入：`import React from 'react'`
- 静态资源：`import logo from '@/assets/logo.png'`
- 同目录文件引用可以使用 `./`，但推荐使用完整的 `@/` 路径

### 4. 文件类型导入示例

#### 组件导入

```typescript
// ✅ 正确
import { Button } from '@/components/common/Button'
import { useAuth } from '@/hooks/useAuth'

// ❌ 错误
import { Button } from '../components/common/Button'
import { useAuth } from '../../hooks/useAuth'
```

#### 工具函数导入

```typescript
// ✅ 正确
import { formatDate } from '@/utils/date'
import { api } from '@/services/api'

// ❌ 错误
import { formatDate } from '../utils/date'
import { api } from './services/api'
```

#### 类型导入

```typescript
// ✅ 正确
import type { User } from '@/types/user'
import type { ApiResponse } from '@/types/api'

// ❌ 错误
import type { User } from '../types/user'
import type { ApiResponse } from '../../types/api'
```

#### Store 导入

```typescript
// ✅ 正确
import { useAppDispatch } from '@/store'
import { inventorySlice } from '@/store/slices/inventoryStore'

// ❌ 错误
import { useAppDispatch } from '../store'
import { inventorySlice } from './store/slices/inventoryStore'
```

### 5. 配置说明

- TypeScript 配置：已在 `tsconfig.app.json` 中配置 paths
- Vite 配置：已在 `vite.config.ts` 中配置 resolve.alias
- IDE 支持：Cursor/VSCode 应自动识别并提供智能提示

### 6. 迁移指南

如果你看到相对路径导入，请立即修改为 @/ 别名：

1. 将 `../` 或 `./` 开头的 src 内部导入替换为 `@/`
2. 计算从 src 目录开始的完整路径
3. 确保导入路径正确无误

### 7. 自动修复

当编写新代码或修改现有代码时，Cursor 应该：

- 自动建议使用 @/ 别名
- 在代码补全时优先使用 @/ 路径
- 在重构时自动更新导入路径

## 执行优先级

**高优先级** - 这是代码规范的基础规则，必须严格执行。
