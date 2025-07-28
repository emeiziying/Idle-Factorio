# 铁矿详情页面配置采掘机修正

## 问题描述

铁矿详情页面无法配置采掘机，用户无法在铁矿详情页面添加采掘机来生产铁矿。

## 问题分析

### 根本原因

在 `RecipeFacilitiesCard` 组件中，过滤逻辑排除了所有被认为是"手动可制作"的配方：

```typescript
// 原始代码（有问题）
const facilityRecipes = recipes.filter(recipe => {
  const validation = validator.validateRecipe(recipe);
  return !validation.canCraftManually && recipe.producers && recipe.producers.length > 0;
});
```

### 问题详情

1. **铁矿采矿配方**：`iron-ore-mining` 配方被 `ManualCraftingValidator` 识别为手动可制作
2. **验证逻辑**：采矿配方有 `mining` 标志，被认为是原始材料采集
3. **过滤结果**：由于被认为是手动可制作，被排除在设施列表之外
4. **用户体验**：用户无法在铁矿详情页面看到采掘机选项

## 解决方案

### 修正逻辑

修改 `RecipeFacilitiesCard` 中的过滤逻辑，允许采矿配方显示在设施列表中：

```typescript
// 修正后的代码
const facilityRecipes = recipes.filter(recipe => {
  const validation = validator.validateRecipe(recipe);
  // 允许采矿配方显示在设施列表中，即使它们被认为是手动可制作的
  const isMiningRecipe = recipe.flags && recipe.flags.includes('mining');
  return (isMiningRecipe || !validation.canCraftManually) && recipe.producers && recipe.producers.length > 0;
});
```

### 修正原理

1. **保留采矿配方**：即使采矿配方被认为是手动可制作的，也应该显示在设施列表中
2. **双重验证**：检查配方是否有 `mining` 标志，或者不是手动可制作的
3. **用户体验**：用户既可以通过手动采集获得铁矿，也可以通过采掘机自动化生产

## 影响范围

### 受影响的物品

所有有采矿配方的物品现在都可以在详情页面配置采掘机：

- **铁矿** (`iron-ore`) - `iron-ore-mining` 配方
- **铜矿** (`copper-ore`) - `copper-ore-mining` 配方  
- **煤炭** (`coal`) - `coal` 配方
- **石头** (`stone`) - `stone` 配方
- **铀矿** (`uranium-ore`) - `uranium-ore-mining` 配方

### 支持的采掘机类型

根据配方数据，支持以下采掘机：

- **热能采掘机** (`burner-mining-drill`) - 燃料驱动
- **电力采掘机** (`electric-mining-drill`) - 电力驱动
- **大型采掘机** (`big-mining-drill`) - 高级采掘机

## 验证方法

### 1. 功能验证

1. 打开铁矿详情页面
2. 检查是否显示"生产设施"部分
3. 验证是否显示采掘机图标和添加按钮
4. 测试添加采掘机功能

### 2. 代码验证

```typescript
// 验证铁矿配方是否被正确识别
const ironOreRecipes = RecipeService.getRecipesThatProduce('iron-ore');
console.log('铁矿配方:', ironOreRecipes);

// 验证采矿配方是否包含mining标志
const miningRecipe = ironOreRecipes.find(r => r.flags?.includes('mining'));
console.log('采矿配方:', miningRecipe);
```

## 设计理念

### 双重生产方式

这个修正体现了游戏的双重生产方式：

1. **手动采集**：玩家可以直接点击手动采集按钮获得铁矿
2. **自动化生产**：玩家可以部署采掘机来自动化铁矿生产

### 渐进式解锁

- **早期**：玩家依赖手动采集获得基础资源
- **中期**：解锁采掘机后可以自动化生产
- **后期**：升级到更高效的采掘机类型

## 总结

这个修正确保了：

1. **功能完整性**：铁矿详情页面现在可以正确配置采掘机
2. **用户体验**：玩家可以选择手动采集或自动化生产
3. **游戏平衡**：保持了手动采集和自动化生产的平衡
4. **代码一致性**：所有采矿类物品都有一致的行为

修正后，铁矿详情页面现在应该能够正确显示采掘机选项，允许玩家配置自动化铁矿生产。 