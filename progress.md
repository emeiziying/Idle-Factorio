Original prompt: 修复上述问题

2026-02-28

- 目标：修复初始化生命周期、科技状态多源、DI 退化为 service locator、关键组件整仓订阅导致的性能问题。
- 当前判断：
  - `StrictMode` 下 `initialize/cleanup` 存在重入与重复清理风险。
  - 科技状态同时散落在 store、TechnologyService/ResearchService、UserProgressService、GameStorageService。
  - `getService()` 在 service 内部被广泛使用，隐藏依赖。
  - 多个重量级组件使用 `useGameStore()` 整仓订阅。
- 待验证：
  - `pnpm test`
  - `pnpm build`
  - 最小运行验证（初始化、模块切换、科技页加载）

已完成：

- 修复 `useAppInitialization` 在 `StrictMode` 下卸载即清理的问题，初始化改为可取消等待、非组件驱动 teardown。
- `DIServiceInitializer` 支持可重入初始化，并在核心初始化阶段统一为 `DataService`/科技服务注入运行时依赖。
- `UserProgressService` 改为内存态，通过显式 `hydrate()` 从主存档恢复，消除和 `GameStorageService` 的双持久化。
- `TechnologyService`/`ResearchService`/`ResearchQueueService` 新增 hydrate 能力，科技 store 改为“service 计算 -> store 同步”。
- `DataService` 去掉对 DI 容器的反向读取，改为依赖端口注入。
- 主模块改为 `React.lazy` 懒加载，`data.json` 改为动态导入。
- 关键页面移除 `useGameStore()` 整仓订阅，改成 selector 订阅。
- 回退了手写 `manualChunks`。该策略导致生产包白屏，保留懒加载和动态数据加载即可稳定拆包。

验证结果：

- `pnpm test` 通过：13 个测试文件，225 个测试全部通过。
- `pnpm build` 通过。
- 浏览器手动验证通过：
  - 生产预览页可正常初始化，不再白屏。
  - 可以切换到“设施”和“科技”模块。
- 开发态页面也能正常初始化。

残余风险 / 后续建议：

- 目前科技运行时仍然存在 service 内部状态与 store 镜像的关系，只是持久化源已经收敛；下一步可以继续把科技 service 改成纯规则服务。
- `GameLoopTaskFactory`、`storageConfigs`、`craftingEngine` 等兼容层仍有 `getService()` 用法，可继续按同样方式收口。
- 自动化脚本二次运行时命中了本机 Playwright 启动权限问题，因此最终以浏览器手动验证为准。

继续开发记录：

- 已创建分支：`codex/architecture-followup`
- 第二阶段 DI 收口：
  - `RecipeService` 改为显式接收 `IManualCraftingValidator`，并通过 `setUnlockPorts()` 注入解锁查询。
  - `DependencyService` 改为显式接收 `RecipeService` 和 `ManualCraftingValidator`。
  - `StorageService` 改为显式接收 `DataService`。
  - `TechDataLoader` 改为显式接收 `DataService` 和配方查询端口。
  - `TechTreeService` 改为显式接收 `TechDataLoader`。
  - `TechnologyService` 不再允许缺省创建 `TechTreeService`，避免退回隐式依赖构造。
  - `DIServiceInitializer` 已同步更新上述构造链，并在初始化完成后把科技解锁端口注入到 `RecipeService`。
- 测试更新：
  - `RecipeService.test.ts` 改为显式构造 service + mock validator/mock unlock ports。
  - `DependencyService.test.ts` 移除对全局容器的 mock，改为直接注入依赖。
- 最新验证：
  - `pnpm build` 通过。
  - `pnpm test` 通过：13 个测试文件，225 个测试全部通过。

第三阶段收口：

- 已移除高频运行路径中的容器读取：
  - `GameLoopTaskFactory` 新增 `setRuntimePorts()`，设施任务和制作任务都通过初始化期注入的 `recipeQuery` 工作。
  - `CraftingEngine` 改为纯端口驱动，不再直接读取 DI 容器或 Zustand store。
  - `storageConfigs` 改为通过 `storageConfigRuntime` 注入 `StorageService` 查询端口。
  - `inventoryStore` 改为通过 `inventoryDataRuntime` 注入 `DataService` 查询端口。
- `DIServiceInitializer` 现负责在启动期注入并在 `cleanup()` 时重置：
  - game loop runtime ports
  - storage config query
  - inventory data query
- 新增回归测试：
  - `src/utils/__tests__/craftingEngine.test.ts`
  - `src/data/__tests__/storageConfigs.test.ts`

本轮验证：

- `pnpm test` 通过：15 个测试文件，229 个测试全部通过。
- `pnpm build` 通过。
- `pnpm preview` 产物启动成功。
- web-game Playwright 客户端已跑通并生成截图：`/tmp/idle-factorio-followup/shot-0.png`
- 浏览器控制台检查结果：0 个 error，0 个 warning。

