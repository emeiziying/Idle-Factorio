# 石炉燃料缓存区容量分析

## 石炉燃料缓存配置

根据设计文档中的配置：

```typescript
// src/data/fuelConfigs.ts
FACILITY_FUEL_CONFIGS = {
  'stone-furnace': {
    acceptedCategories: ['chemical'],
    fuelSlots: 1,                    // 1个燃料槽位
    maxStackPerSlot: 50,             // 每槽最多50个物品
    basePowerConsumption: 0.18       // 180kW
  }
}
```

## 缓存区容量详解

### 1. 物理容量
- **槽位数量**：1个槽位
- **每槽最大堆叠**：50个物品
- **总容量**：1 × 50 = **50个燃料物品**

### 2. 能量容量
能量容量取决于存储的燃料类型：

| 燃料类型 | 单位能量 | 最大数量 | 总能量 | 满载运行时间 |
|---------|----------|----------|--------|--------------|
| 木材 | 2 MJ | 50 | 100 MJ | 9.3 分钟 |
| 煤炭 | 4 MJ | 50 | 200 MJ | 18.5 分钟 |
| 固体燃料 | 12 MJ | 50 | 600 MJ | 55.6 分钟 |
| 火箭燃料 | 100 MJ | 50 | 5000 MJ | 7.7 小时 |
| 核燃料 | 1210 MJ | 50 | 60500 MJ | 3.9 天 |

### 3. 运行时间计算

```typescript
// 计算公式
运行时间(秒) = 总能量(MJ) ÷ 功率消耗(MW)
运行时间(秒) = 总能量(MJ) ÷ 0.18

// 煤炭示例
满载煤炭运行时间 = (50 × 4) ÷ 0.18 = 1111 秒 ≈ 18.5 分钟
```

### 4. 实际生产能力

以铁板生产为例（3.2秒/个）：

| 燃料类型 | 满载可生产铁板数 | 单位燃料产出 |
|---------|----------------|--------------|
| 木材 | 174 个 | 3.5 个/木材 |
| 煤炭 | 347 个 | 6.9 个/煤炭 |
| 固体燃料 | 1042 个 | 20.8 个/燃料 |
| 火箭燃料 | 8681 个 | 173.6 个/燃料 |

## 缓存区设计理念

### 1. 为什么是50个物品？
- **平衡性**：足够的缓存避免频繁补充
- **真实性**：符合Factorio原版设定
- **实用性**：满载煤炭可运行约18分钟

### 2. 为什么只有1个槽位？
- **简单性**：石炉是基础设施，设计简单
- **策略性**：需要玩家选择合适的燃料
- **升级路径**：钢炉可能有更多槽位

## UI显示示例

```typescript
// FuelStatusDisplay 组件显示
<Box>
  {/* 燃料槽位显示 */}
  <Box display="flex" gap={1}>
    {/* 已填充槽位 */}
    {fuelBuffer.slots.map(slot => (
      <Tooltip title={`${slot.itemId}: ${slot.quantity}/50`}>
        <Box>
          <FactorioIcon 
            itemId={slot.itemId}
            size={32}
            quantity={slot.quantity}
          />
          <LinearProgress 
            value={(slot.quantity / 50) * 100}
            variant="determinate"
          />
        </Box>
      </Tooltip>
    ))}
    
    {/* 空槽位（如果有） */}
    {fuelBuffer.slots.length === 0 && (
      <Box sx={{
        width: 32,
        height: 32,
        border: '2px dashed grey',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <LocalFireDepartment color="disabled" />
      </Box>
    )}
  </Box>
  
  {/* 容量文字 */}
  <Typography variant="caption">
    容量: {currentAmount}/50 
    ({(currentAmount/50*100).toFixed(0)}%)
  </Typography>
</Box>
```

## 与其他熔炉对比

| 熔炉类型 | 槽位数 | 每槽容量 | 总容量 | 功率 | 效率提升 |
|---------|--------|----------|--------|------|----------|
| 石炉 | 1 | 50 | 50 | 180kW | 1.0x |
| 钢炉 | 1 | 50 | 50 | 360kW | 2.0x |
| 电炉 | 0 | 0 | 0 | 180kW | 2.0x |

**注**：电炉使用电力，无需燃料缓存

## 优化建议

### 1. 自动补充策略
```typescript
// 当燃料低于20%时自动补充
const AUTO_REFUEL_THRESHOLD = 0.2;

if (slot.quantity / maxStackPerSlot < AUTO_REFUEL_THRESHOLD) {
  // 触发自动补充
  autoRefuel(facility);
}
```

### 2. 燃料预警
```typescript
// 剩余运行时间少于1分钟时警告
const WARNING_TIME = 60; // 秒

if (estimatedRunTime < WARNING_TIME) {
  // 显示燃料不足警告
  showFuelWarning(facility);
}
```

### 3. 批量添加
```typescript
// 支持Shift+点击添加整组燃料
onShiftClick() {
  const stackSize = getItemStackSize(fuelItemId);
  addFuel(facility, fuelItemId, stackSize);
}
```

## 总结

石炉的燃料缓存区设计为：
- **容量**：1个槽位，最多50个物品
- **满载煤炭**：可运行18.5分钟
- **满载木材**：可运行9.3分钟
- **设计理念**：简单实用，平衡游戏性

这个容量设计既保证了游戏的流畅性（不需要频繁加燃料），又保持了一定的挑战性（需要管理燃料供应）。