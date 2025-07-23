# 手动制作判断逻辑详解

## 概述

在异星工厂中，判断一个物品是否能够手动制作是游戏的核心机制之一。本文档详细解释了系统如何判断物品的手动制作能力。

## 判断流程

### 1. 主要判断逻辑

```typescript
validateManualCrafting(itemId: string): ManualCraftingValidation
```

判断流程分为以下几个步骤：

1. **检查物品是否存在**
2. **获取物品的所有配方**
3. **判断是否为原材料**（无配方）
4. **逐个检查配方是否可手动制作**

### 2. 物品分类

系统将物品分为三类：

#### 2.1 原材料 (raw_material)
- **特征**：没有任何配方
- **判断**：`recipes.length === 0`
- **示例**：木材(wood)、石头(stone)、煤炭(coal)
- **结果**：可以手动采集

#### 2.2 可制作物品 (craftable)
- **特征**：至少有一个配方可以手动制作
- **判断**：通过 `validateRecipe()` 验证
- **示例**：木板(wood-plank)、铁齿轮(iron-gear-wheel)
- **结果**：可以手动制作

#### 2.3 受限物品 (restricted)
- **特征**：所有配方都需要特殊设备
- **判断**：所有配方都无法手动制作
- **示例**：钢材(steel)、塑料(plastic)
- **结果**：需要生产设备

## 配方验证规则

### 1. 配方标志检查

```typescript
if (recipe.flags) {
  // 采矿配方 - 可以手动采集
  if (recipe.flags.includes('mining')) {
    return { canCraftManually: true, ... };
  }
  
  // 回收配方 - 通常可以手动制作
  if (recipe.flags.includes('recycling')) {
    return { canCraftManually: true, ... };
  }
}
```

### 2. 生产者限制检查

系统维护了一个受限生产者列表：

```typescript
const restrictedProducers = [
  // 熔炉类
  'stone-furnace',
  'steel-furnace', 
  'electric-furnace',
  
  // 装配机类
  'assembling-machine-1',
  'assembling-machine-2',
  'assembling-machine-3',
  
  // 化工设备类
  'chemical-plant',
  'oil-refinery',
  'centrifuge',
  
  // 流体设备类
  'pumpjack',
  'offshore-pump'
];
```

如果配方指定了这些生产者，则不能手动制作。

### 3. 流体材料检查

```typescript
const fluidItems = [
  'water', 'steam', 'crude-oil', 
  'heavy-oil', 'light-oil', 'petroleum-gas',
  'sulfuric-acid', 'lubricant', 
  'uranium-235', 'uranium-238'
];
```

如果配方的输入材料包含流体，则不能手动制作。

### 4. 特殊限制物品

某些高级物品被硬编码为不能手动制作：

```typescript
const restrictedItems = [
  'engine-unit',              // 引擎
  'electric-engine-unit',     // 电动引擎
  'flying-robot-frame',       // 飞行机器人框架
  'rocket-fuel',              // 火箭燃料
  'rocket-control-unit',      // 火箭控制单元
  'low-density-structure',    // 低密度结构
  'rocket-part'               // 火箭零件
];
```

## 实际应用示例

### 示例1：木板 (wood-plank)

```typescript
// 配方数据
{
  id: "wood-plank",
  in: { "wood": 1 },
  out: { "wood-plank": 2 },
  time: 0.5,
  producers: []  // 无生产者限制
}

// 判断过程
1. 有配方 ✓
2. 无特殊标志
3. 无生产者限制 ✓
4. 无流体材料 ✓
5. 非特殊限制物品 ✓

结果：可以手动制作
```

### 示例2：钢材 (steel)

```typescript
// 配方数据
{
  id: "steel-plate",
  in: { "iron-plate": 5 },
  out: { "steel-plate": 1 },
  time: 16,
  producers: ["stone-furnace", "steel-furnace", "electric-furnace"]
}

// 判断过程
1. 有配方 ✓
2. 无特殊标志
3. 有生产者限制 ✗ (需要熔炉)

结果：不能手动制作，需要熔炉
```

### 示例3：塑料 (plastic)

```typescript
// 配方数据
{
  id: "plastic-bar",
  in: { "petroleum-gas": 20, "coal": 1 },
  out: { "plastic-bar": 2 },
  time: 1,
  producers: ["chemical-plant"]
}

// 判断过程
1. 有配方 ✓
2. 无特殊标志
3. 有生产者限制 ✗ (需要化工厂)
4. 有流体材料 ✗ (petroleum-gas是流体)

结果：不能手动制作，需要化工厂且包含流体
```

## 在UI中的应用

在 `ItemDetailDialog` 组件中，判断逻辑的应用：

```typescript
// 获取物品的所有配方
const itemRecipes = dataService.getRecipesForItem(item.id);

// 无配方物品（原材料）
if (itemRecipes.length === 0) {
  // 显示"无需材料"的手动采集选项
}

// 使用验证器检查配方
const manualCraftableRecipes = itemRecipes.filter(recipe => {
  const validation = validator.validateRecipe(recipe);
  return validation.canCraftManually;
});

// 根据结果显示不同的UI
if (manualCraftableRecipes.length > 0) {
  // 显示手动制作界面
} else {
  // 显示需要设备的提示
}
```

## 辅助方法

### 1. 获取所有可手动制作的物品

```typescript
getManualCraftableItems(): string[] {
  // 返回所有可以手动制作的物品ID列表
}
```

### 2. 获取原材料列表

```typescript
getRawMaterials(): string[] {
  // 返回所有无配方的原材料物品ID列表
}
```

### 3. 获取采矿物品

```typescript
getMiningItems(): string[] {
  // 返回所有带有mining标志的物品ID列表
}
```

## 总结

手动制作的判断是一个多层次的验证过程：

1. **最高优先级**：原材料（无配方）始终可以手动采集
2. **配方级验证**：
   - 特殊标志（mining, recycling）
   - 生产者限制
   - 流体材料限制
   - 特殊物品限制
3. **默认行为**：如果配方没有任何限制，默认可以手动制作

这种设计确保了游戏的平衡性，同时为玩家提供了清晰的制作路径指引。