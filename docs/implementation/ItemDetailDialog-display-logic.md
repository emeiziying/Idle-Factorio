# ItemDetailDialog 显示逻辑整理

## 概述

ItemDetailDialog 组件用于显示物品的详细信息，包括库存状态、制作配方和用途。经过重构后，该组件的显示逻辑更加清晰和模块化。

## 主要改进

### 1. 组件拆分

将原本混杂在一起的显示逻辑拆分为独立的子组件：

- **RecipeMaterials**: 显示配方所需材料
- **RecipeOutput**: 显示配方产出物品
- **CraftButtons**: 制作按钮组

### 2. 逻辑分层

将配方显示逻辑分为两个主要部分：

- **renderManualCraftingSection**: 处理手动合成配方的显示
- **renderProducerRecipesSection**: 处理需要生产设备的配方显示

## 显示结构

```
ItemDetailDialog
├── 标题栏
│   ├── 物品图标
│   ├── 物品名称
│   ├── 物品描述
│   └── 关闭按钮
│
├── 内容区
│   ├── 库存信息卡片
│   │   ├── 当前数量
│   │   ├── 最大容量
│   │   └── 状态标签（如有）
│   │
│   ├── 制作配方卡片
│   │   ├── 手动合成部分
│   │   │   ├── 配方标题
│   │   │   ├── 制作时间
│   │   │   ├── 所需材料（RecipeMaterials）
│   │   │   ├── 产出物品（RecipeOutput）
│   │   │   └── 制作按钮（CraftButtons）
│   │   │
│   │   └── 生产设备配方部分
│   │       ├── 区域标题
│   │       └── 配方列表
│   │           ├── 配方名称
│   │           ├── 生产设备标签
│   │           ├── 所需材料（RecipeMaterials）
│   │           ├── 产出物品（RecipeOutput）
│   │           └── 制作按钮（CraftButtons）
│   │
│   └── 用途卡片
│       └── 可制作物品标签列表
│
└── 操作区
    └── 关闭按钮
```

## 显示逻辑详解

### 1. 手动合成配方显示逻辑

```typescript
renderManualCraftingSection() {
  // 1. 获取物品的所有配方
  const itemRecipes = dataService.getRecipesForItem(item.id);
  
  // 2. 处理无配方物品（原材料）
  if (itemRecipes.length === 0) {
    // 显示"无需材料"的手动合成选项
    return <无需材料的手动合成界面>;
  }
  
  // 3. 筛选可手动制作的配方
  const manualCraftableRecipes = itemRecipes.filter(recipe => {
    const validation = validator.validateRecipe(recipe);
    return validation.canCraftManually;
  });
  
  // 4. 筛选需要特定生产者的配方
  const restrictedRecipes = itemRecipes.filter(recipe => {
    const validation = validator.validateRecipe(recipe);
    return !validation.canCraftManually && validation.category === 'restricted';
  });
  
  // 5. 根据配方类型显示相应界面
  if (manualCraftableRecipes.length > 0) {
    // 显示第一个可手动制作的配方
    return <可手动制作的配方界面>;
  }
  
  if (restrictedRecipes.length > 0) {
    // 显示需要生产设备的提示
    return <需要生产设备的提示界面>;
  }
  
  // 6. 没有任何配方的默认显示
  return <无配方提示>;
}
```

### 2. 生产设备配方显示逻辑

```typescript
renderProducerRecipesSection() {
  // 1. 获取需要生产设备的配方
  const producerRecipes = itemRecipes.filter(recipe => {
    const validation = validator.validateRecipe(recipe);
    return !validation.canCraftManually && validation.category === 'restricted';
  });
  
  // 2. 过滤已解锁的生产设备配方
  const unlockedProducerRecipes = producerRecipes.filter(recipe => {
    return recipe.producers.some(pid => dataService.isItemUnlocked(pid));
  });
  
  // 3. 如果没有已解锁的配方，不显示该区域
  if (unlockedProducerRecipes.length === 0) {
    return null;
  }
  
  // 4. 显示所有已解锁的生产设备配方
  return <生产设备配方列表>;
}
```

## 数据流

1. **物品数据获取**
   - 从 DataService 获取物品详情
   - 包括配方列表和用途列表

2. **配方验证**
   - 使用 ManualCraftingValidator 验证配方类型
   - 区分手动合成配方和需要设备的配方

3. **库存检查**
   - 通过 GameStore 获取物品库存信息
   - 检查制作材料是否充足

4. **制作任务添加**
   - 调用 GameStore 的 addCraftingTask 方法
   - 显示相应的成功或失败消息

## 响应式设计

组件支持移动端和桌面端的响应式显示：

- 使用 `useIsMobile` hook 检测设备类型
- 移动端使用全屏对话框
- 根据设备调整字体大小和间距
- 按钮大小自适应

## 未来优化建议

1. **性能优化**
   - 考虑使用 React.memo 缓存子组件
   - 优化配方列表的渲染

2. **功能增强**
   - 添加配方搜索功能
   - 支持批量制作
   - 显示制作队列状态

3. **用户体验**
   - 添加制作进度动画
   - 优化材料不足时的提示
   - 支持快捷键操作