# 📚 Idle Factorio 文档索引

## 🚀 快速开始

### 新开发者入门路径
1. **项目概览** → [README.md](../README.md) - 了解项目基本信息和快速开始
2. **游戏设计** → [异星工厂v3设计文档.md](design/异星工厂v3设计文档.md) - 理解游戏理念和核心机制
3. **开发指南** → [第一阶段开发指南.md](implementation/第一阶段开发指南.md) - 获取详细的开发任务和实现步骤
4. **代码规范** → [CLAUDE.md](../CLAUDE.md) - Claude AI 助手使用指南和项目架构

### 系统开发者专用
- **存储系统** → [storage-system.md](implementation/systems/storage-system.md)
- **电力系统** → [电力系统设计文档.md](implementation/systems/电力系统设计文档.md)
- **科技系统** → [科技页面设计文档.md](implementation/systems/科技页面设计文档.md)

## 📋 按功能分类

### 🎨 用户界面设计
| 文档 | 描述 | 状态 |
|------|------|------|
| [UI设计说明文档.md](design/UI设计说明文档.md) | 完整的用户界面设计规范 | ✅ 完成 |
| [科技页面设计文档.md](implementation/systems/科技页面设计文档.md) | 科技树UI/UX设计 | ✅ 完成 |

### ⚙️ 核心系统
| 系统 | 文档链接 | 开发状态 | 优先级 |
|------|----------|----------|---------|
| 存储系统 | [storage-system.md](implementation/systems/storage-system.md) | ✅ 完成 | 高 |
| 电力系统 | [电力系统设计文档.md](implementation/systems/电力系统设计文档.md) | ✅ 完成 | 高 |
| 设备管理 | [设备管理系统文档.md](implementation/systems/设备管理系统文档.md) | ✅ 完成 | 高 |
| 科技解锁 | [物品解锁系统文档.md](implementation/systems/物品解锁系统文档.md) | ✅ 完成 | 中 |
| 物流网络 | [物流系统功能设计.md](implementation/systems/物流系统功能设计.md) | 🚧 开发中 | 中 |

### 🔧 技术实现
| 功能 | 文档链接 | 技术栈 | 难度 |
|------|----------|---------|------|
| 存档优化 | [save-optimization.md](implementation/save-optimization.md) | LZ-String, TypeScript | 中等 |
| 配方服务 | [RecipeService应用总结.md](implementation/RecipeService应用总结.md) | 算法优化 | 高 |
| 燃料系统 | [fuel-system-design.md](design/fuel-system-design.md) | 游戏逻辑 | 中等 |

### 📊 数据设计
| 内容 | 文档链接 | 用途 |
|------|----------|------|
| 物品分类 | [物品分类系统设计.md](design/物品分类系统设计.md) | 游戏数据组织 |
| 燃料分析 | [fuel-buffer-capacity-analysis.md](design/fuel-buffer-capacity-analysis.md) | 性能优化 |
| 燃料场景 | [fuel-distribution-scenarios.md](design/fuel-distribution-scenarios.md) | 游戏平衡 |

## 🎯 按开发阶段分类

### Phase 1: 基础系统 ✅
- [第一阶段开发指南.md](implementation/第一阶段开发指南.md) - **主要参考**
- [电力系统设计文档.md](implementation/systems/电力系统设计文档.md)
- [设备管理系统文档.md](implementation/systems/设备管理系统文档.md)
- [物品解锁系统文档.md](implementation/systems/物品解锁系统文档.md)

### Phase 2: 高级功能 🚧
- [第二阶段实现指南.md](implementation/第二阶段实现指南.md)
- [物流系统功能设计.md](implementation/systems/物流系统功能设计.md)

### Phase 3: 优化增强 📋
- [save-optimization.md](implementation/save-optimization.md)
- 性能优化文档（待补充）
- 移动端适配文档（待补充）

## 🔍 快速查找

### 寻找特定功能实现？
```
🔋 电力相关 → 电力系统设计文档.md
📦 存储相关 → storage-system.md  
🔬 科技相关 → 科技页面设计文档.md + 物品解锁系统文档.md
🏭 设施相关 → 设备管理系统文档.md
🛠️ 制作相关 → RecipeService应用总结.md
```

### 寻找开发任务？
```
✨ 新功能开发 → 第一阶段开发指南.md
🐛 问题修复   → 对应系统的设计文档
🚀 性能优化   → save-optimization.md
📱 UI改进     → UI设计说明文档.md
```

## 📈 文档状态总览

| 状态 | 数量 | 文档类型 |
|------|------|----------|
| ✅ 完成 | 9个 | 核心系统设计、实现指南 |
| 🚧 进行中 | 2个 | 物流系统、第二阶段功能 |
| 📋 计划中 | 3个 | 性能优化、移动端适配、高级功能 |

## 🤝 文档贡献

### 添加新文档
1. 选择合适的目录（`design/` 或 `implementation/`）
2. 使用标准的 Markdown 格式
3. 更新本索引文件
4. 更新 [docs/README.md](README.md)

### 更新现有文档
- 优先更新主要文档，标记过时版本
- 保持文档与代码实现同步
- 添加更新日志和时间戳

---

## 🔗 相关资源

- **项目仓库**: [GitHub - emeiziying/Idle-Factorio](https://github.com/emeiziying/Idle-Factorio)
- **在线演示**: [https://emeiziying.github.io/Idle-Factorio/](https://emeiziying.github.io/Idle-Factorio/)
- **问题反馈**: [Issues](https://github.com/emeiziying/Idle-Factorio/issues)
- **开发路线**: [ROADMAP.md](../ROADMAP.md)

---
*最后更新: 2024年 | 文档整理: ✅ 完成*