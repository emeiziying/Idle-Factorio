# DI 改进示例：如何减少 Service Locator 的使用

## 示例 1：改进 Zustand Store

### 当前实现（使用 Service Locator）
```typescript
// store/slices/recipeStore.ts
export const recipeStoreSlice: StateCreator<...> = (set, get) => ({
  filteredRecipes: [],
  
  updateFilteredRecipes: (filters) => {
    // ❌ 在 action 中使用 Service Locator
    const recipeService = getService<RecipeService>(SERVICE_TOKENS.RECIPE_SERVICE);
    const recipes = recipeService.filterRecipes(filters);
    set({ filteredRecipes: recipes });
  }
});
```

### 改进方案 1：Store 工厂模式
```typescript
// store/slices/recipeStore.ts
export function createRecipeStoreSlice(recipeService: RecipeService): StateCreator<...> {
  return (set, get) => ({
    filteredRecipes: [],
    
    updateFilteredRecipes: (filters) => {
      // ✅ 使用注入的服务
      const recipes = recipeService.filterRecipes(filters);
      set({ filteredRecipes: recipes });
    }
  });
}

// store/gameStore.ts
export const createGameStore = (services: {
  recipeService: RecipeService;
  dataService: DataService;
  // ... 其他服务
}) => {
  return create<GameState>()((...args) => ({
    ...createRecipeStoreSlice(services.recipeService)(...args),
    ...createInventoryStoreSlice(services.dataService)(...args),
    // ... 其他 slices
  }));
};

// 在应用初始化时
const services = {
  recipeService: container.resolve<RecipeService>(SERVICE_TOKENS.RECIPE_SERVICE),
  dataService: container.resolve<DataService>(SERVICE_TOKENS.DATA_SERVICE),
};

export const useGameStore = createGameStore(services);
```

### 改进方案 2：命令模式
```typescript
// commands/RecipeCommands.ts
export class RecipeCommands {
  constructor(
    private recipeService: RecipeService,
    private store: StoreApi<GameState>
  ) {}
  
  updateFilteredRecipes(filters: FilterOptions) {
    const recipes = this.recipeService.filterRecipes(filters);
    this.store.setState({ filteredRecipes: recipes });
  }
}

// store/slices/recipeStore.ts
export const recipeStoreSlice: StateCreator<...> = (set, get) => ({
  filteredRecipes: [],
  // 只保留状态，不包含业务逻辑
});

// 在组件中使用
function RecipeList() {
  const recipeCommands = useRecipeCommands(); // Hook 内部获取命令对象
  
  const handleFilter = (filters) => {
    recipeCommands.updateFilteredRecipes(filters);
  };
}
```

## 示例 2：改进服务间的循环依赖

### 当前问题
```typescript
// DataService 依赖 RecipeService
class DataService {
  getAvailableRecipes() {
    // ❌ 使用 Service Locator 避免循环依赖
    const recipeService = getService<RecipeService>(SERVICE_TOKENS.RECIPE_SERVICE);
    return recipeService.getCustomRecipes();
  }
}
```

### 解决方案：事件驱动 + 查询分离
```typescript
// 1. 定义事件
interface RecipeEvents {
  'recipe:custom-added': { recipeId: string };
  'recipe:custom-removed': { recipeId: string };
}

// 2. 创建专门的查询服务
export class RecipeQueryService {
  private customRecipes = new Map<string, Recipe>();
  
  constructor(private eventBus: EventBus<RecipeEvents>) {
    // 监听事件更新缓存
    eventBus.on('recipe:custom-added', ({ recipeId }) => {
      this.loadCustomRecipe(recipeId);
    });
  }
  
  getCustomRecipes(): Recipe[] {
    return Array.from(this.customRecipes.values());
  }
}

// 3. DataService 依赖查询服务而非 RecipeService
export class DataService {
  constructor(
    private recipeQuery: RecipeQueryService // ✅ 无循环依赖
  ) {}
  
  getAvailableRecipes() {
    const baseRecipes = this.getBaseRecipes();
    const customRecipes = this.recipeQuery.getCustomRecipes();
    return [...baseRecipes, ...customRecipes];
  }
}

// 4. RecipeService 发布事件
export class RecipeService {
  constructor(
    private dataService: DataService,
    private eventBus: EventBus<RecipeEvents>
  ) {}
  
  addCustomRecipe(recipe: Recipe) {
    // 保存配方
    this.saveRecipe(recipe);
    // 发布事件
    this.eventBus.emit('recipe:custom-added', { recipeId: recipe.id });
  }
}
```

