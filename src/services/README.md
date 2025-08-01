# 服务层架构说明

## 目录结构

服务层已经重新组织为以下四个主要模块：

```
services/
├── core/               # 核心基础服务
│   ├── DataService.ts       # 数据管理服务
│   ├── GameConfig.ts        # 游戏配置服务
│   ├── DIServiceInitializer.ts # DI服务初始化器
│   ├── DIContainer.ts       # 依赖注入容器
│   ├── ServiceTokens.ts     # 服务令牌定义
│   └── index.ts
│
├── game/               # 游戏逻辑服务
│   ├── GameLoopService.ts      # 游戏循环服务
│   ├── GameLoopTaskFactory.ts  # 游戏循环任务工厂
│   ├── PowerService.ts         # 电力管理服务
│   ├── UserProgressService.ts  # 用户进度服务
│   └── index.ts
│
├── storage/            # 存储相关服务
│   ├── GameStateAdapter.ts    # 游戏状态适配器
│   ├── GameStorageService.ts  # 游戏存储服务
│   ├── StorageService.ts      # 存储配置服务
│   └── index.ts
│
├── crafting/           # 制作相关服务
│   ├── DependencyService.ts   # 依赖分析服务
│   ├── FuelService.ts         # 燃料管理服务
│   ├── RecipeService.ts       # 配方管理服务
│   └── index.ts
│
├── technology/         # 科技系统服务
│   ├── TechnologyService.ts   # 科技主服务（1776行，需要拆分）
│   ├── TechDataLoader.ts      # 科技数据加载
│   ├── TechTreeService.ts     # 科技树管理
│   └── index.ts
│
├── interfaces/         # 服务接口定义
│   └── IManualCraftingValidator.ts
│
├── interfaces.ts       # 服务接口
└── index.ts           # 统一导出
```

## 模块说明

### Core（核心服务）
- **DIContainer**: 依赖注入容器，支持自动依赖解析和生命周期管理
- **DIServiceInitializer**: DI服务初始化器，管理服务注册和启动
- **ServiceTokens**: 服务令牌定义，统一管理服务标识符
- **DataService**: 游戏数据管理，加载和缓存游戏资源
- **GameConfig**: 游戏配置管理

### Game（游戏逻辑）
- **GameLoopService**: 游戏主循环管理
- **GameLoopTaskFactory**: 游戏循环任务创建
- **PowerService**: 电力系统管理
- **UserProgressService**: 用户进度和解锁状态管理

### Storage（存储）
- **StorageService**: 存储配置管理
- **GameStorageService**: 游戏状态持久化
- **GameStateAdapter**: 游戏状态适配器，连接 store 和服务

### Crafting（制作系统）
- **RecipeService**: 配方查询和管理
- **FuelService**: 燃料系统管理
- **DependencyService**: 制作依赖分析

### Technology（科技系统）
- **TechnologyService**: 科技研究主服务（1776行，需要拆分）
- **TechDataLoader**: 科技数据加载
- **TechTreeService**: 科技树结构管理

## 使用方式

### 1. 直接导入具体服务
```typescript
import { DataService } from '@/services/core/DataService';
import { RecipeService } from '@/services/crafting/RecipeService';
```

### 2. 从模块索引导入
```typescript
import { DataService, DIServiceInitializer } from '@/services/core';
import { RecipeService, FuelService } from '@/services/crafting';
```

### 3. 从主索引导入（推荐）
```typescript
import { 
  DataService, 
  RecipeService, 
  getService,
  SERVICE_TOKENS 
} from '@/services';
```

### 4. 在 React 组件中使用 Hooks
```typescript
import { useDataService, useRecipeService } from '@/hooks/useDIServices';

const MyComponent = () => {
  const dataService = useDataService();
  const recipeService = useRecipeService();
  // ...
};
```

## 待优化事项

1. **TechnologyService 拆分**（1776行）
   - 拆分为：TechTreeService、ResearchService、TechUnlockService
   - 分离数据管理和业务逻辑

2. **接口定义统一**
   - 将 interfaces 目录下的接口整合到 interfaces.ts
   - 或者为每个模块创建独立的接口文件

3. **测试文件组织**
   - 考虑将测试文件移动到对应的模块目录下
   - 或创建镜像的测试目录结构

4. **依赖关系优化**
   - 减少跨模块依赖
   - 使用依赖注入模式