当前残余热点：

- store 层仍存在若干 `getService()` 调用，主要在 `facilityStore`、`technologyStore`、`craftingStore`、`recipeStore`、`gameLoopStore`、`gameMetaStore`、`uiStateStore`。
- 其中优先级最高的是 `craftingStore` 和 `facilityStore`，因为都直接参与高频状态更新或任务调度。

第四阶段收口：

- 新增统一的 `src/store/storeRuntimeServices.ts`，把 store 对 service 的访问集中成初始化期注入的 runtime ports。
- 已迁移以下 store 切片到显式 runtime services：
  - `craftingStore`
  - `facilityStore`
  - `recipeStore`
  - `gameLoopStore`
  - `gameMetaStore`
  - `uiStateStore`
  - `technologyStore`
- `DIServiceInitializer` 现在会在核心服务初始化完成后统一注入：
  - `dataQuery`
  - `fuelService`
  - `gameLoopService`
  - `gameStorage`
  - `recipeQuery`
  - `technologyService`
- `cleanup()` 现在也会同步重置 `storeRuntimeServices`，避免热重载或重复初始化时留下脏引用。
- 新增回归测试：
  - `src/store/__tests__/storeRuntimeServices.test.ts`

本轮验证：

- `src/store` 下已无直接 `getService()` 调用。
- `pnpm test` 通过：16 个测试文件，231 个测试全部通过。
- `pnpm build` 通过。
- `pnpm preview` 产物启动成功。
- web-game Playwright 客户端已跑通并生成截图：`/tmp/idle-factorio-store-followup/shot-0.png`
- 浏览器控制台检查结果：0 个 error，0 个 warning。

新的残余热点：

- `getService()` 现在主要只剩在：
  - `src/hooks/useDIServices.ts`（这是合理的 UI/组合根访问层）
  - `src/services/storage/StorageService.ts` 的兼容 helper `getStorageService()`
  - `src/services/core/DIServiceInitializer.ts` 的导出便捷函数
- 下一步若继续收口，优先处理 `StorageService` 的兼容 helper，并把 README 里的示例同步到“组合根/Hook 层可用，业务 service/store 不可用”。

第五阶段生命周期治理：

- 新增统一的 `src/services/core/AppRuntimeContext.ts`，把以下运行时注入点收敛到单一上下文：
  - `storageConfigQuery`
  - `inventoryDataQuery`
  - `storeRuntimeServices`
  - `gameStoreAdapter`
  - `gameLoopRuntimePorts`
- `storageConfigRuntime`、`inventoryDataRuntime`、`storeRuntimeServices` 现已改为代理到 `AppRuntimeContext`，初始化失败或 cleanup 时只需 reset 一处。
- `DIContainer` 新增：
  - `Disposable` 协议
  - `hasInstance()`
  - `disposeInstances()`
  - `clear()` 现在会先 dispose 已解析实例
- `GameLoopService` 已实现 `dispose()`，会统一清理：
  - `visibilitychange` 监听
  - requestAnimationFrame / setTimeout 调度
  - 任务错误恢复 timeout
  - 任务与统计内存状态
- `GameStorageService` 已实现 `dispose()`，会：
  - 解绑 `beforeunload`
  - flush 待保存快照
  - 清理 pending save 状态
- `App.tsx` 已移除 `useAutoSaveBeforeUnload()`，并删除无调用方的 `useAutoSaveBeforeUnload.ts`，避免与 `GameStorageService` 的卸载存档路径重复。
- `DIServiceInitializer` 已重构为：
  - `initializeCoreServices()`
  - `initializeApplication(coreRuntime)`
  - `publishCoreRuntimeContext()`
  - `publishApplicationRuntimeContext()`
  - 初始化失败时会调用 `cleanup()` 回滚部分启动状态

新增回归测试：

- `src/services/core/__tests__/DIContainer.test.ts`
- `src/services/game/__tests__/GameLoopService.test.ts`
- `src/services/storage/__tests__/GameStorageService.test.ts`

本轮验证：

- `pnpm test` 通过：19 个测试文件，236 个测试全部通过（删除无调用方 hook 后已再次验证）。
- `pnpm build` 通过（删除无调用方 hook 后已再次验证）。
- `pnpm preview` 产物启动成功（本轮实际端口：`http://127.0.0.1:4174`）。
- web-game Playwright 客户端已跑通并生成截图：`/tmp/idle-factorio-followup/shot-0.png`
- 已人工检查最新截图，页面主内容与底部导航正常渲染。
- 浏览器控制台检查结果：0 个 error，0 个 warning。

后续建议：

- `DIServiceInitializer` 仍然偏重，下一步可以继续拆成更明确的 bootstrap phases 或 bootstrap orchestrator。
- 首屏性能热点仍然主要在 `icons.webp` 和 data chunk，后续若继续优化，优先做资源切片与分域数据加载。
