# 智能燃料分配系统

## 概述

智能燃料分配系统基于设施优先级和燃料短缺情况，确保关键设施（如热力采掘机）优先获得燃料供应。**只考虑`"type": "burner"`的设施**，因为只有burner类型的设施才需要燃料。

## 设施优先级

### 优先级配置

```typescript
private static readonly FACILITY_PRIORITY: Record<string, number> = {
  // 生产类设施 - 高优先级
  'burner-mining-drill': 1,    // 热力采掘机 - 生产煤炭，最高优先级
  
  // 冶炼类设施 - 中优先级
  'stone-furnace': 10,         // 石炉 - 冶炼基础材料
  'steel-furnace': 11,         // 钢炉 - 冶炼高级材料
  
  // 发电类设施 - 低优先级
  'boiler': 20,                // 锅炉 - 发电设备，需要燃料
  
  // 其他burner设施 - 最低优先级
  'burner-inserter': 30,       // 热能机械臂 - 物流设备
  'locomotive': 31,            // 机车 - 运输设备
  'heating-tower': 32,         // 加热塔 - 高级设备
  'agricultural-tower': 33,    // 农业塔 - 农业设备
  'captive-biter-spawner': 34  // 俘虏虫巢 - 生物设备
};
```

### 优先级说明

| 优先级范围 | 设施类型 | 说明 |
|------------|----------|------|
| 1-5 | 生产设施 | 热力采掘机等生产基础资源的burner设施 |
| 10-15 | 冶炼设施 | 石炉、钢炉等冶炼材料的burner设施 |
| 20-25 | 发电设施 | 锅炉等发电设备的burner设施 |
| 30+ | 其他burner设施 | 物流、运输、农业等辅助burner设施 |

### 设施类型过滤

```typescript
// 获取需要燃料的burner设施，按优先级排序
const needsFuel = facilities
  .filter(f => {
    // 只考虑burner类型的设施
    const itemData = DataService.getInstance().getItem(f.facilityId);
    return f.fuelBuffer && 
           f.status !== FacilityStatus.STOPPED && 
           itemData?.machine?.type === 'burner';
  })
```

**注意**: 只有`"type": "burner"`的设施才会参与燃料分配，`"type": "electric"`的设施（如电力采掘机、大型采掘机等）不参与燃料分配。

## 分配策略

### 1. 燃料充足时的分配

```typescript
private distributeFuelNormally(
  facilities: FacilityInstance[],
  fuelPriority: string[],
  fuelAvailable: Record<string, number>,
  getInventoryItem: (itemId: string) => InventoryItem,
  updateInventory: (itemId: string, amount: number) => void
): void {
  for (const facility of facilities) {
    if (!facility.fuelBuffer) continue;
    
    const status = this.getFuelStatus(facility.fuelBuffer);
    if (status.isEmpty) {
      // 为设施分配燃料
      for (const fuelType of fuelPriority) {
        if (fuelAvailable[fuelType] > 0 && this.isFuelCompatible(facility.facilityId, fuelType)) {
          const result = this.addFuel(facility.fuelBuffer!, fuelType, 1, facility.facilityId);
          if (result.success) {
            fuelAvailable[fuelType]--;
            updateInventory(fuelType, -1);
            break;
          }
        }
      }
    }
  }
}
```

### 2. 燃料短缺时的分配

```typescript
private distributeFuelWithShortage(
  facilities: FacilityInstance[],
  fuelPriority: string[],
  fuelAvailable: Record<string, number>,
  getInventoryItem: (itemId: string) => InventoryItem,
  updateInventory: (itemId: string, amount: number) => void
): void {
  // 按优先级分配燃料
  for (const facility of facilities) {
    if (!facility.fuelBuffer) continue;
    
    const status = this.getFuelStatus(facility.fuelBuffer);
    if (status.isEmpty) {
      const facilityPriority = this.getFacilityPriority(facility.facilityId);
      
      // 为设施分配燃料
      for (const fuelType of fuelPriority) {
        if (fuelAvailable[fuelType] > 0 && this.isFuelCompatible(facility.facilityId, fuelType)) {
          // 高优先级设施获得更多燃料
          const allocationAmount = facilityPriority <= 5 ? Math.min(3, fuelAvailable[fuelType]) : 1;
          
          if (allocationAmount > 0) {
            const result = this.addFuel(facility.fuelBuffer!, fuelType, allocationAmount, facility.facilityId);
            if (result.success) {
              fuelAvailable[fuelType] -= allocationAmount;
              updateInventory(fuelType, -allocationAmount);
              break;
            }
          }
        }
      }
    }
  }
}
```

## 分配逻辑

### 1. 需求计算

