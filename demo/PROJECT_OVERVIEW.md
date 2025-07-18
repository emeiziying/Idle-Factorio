# 异星工厂手机版演示项目概览

## 🎯 项目简介

这是一个基于经典PC游戏Factorio设计的移动端工厂自动化管理游戏演示项目。项目采用React Native开发，实现了Factorio核心玩法在移动端的适配。

## 📱 核心功能演示

### 1. 物品管理系统
- **分类展示**: 物流系统、生产系统、中间产品、战斗系统、流体系统、科技系统
- **状态徽章**: 右上角显示物品状态（缺料/正常/充足）
- **库存显示**: 底部显示当前库存数量
- **网格布局**: 4列网格，适合移动端浏览

### 2. 手工制作队列
- **三种模式**: 制作1个、制作5个、最多制造
- **实时进度**: 环形进度条显示制作进度
- **取消操作**: 点击物品图标取消制作任务
- **队列管理**: 支持多个任务同时进行

### 3. 配方系统
- **详细配方**: 显示输入材料和输出产品
- **材料检查**: 实时显示材料库存是否充足
- **制作时间**: 显示每个配方的制作时间
- **分类信息**: 显示配方所属分类

### 4. 存储管理系统
- **容量扩展**: 通过添加箱子/储罐扩展存储容量
- **库存检查**: 添加存储设备时检查库存是否充足
- **容量显示**: 显示当前库存和最大容量
- **满库存处理**: 达到上限时无法继续生产

### 5. 浮动制作队列
- **气泡设计**: 右下角浮动气泡显示队列状态
- **展开查看**: 点击气泡展开查看详细队列
- **进度可视化**: 环形进度条覆盖物品图标
- **实时更新**: 100ms间隔更新制作进度

## 🎮 游戏机制

### 库存系统
```
基础容量: 100个物品
扩展方式: 添加存储设备
- 铁箱子: +1000容量
- 钢箱子: +2000容量  
- 储液罐: +25000容量（流体）
```

### 制作系统
```
制作时间: 基于配方设定
- 木材: 0.55秒
- 铁矿石: 1秒
- 铁板: 3.5秒
- 铁箱子: 0.5秒
```

### 状态管理
```
缺料中 (红色): 库存为0
正常 (黄色): 库存适中
充足 (绿色): 库存充足
生产中: 正在制作中
库存满: 达到存储上限
```

## 🛠️ 技术实现

### 架构设计
```
App.tsx (入口)
├── GameProvider (状态管理)
├── NavigationContainer (导航)
└── Stack.Navigator (页面路由)
    ├── MainScreen (主界面)
    └── ItemDetailScreen (物品详情)
```

### 状态管理
```typescript
interface GameState {
  resources: {[itemId: string]: number};        // 物品库存
  equipment: {[itemId: string]: any[]};         // 设备装备
  craftingQueue: CraftingTask[];                // 制作队列
  unlockedTechnologies: string[];               // 解锁科技
  selectedCategory: string;                     // 选中分类
}
```

### 组件设计
```
components/
├── ItemCard.tsx           # 物品卡片
├── CategoryTab.tsx        # 分类标签
└── CraftingQueueBubble.tsx # 制作队列气泡

screens/
├── MainScreen.tsx         # 主界面
└── ItemDetailScreen.tsx   # 物品详情页
```

## 📊 数据模型

### 物品数据
```typescript
interface Item {
  id: string;              // 物品ID
  name: string;            // 物品名称
  category: string;        // 所属分类
  stack: number;           // 堆叠数量
  row: number;             // 科技树行数
  fuel?: {                 // 燃料属性
    category: string;
    value: number;
  };
}
```

### 配方数据
```typescript
interface Recipe {
  id: string;              // 配方ID
  name: string;            // 配方名称
  category: string;        // 所属分类
  row: number;             // 科技树行数
  time: number;            // 制作时间
  producers: string[];     // 生产设备
  in: {[itemId: string]: number};  // 输入材料
  out: {[itemId: string]: number}; // 输出产品
  isMining?: boolean;      // 是否为采矿
}
```

## 🎨 界面设计

### 主界面布局
```
┌─────────────────────────┐
│ 分类标签栏 (横向滚动)    │
├─────────────────────────┤
│                         │
│    物品网格 (4列)       │
│  [📦] [📦] [📦] [📦]  │
│  [📦] [📦] [📦] [📦]  │
│                         │
└─────────────────────────┘
                    [⚙️] ← 浮动气泡
```

### 物品详情页布局
```
┌─────────────────────────┐
│ 物品基本信息            │
│ 名称、分类、库存        │
├─────────────────────────┤
│ 配方信息               │
│ 输入: 材料1, 材料2     │
│ 输出: 产品1            │
├─────────────────────────┤
│ 手工制作               │
│ [制作1个] [制作5个] [最多制造] │
├─────────────────────────┤
│ 存储管理               │
│ [添加铁箱子] [添加钢箱子] │
└─────────────────────────┘
```

## 🚀 运行指南

### 环境要求
- Node.js 16+
- React Native CLI
- Android Studio / Xcode

### 快速启动
```bash
cd demo
chmod +x demo-setup.sh
./demo-setup.sh
npm start
```

### 开发命令
```bash
npm start          # 启动Metro服务器
npm run android    # 运行Android版本
npm run ios        # 运行iOS版本
npm test           # 运行测试
npm run lint       # 代码检查
```

## 📈 性能优化

### 渲染优化
- 使用FlatList实现虚拟化列表
- 组件化设计减少重复渲染
- 状态管理集中化

### 内存管理
- 及时清理定时器
- 避免内存泄漏
- 合理使用useEffect

### 用户体验
- 100ms间隔更新进度
- 流畅的动画效果
- 响应式设计

## 🔮 扩展计划

### 短期目标
- [ ] 添加更多物品和配方
- [ ] 实现自动化生产系统
- [ ] 添加科技树界面

### 中期目标
- [ ] 实现存档和读档功能
- [ ] 添加音效和动画
- [ ] 优化性能表现

### 长期目标
- [ ] 实现多人协作功能
- [ ] 添加成就系统
- [ ] 支持模组扩展

## 📄 技术文档

### API文档
- [React Native官方文档](https://reactnative.dev/)
- [React Navigation文档](https://reactnavigation.org/)
- [TypeScript官方文档](https://www.typescriptlang.org/)

### 设计资源
- [Factorio Wiki](https://wiki.factorio.com/)
- [Material Design](https://material.io/design)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

## 🤝 贡献指南

### 开发流程
1. Fork项目
2. 创建功能分支
3. 提交代码
4. 创建Pull Request

### 代码规范
- 使用TypeScript
- 遵循ESLint规则
- 编写单元测试
- 添加注释说明

### 提交规范
```
feat: 添加新功能
fix: 修复bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建过程或辅助工具的变动
```

---

**🎯 这个演示项目展示了如何将经典PC游戏成功适配到移动端，保持了核心玩法的同时，针对移动设备进行了优化设计。** 