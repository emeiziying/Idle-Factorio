# 采掘机配方选择错误修正

## 问题描述

用户在煤矿详情页面配置了热力采掘机，但是生产的是铁矿而不是煤炭。这是一个配方选择逻辑错误。

## 问题分析

### 根本原因

在 `RecipeFacilitiesCard` 组件中，采掘机添加时的配方选择逻辑有问题：

```typescript
// 原始代码（有问题）
const relevantRecipe = facilityRecipes.find(recipe => 
  recipe.producers?.includes(facilityType)
);
```

### 问题详情

1. **配方列表包含多个采矿配方**：`facilityRecipes` 包含了所有相关的采矿配方（铁矿、铜矿、煤炭等）
2. **选择逻辑不完整**：只检查设施类型，没有确保配方生产的是当前物品
3. **错误选择**：如果铁矿的配方在列表中排在前面，就会选择铁矿配方而不是煤炭配方
4. **用户体验**：用户在煤矿页面添加采掘机，却生产了铁矿

## 解决方案

### 修正逻辑

修改配方选择逻辑，确保选择的是生产当前物品的配方：

```typescript
// 修正后的代码
const relevantRecipe = facilityRecipes.find(recipe => 
  recipe.producers?.includes(facilityType) && recipe.out && recipe.out[item.id] !== undefined
);
```

### 修正原理

1. **双重验证**：不仅检查设施类型，还检查配方输出是否包含当前物品
2. **精确匹配**：确保选择的配方确实生产当前查看的物品
3. **用户体验**：用户在哪个物品页面添加设施，就生产哪个物品

## 影响范围

### 受影响的组件

- **`RecipeFacilitiesCard.tsx`**：
  - `handleAddFacility` 方法 - 设施添加时的配方选择
  - `calculateProductionRate` 方法 - 产能计算时的配方选择

### 受影响的物品

所有使用采掘机的物品现在都会正确选择配方：

- **铁矿** (`iron-ore`) - 选择 `iron-ore-mining` 配方
- **铜矿** (`copper-ore`) - 选择 `copper-ore-mining` 配方  
- **煤炭** (`coal`) - 选择 `coal` 配方
- **石头** (`stone`) - 选择 `stone` 配方
- **铀矿** (`uranium-ore`) - 选择 `uranium-ore-mining` 配方

## 验证方法

### 1. 功能验证

1. 打开煤矿详情页面
2. 添加热力采掘机
3. 验证采掘机生产的是煤炭而不是铁矿
4. 测试其他采矿物品（铁矿、铜矿等）

### 2. 代码验证

```typescript
// 验证配方选择逻辑
const coalRecipes = RecipeService.getRecipesThatProduce('coal');
const coalMiningRecipe = coalRecipes.find(r => r.flags?.includes('mining'));
console.log('煤炭采矿配方:', coalMiningRecipe);

// 验证配方输出
console.log('配方输出:', coalMiningRecipe?.out); // 应该包含 coal: 1
```

## 技术细节

### 配方数据结构

```json
{
  "id": "coal",
  "name": "Coal",
  "out": {
    "coal": 1
  },
  "producers": [
    "burner-mining-drill",
    "electric-mining-drill", 
    "big-mining-drill"
  ],
  "flags": ["mining"]
}
```

### 选择逻辑对比

```typescript
// 修正前 - 只检查设施类型
recipe.producers?.includes(facilityType)

// 修正后 - 检查设施类型和输出物品
recipe.producers?.includes(facilityType) && recipe.out && recipe.out[item.id] !== undefined
```

## 设计理念

### 上下文感知

这个修正体现了上下文感知的设计理念：

1. **页面上下文**：用户在哪个物品页面，就生产哪个物品
2. **设施适配**：同一设施在不同页面生产不同物品
3. **用户期望**：符合用户的操作直觉

### 精确匹配

- **设施匹配**：确保设施类型正确
- **物品匹配**：确保生产的是当前物品
- **配方匹配**：确保选择正确的配方

## 总结

这个修正确保了：

1. **功能正确性**：采掘机在正确的页面生产正确的物品
2. **用户体验**：符合用户的操作直觉和期望
3. **逻辑一致性**：所有采矿物品都有一致的行为
4. **代码健壮性**：增加了更严格的验证条件

修正后，用户在煤矿详情页面添加采掘机，现在会正确生产煤炭而不是铁矿。 