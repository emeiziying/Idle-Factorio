# 燃料系统实现计划

## 系统概述

燃料系统将为所有燃料型设施（石炉、钢炉、热能采矿机等）提供燃料管理功能。每个设施实例都有独立的燃料缓存区，可以存储一定量的燃料来维持运行。

## 核心设计

### 1. 数据结构

```typescript
// src/types/facilities.ts
export interface FuelBuffer {
  slots: FuelSlot[];
  maxSlots: number;
  totalEnergy: number;
  maxEnergy: number;
  consumptionRate: number;
  lastUpdate: number;
}

export interface FuelSlot {
  itemId: string;
  quantity: number;
  remainingEnergy: number;
}
```

### 2. 燃料配置

```typescript
// src/data/fuelConfigs.ts
export const FACILITY_FUEL_CONFIGS: Record<string, FuelConfig> = {
  'stone-furnace': {
    acceptedCategories: ['chemical'],
    fuelSlots: 1,
    maxStackPerSlot: 50,
    basePowerConsumption: 0.09  // 90kW (基于data.json)
  },
  'steel-furnace': {
    acceptedCategories: ['chemical'],
    fuelSlots: 1,
    maxStackPerSlot: 50,
    basePowerConsumption: 0.09  // 90kW (基于data.json)
  }
};
```

## 实现步骤

### 阶段1：核心服务

1. **FuelService 实现**
   - 初始化燃料缓存
   - 更新燃料消耗
   - 添加燃料
   - 自动补充

2. **GameStore 集成**
   - 添加燃料相关状态
   - 实现燃料管理动作

### 阶段2：UI组件

1. **FuelStatusDisplay 组件**
   - 显示燃料状态
   - 进度条显示
   - 剩余时间计算

2. **燃料管理界面**
   - 手动添加燃料
   - 燃料分配策略

### 阶段3：游戏循环

1. **useProductionLoop 集成**
   - 每秒更新燃料消耗
   - 自动补充燃料

## 关键计算

### 燃料消耗计算

```typescript
// 基于data.json中的usage字段
const stoneFurnaceConfig = {
  basePowerConsumption: 0.09, // MW (90kW)
  craftingSpeed: 1.0
};

const ironPlateRecipe = {
  time: 3.2, // 秒
  output: 1
};

// 每个铁板消耗的能量
const energyPerPlate = stoneFurnaceConfig.basePowerConsumption * ironPlateRecipe.time;
// = 0.09 * 3.2 = 0.288 MJ

// 使用煤炭（4 MJ）
const platesPerCoal = 4 / 0.288; // ≈ 13.89 个铁板
```

### 性能优化建议

1. **批量更新**
   ```typescript
   // 不好的做法：每帧更新
   useEffect(() => {
     const interval = setInterval(() => {
       updateFuelConsumption();
     }, 16); // 60 FPS
   });
   
   // 好的做法：每秒更新
   useEffect(() => {
     const interval = setInterval(() => {
       updateFuelConsumption();
     }, 1000); // 1秒
   });
   ```

2. **缓存计算结果**
   ```typescript
   const fuelStatusCache = new Map<string, FuelStatus>();
   
   getFuelStatus(buffer: FuelBuffer): FuelStatus {
     const cacheKey = `${buffer.totalEnergy}-${buffer.consumptionRate}`;
     if (fuelStatusCache.has(cacheKey)) {
       return fuelStatusCache.get(cacheKey)!;
     }
     // ... 计算逻辑
     fuelStatusCache.set(cacheKey, status);
     return status;
   }
   ```

## 注意事项

1. **向后兼容**：确保没有燃料系统的设施仍能正常工作
2. **数据持久化**：燃料缓存需要保存到 localStorage
3. **UI响应**：避免频繁更新导致的性能问题
4. **错误处理**：妥善处理燃料配置缺失等异常情况

## 测试用例

### 基础功能测试
- [ ] 石炉可以添加煤炭作为燃料
- [ ] 燃料消耗正确计算
- [ ] 燃料耗尽时设施停止
- [ ] 自动补充燃料功能正常
- [ ] UI显示燃料状态

### 边界条件测试
- [ ] 燃料槽已满时不能继续添加
- [ ] 多种燃料按优先级使用
- [ ] 设施暂停时不消耗燃料
- [ ] 快速切换设施状态时燃料计算正确

### 性能测试
- [ ] 100个石炉同时运行时性能正常
- [ ] 内存使用稳定，无泄漏

## 后续扩展

1. **燃料效率科技**：研究提升燃料利用率
2. **燃料物流**：机械臂自动添加燃料
3. **混合燃料**：支持多种燃料混合使用
4. **燃料指示器**：更丰富的视觉反馈
5. **智能燃料管理**：根据生产需求自动调配燃料