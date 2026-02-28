# 服务层架构说明

## 概述

本项目采用**现代化依赖注入(DI)架构**，为Idle Factorio游戏提供统一、类型安全的服务管理解决方案。所有服务通过DI容器进行管理，确保了代码的可维护性、可测试性和扩展性。

## 🏗️ 架构特点

- **依赖注入**: 使用自研DI容器管理所有服务
- **类型安全**: 完整的TypeScript类型支持
- **React集成**: 专用Hook封装，优化React组件性能
- **模块化**: 按业务领域清晰分组
- **测试友好**: 易于模拟和单元测试

## 📁 目录结构

```
services/
├── core/                     # 核心基础服务
│   ├── DataService.ts            # 数据管理服务 - 游戏数据加载与访问
│   ├── GameConfig.ts             # 游戏配置服务 - 全局配置管理
│   ├── DIContainer.ts            # DI容器实现 - 依赖注入核心
│   ├── DIServiceInitializer.ts   # DI服务初始化器 - 服务注册与启动
│   ├── ServiceTokens.ts          # 服务令牌定义 - 类型安全的服务标识
│   └── index.ts                  # 核心服务导出
│
├── game/                     # 游戏逻辑服务
│   ├── GameLoopService.ts        # 游戏循环服务 - 统一的游戏主循环
│   ├── GameLoopTaskFactory.ts    # 游戏循环任务工厂 - 循环任务管理
│   ├── PowerService.ts           # 电力管理服务 - 电力生产与消耗
│   ├── UserProgressService.ts    # 用户进度服务 - 游戏进度追踪
│   └── index.ts
│
├── crafting/                 # 制作系统服务
│   ├── RecipeService.ts          # 配方管理服务 - 配方查询与分析
│   ├── FuelService.ts            # 燃料管理服务 - 燃料优先级与分配
│   ├── DependencyService.ts      # 制作依赖分析服务 - 材料需求计算
│   └── index.ts
│
├── storage/                  # 存储相关服务
│   ├── GameStorageService.ts     # 游戏存储服务 - 存档管理与数据持久化
│   ├── StorageService.ts         # 存储配置服务 - 存储容器配置管理
│   └── index.ts
│
├── technology/               # 科技系统服务
│   ├── TechnologyService.ts      # 科技主服务 - 科技系统协调
│   ├── TechTreeService.ts        # 科技树管理 - 科技依赖关系
│   ├── TechUnlockService.ts      # 解锁管理 - 科技解锁逻辑
│   ├── ResearchService.ts        # 研究进度管理 - 研究状态追踪
│   ├── ResearchQueueService.ts   # 研究队列 - 研究任务队列管理
│   ├── TechProgressTracker.ts    # 进度统计 - 科技进度统计
│   ├── TechDataLoader.ts         # 数据加载 - 科技数据处理
│   ├── events.ts                 # 事件系统 - 科技事件发布订阅
│   ├── types.ts                  # 内部类型定义
│   └── index.ts
│
├── interfaces/               # 服务接口定义
│   └── IManualCraftingValidator.ts  # 手动制作验证器接口
│
├── interfaces.ts             # 通用服务接口 (保留用于扩展)
└── index.ts                  # 统一服务导出
```

## 🔧 使用方式

### 1. 在组件中使用服务 (推荐)

```typescript
import { useDataService, useRecipeService } from '@/hooks/useDIServices';

function ProductionComponent() {
  const dataService = useDataService();
  const recipeService = useRecipeService();

  const item = dataService.getItemById('iron-plate');
  const recipes = recipeService.getRecipesThatProduce('iron-plate');

  return <div>{/* UI逻辑 */}</div>;
}
```

### 2. 在服务中声明依赖（推荐）

```typescript
import type { DataService } from '@/services/core/DataService';

export class MyService {
  constructor(private readonly dataService: DataService) {
    // ...
  }
}
```

### 3. 可用的Hook列表

```typescript
// 核心服务
useDataService()           // 数据管理服务
useGameConfig()           // 游戏配置服务

// 业务服务
useRecipeService()        // 配方管理服务
useDependencyService()    // 依赖分析服务
useTechnologyService()    // 科技管理服务
useUserProgressService()  // 用户进度服务
useFuelService()         // 燃料管理服务
usePowerService()        // 电力管理服务
useStorageService()      // 存储服务
useGameLoopService()     // 游戏循环服务

// 工具服务
useManualCraftingValidator()  // 手动制作验证器

// 通用Hook
useService<T>(token)      // 通用服务获取
useCommonServices()       // 常用服务组合
```

