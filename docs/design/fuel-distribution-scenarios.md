# 燃料分配场景分析

## 场景：10个石炉，5块煤炭

### 基础数据
- **石炉数量**：10个
- **煤炭数量**：5块
- **煤炭能量**：4 MJ/块
- **石炉功率**：0.18 MW (180 kW)
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
- 每个工作石炉的运行时间：4 MJ ÷ 0.18 MW = 22.2秒
- 总产能：5个石炉同时工作22.2秒

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
export class FuelService {
  /**
   * 智能分配燃料 - 优先给快要耗尽的设施
   */
  smartFuelDistribution(
    facilities: FacilityInstance[],
    getInventoryItem: (itemId: string) => InventoryItem
  ): void {
    // 获取需要燃料的设施，按剩余运行时间排序
    const needsFuel = facilities
      .filter(f => f.fuelBuffer && f.status !== 'stopped')
      .sort((a, b) => {
        const aTime = this.getFuelStatus(a.fuelBuffer!).estimatedRunTime;
        const bTime = this.getFuelStatus(b.fuelBuffer!).estimatedRunTime;
        return aTime - bTime; // 剩余时间少的优先
      });
    
    // 分配燃料
    for (const fuelType of FUEL_PRIORITY) {
      let available = getInventoryItem(fuelType).currentAmount;
      if (available <= 0) continue;
      
      for (const facility of needsFuel) {
        if (available <= 0) break;
        
        const result = this.addFuel(facility.fuelBuffer!, fuelType, 1);
        if (result.success) {
          available--;
        }
      }
    }
  }
}
```

**结果**：
- 初始：5个石炉各1块煤炭
- 22.2秒后：前5个石炉燃料耗尽，系统将剩余库存分配给其他石炉
- 实现了"轮流工作"的效果

#### 4. 优化方案C：优先级系统（最优）
基于生产优先级的分配：

```typescript
// 扩展 FacilityInstance 接口
interface FacilityInstance {
  // ... 现有字段
  priority?: number; // 优先级，数字越大优先级越高
}

// 智能分配考虑优先级
smartFuelDistribution(facilities: FacilityInstance[]) {
  const sorted = facilities
    .filter(f => f.fuelBuffer)
    .sort((a, b) => {
      // 1. 优先级高的优先
      if (a.priority !== b.priority) {
        return (b.priority || 0) - (a.priority || 0);
      }
      // 2. 正在生产的优先
      if (a.production?.progress !== b.production?.progress) {
        return (b.production?.progress || 0) - (a.production?.progress || 0);
      }
      // 3. 燃料少的优先
      return this.getFuelStatus(a.fuelBuffer!).estimatedRunTime - 
             this.getFuelStatus(b.fuelBuffer!).estimatedRunTime;
    });
  
  // ... 分配逻辑
}
```

### 实际游戏表现对比

#### 方案对比表

| 方案 | 同时工作数 | 总运行时间 | 产出效率 | 用户体验 |
|------|-----------|-----------|---------|---------|
| 当前设计 | 5个 | 22.2秒 | 一般 | 简单直观 |
| 轮流使用 | 1-5个交替 | 111秒 | 一般 | 较复杂 |
| 优先级系统 | 根据优先级 | 变化 | 最优 | 可控性强 |

### 实际案例：生产铁板

假设每个石炉生产铁板（3.2秒/个）：

#### 当前设计（5个石炉工作）
- 每个石炉运行时间：22.2秒
- 每个石炉产出：22.2 ÷ 3.2 ≈ 6.9个铁板
- **总产出：34.5个铁板**
- 产出时间：22.2秒内完成

#### 轮流工作（理想情况）
- 总能量：5 × 4 = 20 MJ
- 总运行时间：20 ÷ 0.18 = 111.1秒
- 单炉持续生产：111.1 ÷ 3.2 ≈ 34.7个铁板
- **总产出：34.7个铁板**
- 产出时间：111.1秒内陆续完成

### 建议的实现方式

```typescript
// 在 GameStore 中添加燃料分配策略
interface GameState {
  // ... 现有字段
  fuelDistributionMode: 'simple' | 'smart' | 'priority';
  
  // 设置燃料分配模式
  setFuelDistributionMode: (mode: 'simple' | 'smart' | 'priority') => void;
}

// 在生产循环中应用
useProductionLoop() {
  const { fuelDistributionMode } = useGameStore();
  
  useEffect(() => {
    const interval = setInterval(() => {
      switch (fuelDistributionMode) {
        case 'simple':
          // 先到先得
          autoRefuelSimple();
          break;
        case 'smart':
          // 智能轮流
          smartFuelDistribution();
          break;
        case 'priority':
          // 优先级分配
          priorityFuelDistribution();
          break;
      }
    }, 1000);
  }, [fuelDistributionMode]);
}
```

## 结论

对于"10个石炉，5块煤炭"的场景：

1. **简单模式**：5个石炉可以工作，每个工作22.2秒
2. **智能模式**：石炉轮流工作，总运行时间更长但分布更均匀
3. **优先级模式**：根据生产需求动态分配，效率最高

建议实现多种分配模式，让玩家根据需求选择：
- **新手玩家**：使用简单模式，容易理解
- **进阶玩家**：使用智能模式，资源利用更充分
- **高级玩家**：使用优先级模式，精确控制生产