# 异星工厂移动版 Demo

基于 React + TypeScript 的异星工厂移动端游戏demo，展示以物品为中心的工厂自动化管理系统。

## 功能特性

### 🎯 核心功能
- **六大分类系统**: 物流、生产、中间产品、战斗、流体、科技
- **物品网格展示**: 4列网格布局，适配移动端
- **实时库存管理**: 显示物品数量、生产速率、消耗速率
- **状态指示系统**: 生产中、停产、缺料、库存满等状态
- **物品详情页面**: 核心数据、存储管理、手动制作
- **制作队列系统**: 浮动气泡式队列管理

### 📱 移动端优化
- **响应式设计**: 适配不同屏幕尺寸
- **触控友好**: 80x100px物品卡片，适合手指点击
- **浮动队列**: 空间效率高的制作队列展示
- **Material-UI**: 现代化的移动端UI组件

### 🎮 基于Factorio数据
- **真实数据**: 基于Factorio 1.1.107游戏数据
- **图标系统**: 使用官方图标精灵图
- **分类体系**: 完全基于Factorio的物品分类
- **生产逻辑**: 模拟真实的生产和消耗机制

## 技术栈

- **前端框架**: React 18 + TypeScript
- **UI组件**: Material-UI (MUI) v5
- **状态管理**: React Hooks (useState, useEffect)
- **数据加载**: Fetch API + JSON
- **样式系统**: Emotion (MUI内置)

## 项目结构

```
demo/
├── public/
│   ├── data/1.1/           # Factorio游戏数据
│   │   ├── data.json       # 物品和分类数据
│   │   ├── icons.webp      # 物品图标精灵图
│   │   └── hash.json       # 数据校验
│   └── 异星工厂v2.md        # 产品需求文档
├── src/
│   ├── components/         # React组件
│   │   ├── CategoryTabs.tsx     # 分类标签
│   │   ├── ItemCard.tsx         # 物品卡片
│   │   ├── ItemGrid.tsx         # 物品网格
│   │   ├── ItemDetailDialog.tsx # 物品详情
│   │   └── CraftingQueue.tsx    # 制作队列
│   ├── services/
│   │   └── DataService.ts       # 数据加载和管理
│   ├── types/
│   │   └── index.ts            # TypeScript类型定义
│   └── App.tsx                 # 主应用组件
```

## 快速开始

1. **安装依赖**
   ```bash
   npm install
   ```

2. **启动开发服务器**
   ```bash
   npm start
   ```

3. **访问应用**
   ```
   http://localhost:3000
   ```

## 核心组件说明

### CategoryTabs - 分类标签
- 六大分类的横向滚动标签
- 彩色图标和描述文本
- 响应式设计，支持滑动

### ItemCard - 物品卡片
- 80x100px移动端友好尺寸
- 状态徽章显示生产状态
- 库存数量和生产速率显示
- 悬停和点击交互效果

### ItemGrid - 物品网格
- CSS Grid布局，4列设计
- 自适应间距和对齐
- 空数据状态处理

### ItemDetailDialog - 物品详情
- 核心数据展示（库存、产量、消耗、净增长）
- 存储管理（箱子添加/移除）
- 手动制作（1个、5个、最多制造）
- 物品基础信息

### CraftingQueue - 制作队列
- 浮动气泡按钮（右下角）
- 底部抽屉式队列详情
- 进度条和状态显示
- 点击取消制作功能

## 数据结构

### 物品数据
```typescript
interface Item {
  id: string;           // 物品ID
  name: string;         // 显示名称
  category: string;     // 分类ID
  stack_size?: number;  // 堆叠大小
  description?: string; // 描述
}
```

### 库存数据
```typescript
interface InventoryItem {
  itemId: string;           // 物品ID
  currentAmount: number;    // 当前数量
  maxCapacity: number;      // 最大容量
  productionRate: number;   // 生产速率(/秒)
  consumptionRate: number;  // 消耗速率(/秒)
  status: ItemStatus;       // 状态
}
```

### 制作任务
```typescript
interface CraftingTask {
  id: string;           // 任务ID
  itemId: string;       // 物品ID
  quantity: number;     // 制作数量
  progress: number;     // 进度(秒)
  totalTime: number;    // 总时间(秒)
  status: TaskStatus;   // 状态
}
```

## 特色功能

### 🎨 状态徽章系统
- **生产中**: 绿色圆点 ● 
- **停产中**: 灰色圆点 ○
- **缺料中**: 橙色圆点 ⚠
- **库存满**: 红色圆点 🔴
- **研究中**: 紫色圆点 🔬

### 📊 实时数据更新
- 每秒更新库存数量
- 模拟生产和消耗
- 制作队列进度更新
- 状态变化反馈

### 🔧 制作队列管理
- 最多10个并发任务
- 进度条实时更新
- 点击图标取消制作
- 智能队列状态管理

## 设计理念

基于产品需求文档中的设计原则：

1. **以物品为中心**: 所有界面围绕物品展开
2. **移动端优化**: 适配手机屏幕和触控操作
3. **简化界面**: 专注核心数据和操作
4. **自动化管理**: 模拟完全自动化的资源系统
5. **Factorio忠实**: 基于真实游戏数据和机制

## 后续扩展

- [ ] 设备管理系统
- [ ] 科技研究系统
- [ ] 流体处理系统
- [ ] 配方管理系统
- [ ] 存档系统
- [ ] 多语言支持

## 许可证

MIT License
