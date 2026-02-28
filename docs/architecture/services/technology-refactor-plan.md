# TechnologyService 拆分方案

## 现状分析

当前 TechnologyService.ts 有 1776 行代码，承担了过多职责：
- 科技树数据管理
- 研究进度管理
- 研究队列管理
- 解锁内容管理
- 统计信息收集
- 事件发送
- 数据加载和初始化

## 拆分方案

### 1. TechTreeService（~400行）
**职责**：管理科技树结构和基础数据
```typescript
// src/services/crafting/technology/TechTreeService.ts
export class TechTreeService {
  // 科技树数据存储
  private techTree: Map<string, Technology>;
  private techOrder: string[];
  private techCategories: TechCategory[];
  
  // 基础查询方法
  getTechnology(techId: string): Technology | undefined;
  getAllTechnologies(): Technology[];
  getTechnologiesByCategory(category: string): Technology[];
  searchTechnologies(filter: TechSearchFilter): Technology[];
  
  // 依赖关系查询
  getTechPrerequisites(techId: string): string[];
  getTechDependents(techId: string): string[];
  getTechDependencyChain(techId: string): string[];
  
  // 分类管理
  getTechCategories(): TechCategory[];
  getTechCategory(categoryId: string): TechCategory | undefined;
}
```

### 2. TechUnlockService（~300行）
**职责**：管理科技解锁状态和内容解锁
```typescript
// src/services/crafting/technology/TechUnlockService.ts
export class TechUnlockService {
  // 解锁状态存储
  private unlockedTechs: Set<string>;
  private unlockedItems: Set<string>;
  private unlockedRecipes: Set<string>;
  private unlockedBuildings: Set<string>;
  
  // 解锁检查
  isTechUnlocked(techId: string): boolean;
  isItemUnlocked(itemId: string): boolean;
  isRecipeUnlocked(recipeId: string): boolean;
  isBuildingUnlocked(buildingId: string): boolean;
  
  // 解锁操作
  unlockTechnology(techId: string): void;
  getUnlockedItems(): string[];
  getUnlockedRecipes(): string[];
  getUnlockedBuildings(): string[];
  
  // 解锁内容信息
  getUnlockedContentInfo(technology: Technology): UnlockedContent;
}
```

### 3. ResearchService（~500行）
**职责**：管理研究进度和研究过程
```typescript
// src/services/crafting/technology/ResearchService.ts
export class ResearchService {
  // 当前研究状态
  private currentResearch: TechResearchState | undefined;
  private inventoryOps: InventoryOperations;
  
  // 研究控制
  startResearch(techId: string): Promise<ResearchResult>;
  updateResearchProgress(deltaTime: number): void;
  completeResearch(techId: string): void;
  cancelResearch(): void;
  
  // 研究状态查询
  getCurrentResearch(): TechResearchState | undefined;
  canStartResearch(techId: string): boolean;
  
  // 资源检查
  checkSciencePackAvailability(techId: string): boolean;
  consumeSciencePacks(techId: string): boolean;
  
  // 研究室管理
  getLabCount(): number;
  getLabEfficiency(): number;
  calculateEffectiveResearchTime(tech: Technology): number;
}
```

### 4. ResearchQueueService（~300行）
**职责**：管理研究队列
```typescript
// src/services/crafting/technology/ResearchQueueService.ts
export class ResearchQueueService {
  // 队列存储
  private researchQueue: ResearchQueueItem[];
  private autoResearchEnabled: boolean;
  
  // 队列管理
  addToQueue(techId: string, priority?: ResearchPriority): QueueResult;
  removeFromQueue(techId: string): boolean;
  reorderQueue(techId: string, newPosition: number): boolean;
  clearQueue(): void;
  
  // 队列查询
  getResearchQueue(): ResearchQueueItem[];
  getQueuePosition(techId: string): number;
  
  // 自动研究
  setAutoResearch(enabled: boolean): void;
  getNextInQueue(): ResearchQueueItem | undefined;
  
  // 队列更新
  updateQueueDependencies(): void;
  recalculateQueueTimes(): void;
}
```

### 5. TechProgressTracker（~200行）
**职责**：跟踪研究统计和进度
```typescript
// src/services/crafting/technology/TechProgressTracker.ts
export class TechProgressTracker {
  // 统计数据
  private totalResearchTime: number;
  private totalSciencePacksConsumed: Record<string, number>;
  private researchedTechs: Set<string>;
  
  // 统计方法
  getTechStatistics(): TechStatistics;
  recordResearchComplete(tech: Technology): void;
  recordSciencePackConsumption(packs: Record<string, number>): void;
  
  // 进度计算
  calculateResearchProgress(): number;
  getAvailableTechCount(): number;
}
```

### 6. TechDataLoader（~150行）
**职责**：从 data.json 加载科技数据
```typescript
// src/services/crafting/technology/TechDataLoader.ts
export class TechDataLoader {
  // 数据加载
  async loadTechnologiesFromDataJson(): Promise<Technology[]>;
  async loadTechCategoriesFromDataJson(): Promise<TechCategory[]>;
  
  // 数据转换
  private parseTechRecipe(recipe: TechRecipe): Technology;
  private calculateResearchCost(recipe: TechRecipe): Record<string, number>;
  private calculateResearchTime(recipe: TechRecipe): number;
}
```

### 7. TechnologyService（重构后 ~200行）
**职责**：作为外部接口和协调器
```typescript
// src/services/crafting/TechnologyService.ts
export class TechnologyService {
  // 子服务
  private treeService: TechTreeService;
  private unlockService: TechUnlockService;
  private researchService: ResearchService;
  private queueService: ResearchQueueService;
  private progressTracker: TechProgressTracker;
  
  // 初始化
  async initialize(): Promise<void>;
  
  // 委托方法（保持向后兼容）
  getTechnology(techId: string): Technology | undefined {
    return this.treeService.getTechnology(techId);
  }
  
  startResearch(techId: string): Promise<ResearchResult> {
    return this.researchService.startResearch(techId);
  }
  
  // 事件管理
  on(event: string, callback: (data: unknown) => void): void;
  
  // 获取完整状态
  getTechTreeState(): TechTreeState;
}
```

## 共享类型定义

创建独立的类型文件：
```typescript
// src/services/crafting/technology/types.ts
export interface Technology { ... }
export interface TechResearchState { ... }
export interface ResearchQueueItem { ... }
export interface TechTreeState { ... }
// ... 其他共享类型
```

## 实施步骤

1. **创建目录结构**
   ```
   src/services/crafting/technology/
   ├── TechTreeService.ts
   ├── TechUnlockService.ts
   ├── ResearchService.ts
   ├── ResearchQueueService.ts
   ├── TechProgressTracker.ts
   ├── TechDataLoader.ts
   ├── types.ts
   └── index.ts
   ```

2. **逐步迁移功能**
   - 先创建类型定义文件
   - 按依赖顺序创建各个服务
   - 最后重构主 TechnologyService

3. **测试策略**
   - 为每个新服务创建单元测试
   - 保持原有集成测试通过
   - 逐步迁移测试用例

## 优势

1. **单一职责**：每个服务专注于一个领域
2. **更好的测试性**：可以独立测试每个服务
3. **更容易维护**：代码更清晰，更容易理解和修改
4. **更好的复用性**：各个服务可以独立使用
5. **更低的耦合度**：服务之间通过接口通信