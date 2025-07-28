# 冗余代码检查报告

## 项目概况
- 总文件数：70个 TypeScript/TSX 文件
- 总导入语句：377个
- 检查时间：2024年

## 发现的冗余代码问题

### 1. 调试用的 console.log 语句
项目中存在大量的 console.log、console.warn 和 console.error 语句，这些应该在生产环境中被移除或使用更合适的日志系统。

**受影响的文件：**
- `src/hooks/useGameLoop.ts` - 包含16个console.log语句（用于调试设施状态）
- `src/services/TechnologyService.ts` - 包含9个console语句
- `src/store/gameStore.ts` - 包含2个console.error语句
- `src/services/DataService.ts` - 包含2个console.error语句
- `src/services/UserProgressService.ts` - 包含2个console.warn语句
- `src/services/FuelService.ts` - 包含2个console语句
- `src/App.tsx` - 包含1个console.error语句
- 其他多个组件文件中也有console语句

**建议：** 
- 生产环境中移除所有调试用的console.log语句
- 将console.error替换为适当的错误处理机制
- 考虑使用专门的日志库（如 winston、pino等）

### 2. 未使用的导入
发现了一些可能未使用的导入：

**App.tsx中的潜在未使用导入：**
- `useRef` - 虽然导入了但可能只在部分情况下使用
- `CraftingEngine` - 导入但未在组件中直接使用

**建议：**
- 使用 ESLint 的 `no-unused-vars` 规则来自动检测
- 定期运行导入清理工具

### 3. 重复的计算逻辑
在多个文件中发现了相似的计算逻辑：

**时间转换重复：**
```typescript
// src/utils/craftingEngine.ts - 第184行
const craftingTime = (baseTime / manualEfficiency) * currentTask.quantity * 1000;

// src/services/FuelService.ts - 第113行
const timeDelta = (currentTime - buffer.lastUpdate) / 1000;

// src/hooks/useProductionLoop.ts - 第100行
const deltaTime = (currentTime - lastUpdateRef.current) / 1000;
```

**速率计算重复：**
```typescript
// src/hooks/useGameLoop.ts - 第66行和第74行
const rate = (amount / recipe.time) * machineSpeed * efficiency * count;
```

**建议：**
- 创建通用的时间转换工具函数
- 创建通用的速率计算函数

### 4. TODO/FIXME 标记
发现了未完成的代码：

- `src/store/gameStore.ts` 第803行：`// TODO: 实现太空平台创建逻辑`
- `src/store/gameStore.ts` 第807行：`// TODO: 实现虫巢捕获逻辑`
- `src/store/gameStore.ts` 第820行：`// TODO: 添加科技解锁通知`
- `src/services/PowerService.ts` 第206行：`// TODO: 从生产系统获取实际蒸汽产量`

**建议：**
- 创建任务追踪系统来管理这些TODO
- 评估这些功能是否真的需要实现

### 5. 重复的错误处理模式
多个服务中使用了相似的单例模式和错误处理：

```typescript
// 多个服务都有类似的getInstance模式
static getInstance(): ServiceName {
  if (!ServiceName.instance) {
    ServiceName.instance = new ServiceName();
  }
  return ServiceName.instance;
}
```

**建议：**
- 创建一个基础的单例服务类
- 使用装饰器模式来减少重复代码

### 6. 潜在的性能问题
**useGameLoop.ts** 中的日志输出在生产环境会影响性能：
- 每次游戏循环都会输出多个console.log
- 这些日志在高频率更新时会严重影响性能

### 7. 未使用的导出函数
在 `src/data/storageConfigs.ts` 中有多个导出函数，需要确认是否都在使用：
- `getChestConfig`
- `getAvailableChestTypes`

在 `src/hooks/useIsMobile.ts` 中：
- `useIsTablet` - 需要确认是否在项目中使用
- `useDeviceType` - 需要确认是否在项目中使用

## 建议的优化步骤

1. **立即行动：**
   - 移除所有生产环境不需要的console.log语句
   - 清理未使用的导入

2. **短期改进：**
   - 将重复的计算逻辑抽取为工具函数
   - 实现适当的日志系统
   - 完成或移除TODO标记的功能

3. **长期优化：**
   - 实施代码质量工具（ESLint、Prettier）
   - 设置预提交钩子来自动检查代码质量
   - 考虑使用代码覆盖率工具来识别死代码

## 工具推荐

1. **ESLint** - 配置规则来检测未使用的变量和导入
2. **ts-prune** - 专门用于查找未使用的TypeScript导出
3. **depcheck** - 检查未使用的依赖
4. **madge** - 分析循环依赖

### 8. 循环依赖问题
使用 madge 工具检测到9个循环依赖：

1. `services/DataService.ts` → `services/RecipeService.ts` → `services/DataService.ts`
2. `services/DataService.ts` → `services/RecipeService.ts` → `utils/manualCraftingValidator.ts` → `services/DataService.ts`
3. `services/RecipeService.ts` → `utils/manualCraftingValidator.ts` → `services/RecipeService.ts`
4. `services/DataService.ts` → `services/TechnologyService.ts` → `services/DataService.ts`
5. `data/storageConfigs.ts` → `services/StorageService.ts` → `data/storageConfigs.ts`
6. 复杂的循环链：DataService → TechnologyService → gameStore → storageConfigs → StorageService → DataService
7. DataService → TechnologyService → gameStore → DataService
8. DataService → TechnologyService → gameStore → FuelService → DataService
9. `services/TechnologyService.ts` → `store/gameStore.ts` → `services/TechnologyService.ts`

**循环依赖的危害：**
- 增加代码复杂度，难以理解和维护
- 可能导致初始化顺序问题
- 使单元测试变得困难
- 影响代码的模块化

**建议：**
- 重构服务之间的依赖关系
- 考虑使用依赖注入模式
- 将共享的类型定义移到独立的文件中
- 使用接口而不是具体实现来减少耦合

## 更新的发现

经过进一步检查，发现：
- `useIsTablet` 和 `useDeviceType` 在 `useIsMobile.ts` 中定义但未在其他地方使用（除了 `useDeviceType` 内部使用了 `useIsTablet`）
- `getChestConfig` 和 `getAvailableChestTypes` 实际上在 `StorageExpansionDialog.tsx` 中被使用，不是冗余代码
- `CraftingEngine` 在 `App.tsx` 中被正确使用（start/stop方法）

## 总结

项目中存在的主要冗余代码问题：
1. **调试用的console语句**（约40+处）- 严重影响生产环境性能
2. **循环依赖**（9个）- 影响代码架构和可维护性
3. **重复的计算逻辑** - 降低代码质量
4. **未完成的TODO功能** - 代码债务
5. **未使用的导出函数**（`useIsTablet`、`useDeviceType`）

建议优先级：
1. 高优先级：解决循环依赖问题（影响架构）
2. 高优先级：移除console.log语句（影响性能）
3. 中优先级：抽取重复逻辑为工具函数
4. 低优先级：清理未使用的导出和TODO标记