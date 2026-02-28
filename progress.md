Original prompt: 从架构师角度评审当前应用技术方案，并推进重设计蓝图的实施。

2026-02-28
- 已把 experimental runtime 挂进入口 bootstrap、registry、scheduler 和调试面板，现阶段可以并行跑研究子系统。
- 已修正旧存档到新快照的桥接，科技定义改为从静态 recipe/item 元数据构建，不再依赖不存在的 `gameData.technologies`。
- 已将 `ResearchQueue` 抽成可复用视图，科技页开发态会同时显示旧链路研究队列和新引擎研究队列。
- 当前新增内容：`TechDetailPanel` 支持插入额外操作区，开发态下会显示 experimental runtime 的研究操作按钮，允许对选中科技直接执行开始研究、加入队列、移除队列。
- 这轮已补本地验证：
  - `pnpm test` 通过，12 个测试文件 / 215 个测试全绿。
  - `pnpm build` 通过；当前仍有单个产物 chunk 超过 1000 kB 的 Vite 告警，但不是本轮回归。
  - 浏览器验证已完成：科技页 experimental 研究队列预览上屏；科技详情抽屉可以打开并滚到底部看到 `Experimental Runtime` 区块；截图检查未见新的渲染异常；console/page errors 为空。
- 顺手收敛了一处语义不一致：experimental runtime 不再允许通过调试按钮或队列按钮手动启动 `researchTrigger` 科技，和详情面板当前提示保持一致。
- 当前新增内容：
  - 新增纯 selector [engine/selectors/technologySelectors.ts]，把科技卡片状态、详情状态、队列 ID、排序和显示过滤从 `TechnologyService` 抽离出来。
  - `TechSimpleGrid` 已去掉对 `TechnologyService` 的排序/过滤依赖，旧链路和新引擎卡片都复用同一套纯 selector。
  - 科技页开发态新增“卡片状态来源”切换；切到“新引擎”后，科技卡片状态、排序、过滤和详情顶部状态都来自 runtime state。
  - runtime 模式下详情抽屉会隐藏旧研究按钮，仅保留 `Experimental Runtime` 操作区，避免新旧写路径混用。
- 当前新增内容：
  - `TechGridCard` 已去掉 `TechnologyService/DataService` 依赖，卡片解锁内容、前置科技名称、触发器信息和研究配方摘要统一改由纯 metadata selector 提供。
  - `loadGameCatalog.ts` 新增同步 `getGameCatalog()`，旧链路也能拿到同一份静态 catalog，避免卡片层继续回退到 service。
  - `TechSimpleGrid/TechVirtualizedGrid` 现在都显式接收 `cardMetadataById`，卡片展示所需的派生信息已经和业务服务解耦。
- 这轮验证结果：
  - `pnpm test` 通过，现为 13 个测试文件 / 219 个测试全绿，新增了 technology selector 单测。
  - `pnpm build` 通过，仍只有既有的大 chunk 警告。
  - `$WEB_GAME_CLIENT` 已跑过科技页截图，确认切换条上屏。
  - 额外 Playwright 校验已确认：切到“新引擎”后可打开科技详情，详情顶部状态显示为 runtime 状态，旧研究按钮隐藏；console/page errors 为空。
- 这轮验证结果：
  - `pnpm test` 通过，现为 13 个测试文件 / 220 个测试全绿，新增 metadata selector 覆盖。
  - `pnpm build` 通过，仍只有既有的大 chunk 警告。
  - `$WEB_GAME_CLIENT` 已重新跑过科技页截图，卡片列表无视觉回退。
  - 额外 Playwright 校验已确认：切到“新引擎”后可打开科技详情，卡片摘要与详情展示仍完整，console/page errors 为空。
- 当前新增内容：
  - `DataService` 的 i18n 加载已改成显式 locale loader，`zh.json` 不再同时走静态引用和通配动态 import；顺手补了 locale 级缓存，避免后续切换语言时复用错数据。
  - 新增 [engine/core/__tests__/researchState.test.ts]，覆盖 `research/start`、`research/queue-add`、`research/queue-remove`、`research/auto-set`、自动起研、完成解锁，以及 trigger-tech 禁止手动 start/queue。
  - `TechDetailPanel` 主体内容已完全切到 catalog/selectors，旧 service 读路径已从详情面板中移除。
