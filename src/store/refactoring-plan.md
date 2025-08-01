# Store 重构计划

## 当前问题
当前的 `gameStore.ts` 文件过于庞大（1328行），包含了太多不同的功能模块，违反了单一职责原则。这导致：
- 代码难以维护和理解
- 状态更新可能产生意外的副作用
- 测试变得复杂
- 性能优化困难

## 建议的模块拆分方案

### 1. **inventoryStore** - 库存管理
负责管理游戏中的物品库存相关状态和操作。

**状态：**
- `inventory: Map<string, InventoryItem>` - 物品库存
- `deployedContainers: DeployedContainer[]` - 已部署的存储容器

**操作：**
- `updateInventory()` - 更新库存
- `batchUpdateInventory()` - 批量更新库存
- `getInventoryItem()` - 获取库存物品
- `recalculateItemCapacity()` - 重新计算物品容量
- `deployChestForStorage()` - 部署存储箱
- `removeDeployedContainer()` - 移除存储容器
- `getDeployedContainersForItem()` - 获取物品的存储容器

### 2. **craftingStore** - 制作系统
管理制作队列、制作任务和制作链。

**状态：**
- `craftingQueue: CraftingTask[]` - 制作队列
- `craftingChains: CraftingChain[]` - 制作链
- `maxQueueSize: number` - 最大队列大小

**操作：**
- `addCraftingTask()` - 添加制作任务
- `addCraftingChain()` - 添加制作链
- `removeCraftingTask()` - 移除制作任务
- `updateCraftingProgress()` - 更新制作进度
- `completeCraftingTask()` - 完成制作任务
- `craftChest()` - 制作箱子
- `canCraftChest()` - 检查是否可以制作箱子

### 3. **facilityStore** - 设施管理
管理游戏中的各种设施。

**状态：**
- `facilities: FacilityInstance[]` - 设施列表

**操作：**
- `addFacility()` - 添加设施
- `updateFacility()` - 更新设施
- `removeFacility()` - 移除设施
- `refuelFacility()` - 为设施加油
- `autoRefuelFacilities()` - 自动加油
- `updateFuelConsumption()` - 更新燃料消耗

### 4. **technologyStore** - 科技系统
管理科技研究、解锁和研究队列。

**状态：**
- `technologies: Map<string, Technology>` - 科技数据
- `researchState: TechResearchState | null` - 当前研究状态
- `researchQueue: ResearchQueueItem[]` - 研究队列
- `unlockedTechs: Set<string>` - 已解锁科技
- `autoResearch: boolean` - 自动研究开关
- `techCategories: TechCategory[]` - 科技分类

**操作：**
- `initializeTechnologyService()` - 初始化科技服务
- `startResearch()` - 开始研究
- `completeResearch()` - 完成研究
- `addToResearchQueue()` - 添加到研究队列
- `removeFromResearchQueue()` - 从研究队列移除
- `reorderResearchQueue()` - 重排研究队列
- `setAutoResearch()` - 设置自动研究
- `getTechnology()` - 获取科技
- `isTechUnlocked()` - 检查科技是否解锁
- `isTechAvailable()` - 检查科技是否可用
- `updateResearchProgress()` - 更新研究进度

### 5. **recipeStore** - 配方管理
管理配方收藏、最近使用和配方搜索。

**状态：**
- `favoriteRecipes: Set<string>` - 收藏的配方
- `recentRecipes: string[]` - 最近使用的配方
- `maxRecentRecipes: number` - 最大最近配方数

**操作：**
- `addFavoriteRecipe()` - 添加收藏配方
- `removeFavoriteRecipe()` - 移除收藏配方
- `isFavoriteRecipe()` - 检查是否收藏
- `addRecentRecipe()` - 添加最近配方
- `getRecentRecipes()` - 获取最近配方
- `getFavoriteRecipes()` - 获取收藏配方
- `getRecommendedRecipes()` - 获取推荐配方
- `getRecipeStats()` - 获取配方统计
- `searchRecipes()` - 搜索配方

### 6. **statisticsStore** - 游戏统计
管理游戏统计数据和触发器追踪。

**状态：**
- `totalItemsProduced: number` - 总生产物品数
- `craftedItemCounts: Map<string, number>` - 制造物品计数
- `builtEntityCounts: Map<string, number>` - 建造实体计数
- `minedEntityCounts: Map<string, number>` - 挖掘实体计数

**操作：**
- `trackCraftedItem()` - 追踪制造物品
- `trackBuiltEntity()` - 追踪建造实体
- `trackMinedEntity()` - 追踪挖掘实体
- `checkResearchTriggers()` - 检查研究触发器

### 7. **persistenceStore** - 存档管理
管理游戏存档和数据持久化。

**状态：**
- `lastSaveTime: number` - 上次保存时间
- `saveKey: string` - 存档触发键

**操作：**
- `saveGame()` - 保存游戏
- `forceSaveGame()` - 强制保存
- `loadGameData()` - 加载游戏数据
- `clearGameData()` - 清除游戏数据

### 8. **gameTimeStore** - 游戏时间（已存在）
保持现有的独立时间管理store。

## 实施步骤

### 第一阶段：创建新的store文件
1. 在 `src/store/modules/` 目录下创建各个模块的store文件
2. 每个store使用独立的zustand实例
3. 导出类型定义和hooks

### 第二阶段：迁移代码
1. 将状态和操作从gameStore迁移到对应的模块
2. 处理跨模块的依赖关系
3. 更新import路径

### 第三阶段：创建根store
创建一个轻量级的根store来协调各个模块之间的交互：

```typescript
// src/store/rootStore.ts
export const useRootStore = () => {
  const inventory = useInventoryStore();
  const crafting = useCraftingStore();
  const facility = useFacilityStore();
  const technology = useTechnologyStore();
  const recipe = useRecipeStore();
  const statistics = useStatisticsStore();
  const persistence = usePersistenceStore();
  const gameTime = useGameTimeStore();

  return {
    inventory,
    crafting,
    facility,
    technology,
    recipe,
    statistics,
    persistence,
    gameTime,
  };
};
```

### 第四阶段：更新组件
1. 更新所有使用gameStore的组件
2. 使用新的模块化store
3. 运行测试确保功能正常

## 优点
1. **单一职责**：每个store负责一个具体的功能领域
2. **更好的性能**：组件只订阅需要的状态变化
3. **易于测试**：可以独立测试每个模块
4. **可维护性**：代码更容易理解和修改
5. **类型安全**：每个模块有明确的类型定义

## 注意事项
1. **跨模块通信**：某些操作可能需要更新多个store，需要设计合适的通信机制
2. **事务性操作**：确保跨store的操作保持一致性
3. **向后兼容**：可以提供一个兼容层来支持旧代码的迁移
4. **存档格式**：需要更新存档/加载逻辑以支持新的store结构

## 示例代码结构
```
src/store/
├── modules/
│   ├── inventoryStore.ts
│   ├── craftingStore.ts
│   ├── facilityStore.ts
│   ├── technologyStore.ts
│   ├── recipeStore.ts
│   ├── statisticsStore.ts
│   └── persistenceStore.ts
├── rootStore.ts
├── gameTimeStore.ts (已存在)
└── index.ts (导出所有store)
```