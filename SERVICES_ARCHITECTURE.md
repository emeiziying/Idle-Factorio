# 服务架构文档

## 服务概览

项目采用**服务定位器模式**来管理服务依赖，所有服务通过 `ServiceLocator` 注册和获取，避免循环依赖。

## 核心服务

### 1. ServiceLocator（服务定位器）
- **文件**: `ServiceLocator.ts`
- **功能**: 中央服务注册表，管理所有服务实例
- **主要方法**:
  - `register<T>(name: string, service: T)`: 注册服务
  - `get<T>(name: string): T`: 获取服务
  - `has(name: string): boolean`: 检查服务是否存在

### 2. ServiceInitializer（服务初始化器）
- **文件**: `ServiceInitializer.ts`
- **功能**: 按正确顺序初始化所有服务
- **初始化顺序**:
  1. UserProgressService（用户进度）
  2. StorageService（存储）
  3. GameStateAdapter（游戏状态适配器）
  4. ManualCraftingValidator（手动制作验证）
  5. DataService（数据服务）
  6. RecipeService（配方）
  7. TechnologyService（科技）
  8. FuelService（燃料）
  9. PowerService（电力）

## 业务服务

### 3. DataService（数据服务）
- **文件**: `DataService.ts` (546行)
- **功能**: 游戏数据管理的核心服务
- **职责**:
  - 加载和缓存游戏数据（items, recipes, categories）
  - 加载国际化数据
  - 提供数据查询接口
  - 管理物品解锁状态
- **主要方法**:
  - `loadGameData()`: 加载游戏数据
  - `loadI18nData(locale)`: 加载国际化数据
  - `getItem(itemId)`: 获取物品信息
  - `getRecipe(recipeId)`: 获取配方信息
  - `isItemUnlocked(itemId)`: 检查物品是否解锁

### 4. RecipeService（配方服务）
- **文件**: `RecipeService.ts` (773行)
- **功能**: 管理所有配方相关逻辑
- **职责**:
  - 合并游戏配方和自定义配方
  - 提供配方查询和过滤
  - 手动制作配方验证
  - 配方统计和分析
- **主要方法**:
  - `getRecipeById(id)`: 根据ID获取配方
  - `getRecipesThatProduce(itemId)`: 获取生产某物品的配方
  - `getRecipesThatUse(itemId)`: 获取使用某物品的配方
  - `getManualCraftingRecipe(itemId)`: 获取手动制作配方
  - `getMostEfficientRecipe(itemId)`: 获取最高效的配方

### 5. TechnologyService（科技服务）
- **文件**: `TechnologyService.ts` (1687行) - 最大的服务
- **功能**: 管理科技树和研究系统
- **职责**:
  - 科技树管理和依赖解析
  - 研究进度跟踪
  - 科技解锁逻辑
  - 自动研究队列
  - 科技包消耗
- **主要方法**:
  - `startResearch(techId)`: 开始研究科技
  - `updateResearch(deltaTime)`: 更新研究进度
  - `isUnlocked(techId)`: 检查科技是否已解锁
  - `canResearch(techId)`: 检查是否可以研究
  - `getTechTree()`: 获取科技树数据

### 6. FuelService（燃料服务）
- **文件**: `FuelService.ts` (386行)
- **功能**: 管理设施燃料系统
- **职责**:
  - 燃料缓冲区管理
  - 燃料消耗计算
  - 自动补充燃料
  - 燃料优先级管理
- **主要方法**:
  - `initializeFuelBuffer(facilityId)`: 初始化燃料缓冲
  - `updateFuelConsumption(facility, deltaTime)`: 更新燃料消耗
  - `refillFuelBuffer(facility, inventory)`: 补充燃料
  - `getOptimalFuel(fuelCategory, inventory)`: 获取最优燃料

### 7. PowerService（电力服务）
- **文件**: `PowerService.ts` (311行)
- **功能**: 管理电力系统
- **职责**:
  - 电力产生和消耗计算
  - 电力平衡管理
  - 设施电力状态
  - 蒸汽发电管理
- **主要方法**:
  - `calculatePowerBalance(facilities)`: 计算电力平衡
  - `updateFacilityPowerStatus(facility, hasPower)`: 更新设施电力状态
  - `getPowerConsumption(facility)`: 获取设施电力消耗
  - `getPowerProduction(facility)`: 获取设施电力产出

