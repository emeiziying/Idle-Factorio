# 基于Factorio Wiki的手动制作验证实现

## 概述

本文档说明了如何根据Factorio官方Wiki实现手动制作验证逻辑。

参考资料：
- [Manual Crafting - Factorio Wiki](https://wiki.factorio.com/Crafting#Manual_crafting)
- [Recycler - Factorio Wiki](https://wiki.factorio.com/Recycler)

## Wiki规则总结

### 1. 手动制作的基本规则

根据Wiki，以下是手动制作的核心规则：

1. **配方类别限制**
   - `crafting` - 可以手动制作
   - `advanced-crafting` - 可以手动制作（需要解锁）
   - 其他类别（如 `smelting`、`chemistry` 等）需要特殊设备

2. **流体限制**
   - 包含流体的配方不能手动制作
   - Wiki明确指出："Products that require liquids... cannot be manually crafted"

3. **特殊物品限制**
   - 某些物品明确不能手动制作，如：
     - Engine unit（引擎单元）
     - Electric engine unit（电动引擎单元）
     - Flying robot frame（飞行机器人框架）

### 2. 特殊情况

1. **recycling-or-hand-crafting 类别**
   - 这是一个特殊类别，表示配方既可以在回收机中进行，也可以手动制作
   - 应该被视为可手动制作

2. **没有生产者的配方**
   - 如果配方没有指定生产者，通常意味着可以手动制作
   - 但需要检查其他限制（如流体、类别等）

## 实现细节

### 1. 验证优先级

验证按以下优先级进行：

```typescript
1. 黑名单检查（最高优先级）
2. 白名单检查
3. 配方类别检查
4. 配方标志检查（mining、recycling等）
5. 流体材料检查
6. 特殊物品检查
7. 生产者限制检查
8. 默认判断
```

### 2. 配置结构

```typescript
export interface ManualCraftingConfig {
  // 可手动制作的类别（基于Wiki）
  manualCraftableCategories: ['crafting', 'advanced-crafting'];
  
  // 受限类别（需要设备）
  restrictedCategories: [
    'smelting',
    'chemistry', 
    'oil-processing',
    'centrifuging',
    'rocket-building',
    'crafting-with-fluid', // 特别注意：包含流体的不能手动制作
    // ... 太空时代类别
  ];
  
  // 流体列表（用于检查配方材料）
  fluidItems: [...];
  
  // Wiki明确提到的受限物品
  restrictedItems: [
    'engine-unit',
    'electric-engine-unit',
    'flying-robot-frame',
    // ...
  ];
}
```

### 3. 验证逻辑示例

```typescript
// 示例1：木箱（wooden-chest）
// - 类别：logistics（不在可手动制作列表中）
// - 但在白名单中
// 结果：可以手动制作

// 示例2：钢材（steel）
// - 类别：smelting
// - 需要熔炉
// 结果：不能手动制作

// 示例3：硫酸（sulfuric-acid）
// - 类别：chemistry
// - 包含流体
// 结果：不能手动制作（两个原因）
```

## 与游戏数据的差异

### 当前数据问题

1. **生产者字段**
   - 数据中几乎所有配方都列出了生产者
   - 实际上很多基础物品应该可以手动制作

2. **类别不一致**
   - 某些应该是 `crafting` 类别的配方被标记为其他类别

### 解决方案

通过白名单机制覆盖数据中的限制：

```typescript
manualCraftingWhitelist: [
  // 基础制作物品
  'wooden-chest',
  'iron-chest',
  'transport-belt',
  'inserter',
  // ... 更多根据Wiki应该可以手动制作的物品
]
```

## 使用建议

### 1. 严格模式（遵循Wiki）

使用 `defaultManualCraftingConfig` 或 `strictManualCraftingConfig`：

```typescript
validator.useDefaultConfig(); // 推荐
```

### 2. 宽松模式（更好的游戏体验）

如果想要更宽松的规则：

```typescript
validator.useRelaxedConfig();
```

### 3. 自定义模式

根据具体需求调整：

```typescript
const customConfig = {
  ...defaultManualCraftingConfig,
  // 添加更多白名单物品
  manualCraftingWhitelist: [
    ...defaultManualCraftingConfig.manualCraftingWhitelist,
    'advanced-circuit',
    'processing-unit'
  ]
};
validator.setConfig(customConfig);
```

## 测试验证

### 测试用例

1. **原材料**
   - 木材、石头、煤炭等 → 应该可以手动采集

2. **基础制作**
   - 木箱、铁棒、铁齿轮等 → 应该可以手动制作

3. **需要熔炉**
   - 铁板、钢材等 → 不能手动制作

4. **包含流体**
   - 硫酸、润滑油等 → 不能手动制作

5. **高级物品**
   - 引擎单元、电动引擎等 → 不能手动制作

### 验证脚本

使用 `scripts/validate-manual-crafting.cjs` 验证实现是否符合预期。

## 未来改进

1. **数据修正**
   - 理想情况下，游戏数据应该正确标记哪些配方可以手动制作
   - 可以添加 `allow_manual_crafting` 字段

2. **动态白名单**
   - 根据玩家解锁的科技动态调整白名单

3. **配方变体**
   - 某些物品可能有多个配方，需要分别判断每个配方