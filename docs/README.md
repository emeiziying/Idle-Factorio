# 文档目录

## 文档结构

```
docs/
├── architecture/       # 架构设计文档
├── design/            # 设计文档
├── guides/            # 开发和使用指南
├── implementation/    # 实现相关文档
├── systems/           # 系统功能文档
└── technical/         # 技术规范文档
```

## 核心文档

### 🏗️ 架构文档
- **[系统架构总览](architecture/system-overview.md)** - 整体架构设计
- **[技术栈选型](architecture/tech-stack.md)** - 技术选型说明

### 📐 设计文档
- **[UI设计说明文档](design/UI设计说明文档.md)** - UI/UX设计规范
- **[异星工厂v3设计文档](design/异星工厂v3设计文档.md)** - 最新版本设计
- **[物品分类系统设计](design/物品分类系统设计.md)** - 物品分类逻辑

### 📖 开发指南
- **[开发指南](guides/development-guide.md)** - 完整的开发指南，包含第一阶段和第二阶段

### 🔧 系统文档
- **[存储系统](systems/storage-system.md)** - 完整的存储系统文档（含存档优化）
- **[燃料系统](systems/fuel-system.md)** - 完整的燃料系统文档
- **[电力系统设计文档](systems/电力系统设计文档.md)** - 电力系统详细设计
- **[物流系统功能设计](systems/物流系统功能设计.md)** - 物流系统设计
- **[科技页面设计文档](systems/科技页面设计文档.md)** - 科技系统设计
- **[设备管理系统文档](systems/设备管理系统文档.md)** - 设备管理功能
- **[物品解锁系统文档](systems/物品解锁系统文档.md)** - 解锁机制
- **[手动采集识别系统](systems/手动采集识别系统.md)** - 采集系统

### 📝 实现文档
- **[RecipeService应用总结](implementation/RecipeService应用总结.md)** - 配方服务实现
- **[inventory-management-guide](implementation/inventory-management-guide.md)** - 库存管理指南
- **[ci-cd.md](ci-cd.md)** - CI/CD配置说明

## 文档更新历史

### 2024-01 重构
- ✅ 创建新的目录结构（architecture, guides, systems, technical）
- ✅ 合并存储系统相关文档为 `systems/storage-system.md`
- ✅ 合并燃料系统相关文档为 `systems/fuel-system.md`
- ✅ 合并开发指南文档为 `guides/development-guide.md`
- ✅ 移动系统文档到 `systems/` 目录
- ✅ 更新文档间的交叉引用

### 已删除的过时文档
- `STORAGE_SYSTEM_README.md` - 已合并到 `systems/storage-system.md`
- `save-optimization-summary.md` - 已合并到 `systems/storage-system.md`
- `save-optimization-phase2-summary.md` - 已合并到 `systems/storage-system.md`
- `第一阶段开发指南.md` - 已合并到 `guides/development-guide.md`
- `第二阶段实现指南.md` - 已合并到 `guides/development-guide.md`
- `fuel-system-design.md` - 已合并到 `systems/fuel-system.md`
- `fuel-buffer-capacity-analysis.md` - 已合并到 `systems/fuel-system.md`
- `fuel-distribution-scenarios.md` - 已合并到 `systems/fuel-system.md`
- `fuel-system-implementation-plan.md` - 已合并到 `systems/fuel-system.md`
- `fuel-system-implementation-summary.md` - 已合并到 `systems/fuel-system.md`
- `storage-system-refactor.md` - 已合并到 `systems/storage-system.md`

## 使用指南

### 新手入门
1. 先阅读 [开发指南](guides/development-guide.md) 了解项目概况
2. 查看 [系统架构总览](architecture/system-overview.md) 理解整体设计
3. 根据需要深入了解各个系统的具体文档

### 开发参考
- 实现新功能前，先查看相关系统文档
- 遵循设计文档中的规范和约定
- 参考已有实现文档的最佳实践

### 文档维护
- 实现新功能时同步更新相关文档
- 保持文档结构清晰，避免重复内容
- 定期审查和清理过时文档