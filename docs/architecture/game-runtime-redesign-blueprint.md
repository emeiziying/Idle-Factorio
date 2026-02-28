# 游戏运行时重设计蓝图

## 目标

将当前应用重构为“纯领域引擎 + 运行时编排 + React UI 外壳”的离线优先模块化单体。

重构后应满足以下约束：

- 业务真相只有一份：`GameState`
- 静态数据只读：`GameCatalog`
- UI 只读 selector，只发 command
- 持久化只保存版本化快照
- React、存储、调度不直接渗透进领域规则

## 当前架构问题

### 1. 真相源分散

- `store`
- `service` 内部状态
- `localStorage`

同一份科技、研究、设施运行态被多处持有，导致读档、清档、初始化顺序彼此覆盖。

### 2. 启动路径依赖副作用

- store 模块导入即加载存档
- React 生命周期负责初始化和清理核心系统
- 开发模式下容易受到 `StrictMode` 双挂载影响

### 3. 服务层职责过重

- 同时承担规则、状态、持久化、调度、UI 适配
- 自研 DI 容器并没有真正形成显式依赖边界
- 大量运行期 `getService()` 使真实依赖隐藏在方法体内

### 4. 持久化模型有损

- 设施运行态没有完整保存
- 业务字段和显示字段被混存
- 缺少显式 `schemaVersion`

## 目标技术方案

### 前端框架

- `React + TypeScript + Vite`

### 运行态

- `GameRuntime` 负责生命周期、tick 调度、自动保存、订阅
- React 通过 `useSyncExternalStore` 订阅运行态

### 业务引擎

- 纯 TypeScript
- 不依赖 React、Zustand、浏览器存储、DOM
- 输入：`state + command/tick + catalog`
- 输出：`newState + events`

### 持久化

- 默认目标：`IndexedDB`
- 仓库接口：`SnapshotRepository`
- 数据格式：版本化 `GameSnapshot`

### UI 状态

- `Zustand` 仅存放 UI 临时状态
- 不再持有核心业务真相

## 目标目录结构

```text
src/
  app/
    bootstrap/
      createGameRuntime.ts
    runtime/
      GameRuntime.ts
      RuntimeScheduler.ts
    persistence/
      SnapshotRepository.ts
  data/
    catalog/
      GameCatalog.ts
      buildGameCatalog.ts
  engine/
    model/
      GameState.ts
      GameSnapshot.ts
      GameCommand.ts
      DomainEvent.ts
    core/
      createInitialGameState.ts
      applyGameCommand.ts
      tickGame.ts
    systems/
      facilitySystem.ts
      craftingSystem.ts
      fuelSystem.ts
      powerSystem.ts
      researchSystem.ts
      unlockSystem.ts
      statsSystem.ts
    selectors/
      inventorySelectors.ts
      technologySelectors.ts
      facilitySelectors.ts
  ui/
    hooks/
      useGameRuntime.ts
      useGameSelector.ts
      useGameCommands.ts
    stores/
      uiStore.ts
```

## 分层职责

### `data/catalog`

职责：

- 加载静态游戏数据
- 构建索引和只读查询结构
- 提供不依赖运行态的静态元数据

禁止：

- 判断科技是否已解锁
- 持有运行时状态
- 写浏览器存储

### `engine/model`

职责：

- 定义游戏核心状态模型
- 定义命令、事件、快照结构

要求：

- 不引用 UI 类型
- 不引用浏览器 API

### `engine/core`

职责：

- 创建初始状态
- 应用命令
- 推进模拟时间

要求：

- 纯函数
- 可直接单元测试

### `engine/systems`

职责：

- 单一领域规则模块
- 每个系统只处理一个子域

建议拆分：

- 设施
- 燃料
- 电力
- 研究
- 解锁
- 统计

### `app/runtime`

职责：

- 持有当前运行中的 `GameState`
- 维护命令队列
- 负责 tick 调度
- 触发自动保存
- 对外提供订阅接口

说明：

- `Runtime` 可以使用浏览器 API
- 但不能实现领域规则

### `app/persistence`

职责：

- 保存和读取 `GameSnapshot`
- 处理迁移和版本兼容

要求：

