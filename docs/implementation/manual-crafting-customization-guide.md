# 手动合成校验逻辑自定义指南

## 概述

本指南详细说明如何修改手动合成校验逻辑，使其更符合您的游戏需求。新的验证系统基于配置文件，提供了灵活的自定义选项。

## 快速开始

### 1. 使用预设配置

系统提供了三种预设配置：

```typescript
// 使用默认配置（基于 Factorio Wiki）
validator.useDefaultConfig();

// 使用宽松配置（允许更多物品手动制作）
validator.useRelaxedConfig();

// 使用早期游戏配置（严格限制）
const validator = ManualCraftingValidator.getInstance(earlyGameConfig);
```

### 2. 在组件中应用配置

```typescript
// 在 ItemDetailDialog 中
useEffect(() => {
  validator.useRelaxedConfig(); // 使用宽松配置
}, []);
```

## 配置选项详解

### ManualCraftingConfig 接口

```typescript
interface ManualCraftingConfig {
  // 可以手动制作的配方类别
  manualCraftableCategories: string[];
  
  // 需要特殊设备的配方类别
  restrictedCategories: string[];
  
  // 流体物品列表
  fluidItems: string[];
  
  // 不能手动制作的特殊物品
  restrictedItems: string[];
  
  // 需要特殊设备的生产者
  restrictedProducers: string[];
  
  // 手动制作白名单（强制允许）
  manualCraftingWhitelist: string[];
  
  // 手动制作黑名单（强制禁止）
  manualCraftingBlacklist: string[];
  
  // 是否启用严格模式
  strictMode: boolean;
}
```

## 自定义配置示例

### 示例 1：允许特定物品手动制作

```typescript
const customConfig: ManualCraftingConfig = {
  ...defaultManualCraftingConfig,
  
  // 添加到白名单
  manualCraftingWhitelist: [
    'wooden-chest',
    'iron-chest',
    'stone-furnace',
    'iron-gear-wheel',
    'copper-cable',
    'electronic-circuit'
  ]
};

validator.setConfig(customConfig);
```

### 示例 2：移除生产者限制

```typescript
const customConfig: ManualCraftingConfig = {
  ...defaultManualCraftingConfig,
  
  // 只保留真正需要特殊设备的生产者
  restrictedProducers: [
    'chemical-plant',
    'oil-refinery',
    'centrifuge'
  ]
};
```

### 示例 3：根据游戏进度动态调整

```typescript
function updateValidatorForProgress(techLevel: number) {
  const config: ManualCraftingConfig = {
    ...defaultManualCraftingConfig,
    manualCraftingWhitelist: []
  };
  
  if (techLevel >= 1) {
    // 解锁基础制作
    config.manualCraftingWhitelist.push(
      'wooden-chest',
      'stone-furnace',
      'burner-mining-drill'
    );
  }
  
  if (techLevel >= 2) {
    // 解锁更多物品
    config.manualCraftingWhitelist.push(
      'transport-belt',
      'inserter',
      'iron-gear-wheel'
    );
  }
  
  if (techLevel >= 3) {
    // 解锁电子产品
    config.manualCraftingWhitelist.push(
      'electronic-circuit',
      'automation-science-pack'
    );
  }
  
  validator.setConfig(config);
}
```

## 验证优先级

验证器按以下优先级检查物品：

1. **黑名单**（最高优先级）- 强制禁止
2. **白名单** - 强制允许
3. **严格模式** - 如果启用，有生产者的配方都不能手动制作
4. **配方类别** - 检查是否在允许/限制列表中
5. **配方标志** - 特殊标志如 'mining'
6. **生产者限制** - 检查是否需要特殊设备
7. **流体检查** - 包含流体的配方不能手动制作
8. **特殊物品** - 检查是否在限制物品列表中

## 实际应用场景

### 场景 1：休闲模式

允许更多物品手动制作，减少对自动化的依赖：

