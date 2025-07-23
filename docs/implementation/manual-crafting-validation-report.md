# 手动制作物品验证报告

## 验证结果概述

根据当前游戏数据验证，共有 394 个物品：

- 🌿 **原材料（可手动采集）**: 0 个
- 🔨 **可手动制作物品**: 7 个 (1.8%)
- 🏭 **需要生产设备**: 387 个 (98.2%)

## 可手动获得的物品

### 基础资源（可手动采集）
1. **Wood (木材)** - 无需生产者，可直接采集
2. **Coal (煤炭)** - 可通过采矿机采集，也可手动采集
3. **Stone (石头)** - 可通过采矿机采集，也可手动采集
4. **Iron ore (铁矿石)** - 可通过采矿机采集，也可手动采集
5. **Copper ore (铜矿石)** - 可通过采矿机采集，也可手动采集

### 流体资源
6. **Water (水)** - 通过离岸泵获取
7. **Crude oil (原油)** - 通过抽油机获取

## 数据问题分析

### 1. 缺少手动制作配方

根据 Factorio Wiki，以下物品应该可以手动制作，但在当前数据中都需要装配机：

- **基础物品**
  - Wooden chest (木箱)
  - Stone furnace (石炉)
  - Iron stick (铁棒)
  - Iron gear wheel (铁齿轮)
  - Copper cable (铜线)
  
- **工具和武器**
  - Pistol (手枪)
  - Firearm magazine (弹匣)
  
- **中间产品**
  - Electronic circuit (电路板)
  - Burner mining drill (燃烧采矿机)

### 2. 配方数据结构问题

当前配方数据结构：
```json
{
  "id": "wooden-chest",
  "name": "Wooden chest",
  "category": "logistics",
  "producers": ["assembling-machine-1", "assembling-machine-2", "assembling-machine-3"],
  "in": { "wood": 2 },
  "out": { "wooden-chest": 1 }
}
```

问题：
- 所有配方都列出了生产者（producers），但没有标记哪些可以手动制作
- 缺少 `allow_manual_crafting` 或类似的字段
- 配方类别（category）不能准确反映是否可手动制作

### 3. 建议的改进

1. **添加手动制作标记**
   ```json
   {
     "id": "wooden-chest",
     "allow_manual_crafting": true,
     "producers": ["player", "assembling-machine-1", ...]
   }
   ```

2. **区分配方类别**
   - `crafting` - 只能手动制作
   - `advanced-crafting` - 可以手动或在装配机中制作
   - `assembling` - 只能在装配机中制作
   - `smelting` - 只能在熔炉中制作

3. **完善验证逻辑**
   - 基于官方 Wiki 的规则创建白名单
   - 考虑游戏版本差异（基础游戏 vs 太空时代）

## 验证脚本使用说明

### 运行验证
```bash
# 完整验证
node scripts/validate-manual-crafting.cjs

# 检查特定物品
node scripts/check-specific-items.cjs
```

### 验证逻辑
1. 检查配方类别
2. 检查生产者限制
3. 检查流体材料
4. 检查特殊限制物品

## 结论

当前数据中的手动制作信息不完整，需要：
1. 更新配方数据，添加手动制作标记
2. 根据 Factorio Wiki 完善配方分类
3. 区分"可以手动制作"和"必须使用设备"的配方

这将使游戏的制作系统更准确地反映实际的 Factorio 游戏机制。