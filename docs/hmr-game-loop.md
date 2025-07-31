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