```typescript
// 计算每个设施需要的燃料
needsFuel.forEach(facility => {
  if (!facility.fuelBuffer) return;
  
  const status = this.getFuelStatus(facility.fuelBuffer);
  if (status.isEmpty) {
    // 设施没有燃料，需要补充
    const facilityPriority = this.getFacilityPriority(facility.facilityId);
    
    // 根据设施优先级分配燃料需求
    for (const fuelType of fuelPriority) {
      if (this.isFuelCompatible(facility.facilityId, fuelType)) {
        // 高优先级设施获得更多燃料分配
        const demandMultiplier = facilityPriority <= 5 ? 3 : facilityPriority <= 15 ? 2 : 1;
        fuelDemand[fuelType] += demandMultiplier;
        break; // 只分配一种燃料类型
      }
    }
  }
});
```

### 2. 短缺检测

```typescript
// 检查是否有燃料短缺
let hasShortage = false;
for (const fuelType of fuelPriority) {
  if (fuelDemand[fuelType] > fuelAvailable[fuelType]) {
    hasShortage = true;
    break;
  }
}
```

### 3. 分配策略选择

```typescript
if (hasShortage) {
  // 燃料短缺时的分配策略
  this.distributeFuelWithShortage(needsFuel, fuelPriority, fuelAvailable, getInventoryItem, updateInventory);
} else {
  // 燃料充足时的正常分配
  this.distributeFuelNormally(needsFuel, fuelPriority, fuelAvailable, getInventoryItem, updateInventory);
}
```

## 实际效果

### 1. 热力采掘机优先（burner类型）

- **优先级**: 1（最高）
- **燃料分配**: 在燃料短缺时获得3倍燃料
- **原因**: 生产煤炭，是供应链的源头
- **类型**: `"type": "burner"`

### 2. 石炉次之（burner类型）

- **优先级**: 10（中等）
- **燃料分配**: 在燃料短缺时获得1倍燃料
- **原因**: 消耗煤炭，可以暂时停止
- **类型**: `"type": "burner"`

### 3. 锅炉（burner类型）

- **优先级**: 20（较低）
- **燃料分配**: 在燃料充足时才分配
- **原因**: 发电设备，可以暂时停止
- **类型**: `"type": "burner"`

### 4. 其他burner设施

- **优先级**: 30+（最低）
- **燃料分配**: 在燃料充足时才分配
- **原因**: 非关键设施，可以暂停运行
- **类型**: `"type": "burner"`

### 4. 电力设施（不参与分配）

- **类型**: `"type": "electric"`
- **燃料需求**: 无（使用电力）
- **分配策略**: 不参与燃料分配
- **示例**: 电力采掘机、大型采掘机等

## 使用场景

### 1. 煤炭充足时

```
热力采掘机(burner) → 石炉(burner) → 锅炉(burner) → 其他burner设施
      ↓                    ↓              ↓              ↓
     煤炭                 铁板           发电           辅助功能
```

### 2. 煤炭短缺时

```
热力采掘机(burner, 3倍燃料) → 石炉(burner, 1倍燃料) → 锅炉(burner, 暂停) → 其他burner设施(暂停)
      ↓                              ↓
    煤炭生产                        铁板生产
```

### 3. 完全短缺时

```
热力采掘机(burner, 仅此设施运行) → 其他burner设施(全部暂停)
      ↓
    煤炭生产
```

### 4. 电力设施（始终不参与）

```
电力采掘机(electric) → 大型采掘机(electric) → 其他电力设施
      ↓                    ↓
    基础资源生产          高级资源生产
```

**注意**: 电力设施（`"type": "electric"`）不参与燃料分配，因为它们使用电力而非燃料。

## 系统优势

### 1. 供应链保护

- 优先保证生产设施运行
- 确保基础资源供应
- 防止供应链中断

### 2. 智能分配

- 根据设施重要性分配燃料
- 在短缺时优先关键设施
- 动态调整分配策略

### 3. 游戏平衡

- 增加策略性思考
- 促进资源管理
- 符合真实工业逻辑

## 总结

智能燃料分配系统确保了：

1. **只考虑burner设施** - 只有`"type": "burner"`的设施参与燃料分配
2. **热力采掘机最高优先级** - 保证煤炭生产
3. **冶炼设施中等优先级** - 在煤炭充足时运行
4. **发电设施较低优先级** - 锅炉等发电设备在资源充足时运行
5. **其他burner设施最低优先级** - 在资源充足时运行
6. **电力设施不参与** - `"type": "electric"`的设施不参与燃料分配
7. **动态分配策略** - 根据燃料短缺情况调整

这个系统确保了生产链的稳定性，符合Factorio游戏的设计理念，并且只对真正需要燃料的burner设施进行分配。 