## 示例 3：改进 React 组件的服务使用

### 当前实现
```typescript
// hooks/useCrafting.ts
export const useCrafting = () => {
  const analyzeDependencies = useCallback((itemId: string) => {
    // ❌ 在回调中使用 Service Locator
    const dependencyService = getService<DependencyService>(SERVICE_TOKENS.DEPENDENCY_SERVICE);
    return dependencyService.analyzeDependencies(itemId);
  }, []);
};
```

### 改进方案：服务实例稳定化
```typescript
// hooks/useCrafting.ts
export const useCrafting = () => {
  // ✅ 在 Hook 顶层获取服务（只执行一次）
  const dependencyService = useDependencyService();
  
  const analyzeDependencies = useCallback((itemId: string) => {
    // 直接使用已获取的服务
    return dependencyService.analyzeDependencies(itemId);
  }, [dependencyService]); // 服务实例是稳定的
};

// 或者使用 Facade 模式
export class CraftingFacade {
  constructor(
    private dependencyService: DependencyService,
    private recipeService: RecipeService
  ) {}
  
  analyzeCrafting(itemId: string, quantity: number) {
    const dependencies = this.dependencyService.analyzeDependencies(itemId);
    const recipes = this.recipeService.getRequiredRecipes(dependencies);
    return { dependencies, recipes };
  }
}

// Hook 简化为
export const useCrafting = () => {
  const craftingFacade = useCraftingFacade(); // 一次性获取 Facade
  
  return {
    analyzeCrafting: craftingFacade.analyzeCrafting.bind(craftingFacade)
  };
};
```

## 示例 4：测试友好的服务架构

```typescript
// 定义服务接口
interface IRecipeService {
  filterRecipes(filters: FilterOptions): Recipe[];
  getCustomRecipes(): Recipe[];
}

interface IDataService {
  getItem(id: string): Item | null;
  getRecipe(id: string): Recipe | null;
}

// 创建可测试的 Store
export function createTestableGameStore(deps: {
  recipeService: IRecipeService;
  dataService: IDataService;
}) {
  return create<GameState>()((set, get) => ({
    // 状态
    recipes: [],
    
    // Actions 使用注入的依赖
    loadRecipes: async () => {
      const recipes = await deps.recipeService.getCustomRecipes();
      set({ recipes });
    }
  }));
}

// 测试
describe('GameStore', () => {
  it('should load recipes', async () => {
    const mockRecipeService: IRecipeService = {
      filterRecipes: jest.fn(),
      getCustomRecipes: jest.fn().mockResolvedValue([mockRecipe])
    };
    
    const store = createTestableGameStore({
      recipeService: mockRecipeService,
      dataService: mockDataService
    });
    
    await store.getState().loadRecipes();
    
    expect(store.getState().recipes).toEqual([mockRecipe]);
  });
});
```

## 总结

1. **Store 工厂模式**：在创建时注入依赖，避免运行时查找
2. **命令模式**：将业务逻辑从 Store 中分离
3. **事件驱动**：解决循环依赖
4. **Facade 模式**：简化复杂的服务交互
5. **接口隔离**：便于测试和解耦

这些改进可以逐步实施，不需要一次性重构整个项目。