- 这轮验证结果：
  - `pnpm test` 通过，现为 14 个测试文件 / 226 个测试全绿。
  - `pnpm build` 通过；此前 `zh.json` 既静态又动态引用的 Vite 告警已消失，当前只剩既有的大 chunk 告警。
  - `$WEB_GAME_CLIENT` 已重新跑过科技页截图，科技卡片、runtime 切换条、双研究队列和调试面板显示正常。
  - 额外 Playwright 校验已确认：切到“新引擎”后可打开 `Steam power` 详情抽屉，主体内容与运行时状态正常显示，console/page errors 为空。
- 当前新增内容：
  - 新增 [engine/core/researchTriggers.ts]，把 trigger-tech 的计数判断抽成纯规则，并接入 `tickGame()`；新引擎现在会根据 `craftedItemCounts / builtEntityCounts / minedEntityCounts` 自动解锁触发式科技。
  - `createGameRuntime()` 在创建后会先跑一次 `tick(0)`，因此从旧档导入到新 runtime 后，如果触发条件已满足，科技会立即规范化到已解锁状态，不再等下一秒 scheduler。
  - `TechnologyModule` 已去掉 legacy 科技状态对 `TechnologyService.isTechAvailable()` 的依赖，旧链路和新引擎现在都通过 selector + `adaptLegacyStoreStateToGameState()` 计算卡片状态、详情状态和 trigger 进度。
  - `TechGridCard` / `TechDetailPanel` 已支持显示 trigger-tech 动态进度；满足前置但等待触发的科技会显示为“待触发”，并展示 `current/required` 进度。
  - `ExperimentalTechDetailActions` 的旧提示已改成真实 trigger 进度展示，不再声称“尚未接入自动解锁流程”。
- 这轮验证结果：
  - `pnpm test` 通过，现为 14 个测试文件 / 229 个测试全绿；新增了 trigger-tech 自动解锁和 trigger progress selector 覆盖。
  - `pnpm build` 通过，当前只剩既有的大 chunk 告警。
  - `$WEB_GAME_CLIENT` 已重新跑过科技页截图；trigger-tech 卡片能显示 `craft-item 0/10` 这类动态进度。
  - 额外 Playwright 校验已确认：切到“新引擎”后打开 `Steam power` 详情，状态为“待触发”，自动解锁条件区能显示当前进度和进度条，console/page errors 为空。
- 当前新增内容：
  - 右侧主 `ResearchQueue` 已改成跟随 `gridSource` 切换：在“新引擎”模式下，主队列直接消费 runtime state；在“旧链路”模式下，继续消费 legacy state。
  - 新增 [app/runtime/adapters/__tests__/adaptRuntimeResearchToLegacyView.test.ts]，把队列 view adapter 的当前研究、阻塞前置和兼容别名行为补上了测试。
  - `ResearchQueue` 已去掉对 `TechnologyService` 的隐式回退依赖，科技解析现在必须通过显式 `resolveTechnology` 传入；科技页主侧栏和 experimental preview 都已改成使用 catalog 解析。
  - `ExperimentalResearchQueuePreview` 现在只在 legacy 模式下显示，用来对照新引擎队列；切到 runtime 模式时，右侧主队列就是新引擎队列，不再重复渲染 preview。
- 这轮验证结果：
  - `pnpm test` 通过，现为 15 个测试文件 / 231 个测试全绿。
  - `pnpm build` 通过，当前只剩既有的大 chunk 告警。
  - `$WEB_GAME_CLIENT` 已重新跑过科技页 legacy 截图，确认主队列仍是旧链路，experimental preview 还在。
  - 额外 Playwright 校验已确认：切到“新引擎”后，右侧主队列标题变为 `新引擎研究队列`，且不再重复显示 experimental preview；console/page errors 为空。
- 当前新增内容：
  - 新增 [app/bootstrap/__tests__/createGameRuntime.test.ts]，覆盖“旧档导入即满足 trigger 条件时，`createGameRuntime()` 会在初始化阶段通过 `tick(0)` 立即规范化为已解锁状态”。
  - [engine/core/__tests__/researchState.test.ts] 新增了多级 trigger 依赖链测试，确认同一轮 `tickGame()` 内会按依赖顺序连续解锁 `electronics -> steam-power` 这类链路。
- 这轮验证结果：
  - `pnpm test` 通过，现为 16 个测试文件 / 233 个测试全绿。
  - `pnpm build` 通过，当前只剩既有的大 chunk 告警。
  - `$WEB_GAME_CLIENT` 已重新跑过科技页截图，未见新的视觉回退。
