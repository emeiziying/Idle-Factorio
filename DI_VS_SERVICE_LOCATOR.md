# DI vs Service Locator: 为什么还在混用？

## 理论上的最佳实践

在有了 DI 容器后，理想情况下应该：
- **构造函数注入**: 所有依赖通过构造函数传入
- **避免 Service Locator**: 不应该在运行时主动获取依赖
- **明确的依赖关系**: 从构造函数就能看出所有依赖

## 当前项目中继续使用 Service Locator 的原因

### 1. React 生态系统的限制

**问题**: React 组件和 Hooks 无法使用构造函数注入
```typescript
// ❌ 不能这样做
function MyComponent(dataService: DataService) { 
  // React 不支持
}

// ✅ 只能这样做
function MyComponent() {
  const dataService = useDataService(); // 内部使用 getService
}
```

**原因**: 
- React 组件由框架实例化，不是我们控制
- Hooks 必须在函数组件内部调用
- 无法在组件外部注入依赖

### 2. Zustand Store 的限制

**问题**: Zustand store 是单例对象，不是类实例
```typescript
// Zustand store 的结构
const useGameStore = create((set, get) => ({
  // 状态
  inventory: [],
  
  // ❌ 不能通过构造函数注入
  addItem: (item) => {
    // 只能在这里获取服务
    const recipeService = getService(SERVICE_TOKENS.RECIPE_SERVICE);
  }
}));
```

**原因**:
- Store 在模块加载时创建
- 没有构造函数可以注入依赖
- Actions 需要在运行时获取服务

### 3. 循环依赖问题

**问题**: 某些服务之间存在循环依赖
```typescript
// DataService 需要 RecipeService
class DataService {
  constructor(private recipeService: RecipeService) {} // ❌ 循环依赖
}

// RecipeService 需要 DataService
class RecipeService {
  constructor(private dataService: DataService) {} // ❌ 循环依赖
}
```

**当前解决方案**: 延迟获取
```typescript
class DataService {
  getRecipes() {
    // 延迟获取，避免循环依赖
    const recipeService = getService(SERVICE_TOKENS.RECIPE_SERVICE);
  }
}
```

### 4. 动态依赖

**问题**: 某些依赖只在特定条件下需要
```typescript
class CraftingEngine {
  updateCraftingQueue() {
    if (hasCustomRecipes) {
      // 只在有自定义配方时才需要
      const recipeService = getService(SERVICE_TOKENS.RECIPE_SERVICE);
    }
  }
}
```

## 改进方案

### 方案 1: 使用 React Context 代替 Service Locator

```typescript
// 创建服务上下文
const ServicesContext = React.createContext<{
  dataService: DataService;
  recipeService: RecipeService;
}>(null);

// 在应用根部提供服务
function App() {
  const services = useMemo(() => ({
    dataService: container.resolve(SERVICE_TOKENS.DATA_SERVICE),
    recipeService: container.resolve(SERVICE_TOKENS.RECIPE_SERVICE),
  }), []);
  
  return (
    <ServicesContext.Provider value={services}>
      <YourApp />
    </ServicesContext.Provider>
  );
}

// 在组件中使用
function MyComponent() {
  const { dataService } = useContext(ServicesContext);
  // 使用 dataService
}
```

**优点**:
- 更符合 React 模式
- 依赖关系更清晰
- 便于测试（可以提供 mock 服务）

**缺点**:
- 需要大量重构
- 可能导致 Context Hell
- 性能考虑（Context 变化会触发重渲染）

### 方案 2: 为 Store 创建工厂函数

```typescript
// Store 工厂
function createGameStore(deps: {
  dataService: DataService;
  recipeService: RecipeService;
}) {
  return create((set, get) => ({
    inventory: [],
    
    addItem: (item) => {
      // 使用注入的依赖
      deps.recipeService.validateRecipe(item);
    }
  }));
}

// 在初始化时创建
const useGameStore = createGameStore({
  dataService: container.resolve(SERVICE_TOKENS.DATA_SERVICE),
  recipeService: container.resolve(SERVICE_TOKENS.RECIPE_SERVICE),
});
```

**优点**:
- Store 的依赖明确
- 便于测试
- 避免运行时查找

**缺点**:
- 需要重构所有 Store
- 初始化顺序变复杂

### 方案 3: 解决循环依赖

```typescript
// 1. 提取接口
interface IDataProvider {
  getItem(id: string): Item;
  getRecipe(id: string): Recipe;
}

interface IRecipeValidator {
  validateRecipe(recipe: Recipe): boolean;
}

// 2. 服务只依赖接口
class DataService implements IDataProvider {
  // 不依赖 RecipeService
}

class RecipeService implements IRecipeValidator {
  constructor(private dataProvider: IDataProvider) {} // 依赖接口
}

// 3. 创建聚合服务
class GameDataService {
  constructor(
    private dataService: DataService,
    private recipeService: RecipeService
  ) {}
  
  // 提供统一的 API
  getRecipeWithValidation(id: string) {
    const recipe = this.dataService.getRecipe(id);
    this.recipeService.validateRecipe(recipe);
    return recipe;
  }
}
```

### 方案 4: 保持现状但改进使用方式

```typescript
// 1. 限制 Service Locator 的使用范围
// 只在以下地方允许使用：
// - React Hooks（封装后）
// - Store Actions
// - 工厂函数

// 2. 创建类型安全的 Service Locator
class TypedServiceLocator {
  getDataService(): DataService {
    return getService(SERVICE_TOKENS.DATA_SERVICE);
  }
  
  getRecipeService(): RecipeService {
    return getService(SERVICE_TOKENS.RECIPE_SERVICE);
  }
}

// 3. 集中管理服务获取
export const services = new TypedServiceLocator();

// 使用
const dataService = services.getDataService();
```

## 推荐的渐进式改进路径

### 第一阶段：解决循环依赖（高优先级）
1. 提取接口，打破循环依赖
2. 重新组织服务职责
3. 在服务层完全使用构造函数注入

### 第二阶段：改进 Store（中优先级）
1. 创建 Store 工厂函数
2. 在创建时注入依赖
3. 消除 Store 中的 Service Locator

### 第三阶段：优化 React 集成（低优先级）
1. 评估是否需要 Context
2. 保持现有的 Hook 封装
3. 确保类型安全

## 结论

混用 DI 和 Service Locator 的主要原因是：
1. **技术限制**: React 和 Zustand 的架构限制
2. **历史原因**: 渐进式迁移导致的混合状态
3. **实用主义**: 某些场景下 Service Locator 更简单

**建议**:
- 在服务层严格使用 DI
- 在 UI 层（React/Store）接受 Service Locator
- 通过良好的封装隐藏实现细节
- 重点解决循环依赖问题