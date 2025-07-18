# Idle Factorio Demo

基于Factorio的移动端工厂自动化游戏演示项目。

## 功能特性

- 🏭 **工厂自动化**: 模拟Factorio的生产系统
- 📱 **移动端优化**: 专为移动设备设计的UI交互
- 🎮 **手工艺系统**: 基于Factorio wiki的生产队列
- 📦 **库存管理**: 支持存储设备和容量限制
- 🔄 **实时更新**: 生产进度实时显示
- 🎨 **Factorio图标**: 集成真实游戏图标系统

## 快速开始

### 环境要求
- Node.js 18+
- React Native CLI
- iOS Simulator 或 Android Emulator

### 安装依赖
```bash
cd demo
npm install
```

### 运行项目
```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

## 项目结构

```
demo/
├── src/
│   ├── components/          # UI组件
│   │   ├── ItemCard.tsx    # 物品卡片
│   │   ├── CategoryTab.tsx # 分类标签
│   │   ├── GameIcon.tsx    # 游戏图标组件
│   │   └── CraftingQueueBubble.tsx # 生产队列气泡
│   ├── screens/            # 页面组件
│   │   ├── MainScreen.tsx  # 主页面
│   │   └── ItemDetailScreen.tsx # 物品详情页
│   ├── context/            # 状态管理
│   │   └── GameContext.tsx # 游戏状态上下文
│   ├── data/               # 游戏数据
│   │   ├── gameData.ts     # 游戏数据定义
│   │   └── iconData.ts     # 图标数据
│   └── types/              # 类型定义
│       └── index.ts        # 通用类型
├── assets/                 # 静态资源
│   └── icons.webp         # Factorio图标精灵图
└── ICON_INTEGRATION.md    # 图标系统说明
```

## 核心功能

### 生产系统
- **手工艺队列**: 支持1、5、最大数量生产
- **链式生产**: 自动处理依赖关系
- **进度显示**: 实时显示生产进度
- **取消操作**: 支持取消正在生产的物品

### 库存系统
- **容量管理**: 存储设备增加最大容量
- **自动停止**: 容量满时自动停止生产
- **设备消耗**: 添加存储设备消耗库存

### 移动端优化
- **触摸友好**: 大按钮和清晰的触摸区域
- **浮动UI**: 生产队列气泡设计
- **简化交互**: 三按钮生产模式替代右键菜单

## 图标系统

项目已集成Factorio 1.1.107的完整图标系统：

### 包含的图标
- **存储设备**: wooden-chest, iron-chest, steel-chest, storage-tank
- **基础资源**: wood, coal, stone, iron-ore, copper-ore  
- **加工品**: iron-plate, copper-plate, steel-plate
- **中间品**: copper-cable, iron-stick, iron-gear-wheel
- **电路**: electronic-circuit, advanced-circuit, processing-unit

### 使用方法
```typescript
import GameIcon from './components/GameIcon';

// 在组件中使用
<GameIcon iconId="wood" size={32} />
```

详细说明请参考 [ICON_INTEGRATION.md](./ICON_INTEGRATION.md)

## 技术栈

- **框架**: React Native 0.72+
- **语言**: TypeScript
- **状态管理**: React Context
- **导航**: React Navigation 6
- **图标**: Factorio 1.1.107 精灵图系统

## 开发说明

### 添加新物品
1. 在 `src/data/gameData.ts` 中添加物品定义
2. 在 `src/data/iconData.ts` 中添加图标数据
3. 确保 `assets/icons.webp` 包含对应图标

### 修改UI样式
- 主色调: `#1E293B` (深蓝灰)
- 成功色: `#10B981` (绿色)
- 警告色: `#F59E0B` (橙色)
- 错误色: `#EF4444` (红色)

### 调试技巧
- 使用React Native Debugger进行调试
- 查看控制台日志了解生产状态
- 使用开发者菜单重新加载应用

## 已知问题

- ⚠️ TypeScript配置需要优化（JSX支持）
- ⚠️ 图标组件需要完善集成
- ⚠️ 部分依赖可能需要更新

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

本项目基于MIT许可证开源。

---

**注意**: 这是一个演示项目，展示了如何将Factorio的核心机制移植到移动端。实际游戏开发需要更多的优化和功能完善。 