- 当前新增内容：
  - 新增 [app/runtime/__tests__/GameRuntime.test.ts]，覆盖 `dispatch -> tick -> save` 的连续操作下，监听器通知顺序、完成研究事件顺序、`save()` 快照一致性，以及无 repository 时的安全保存行为。
  - 这组测试同时验证了 `unsubscribe()` 后不会再收到后续 dispatch 的通知，给新 runtime 的外部订阅边界补上了回归保护。
- 这轮验证结果：
  - `pnpm test` 通过，现为 17 个测试文件 / 236 个测试全绿。
  - `pnpm build` 通过，当前只剩既有的大 chunk 告警。
  - `$WEB_GAME_CLIENT` 已重新跑过科技页截图，未见新的视觉回退。
- 当前新增内容：
  - 新引擎 `FacilityState` 已补上 `count`，并把 runtime snapshot schema 升到 v2；[LocalStorageSnapshotRepository.ts](/Volumes/p1/Dev/Idle-Factorio/src/app/persistence/LocalStorageSnapshotRepository.ts) 会在读取旧 experimental snapshot 时自动补齐 `count`。
  - 新增纯规则 [facilitySystems.ts](/Volumes/p1/Dev/Idle-Factorio/src/engine/core/facilitySystems.ts)，`tickGame()` 现在会处理设施电力快照、`no_power` 状态规范化、burner 设施燃料消耗，以及 `no_fuel` 设施的最小自动补燃。
  - [adaptLegacyStoreStateToSnapshot.ts](/Volumes/p1/Dev/Idle-Factorio/src/app/persistence/adaptLegacyStoreStateToSnapshot.ts) 已把 legacy 设施数量映射到新 `GameState`，不再在导入 runtime 时丢掉设施规模。
  - 新增 [facilitySystems.test.ts](/Volumes/p1/Dev/Idle-Factorio/src/engine/core/__tests__/facilitySystems.test.ts) 和 [LocalStorageSnapshotRepository.test.ts](/Volumes/p1/Dev/Idle-Factorio/src/app/persistence/__tests__/LocalStorageSnapshotRepository.test.ts)，覆盖 `no_power`、power deficit 比例、burner 燃料消耗/自动补燃，以及旧 snapshot 迁移。
  - [ExperimentalRuntimeDebugPanel.tsx](/Volumes/p1/Dev/Idle-Factorio/src/components/common/ExperimentalRuntimeDebugPanel.tsx) 现在会显示 runtime 设施总台数、电力生成/消耗和 `no_fuel/no_power` 计数，便于观察新引擎设施子系统。
- 这轮验证结果：
  - `pnpm test` 通过，现为 19 个测试文件 / 241 个测试全绿。
  - `pnpm build` 通过，当前只剩既有的大 chunk 告警。
  - `pnpm preview --host 127.0.0.1 --port 4173` 已成功启动；随后按 [$develop-web-game](/Users/quan/.codex/skills/develop-web-game/SKILL.md) 跑过 Playwright client，并人工检查了截图 `/tmp/idle-factorio-runtime-check/shot-0.png`，主界面无白屏或明显布局回退。
  - 这次 Playwright client 没有产出独立的文本状态文件；浏览器检查主要完成了页面可见性和截图确认。

- 当前新增内容：
  - `tickGame()` 已接入设施生产推进：在 power/fuel 之后执行配方输入消耗、生产进度推进和产出写回，`count` 会按设施组规模放大输入/输出。
  - 设施在缺材料时会进入 `no_resource`，并通过 `facility/no-resource` 事件上报；材料恢复后会自动回到 `running`。
  - `facilitySystems.test.ts` 新增了“生产闭环”和“缺料阻塞”两条测试，覆盖输入扣减、产出回写、状态切换与事件发射。
- 这轮验证结果：
  - `pnpm test -- --run src/engine/core/__tests__/facilitySystems.test.ts` 通过，6/6 用例通过。
  - `pnpm test` 通过，现为 19 个测试文件 / 243 个测试全绿。
  - `pnpm build` 通过，当前只剩既有的大 chunk 告警。

- 当前新增内容：
  - `tickFacilityProductionState` 已支持单 tick 多周期生产：会在一个 tick 内循环完成多次配方，并在剩余时间可继续时预扣下一轮输入材料。
  - 生产推进在输入不足时会在“已完成可完成的轮次”后切换到 `no_resource`，避免大 `deltaMs` 下遗漏阻塞状态。
  - `facilitySystems.test.ts` 的生产用例已补齐多周期断言（同一 tick 产出 + 下一轮进度保留）。
