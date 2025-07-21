# Factorio-like Game Demo

这是一个类似 Factorio 的自动化工厂建设游戏的前端演示项目。

## 功能特性

### ✅ 已实现功能

#### 生产模块
- [x] 物品分类展示（六大类别）
- [x] 物品网格布局
- [x] 物品详情对话框
- [x] 物品解锁系统
- [x] 库存管理
- [x] 制作队列

#### 设施模块
- [x] 设施管理界面
- [x] 电力系统
- [x] 电力管理面板
- [x] 设施详情展示

#### 物品解锁系统
- [x] 基于进度的物品可见性控制
- [x] 默认解锁基础物品
- [x] 本地存储持久化
- [x] 解锁状态管理服务

### 🚧 开发中功能
- [ ] 科技树系统
- [ ] 研究队列
- [ ] 成就系统
- [ ] 生产链可视化

## 技术栈

- **框架**: React 18 + TypeScript
- **UI组件**: Material-UI v7
- **状态管理**: React Hooks + Context
- **样式**: CSS-in-JS (MUI styled components)
- **构建工具**: Create React App

## 快速开始

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm start
```

### 构建生产版本
```bash
npm run build
```

## 项目结构

```
src/
├── components/          # UI组件
│   ├── CategoryTabs.tsx      # 分类标签组件
│   ├── ItemGrid.tsx          # 物品网格
│   ├── ItemCard.tsx          # 物品卡片
│   ├── ItemDetailDialog.tsx  # 物品详情
│   ├── FacilityOverview.tsx  # 设施概览
│   └── PowerManagementPanel.tsx # 电力管理
├── services/           # 业务服务
│   ├── DataService.ts        # 数据管理
│   ├── UserProgressService.ts # 用户进度
│   ├── FacilityService.ts    # 设施管理
│   └── PowerService.ts       # 电力系统
├── types/             # TypeScript类型
│   ├── index.ts             # 基础类型
│   └── facilities.ts        # 设施类型
└── App.tsx            # 主应用组件
```

## 游戏机制

### 物品解锁
- 新玩家开始时拥有基础物品（木材、煤炭、铁矿等）
- 通过科技研究解锁新物品（待实现）
- 解锁进度自动保存

### 电力系统
- 发电设施：蒸汽机
- 消耗设施：电力采掘机、装配机等
- 实时电力平衡计算
- 电力不足警告

### 生产系统
- 配方系统
- 制作队列（最多10个任务）
- 自动生产计算
- 库存管理

## 开发文档

详细的开发文档请参考项目根目录：
- `第一阶段开发任务文档.md` - 开发任务清单
- `第一阶段开发说明文档.md` - 技术实现说明
- `物品解锁系统文档.md` - 解锁系统详细说明
- `电力系统设计文档.md` - 电力系统设计

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目仅供学习和演示用途。
