# 异星工厂 v2 (Idle Factorio)

一个基于 React 的放置类工厂管理游戏，灵感来源于 Factorio。

## 📋 项目概述

**异星工厂 v2** 是一个现代化的网页游戏，实现了工厂生产管理的核心机制。玩家可以管理资源、配方、科技树，建立自动化生产链，体验工厂扩张的乐趣。

### 技术栈

- **前端框架**: React 19.1.0 + TypeScript
- **构建工具**: Vite 7.0.4
- **UI 组件库**: Material-UI v7.2.0
- **状态管理**: Zustand 5.0.6
- **包管理器**: pnpm 9.15.0
- **数据压缩**: LZ-String（用于存档压缩）
- **虚拟列表**: React Virtual（优化大量数据渲染）

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 9.15.0

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

启动开发服务器，支持热更新。默认运行在 `http://localhost:5173`

### 构建项目

```bash
pnpm build
```

编译 TypeScript 并构建生产版本。

### 预览构建

```bash
pnpm preview
```

预览生产构建版本。

### 代码检查

```bash
pnpm lint
```

运行 ESLint 进行代码质量检查。

## 🏗️ 项目架构

### 目录结构

```
/
├── src/
│   ├── components/        # React 组件
│   ├── hooks/            # 自定义 React Hooks
│   ├── services/         # 业务逻辑服务层
│   ├── store/            # Zustand 状态管理
│   ├── data/             # 游戏数据定义
│   ├── types/            # TypeScript 类型定义
│   ├── utils/            # 工具函数
│   └── theme/            # 主题配置
├── public/
│   └── data/             # 游戏静态数据文件
├── docs/                 # 项目文档
└── .github/              # GitHub 相关配置
```

### 核心模块

#### 服务层架构

- **DataService**: 单例模式，负责游戏数据加载和库存管理
- **RecipeService**: 静态类，处理配方分析、效率计算和依赖链
- **UserProgressService**: 管理物品解锁状态
- **StorageService**: 存储配置管理，包括容量和流体处理
- **TechnologyService**: 科技树管理和研究进度
- **GameStore**: 使用 Zustand 的响应式状态管理，支持 localStorage 持久化

#### 已实现功能

- ✅ **生产模块**: 物品展示、制作队列、库存管理
- ✅ **游戏数据加载**: 异步数据加载，支持国际化
- ✅ **配方系统**: 高级配方分析和优化
- ✅ **存储系统**: 多类型存储管理（普通、流体、气体）
- ✅ **科技树**: 研究进度和解锁机制
- ✅ **存档系统**: 自动保存和压缩存档

## 🎮 游戏特性

- **自动化生产**: 设置生产链，自动制造物品
- **配方优化**: 智能分析最优生产路径
- **科技研究**: 解锁新配方和生产能力
- **资源管理**: 合理分配存储空间和生产能力
- **离线进度**: 支持离线收益计算

## 🛠️ 开发指南

### 添加新功能

1. 在 `src/types/` 中定义相关 TypeScript 类型
2. 在 `src/services/` 中实现业务逻辑
3. 在 `src/store/` 中添加状态管理
4. 在 `src/components/` 中创建 UI 组件

### 代码规范

- 使用 TypeScript 进行类型安全编程
- 遵循 ESLint 配置的代码规范
- 组件使用函数式组件和 Hooks
- 服务层使用单例或静态类模式

### 性能优化

- 使用 React Virtual 处理大列表渲染
- 实施懒加载和代码分割
- 优化状态更新，避免不必要的重渲染
- 使用 Web Workers 处理复杂计算

## 📝 更新日志

查看 [CLAUDE.md](./CLAUDE.md) 了解详细的开发进度和更新历史。

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源。

## 🔗 相关链接

- [在线演示](https://emeiziying.github.io/Idle-Factorio/)
- [问题反馈](https://github.com/emeiziying/Idle-Factorio/issues)

---

<p align="center">使用 ❤️ 基于 React + TypeScript + Vite 构建</p>
