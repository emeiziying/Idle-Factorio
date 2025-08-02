# 循环依赖分析

## 主要循环依赖关系

### 1. DataService ↔ RecipeService
```
DataService
  └─> RecipeService (5处调用)
      └─> DataService (2处调用)
```
**问题:** 相互依赖，DataService 需要 RecipeService 来处理配方相关逻辑，RecipeService 需要 DataService 获取基础数据。

### 2. DataService ↔ TechnologyService
```
DataService
  └─> TechnologyService (1处调用)
      └─> TechDataLoader
          └─> DataService (构造函数)
```
**问题:** DataService 需要检查科技解锁状态，而科技服务需要加载游戏数据。

### 3. RecipeService ↔ ManualCraftingValidator
```
RecipeService
  └─> ManualCraftingValidator (4处调用)
      └─> RecipeService (1处调用)
```
**问题:** RecipeService 使用验证器，验证器又需要获取配方信息。

### 4. CraftingEngine → 多个服务
```
CraftingEngine
  ├─> RecipeService (4处调用)
  └─> DataService (2处调用)
```
**说明:** CraftingEngine 是应用层服务，依赖多个业务层服务，这是合理的。

## 详细分析

### DataService 中的 Service Locator 使用
1. **getAvailableRecipes()** - 第275行
   - 获取 RecipeService 来处理自定义配方
   
2. **isRecipeUnlocked()** - 第338行
   - 获取 TechnologyService 检查科技解锁
   
3. **isRecipeUnlocked()** - 第350行
   - 获取 RecipeService 检查自定义配方
   
4. **checkRecipeRequirements()** - 第561行
   - 获取 RecipeService 检查自定义配方需求
   
5. **getBuildingRecipes()** - 第615行
   - 获取 RecipeService 处理建筑配方

### RecipeService 中的 Service Locator 使用
1. **sortRecipesByCategory()** - 第154, 158行
   - 获取 ManualCraftingValidator 和 DataService
   
2. **sortRecipesForUI()** - 第195, 199行
   - 获取 ManualCraftingValidator 和 DataService

### 其他服务的使用
- **ManualCraftingValidator**: 延迟获取 DataService 和 RecipeService
- **DependencyService**: 获取 RecipeService
- **TechDataLoader**: 获取 DataService 和 RecipeService
- **StorageService**: 获取 DataService

## 解决方案

### 方案 1: 提取共享接口
创建更细粒度的接口，让服务只依赖需要的部分：

```typescript
// 基础数据接口
interface IDataProvider {
  getItem(id: string): Item | null;
  getRecipe(id: string): Recipe | null;
  getItems(): Item[];
}

// 配方查询接口
interface IRecipeQuery {
  isCustomRecipe(id: string): boolean;
  getCustomRecipe(id: string): Recipe | null;
}

// 科技查询接口
interface ITechQuery {
  isTechnologyUnlocked(id: string): boolean;
}
```

### 方案 2: 重构服务职责
1. **DataService**: 只负责加载和缓存原始数据
2. **RecipeQueryService**: 负责配方查询逻辑（包括自定义配方）
3. **UnlockService**: 统一处理所有解锁逻辑（科技、配方等）
4. **ValidationService**: 统一的验证服务

### 方案 3: 使用事件驱动
```typescript
// 配方解锁事件
eventBus.on('recipe:unlocked', (recipeId) => {
  // 更新缓存
});

// 科技解锁事件
eventBus.on('tech:unlocked', (techId) => {
  // 更新相关配方
});
```

### 方案 4: 依赖注入改进
使用工厂函数或 Provider 模式来延迟解析循环依赖：

```typescript
// 在 DIServiceInitializer 中
container.registerFactory(SERVICE_TOKENS.DATA_SERVICE, (c) => {
  const dataService = new DataService();
  // 设置延迟加载的依赖
  dataService.setRecipeProvider(() => c.resolve(SERVICE_TOKENS.RECIPE_SERVICE));
  return dataService;
});
```

## 推荐的重构步骤

1. **第一步**: 提取 `IDataProvider` 接口，让其他服务依赖接口而非具体实现
2. **第二步**: 将配方相关逻辑从 DataService 移到 RecipeService
3. **第三步**: 创建 UnlockService 统一处理解锁逻辑
4. **第四步**: 使用事件系统解耦服务间的状态同步
5. **第五步**: 重构测试，确保功能不受影响

## 优先级

1. **高优先级**: DataService ↔ RecipeService 的循环依赖
2. **中优先级**: RecipeService ↔ ManualCraftingValidator 的循环依赖
3. **低优先级**: Store 和 Hooks 中的 Service Locator 使用（这些是合理的）