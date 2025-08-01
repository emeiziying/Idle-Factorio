# Code Formatting Rule - 代码格式化规则

## 规则概述

使用 Prettier 自动格式化代码，确保代码风格一致性。所有代码提交前必须通过 Prettier 格式化。

## Prettier 配置说明

### 核心配置

- **不使用分号**：`semi: false`
- **使用单引号**：`singleQuote: true`（JSX 除外）
- **缩进宽度**：2 空格
- **最大行宽**：100 字符
- **尾随逗号**：多行时总是添加
- **箭头函数参数**：总是使用括号

### 导入排序规则

导入语句会自动按以下顺序排序：

1. React 相关导入
2. 第三方库导入
3. `@/` 别名导入（项目内部文件）
4. 相对路径导入

每组之间会自动添加空行。

## 使用方式

### 手动格式化

```bash
# 格式化所有文件
npm run format

# 检查格式（不修改文件）
npm run format:check

# 格式化单个文件
npx prettier --write src/components/MyComponent.tsx
```

### 自动格式化

- **保存时自动格式化**：Cursor/VSCode 配置了保存时自动运行 Prettier
- **提交前自动格式化**：通过 lint-staged 和 husky 在 git commit 前自动格式化

### IDE 配置

在 Cursor/VSCode 中，确保以下设置：

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## 格式化示例

### 导入语句格式化

```typescript
// ✅ 格式化后 - 自动排序和分组
import React, { useEffect, useState } from 'react'

import { Box, Button } from '@mui/material'
import { useDispatch } from 'react-redux'

import { DataService } from '@/services/DataService'
import { useGameLoop } from '@/hooks/useGameLoop'
import type { Item } from '@/types'

import { formatNumber } from './utils'

// ❌ 格式化前 - 混乱的导入顺序
import { formatNumber } from './utils'
import { Box, Button } from '@mui/material'
import type { Item } from '@/types'
import React, { useState, useEffect } from 'react'
import { useGameLoop } from '@/hooks/useGameLoop'
```

### 代码格式化

```typescript
// ✅ 格式化后
export const ItemCard: FC<ItemCardProps> = ({ item, quantity, onClick }) => {
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(item)
    }
  }, [item, onClick])

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
        },
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent>
        <Typography variant="h6">{item.name}</Typography>
        <Typography variant="body2">数量: {formatNumber(quantity)}</Typography>
      </CardContent>
    </Card>
  )
}

// ❌ 格式化前
export const ItemCard:FC<ItemCardProps>=({item,quantity,onClick})=>{
const [isHovered,setIsHovered]=useState(false);
const handleClick=useCallback(()=>{if(onClick){onClick(item)};},[item,onClick]);
return <Card sx={{cursor:"pointer",transition:"all 0.2s","&:hover":{transform:"translateY(-2px)"}}} onClick={handleClick} onMouseEnter={()=>setIsHovered(true)} onMouseLeave={()=>setIsHovered(false)}>
<CardContent><Typography variant="h6">{item.name}</Typography>
<Typography variant="body2">数量: {formatNumber(quantity)}</Typography></CardContent></Card>}
```

### 对象和数组格式化

```typescript
// ✅ 格式化后
const gameConfig = {
  maxInventorySize: 100,
  defaultCraftingSpeed: 1,
  features: {
    automation: true,
    multiplayer: false,
    achievements: true,
  },
  difficultyLevels: ['easy', 'normal', 'hard', 'expert'],
}

const items = [
  { id: 'iron-plate', quantity: 100 },
  { id: 'copper-plate', quantity: 50 },
  { id: 'steel-plate', quantity: 25 },
]

// ❌ 格式化前
const gameConfig={maxInventorySize:100,defaultCraftingSpeed:1,features:{automation:true,multiplayer:false,achievements:true},difficultyLevels:["easy","normal","hard","expert"]}
const items=[{id:"iron-plate",quantity:100},{id:"copper-plate",quantity:50},{id:"steel-plate",quantity:25}]
```

## 与 ESLint 集成

Prettier 已与 ESLint 集成，规则冲突已解决：

- ESLint 负责代码质量规则（如未使用的变量、类型错误等）
- Prettier 负责代码格式规则（如缩进、换行、引号等）
- 使用 `eslint-config-prettier` 禁用了 ESLint 中与 Prettier 冲突的规则

## 忽略文件

以下文件/目录被 Prettier 忽略（见 .prettierignore）：

- `node_modules/`
- `dist/`、`build/`、`coverage/`
- `package-lock.json`、`pnpm-lock.yaml`
- `src/data/spa/` - 游戏数据文件
- `*.json` - JSON 数据文件

## 最佳实践

1. **定期运行格式化**：在提交代码前运行 `npm run format`
2. **配置编辑器**：确保编辑器配置了自动格式化
3. **团队一致性**：团队成员都应使用相同的 Prettier 配置
4. **CI 集成**：在 CI 中添加 `npm run format:check` 确保代码格式正确

## 故障排除

### 常见问题

1. **格式化不生效**
   - 检查是否安装了 Prettier 扩展
   - 确认编辑器的默认格式化器设置
   - 运行 `npm install` 确保依赖安装完整

2. **与 ESLint 冲突**
   - 确保 `eslint-config-prettier` 在 ESLint 配置的最后
   - 运行 `npm run lint:fix` 修复可自动修复的问题

3. **导入排序不工作**
   - 确认安装了 `@trivago/prettier-plugin-sort-imports`
   - 检查 `.prettierrc.json` 中的 plugins 配置

## 执行优先级

**高优先级** - 代码格式一致性是团队协作的基础，必须严格执行。