```typescript
const casualModeConfig: ManualCraftingConfig = {
  ...relaxedManualCraftingConfig,
  
  // 允许更多高级物品
  manualCraftingWhitelist: [
    ...relaxedManualCraftingConfig.manualCraftingWhitelist,
    'advanced-circuit',
    'processing-unit',
    'solar-panel',
    'accumulator'
  ],
  
  // 减少限制
  restrictedProducers: ['chemical-plant', 'oil-refinery'],
  restrictedItems: []
};
```

### 场景 2：挑战模式

严格限制手动制作，强制使用自动化：

```typescript
const challengeModeConfig: ManualCraftingConfig = {
  ...defaultManualCraftingConfig,
  
  // 严格模式
  strictMode: true,
  
  // 只允许最基础的物品
  manualCraftingWhitelist: ['wood', 'stone', 'coal'],
  
  // 扩大黑名单
  manualCraftingBlacklist: [
    'wooden-chest',
    'stone-furnace',
    'burner-mining-drill'
  ]
};
```

### 场景 3：教程模式

根据教程进度逐步解锁：

```typescript
class TutorialValidator {
  private validator = ManualCraftingValidator.getInstance();
  private unlockedItems: Set<string> = new Set();
  
  unlockItem(itemId: string) {
    this.unlockedItems.add(itemId);
    this.updateConfig();
  }
  
  private updateConfig() {
    const config: ManualCraftingConfig = {
      ...defaultManualCraftingConfig,
      strictMode: true,
      manualCraftingWhitelist: Array.from(this.unlockedItems)
    };
    
    this.validator.setConfig(config);
  }
}
```

## 调试和测试

### 验证单个物品

```typescript
const validation = validator.validateManualCrafting('iron-gear-wheel');
console.log(`物品: iron-gear-wheel`);
console.log(`可手动制作: ${validation.canCraftManually}`);
console.log(`原因: ${validation.reason}`);
console.log(`类别: ${validation.category}`);
```

### 批量验证

```typescript
const items = ['wood', 'iron-plate', 'electronic-circuit'];
const results = validator.validateMultipleItems(items);

results.forEach((validation, itemId) => {
  console.log(`${itemId}: ${validation.canCraftManually ? '✅' : '❌'}`);
});
```

### 获取所有可手动制作的物品

```typescript
const craftableItems = validator.getAllManualCraftableItems();
console.log(`可手动制作的物品数量: ${craftableItems.length}`);
console.log(`物品列表:`, craftableItems);
```

## 最佳实践

1. **使用配置文件**：将配置保存在单独的文件中，便于管理和版本控制。

2. **渐进式解锁**：根据游戏进度逐步解锁手动制作能力。

3. **保持平衡**：不要过度放宽限制，保持游戏的挑战性。

4. **文档化**：记录您的自定义规则和原因。

5. **测试**：充分测试不同配置下的游戏体验。

## 常见问题

### Q: 如何让所有物品都可以手动制作？

```typescript
const allManualConfig: ManualCraftingConfig = {
  ...defaultManualCraftingConfig,
  strictMode: false,
  restrictedCategories: [],
  restrictedProducers: [],
  restrictedItems: [],
  fluidItems: [] // 甚至允许流体配方
};
```

### Q: 如何完全禁用手动制作？

```typescript
const noManualConfig: ManualCraftingConfig = {
  ...defaultManualCraftingConfig,
  strictMode: true,
  manualCraftingWhitelist: [], // 空白名单
  manualCraftingBlacklist: ['*'] // 或列出所有物品
};
```

### Q: 如何保存和加载自定义配置？

```typescript
// 保存配置
localStorage.setItem('manualCraftingConfig', JSON.stringify(customConfig));

// 加载配置
const savedConfig = localStorage.getItem('manualCraftingConfig');
if (savedConfig) {
  validator.setConfig(JSON.parse(savedConfig));
}
```

## 总结

新的手动合成校验系统提供了极大的灵活性，您可以：

- 使用预设配置快速开始
- 通过白名单/黑名单精确控制
- 根据游戏进度动态调整
- 创建符合您游戏风格的自定义规则

通过合理配置，可以创造出从休闲到硬核的各种游戏体验。