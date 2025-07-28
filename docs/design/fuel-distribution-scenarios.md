# 燃料分配场景分析

## 场景：10个石炉，5块煤炭

### 基础数据
- **石炉数量**：10个
- **煤炭数量**：5块
- **煤炭能量**：4 MJ/块
- **石炉功率**：0.09 MW (90 kW) - 基于data.json中的usage字段
- **石炉燃料槽**：1个槽位，最多50个物品

### 分配策略分析

#### 1. 当前设计（独立缓存）
在当前的设计中，每个石炉有独立的燃料缓存区，自动补充燃料的逻辑是：

```typescript
// 自动补充燃料时的行为
autoRefuelFacilities() {
  facilities.forEach(facility => {
    if (facility.fuelBuffer && !facility.fuelBuffer.isFull) {
      // 尝试补充燃料
      autoRefuel(facility);
    }
  });
}
```

**问题**：这会导致"先到先得"的情况，前5个石炉各得到1块煤炭，后5个石炉没有燃料。

**结果**：
- 工作的石炉：5个
- 每个工作石炉的运行时间：4 MJ ÷ 0.09 MW = 44.4秒
- 总产能：5个石炉同时工作44.4秒

#### 2. 优化方案A：均匀分配（不推荐）
如果将5块煤炭均匀分配给10个石炉：

```typescript
// 理论上的均匀分配
每个石炉获得：5 ÷ 10 = 0.5块煤炭
```

**问题**：Factorio不支持分割物品，煤炭是整数单位。

**结果**：技术上不可行

#### 3. 优化方案B：轮流使用（推荐）
实现一个更智能的燃料分配系统：

```typescript
// src/services/FuelService.ts 增强版
smartFuelDistribution(facilities: FacilityInstance[], availableFuel: number) {
  // 计算每个设施需要的燃料
  const fuelNeeds = facilities.map(facility => {
    const config = FACILITY_FUEL_CONFIGS[facility.facilityId];
    const maxEnergy = config.maxStackPerSlot * 4; // 假设使用煤炭
    const currentEnergy = facility.fuelBuffer?.totalEnergy || 0;
    return Math.max(0, maxEnergy - currentEnergy);
  });
  
  // 按需分配燃料
  let remainingFuel = availableFuel;
  facilities.forEach((facility, index) => {
    if (remainingFuel > 0 && fuelNeeds[index] > 0) {
      const fuelToAdd = Math.min(remainingFuel, fuelNeeds[index]);
      addFuel(facility, 'coal', fuelToAdd);
      remainingFuel -= fuelToAdd;
    }
  });
}
```

**优势**：
- 优先满足燃料不足的设施
- 避免燃料浪费
- 提高整体效率

### 实际运行时间对比

#### 当前设计（5个石炉工作）
- **总运行时间**：44.4秒
- **总铁板产出**：5 × (44.4 ÷ 3.2) ≈ 69个铁板

#### 智能分配（10个石炉轮流工作）
- **每个石炉运行时间**：44.4秒
- **总运行时间**：44.4秒
- **总铁板产出**：10 × (44.4 ÷ 3.2) ≈ 139个铁板

**结论**：在燃料总量相同的情况下，智能分配不会改变总产出，但可以提供更均匀的产能分布。

### 扩展场景分析

#### 场景A：燃料充足（50块煤炭，10个石炉）
- **当前设计**：每个石炉获得5块煤炭，运行222秒
- **智能分配**：每个石炉获得5块煤炭，运行222秒
- **结果**：两种方式效果相同

#### 场景B：燃料不足（3块煤炭，10个石炉）
- **当前设计**：前3个石炉各获得1块煤炭，运行44.4秒
- **智能分配**：10个石炉轮流使用3块煤炭，总运行时间相同
- **结果**：智能分配提供更均匀的产能

### 实现建议

1. **保持当前设计**：简单可靠，适合大多数情况
2. **添加智能分配选项**：作为高级功能，让玩家选择
3. **燃料预警系统**：当燃料不足时提醒玩家
4. **统计面板**：显示燃料使用效率和分配情况