## 🎯 服务功能说明

### Core（核心服务）

- **DataService**: 管理游戏基础数据，提供物品、配方、科技等数据访问
- **GameConfig**: 管理游戏配置常量，如制作时间、燃料阈值等
- **DIContainer**: DI容器实现，负责服务的注册、解析和生命周期管理
- **DIServiceInitializer**: 服务初始化器，统一管理服务的注册和启动流程
- **ServiceTokens**: 定义类型安全的服务令牌，避免字符串硬编码

### Game（游戏逻辑）

- **GameLoopService**: 统一的游戏主循环，使用requestAnimationFrame优化性能
- **GameLoopTaskFactory**: 游戏循环任务工厂，管理各种游戏系统的更新任务
- **PowerService**: 电力系统管理，计算电力生产、消耗和平衡
- **UserProgressService**: 用户进度追踪，管理解锁状态和游戏进度

### Crafting（制作系统）

- **RecipeService**: 配方管理，提供配方查询、效率分析和依赖计算
- **FuelService**: 燃料管理，处理燃料优先级、分配和自动补充
- **DependencyService**: 制作依赖分析，计算复杂制作链的材料需求

### Storage（存储系统）

- **GameStorageService**: 游戏存档管理，处理数据序列化、压缩和持久化
- **StorageService**: 存储容器配置，管理各种存储设备的配置和容量

### Technology（科技系统）

- **TechnologyService**: 科技系统主服务，协调各个科技子系统
- **TechTreeService**: 科技树管理，处理科技间的依赖关系
- **TechUnlockService**: 解锁管理，处理科技解锁逻辑和触发条件
- **ResearchService**: 研究进度管理，追踪当前研究状态
- **ResearchQueueService**: 研究队列管理，处理研究任务的排队和调度
- **TechProgressTracker**: 科技进度统计，提供科技进度的统计信息

## 🚀 架构优势

### 相比传统模式的改进

| 特性 | 传统单例模式 | DI架构 |
|------|-------------|--------|
| **类型安全** | 运行时错误风险 | 编译时类型检查 |
| **测试友好** | 难以模拟依赖 | 易于依赖注入和模拟 |
| **循环依赖** | 容易产生问题 | 自动检测和处理 |
| **代码解耦** | 静态耦合 | 接口驱动的松耦合 |
| **维护成本** | 隐式依赖关系 | 显式依赖声明 |

### React生态集成

- **自定义Hook**: 封装服务访问，提供React友好的API
- **性能优化**: 服务实例由 DI 容器管理，Hook 只负责读取单例引用
- **类型推导**: 完整的TypeScript类型推导支持
- **开发体验**: 与React DevTools和其他开发工具良好集成

## 📈 最佳实践

### DO ✅

- 使用专用Hook获取服务实例
- 在服务构造函数中注入依赖
- 使用SERVICE_TOKENS常量而非字符串
- 为新服务编写对应的Hook

### DON'T ❌

- 不要在组件中直接调用getService
- 不要在Hook外部缓存服务实例
- 不要使用字符串作为服务标识
- 不要在服务中直接访问React状态
- 不要在服务内部再调用 `getService()` 隐式拉取依赖

## 🔄 扩展指南

### 添加新服务

1. **定义服务令牌**
```typescript
// ServiceTokens.ts
export const SERVICE_TOKENS = {
  // ...existing tokens
  MY_NEW_SERVICE: 'MyNewService',
};
```

2. **注册服务**
```typescript
// DIServiceInitializer.ts
container.register(SERVICE_TOKENS.MY_NEW_SERVICE, MyNewService);
```

3. **创建Hook**
```typescript
// useDIServices.ts
export const useMyNewService = (): MyNewService => {
  return getService<MyNewService>(SERVICE_TOKENS.MY_NEW_SERVICE);
};
```

4. **在组件中使用**
```typescript
const myService = useMyNewService();
```

## 🎉 总结

依赖注入架构为Idle Factorio提供了现代化、可维护的服务管理解决方案。通过统一的DI容器和类型安全的Hook系统，开发者可以轻松地访问和扩展各种游戏服务，同时保持代码的清洁和可测试性。

这一架构为项目的长期发展和团队协作奠定了坚实的技术基础。
