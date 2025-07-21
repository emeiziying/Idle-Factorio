# 异星工厂 v2 - 物流驱动生产管理系统

基于 React + TypeScript 的异星工厂游戏，实现了完整的物流驱动生产系统。玩家需要通过配置传送带和机械臂来优化生产效率。

## 🎮 游戏特色

### 核心机制：物流驱动生产
与传统自动化不同，本游戏中：
- **生产效率 = MIN(基础产能, 输入物流能力, 输出物流能力)**
- 物流设备（传送带、机械臂）是生产的必要条件
- 需要合理配置物流以达到最大效率

## 🚀 功能特性

### 物流系统
- **多级物流设备**
  - 传送带：黄色(15/s)、红色(30/s)、蓝色(45/s)
  - 机械臂：基础(0.83/s)、快速(2.31/s)、极速(5.0/s)
- **实时效率计算**: 
  - 实际产能 = MIN(基础产能, 输入物流能力, 输出物流能力)
  - 动态显示当前效率和瓶颈位置
- **智能优化建议**: 
  - 一键优化：自动计算并配置最优物流方案
  - 多种优化策略：增加数量、升级等级、混合配置
- **库存管理**:
  - 配置物流时自动消耗库存
  - 升级时智能处理被替换的物品
  - 库存满时提供多种处理方案

### 生产管理
- **设施系统**: 基于真实配方数据的生产设施
- **生产链分析**: 可视化显示完整生产链和瓶颈
- **批量操作**: 支持批量配置多个设施的物流
- **设施总览**: 集中查看所有设施状态和效率

### 数据持久化
- **自动保存**: 每30秒自动保存游戏进度
- **存档管理**: 支持导入/导出存档
- **配置保存**: 物流配置和设施状态持久化

### 用户界面
- **响应式设计**: 完美适配移动端和桌面端
- **直观的效率指示**: 
  - 🟢 绿色（90%+）：高效运行
  - 🟠 橙色（70-90%）：效率低下
  - 🔴 红色（<70%）：严重瓶颈
- **Material-UI**: 现代化的界面设计

## 📁 项目结构

```
demo/
├── public/
│   ├── data/1.1/                     # Factorio游戏数据
│   │   ├── data.json                 # 物品、配方、分类数据
│   │   ├── icons.webp                # 物品图标精灵图
│   │   └── hash.json                 # 数据校验
│   └── 异星工厂v2.md                  # 产品需求文档
├── src/
│   ├── components/                   # React组件
│   │   ├── CategoryTabs.tsx          # 分类标签导航
│   │   ├── ItemCard.tsx              # 物品卡片
│   │   ├── ItemGrid.tsx              # 物品网格布局
│   │   ├── ItemDetailDialog.tsx      # 物品详情对话框
│   │   ├── CraftingQueue.tsx         # 制作队列
│   │   ├── FacilityLogisticsPanel.tsx # 设施物流配置面板
│   │   ├── FacilityOverview.tsx      # 设施总览页面
│   │   ├── ProductionChainAnalyzer.tsx # 生产链分析器
│   │   └── BatchOperations.tsx       # 批量操作对话框
│   ├── services/                     # 业务服务
│   │   ├── DataService.ts            # 数据加载和管理
│   │   ├── SimpleLogisticsService.ts # 物流计算服务
│   │   ├── FacilityService.ts        # 设施管理服务
│   │   └── PersistenceService.ts     # 数据持久化服务
│   ├── types/                        # TypeScript类型定义
│   │   ├── index.ts                  # 基础类型
│   │   ├── logistics.ts              # 物流系统类型
│   │   └── facilities.ts             # 设施系统类型
│   ├── hooks/                        # 自定义React Hooks
│   │   └── useEfficiencyCalculation.ts # 效率计算优化Hook
│   └── App.tsx                       # 主应用组件
├── QUICKSTART.md                     # 快速入门指南
└── README.md                         # 项目说明文档
```

## 🛠 技术栈

- **前端框架**: React 18 + TypeScript 4.9
- **UI组件库**: Material-UI (MUI) v5
- **状态管理**: React Hooks + Context
- **数据处理**: 基于Service的架构模式
- **性能优化**: useMemo, useCallback, 防抖
- **持久化**: LocalStorage + 自动保存

