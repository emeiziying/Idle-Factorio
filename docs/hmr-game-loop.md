# 游戏循环热重载 (HMR) 实现

## 概述

游戏循环在热重载时的处理是一个常见问题。如果不正确处理，可能会导致：
- 多个游戏循环同时运行
- 内存泄漏
- 状态丢失
- 性能问题

## 实现方案

### 1. GameLoopManager (游戏循环管理器)

`src/utils/GameLoopManager.ts` 负责管理所有的游戏循环任务：

```typescript
// HMR 支持
if (import.meta.hot) {
  // dispose: 模块被替换前调用
  import.meta.hot.dispose(() => {
    // 1. 保存当前任务信息
    // 2. 停止 requestAnimationFrame 循环
    // 3. 清理所有任务
  });
  
  // accept: 新模块加载后调用
  import.meta.hot.accept(() => {
    // 任务会由各个系统重新注册
  });
}
```

**关键点：**
- 使用单例模式，确保只有一个实例
- 在 dispose 时停止所有循环，防止旧循环继续运行
- 任务信息仅用于调试，实际任务由各系统重新注册

### 2. MainGameLoop (主游戏循环)

`src/core/MainGameLoop.ts` 是游戏的主循环，协调所有子系统：

```typescript
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    // 1. 保存运行状态和累积器
    // 2. 停止游戏循环
  });
  
  import.meta.hot.accept(() => {
    // 1. 恢复累积器状态（避免时间跳跃）
    // 2. 如果之前在运行，重新启动
  });
}
```

**关键点：**
- 保存累积器状态，避免热重载后时间突然跳跃
- 记住之前的运行状态，自动恢复

### 3. ServiceInitializer (服务初始化器)

`src/services/core/ServiceInitializer.ts` 负责初始化所有服务：

```typescript
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    // 保存初始化状态
  });
  
  import.meta.hot.accept(() => {
    // 恢复初始化状态，避免重复初始化
  });
}
```

**关键点：**
- 防止热重载时重复初始化服务
- 维持服务的单例状态

## 工作流程

1. **代码修改触发热重载**
   - Vite 检测到文件变化
   - 准备替换模块

2. **Dispose 阶段**（旧模块清理）
   - GameLoopManager: 停止 requestAnimationFrame，清理任务
   - MainGameLoop: 保存状态，停止主循环
   - ServiceInitializer: 记录初始化状态

3. **Accept 阶段**（新模块加载）
   - 新模块被加载
   - ServiceInitializer: 恢复初始化状态
   - MainGameLoop: 恢复累积器，重启循环
   - GameLoopManager: 等待任务重新注册

## 调试信息

热重载时会在控制台输出调试信息：

```
[HMR] GameLoopManager: Saved tasks and stopped loop
[HMR] MainGameLoop: Stopped game loop
[HMR] ServiceInitializer: Saved initialization state
[HMR] ServiceInitializer: Module accepted
[HMR] MainGameLoop: Module accepted
[HMR] MainGameLoop: Restored accumulators
[HMR] MainGameLoop: Restarted game loop
[HMR] GameLoopManager: Module accepted, restoring state
```

## 注意事项

1. **函数无法序列化**
   - 回调函数在热重载时会丢失
   - 需要由各系统重新注册

2. **状态一致性**
   - 累积器状态需要保存和恢复
   - 避免时间跳跃或重复执行

3. **内存管理**
   - 确保清理所有事件监听器
   - 取消所有未完成的异步操作

## 测试热重载

1. 启动开发服务器：`npm run dev`
2. 打开浏览器控制台
3. 修改任何相关文件
4. 观察控制台输出，确认循环正确重启
5. 检查游戏状态是否保持一致

## 常见问题

### Q: 热重载后游戏速度变快？
A: 可能是旧循环没有正确停止。检查 dispose 函数是否正确执行。

### Q: 热重载后游戏状态重置？
A: 需要在适当的地方保存和恢复状态。参考 MainGameLoop 的累积器处理。

### Q: 控制台报错 "Cannot read property of null"？
A: 可能是单例实例被错误清理。确保 HMR 正确处理单例模式。

## 使用通用 HMR 工具

为了让 HMR 代码更容易复用，项目提供了通用的 HMR 工具类 `src/utils/hmr.ts`：

### 1. 基础 HMR 设置

```typescript
import { setupHMR } from '@/utils/hmr';

setupHMR({
  moduleName: 'MyModule',
}, {
  getState: () => {
    // 返回需要保存的状态
    return { someData: myData };
  },
  restoreState: (state) => {
    // 恢复保存的状态
    myData = state.someData;
  },
  onDispose: () => {
    // 清理逻辑（可选）
    cleanup();
  },
  onAccept: () => {
    // accept 后的额外处理（可选）
    reinitialize();
  }
});
```

### 2. 单例模式 HMR

```typescript
import { setupSingletonHMR } from '@/utils/hmr';

setupSingletonHMR({
  moduleName: 'MySingleton',
  getInstance: () => MySingleton.getInstance(),
  preserveProperties: ['property1', 'property2'] // 需要保存的属性
});
```

### 3. 游戏循环 HMR

```typescript
import { setupGameLoopHMR } from '@/utils/hmr';

setupGameLoopHMR({
  moduleName: 'MyGameLoop',
  isRunning: () => loop.isRunning(),
  start: () => loop.start(),
  stop: () => loop.stop(),
  getExtraState: () => ({ 
    // 额外需要保存的状态
    timers: loop.timers 
  }),
  restoreExtraState: (state) => {
    // 恢复额外状态
    loop.timers = state.timers;
  }
});
```

### 4. React 组件中的 HMR 清理

```typescript
import { useHMRCleanup } from '@/utils/hmr';

function MyComponent() {
  const [timer, setTimer] = useState<number>();

  useEffect(() => {
    const id = setInterval(() => {
      // 定时任务
    }, 1000);
    setTimer(id);
    
    return () => clearInterval(id);
  }, []);

  // HMR 时自动清理定时器
  useHMRCleanup(() => {
    if (timer) clearInterval(timer);
  }, [timer]);

  return <div>...</div>;
}
```

### 优势

1. **代码复用**：避免重复编写 HMR 逻辑
2. **类型安全**：提供 TypeScript 类型支持
3. **错误处理**：自动捕获和记录错误
4. **调试友好**：统一的日志格式
5. **场景优化**：针对不同场景提供专门的工具函数

### 迁移指南

如果你有现有的 HMR 代码，可以按以下步骤迁移：

1. 识别模式（基础/单例/游戏循环）
2. 选择对应的工具函数
3. 提取状态保存/恢复逻辑
4. 替换原有的 `import.meta.hot` 代码

这样可以让代码更简洁、更易维护。