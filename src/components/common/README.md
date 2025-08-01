# 通用UI组件

这个目录包含了可复用的UI组件，用于提供一致的用户体验。

## 组件列表

### LoadingScreen
全屏加载页面组件

```tsx
import { LoadingScreen } from '@/components/common';

// 基本用法
<LoadingScreen />

// 自定义内容
<LoadingScreen 
  title="正在加载游戏"
  message="准备游戏数据中..."
  subtitle="首次加载可能需要几秒钟"
  withTheme // 包含主题提供器，用于独立页面
/>
```

### ErrorScreen
全屏错误页面组件

```tsx
import { ErrorScreen } from '@/components/common';

// 基本用法
<ErrorScreen error="发生了错误" />

// 带重试功能
<ErrorScreen 
  error="初始化失败"
  showRetry
  retryText="重试初始化"
  onRetry={() => { /* 重试逻辑 */ }}
  withTheme
/>
```

### InlineLoading
内联加载组件，用于组件内部的加载状态

```tsx
import { InlineLoading } from '@/components/common';

// 基本用法
<InlineLoading />

// 自定义样式
<InlineLoading 
  message="加载物品数据中..."
  height={200}
  showSpinner={false}
  color="error"
/>
```

## 设计原则

1. **一致性**: 所有加载和错误状态使用统一的组件
2. **可复用性**: 通过props支持不同的使用场景
3. **主题兼容**: 自动适配应用主题
4. **响应式**: 适配不同屏幕尺寸

## 使用场景

- **LoadingScreen**: 应用启动、页面切换时的全屏加载
- **ErrorScreen**: 应用崩溃、初始化失败时的错误页面
- **InlineLoading**: 组件内数据加载、服务初始化等待