### 8. StorageService（存储服务）
- **文件**: `StorageService.ts` (97行)
- **功能**: 管理存储配置
- **职责**:
  - 合并游戏数据和自定义存储配置
  - 提供存储类型查询
  - 管理箱子配置
- **主要方法**:
  - `getStorageConfig(storageType)`: 获取存储配置
  - `getAvailableStorageTypes()`: 获取所有存储类型
  - `getSolidStorageTypes()`: 获取固体存储类型
  - `getLiquidStorageTypes()`: 获取液体存储类型

### 9. DependencyService（依赖服务）
- **文件**: `DependencyService.ts` (212行)
- **功能**: 处理制作依赖链
- **职责**:
  - 分析制作依赖关系
  - 计算完整制作链
  - 检查材料可用性
  - 生成制作计划
- **主要方法**:
  - `analyzeCraftingChain(recipe, quantity)`: 分析制作链
  - `checkMaterialAvailability(chain)`: 检查材料可用性
  - `calculateTotalResources(chain)`: 计算总资源需求

### 10. UserProgressService（用户进度服务）
- **文件**: `UserProgressService.ts` (111行)
- **功能**: 管理用户游戏进度
- **职责**:
  - 跟踪解锁的物品和科技
  - 持久化用户进度
  - 提供进度查询接口
- **主要方法**:
  - `unlockItem(itemId)`: 解锁物品
  - `unlockTech(techId)`: 解锁科技
  - `isItemUnlocked(itemId)`: 检查物品是否解锁
  - `saveProgress()`: 保存进度
  - `loadProgress()`: 加载进度

## 适配器和接口

### 11. GameStateAdapter（游戏状态适配器）
- **文件**: `GameStateAdapter.ts` (32行)
- **功能**: 将 gameStore 适配为 GameStateProvider 接口
- **目的**: 解耦服务与 store 的直接依赖

### 接口定义
- **interfaces.ts**: 定义 `GameStateProvider` 接口
- **interfaces/IManualCraftingValidator.ts**: 定义手动制作验证接口

## 服务依赖关系

```
ServiceInitializer
    ├── UserProgressService (独立)
    ├── StorageService → DataService
    ├── GameStateAdapter → gameStore
    ├── ManualCraftingValidator → DataService, RecipeService
    ├── DataService → UserProgressService, RecipeService, TechnologyService
    ├── RecipeService → DataService, ManualCraftingValidator
    ├── TechnologyService → DataService, UserProgressService, GameStateAdapter
    ├── FuelService → DataService
    └── PowerService → DataService
```

## 服务注册名称

在 `ServiceLocator` 中注册的服务名称常量：

```typescript
export const SERVICE_NAMES = {
  DATA: 'DataService',
  RECIPE: 'RecipeService',
  TECHNOLOGY: 'TechnologyService',
  USER_PROGRESS: 'UserProgressService',
  FUEL: 'FuelService',
  POWER: 'PowerService',
  STORAGE: 'StorageService',
  GAME_STATE: 'GameStateProvider',
  MANUAL_CRAFTING_VALIDATOR: 'ManualCraftingValidator',
} as const;
```

## 服务使用示例

```typescript
// 获取服务实例
const dataService = ServiceLocator.get<DataService>(SERVICE_NAMES.DATA);
const item = dataService.getItem('iron-plate');

// 检查服务是否存在
if (ServiceLocator.has(SERVICE_NAMES.RECIPE)) {
  const recipeService = ServiceLocator.get<RecipeService>(SERVICE_NAMES.RECIPE);
  const recipes = recipeService.getRecipesThatProduce('iron-plate');
}
```

## 设计原则

1. **单一职责**: 每个服务负责一个特定领域
2. **依赖注入**: 通过 ServiceLocator 获取依赖
3. **延迟加载**: 服务在需要时才获取依赖
4. **接口隔离**: 使用接口解耦具体实现
5. **单例模式**: 所有服务都是单例

## 最佳实践

1. **避免循环依赖**: 使用 ServiceLocator 而非直接导入
2. **错误处理**: 获取服务时检查是否存在
3. **类型安全**: 使用泛型确保类型正确
4. **初始化顺序**: 通过 ServiceInitializer 管理
5. **日志记录**: 使用统一的日志系统