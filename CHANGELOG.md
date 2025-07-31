# 更新日志

所有重要的项目更改都将记录在此文件中。

本文件格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且该项目遵循[语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Added

- 生产系统 - 完整的物品制作和队列管理功能
- 配方系统 - 高级配方分析，包括效率计算和依赖链分析
- 库存管理 - 支持容量限制和物品堆叠
- 存储系统 - 通用存储系统，支持固体和液体存储（储液罐 25,000 单位容量）
- 设施系统 - 基础框架实现
- 数据加载 - 异步加载机制，支持国际化（中文、日文）
- 图标系统 - 基于精灵图的图标渲染
- UI 组件：
  - 底部导航栏（5个主要模块）
  - 分类标签页系统
  - 物品详情面板
  - 配方分析可视化
  - 制作队列实时进度显示
- 存档优化：
  - 第一阶段：数据结构优化，减少 50-60% 存档大小
  - 第二阶段：LZ-String 压缩，总体压缩率达 70-80%
- 文档：
  - 中文 README 文档
  - CLAUDE.md AI 编程助手指南
  - 系统设计和实现文档

### Changed

- 存储配置结构优化，减少重复数据
- 库存数据结构优化，减少约 89% 数据量
- 设施数据存储简化
- 数值精度从 15 位小数降至 2 位
- UI 设计采用移动端优先策略

### Fixed

- 修复双重初始化问题
- 修复 Map/Set 序列化问题
- 修复存档兼容性问题

### Security

- 实现防抖存储机制，防止频繁 localStorage 写入

## [0.0.0] - 2024-01-01

### Added

- 使用 Vite 创建初始项目结构
- React 19.1.0 + TypeScript + Vite 技术栈
- Material-UI v7.2.0 UI 框架
- Zustand 状态管理
- pnpm 包管理器配置
- ESLint 9 代码规范配置
- TypeScript 严格模式配置
- 基础服务层架构（DataService、RecipeService）

[Unreleased]: https://github.com/emeiziying/Idle-Factorio/compare/v0.0.0...HEAD
[0.0.0]: https://github.com/emeiziying/Idle-Factorio/releases/tag/v0.0.0