- 不擅自修复领域状态
- 不生成第二份业务状态

### `ui`

职责：

- 展示视图
- 读取 selector
- 发送 command

禁止：

- 直接改动核心业务状态
- 直接读写浏览器存档
- 直接调领域系统

## 核心模型

### `GameState`

必须只包含运行时业务真相：

- `meta`
- `inventory`
- `facilities`
- `crafting`
- `research`
- `unlocks`
- `power`
- `stats`
- `simulationTimeMs`

### `GameSnapshot`

```ts
interface GameSnapshot {
  schemaVersion: number;
  savedAtMs: number;
  state: GameState;
}
```

规则：

- 游戏进度只保存在 `state`
- UI 偏好单独存储
- 快照必须有版本号

### `GameCommand`

统一写入口。典型命令：

- 建造设施
- 设置配方
- 开始研究
- 添加研究队列
- 手动补燃料
- 手动制作

### `DomainEvent`

用于通知外层：

- 研究完成
- 科技解锁
- 设施缺料
- 设施输出阻塞
- 自动存档失败

事件不应成为新的真相源。

## 启动流程

新的启动流程必须显式化：

1. 加载 `GameCatalog`
2. 读取快照
3. 执行快照迁移
4. 恢复 `GameState`
5. 计算离线进度并分块回放
6. 创建 `GameRuntime`
7. 挂载 React

React 组件不再负责初始化核心系统。

## Tick 执行顺序

为避免时序 bug，统一顺序如下：

1. 应用命令队列
2. 自动补燃料
3. 燃料消耗
4. 电力分配
5. 设施生产推进
6. 手工制作推进
7. 研究推进
8. 解锁检查
9. 统计更新
10. 输出领域事件

## 与现有代码的映射关系

下列模块应逐步退役或下沉：

- `services/core/DataService.ts`
  - 拆为 `data/catalog` + `engine/selectors`
- `services/core/DIServiceInitializer.ts`
  - 替换为 `app/bootstrap/createGameRuntime.ts`
- `services/game/GameLoopTaskFactory.ts`
  - 替换为 `app/runtime` 调度器 + `engine/core/tickGame.ts`
- `services/storage/GameStorageService.ts`
  - 替换为 `SnapshotRepository`
- `services/technology/TechnologyService.ts`
  - 拆为 `researchSystem`、`unlockSystem`、相关 selector
- `store/slices/technologyStore.ts`
  - 降级为 UI 适配层或删除
- `services/game/UserProgressService.ts`
  - 移除独立持久化职责

## 迁移阶段

### 阶段 1：建立新骨架

- 新增 `GameCatalog`
- 新增 `GameState` / `GameSnapshot`
- 新增 `GameRuntime`
- 保持旧系统继续运行

### 阶段 2：统一科技真相

- 将科技解锁和研究状态迁入 `GameState`
- 去掉 `UserProgressService` 的独立存储
- 让 UI 只从 runtime 读科技状态

### 阶段 3：重做存档

- 引入 `schemaVersion`
- 完整保存设施运行态
- 增加迁移器

### 阶段 4：迁移循环系统

- 将设施、燃料、电力、研究逻辑迁入 `tickGame`
- 停止由 store/action 直接驱动核心演算

### 阶段 5：移除旧编排层

- 下线 DI 初始化器
- 下线旧 service locator 模式
- 精简 store 为 UI store

## 测试策略

### 领域单测

覆盖：

- 命令应用
- tick 推进
- 研究完成
- 设施缺料与恢复
- 燃料耗尽

### 持久化测试

覆盖：

- 快照读写
- 旧版本迁移
- 清档

### 运行时集成测试

覆盖：

- 启动
- 订阅更新
- 自动保存
- 离线回放

### E2E 测试

覆盖：

- 新游戏
- 研究
- 建造
- 存档恢复
- 清档后重新进入

## 验收标准

完成重构后，应满足：

- 任何业务状态只在 `GameState` 中保存一份
- 任何持久化只通过 `SnapshotRepository`
- React 组件不直接写业务状态
- 无模块导入即执行的初始化副作用
- `StrictMode` 下初始化行为稳定
- 读档、清档、离线收益具备自动化覆盖
