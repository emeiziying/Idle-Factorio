# Service Locator 使用情况分析

## 概览
本文档记录了项目中所有使用 Service Locator 模式（通过 `getService` 直接获取服务）的地方。

## 使用场景分类

### 1. Hooks 中的使用 ✅ (合理)
这些是封装好的 React Hooks，为组件提供服务访问，这是推荐的模式。

**文件: `/src/hooks/useDIServices.ts`**
- 所有的 `useXxxService()` 函数都使用 `getService`
- 这是正确的做法，Hooks 封装了服务获取逻辑

**文件: `/src/hooks/useCrafting.ts`**
- 在回调函数中使用 `getService` 获取 `DependencyService`
- 这是合理的，因为需要在运行时获取服务

### 2. Store Slices 中的使用 ⚠️ (需要评估)
这些是 Zustand store 的 action 中使用的，因为 store 是单例的，所以使用 Service Locator 是可以接受的。

**文件列表:**
- `/src/store/slices/technologyStore.ts` - 12处使用
- `/src/store/slices/inventoryStore.ts` - 1处使用
- `/src/store/slices/facilityStore.ts` - 4处使用
- `/src/store/slices/gameLoopStore.ts` - 1处使用
- `/src/store/slices/craftingStore.ts` - 1处使用
- `/src/store/slices/recipeStore.ts` - 5处使用

**建议:** 这些使用是合理的，因为 Zustand store 本身就是单例模式，无法使用依赖注入。

### 3. 服务内部的循环依赖 ⚠️ (需要重构)
这些是服务内部为了避免循环依赖而延迟获取其他服务的情况。

**DataService (`/src/services/core/DataService.ts`):**
- 获取 `RecipeService` - 3处
- 获取 `TechnologyService` - 1处
- 获取 `UserProgressService` - 1处

**其他服务:**
- `RecipeService` - 获取 `ManualCraftingValidator` 和 `DataService`
- `CraftingEngine` - 获取 `RecipeService` 和 `DataService`
- `DependencyService` - 获取 `RecipeService`
- `TechDataLoader` - 获取 `DataService` 和 `RecipeService`
- `ManualCraftingValidator` - 获取 `DataService` 和 `RecipeService`
- `StorageService` - 获取 `DataService` 和自身

**建议:** 这些循环依赖需要通过以下方式解决：
1. 重新设计服务接口，减少相互依赖
2. 使用事件驱动架构解耦服务
3. 将共享逻辑提取到独立的服务中

### 4. 工厂类中的使用 ✅ (合理)
**GameLoopTaskFactory (`/src/services/game/GameLoopTaskFactory.ts`):**
- 获取 `CraftingEngine`
- 这是合理的，因为工厂需要在运行时创建任务

### 5. 配置文件中的使用 ✅ (合理)
**storageConfigs (`/src/data/storageConfigs.ts`):**
- 获取 `StorageService`
- 这是配置文件中的延迟初始化，是合理的

## 统计

- **总使用次数:** 约 52 处
- **合理使用:** Hooks、Store、工厂类、配置文件
- **需要重构:** 服务间的循环依赖（约 15 处）

## 建议的重构方向

### 1. 解决 DataService 的循环依赖
- 将配方相关逻辑移到 RecipeService
- 将科技相关逻辑移到 TechnologyService
- DataService 只负责基础数据加载

### 2. 使用接口隔离
- 定义更细粒度的服务接口
- 服务只依赖需要的接口，而不是整个服务

### 3. 引入事件系统
- 使用事件驱动来解耦服务间的直接调用
- 已有 TechEventEmitter，可以扩展到其他领域

### 4. 重新组织服务层次
```
核心层（无依赖）
  ├── GameConfig
  ├── StorageService
  └── EventEmitter

数据层（依赖核心层）
  ├── DataService（只负责加载）
  └── UserProgressService

业务层（依赖数据层）
  ├── RecipeService
  ├── TechnologyService
  ├── FuelService
  └── PowerService

应用层（依赖业务层）
  ├── CraftingEngine
  ├── GameLoopService
  └── DependencyService
```

## 结论

大部分 Service Locator 的使用是合理的，主要问题集中在服务间的循环依赖。建议通过重新设计服务架构来解决这些问题，而不是简单地消除 Service Locator 的使用。