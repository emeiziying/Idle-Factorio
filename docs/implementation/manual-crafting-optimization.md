# 手动制作筛选逻辑优化

## 概述

根据 Factorio Wiki 官方文档优化了手动制作物品的筛选逻辑，使其更符合游戏实际规则。

## 主要改进

### 1. 基于配方类别（Category）的判断

根据官方 Wiki，不同的配方类别决定了是否可以手动制作：

#### 可手动制作的类别
- `crafting` - 基础制作
- `advanced-crafting` - 高级制作
- `crafting-with-fluid` - 某些包含流体的配方（需要进一步检查）

#### 需要特殊设备的类别
- `smelting` - 熔炼（需要熔炉）
- `chemistry` - 化工（需要化工厂）
- `oil-processing` - 炼油（需要炼油厂）
- `centrifuging` - 离心（需要离心机）
- `rocket-building` - 火箭建造（需要火箭发射井）
- `electromagnetics` - 电磁（需要电磁工厂）
- `cryogenics` - 低温（需要低温工厂）
- `metallurgy` - 冶金（需要铸造厂）
- `organic` - 有机（需要生物室）
- `recycling` - 回收（需要回收机）

#### 特殊类别
- `recycling-or-hand-crafting` - 既可以在回收机中进行，也可以手动制作

### 2. 配方标志（Flags）处理

- **mining** - 采矿配方，可以手动采集
- **recycling** - 回收配方，需要检查是否有生产者限制

### 3. 生产者限制扩展

扩展了受限生产者列表，包括：

#### 基础游戏设备
- 熔炉：石炉、钢炉、电炉
- 装配机：1型、2型、3型
- 化工设备：化工厂、炼油厂、离心机
- 流体设备：抽油机、水泵

#### 太空时代扩展设备
- 铸造厂（foundry）
- 电磁工厂（electromagnetic-plant）
- 低温工厂（cryogenic-plant）
- 生物室（biochamber）
- 回收机（recycler）
- 农业塔（agricultural-tower）
- 虫巢孵化器（captive-biter-spawner）

### 4. 流体物品列表更新

根据最新版本，扩展了流体物品列表：

#### 基础流体
- water、steam、crude-oil、heavy-oil、light-oil、petroleum-gas
- sulfuric-acid、lubricant

#### 核能相关
- uranium-235、uranium-238

#### 太空时代流体
- thruster-fuel、thruster-oxidizer
- lava、molten-iron、molten-copper
- holmium-solution、electrolyte
- ammoniacal-solution、ammonia
- lithium-brine、fluorine
- fluoroketone-hot、fluoroketone-cold
- plasma

### 5. 特殊限制物品扩展

根据 Wiki 说明，某些高级物品即使配方允许也不能手动制作：

#### 基础游戏
- engine-unit（引擎单元）
- electric-engine-unit（电动引擎单元）
- flying-robot-frame（飞行机器人框架）
- rocket-fuel（火箭燃料）
- rocket-control-unit（火箭控制单元）
- low-density-structure（低密度结构）
- rocket-part（火箭部件）

#### 太空时代新增
- quantum-processor（量子处理器）
- fusion-power-cell（聚变能量电池）
- superconductor（超导体）
- supercapacitor（超级电容器）

## 验证流程

1. **配方类别检查** - 首先检查配方的 category 属性
2. **配方标志检查** - 检查特殊标志如 mining、recycling
3. **生产者限制检查** - 验证是否需要特殊设备
4. **流体材料检查** - 验证输入是否包含流体
5. **特殊物品检查** - 验证是否为硬编码的受限物品

## 参考资料

- [Factorio Wiki - 制作系统](https://wiki.factorio.com/Crafting/zh#Manual_crafting)
- [Factorio Wiki - 回收机](https://wiki.factorio.com/Recycler/zh)
- [Factorio Wiki - 流体系统](https://wiki.factorio.com/Fluid_system)

## 使用示例

```typescript
const validator = ManualCraftingValidator.getInstance();

// 验证单个物品
const validation = validator.validateManualCrafting('iron-plate');
if (validation.canCraftManually) {
  console.log(`可以手动制作: ${validation.reason}`);
} else {
  console.log(`不能手动制作: ${validation.reason}`);
}

// 验证单个配方
const recipe = dataService.getRecipe('steel-plate');
const recipeValidation = validator.validateRecipe(recipe);
console.log(`配方验证结果: ${recipeValidation.reason}`);

// 获取所有可手动制作的物品
const manualCraftableItems = validator.getManualCraftableItems();
console.log(`可手动制作的物品数量: ${manualCraftableItems.length}`);
```

## 未来改进建议

1. **配方数据完善** - 需要确保游戏数据中包含完整的 category 信息
2. **特殊情况处理** - 某些包含流体的配方可能仍可手动制作，需要更精确的规则
3. **版本兼容性** - 不同游戏版本的规则可能有所不同，需要版本适配
4. **性能优化** - 可以缓存验证结果以提高性能