## 🎯 快速开始

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm start
```

### 访问应用
```
http://localhost:3000
```

## 📖 核心概念说明

### 物流计算模型
```typescript
// 物流能力计算
conveyorCapacity = conveyorCount * conveyorSpeed
inserterCapacity = inserterCount * inserterSpeed
logisticsCapacity = min(conveyorCapacity, inserterCapacity)

// 实际产能计算
actualProduction = min(
  baseProduction,
  inputLogisticsCapacity,
  outputLogisticsCapacity
)

// 效率计算
efficiency = actualProduction / baseProduction
```

### 设施数据结构
```typescript
interface Facility {
  id: string;
  itemId: string;              // 生产的物品
  type: string;                // 设施类型
  count: number;               // 设施数量
  baseSpeed: number;           // 基础速度
  baseInputRate: Record<string, number>;  // 输入需求
  baseOutputRate: number;      // 输出速率
  powerType: 'electric' | 'fuel' | 'none';
  powerConsumption?: number;   // 电力消耗
}
```

### 物流配置结构
```typescript
interface LogisticsConfig {
  conveyors: number;           // 传送带数量
  conveyorType: string;        // 传送带类型
  inserters: number;           // 机械臂数量
  inserterType: string;        // 机械臂类型
}
```

## 🌟 特色功能详解

### 1. 生产链分析器
- 递归分析物品的完整生产链
- 可视化显示每个节点的效率和瓶颈
- 支持展开/折叠查看详细信息
- 统计整体生产链健康状况

### 2. 批量物流配置
- 选择多个设施进行批量配置
- 支持"设置为"、"增加"、"自动优化"三种模式
- 智能库存检查，防止过度消耗
- 实时反馈操作结果

### 3. 设施总览面板
- 按物品分组显示所有设施
- 显示总产能、平均效率等关键指标
- 颜色编码快速识别问题设施
- 支持快速跳转到配置界面

### 4. 性能优化机制
- 使用React.memo避免不必要的重渲染
- 防抖机制减少频繁计算
- 智能缓存计算结果
- 懒加载大型组件

## 📊 游戏数据

### 物流设备规格
| 设备类型 | 名称 | 速度(/秒) | 颜色 |
|---------|------|----------|------|
| 传送带 | 黄色传送带 | 15 | #FFD700 |
| 传送带 | 红色传送带 | 30 | #FF4444 |
| 传送带 | 蓝色传送带 | 45 | #4444FF |
| 机械臂 | 基础机械臂 | 0.83 | #FFD700 |
| 机械臂 | 快速机械臂 | 2.31 | #FF4444 |
| 机械臂 | 极速机械臂 | 5.00 | #4444FF |

### 设施类型
- **采矿设施**: 电力采掘机、热力采掘机
- **冶炼设施**: 石质熔炉、钢质熔炉、电炉
- **装配设施**: 装配机1/2/3型
- **化工设施**: 化工厂、炼油厂
- **研究设施**: 研究实验室

## 🚧 已知限制

1. **设施数据**: 目前使用示例数据，未来将从游戏文件完整加载
2. **配方系统**: 简化了部分复杂配方的处理
3. **模块系统**: 尚未实现生产力/效能模块
4. **电力系统**: 暂未实现电力需求计算
5. **传送带计算**: 当前使用简化模型，未考虑实际布局拓扑
6. **存储系统**: 混合存储箱的容量计算仍需完善
7. **物流布局**: 缺少可视化的物流连接显示

## 🔮 后续计划

- [ ] 完整的模块系统（生产力、效能、速度）
- [ ] 电力网络管理
- [ ] 物流网络可视化
- [ ] 生产统计和图表
- [ ] 多语言支持
- [ ] PWA支持（离线使用）

## 📝 更新日志

### v2.0.0 (2024-01)
- ✅ 实现完整的物流驱动生产系统
- ✅ 添加生产链分析功能
- ✅ 实现数据持久化和自动保存
- ✅ 添加批量操作功能
- ✅ 优化性能和用户体验
- ✅ 完善文档和快速入门指南

### v1.0.0 (2024-01)
- 初始版本发布
- 基础物品管理系统
- 简单的制作队列

## 📄 许可证

MIT License

## 🙏 致谢

- Factorio 游戏数据来自 [Wube Software](https://factorio.com/)
- UI组件使用 [Material-UI](https://mui.com/)
- 图标资源来自 Factorio 游戏文件