- 这轮验证结果：
  - `pnpm test -- --run src/engine/core/__tests__/facilitySystems.test.ts` 通过，6/6 用例通过。
  - `pnpm test` 通过，现为 19 个测试文件 / 243 个测试全绿。
  - `pnpm build` 通过，当前只剩既有的大 chunk 告警。


- 当前新增内容：
  - 修正设施生产状态机：`output_full` 不再在无容量判断时被自动恢复为 `running`，避免 runtime 生成“假恢复”状态。
  - `facilitySystems.test.ts` 新增 `output_full` 保持阻塞的回归用例，锁定当前行为边界，等后续容量模型迁移后再放开恢复逻辑。
- 这轮验证结果：
  - `pnpm test -- --run src/engine/core/__tests__/facilitySystems.test.ts` 通过，7/7 用例通过。
  - `pnpm test` 通过，现为 19 个测试文件 / 244 个测试全绿。
  - `pnpm build` 通过，当前只剩既有的大 chunk 告警。


- 当前新增内容：
  - `GameState.inventory` 新增可选 `capacities`，并在 legacy→runtime 适配时映射 `InventoryItem.maxCapacity`，为 runtime `output_full` 判断提供容量基线。
  - `tickFacilityProductionState` 现已接入输出容量判断：
    - 启动新一轮生产前会先检查输出空间，不足时进入 `output_full`；
    - 完成产出前会再次检查输出空间，不足时保持完成态并进入 `output_full`；
    - `output_full` 设施在容量恢复后可自动恢复并继续处理产出。
  - `facilitySystems.test.ts` 新增 `output_full` 恢复回归用例，并将阻塞用例改为容量受限场景，锁定新语义。
- 这轮验证结果：
  - `pnpm test -- --run src/engine/core/__tests__/facilitySystems.test.ts` 通过，8/8 用例通过。
  - `pnpm test` 通过，现为 19 个测试文件 / 245 个测试全绿。
  - `pnpm build` 通过，当前只剩既有的大 chunk 告警。


- 当前新增内容：
  - 设施产出已接入 runtime 统计：`tickFacilityProductionState` 在写入配方产出时会累计 `stats.totalItemsProduced`，使 runtime 总产量与设施产出一致。
  - `facilitySystems.test.ts` 补充了总产量断言：生产成功会增长 `totalItemsProduced`，`output_full` 阻塞时不会误增长。
- 这轮验证结果：
  - `pnpm test -- --run src/engine/core/__tests__/facilitySystems.test.ts` 通过，8/8 用例通过。
  - `pnpm test` 通过，现为 19 个测试文件 / 245 个测试全绿。
  - `pnpm build` 通过，当前只剩既有的大 chunk 告警。


- 当前新增内容：
  - `no_resource/output_full` 的恢复时序已对齐 legacy：设施在恢复为 `running` 的当 tick 不立即继续生产，下一 tick 才推进配方，避免恢复瞬间额外产出。
  - `facilitySystems.test.ts` 的 `output_full` 恢复用例已扩展为“两段断言”：先验证恢复 tick 只改状态不产出，再验证下一 tick 才产出并在容量再次满时回到 `output_full`。
- 这轮验证结果：
  - `pnpm test -- --run src/engine/core/__tests__/facilitySystems.test.ts` 通过，8/8 用例通过。
  - `pnpm test` 通过，现为 19 个测试文件 / 245 个测试全绿。
  - `pnpm build` 通过，当前只剩既有的大 chunk 告警。


- 当前新增内容：
  - 新增领域事件 `facility/output-full`，当设施从可运行状态进入 `output_full` 时上报事件，便于 runtime 侧后续面板/日志订阅。
  - `facilitySystems.test.ts` 已补充 `output_full` 事件断言：恢复后再次因容量不足进入 `output_full` 时会触发事件；持续阻塞状态不重复发事件。
- 这轮验证结果：
  - `pnpm test -- --run src/engine/core/__tests__/facilitySystems.test.ts` 通过，8/8 用例通过。
  - `pnpm test` 通过，现为 19 个测试文件 / 245 个测试全绿。
  - `pnpm build` 通过，当前只剩既有的大 chunk 告警。


