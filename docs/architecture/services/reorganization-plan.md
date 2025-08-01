# 服务层重新组织方案

## 当前结构的问题

目前 `TechnologyService` 被放在了 `crafting` 目录下，这是不合适的，因为：
- 科技系统是独立的核心游戏系统
- 科技系统影响多个其他系统（解锁物品、配方、建筑等）
- 将其归类为"制作"系统的一部分会造成概念混淆

## 建议的新结构

```
services/
├── core/                    # 核心基础服务
│   ├── DataService.ts
│   ├── GameConfig.ts
│   ├── DIServiceInitializer.ts
│   ├── DIContainer.ts
│   ├── ServiceTokens.ts
│   └── index.ts
│
├── game/                    # 游戏逻辑服务
│   ├── GameLoopService.ts
│   ├── GameLoopTaskFactory.ts
│   ├── PowerService.ts
│   ├── UserProgressService.ts
│   └── index.ts
│
├── storage/                 # 存储相关服务
│   ├── GameStateAdapter.ts
│   ├── GameStorageService.ts
│   ├── StorageService.ts
│   └── index.ts
│
├── crafting/                # 制作系统服务
│   ├── RecipeService.ts          # 配方管理
│   ├── FuelService.ts            # 燃料管理
│   ├── DependencyService.ts      # 制作依赖分析
│   └── index.ts
│
├── technology/              # 科技系统服务 (新独立目录)
│   ├── TechnologyService.ts      # 主服务（或拆分后的多个服务）
│   ├── TechTreeService.ts        # 科技树管理
│   ├── ResearchService.ts        # 研究进度管理
│   ├── TechUnlockService.ts      # 解锁管理
│   ├── ResearchQueueService.ts   # 研究队列
│   ├── TechProgressTracker.ts    # 进度统计
│   ├── TechDataLoader.ts         # 数据加载
│   ├── types.ts                  # 内部类型定义
│   └── index.ts
│
├── interfaces/              # 服务接口定义
│   └── IManualCraftingValidator.ts
│
├── interfaces.ts
└── index.ts
```

## 实施步骤

### 1. 创建 technology 目录（与 crafting 同级）
```bash
mkdir src/services/technology
```

### 2. 移动科技相关文件
```bash
# 移动主服务
mv src/services/crafting/TechnologyService.ts src/services/technology/

# 移动已创建的拆分文件
mv src/services/crafting/technology/* src/services/technology/

# 移动相关文档
mv src/services/crafting/technology-refactor-plan.md src/services/technology/
```

### 3. 更新导入路径
- 更新所有引用 `crafting/TechnologyService` 的地方
- 更新服务的 index.ts 文件

### 4. 更新主 index.ts
```typescript
// src/services/index.ts
export * from './core';
export * from './game';
export * from './storage';
export * from './crafting';
export * from './technology';  // 新增
export * from './interfaces';
```

## 其他可能的组织方案

### 方案 A：按游戏系统分组
```
services/
├── core/           # 基础设施
├── progression/    # 进度系统（包含科技、成就等）
│   ├── technology/
│   └── achievements/
├── production/     # 生产系统（包含制作、电力等）
│   ├── crafting/
│   └── power/
└── persistence/    # 持久化（存储）
```

### 方案 B：按功能层次分组
```
services/
├── infrastructure/ # 基础设施层
├── domain/        # 领域服务层
│   ├── technology/
│   ├── crafting/
│   ├── power/
│   └── inventory/
└── application/   # 应用服务层
```

## 推荐方案

推荐使用第一种方案（将 technology 作为独立的顶级目录），因为：

1. **清晰的领域边界** - 每个目录代表一个独立的游戏系统
2. **易于理解** - 开发者可以快速找到相关代码
3. **最小改动** - 只需要移动科技相关的文件
4. **便于扩展** - 未来可以轻松添加新的游戏系统

这样的组织结构更准确地反映了游戏的领域模型，使代码库更容易维护和扩展。