- 当前新增内容：
  - `GameLoopTaskFactory` 已增加 runtime 就绪门禁：当 `GameRuntimeRegistry.status === ready` 时，legacy 的 `FACILITIES` 与 `FUEL_CONSUMPTION` 任务不再运行，避免新旧双写设施状态。
  - 新增 `isLegacyFacilityLoopEnabled()` 导出，作为后续切换与测试的统一判定入口。
  - 新增 [src/services/game/__tests__/GameLoopTaskFactory.test.ts]，覆盖 runtime `booting/ready` 两种状态下的 legacy 设施循环开关行为。
- 这轮验证结果：
  - `pnpm test -- --run src/services/game/__tests__/GameLoopTaskFactory.test.ts` 通过，2/2 用例通过。
  - `pnpm test` 通过，现为 20 个测试文件 / 247 个测试全绿。
  - `pnpm build` 通过，当前只剩既有的大 chunk 告警。


- 当前新增内容：
  - `PowerManagement` 已接入 runtime 只读电力快照：当 `GameRuntimeRegistry` 就绪时，页面直接使用 `runtimeState.power` 与 runtime 设施数据渲染，不再依赖 legacy `PowerService` 计算作为唯一来源。
  - runtime 模式下发电设施操作按钮会禁用，并在页面顶部显示“runtime 只读”提示，明确避免新旧写路径混用。
  - 该页仍保留 legacy 回退：runtime 未就绪时继续走原有 `PowerService + store facilities` 路径。
- 这轮验证结果：
  - `pnpm test -- --run src/services/game/__tests__/GameLoopTaskFactory.test.ts src/engine/core/__tests__/facilitySystems.test.ts` 通过，10/10 用例通过。
  - `pnpm test` 通过，现为 20 个测试文件 / 247 个测试全绿。
  - `pnpm build` 通过，当前只剩既有的大 chunk 告警。


- 当前新增内容：
  - 新增设施 selector [src/engine/selectors/facilitySelectors.ts]，把 runtime 电力视图模型（`power balance` + `generator stats`）从 `PowerManagement` 组件内下沉到引擎选择器层。
  - [PowerManagement.tsx] 现在在 runtime 模式下直接消费 `facilitySelectors` 产出的只读视图，组件内不再内联 runtime 电力规则计算；legacy 模式仍保留 `PowerService` 回退。
  - 新增 [src/engine/selectors/__tests__/facilitySelectors.test.ts]，覆盖 runtime 电力视图和发电设施统计聚合。
- 这轮验证结果：
  - `pnpm test -- --run src/engine/selectors/__tests__/facilitySelectors.test.ts src/services/game/__tests__/GameLoopTaskFactory.test.ts` 通过，4/4 用例通过。
  - `pnpm test` 通过，现为 21 个测试文件 / 249 个测试全绿。
  - `pnpm build` 通过，当前只剩既有的大 chunk 告警。


TODO
- 评估是否保留 `ExperimentalResearchQueuePreview` 这个 legacy 对照面板；如果后续研究详情和主队列都已经切稳，可以考虑删除整个 preview 入口。
- 继续把设施子域往新引擎推进，下一步优先迁输出容量（`output_full`）和多周期生产细节，减少与 legacy 行为差异。
- 评估是否把正式电力面板先接到 runtime selector；现在 power snapshot 已经存在于 `GameState`，可以作为设施模块切 runtime 的第一个只读面板。

- 当前新增内容：
  - `EfficiencyOptimizer` 已接入 runtime 设施快照：当 `GameRuntimeRegistry` 就绪时，页面改为读取 `runtimeState.facilities`（状态/效率/配方）和 runtime catalog 配方数据进行瓶颈分析，不再只依赖 legacy 设施结构。
  - 效率概览中的电力满足率在 runtime 模式下改为来自 `buildRuntimePowerBalanceView(...)`，保持与 `PowerManagement` 一致的 runtime 读模型；runtime 未就绪时继续 legacy 回退。
  - 页面顶部新增 runtime 只读提示，明确该页当前为 runtime 快照视图。
- 这轮验证结果：
  - `pnpm test -- --run src/engine/selectors/__tests__/facilitySelectors.test.ts src/services/game/__tests__/GameLoopTaskFactory.test.ts` 通过，4/4 用例通过。
  - `pnpm test` 通过，保持 21 个测试文件 / 249 个测试全绿。
  - `pnpm build` 通过，当前只剩既有的大 chunk 告警。
