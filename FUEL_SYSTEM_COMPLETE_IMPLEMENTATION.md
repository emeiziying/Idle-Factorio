# 燃料系统完整实现

## 概述

燃料系统是Factorio游戏的核心机制之一。所有需要能源的机器都必须消耗燃料才能工作。本系统实现了完整的燃料管理功能。

## 燃料机器类型

### 1. 化学燃料机器 (Chemical Fuel)

#### 热能采掘机 (Burner Mining Drill)
- **燃料类型**：化学燃料（煤炭、木材等）
- **功率消耗**：150 kW
- **燃料槽位**：1个
- **特点**：早期采矿设备，需要燃料

#### 石炉 (Stone Furnace)
- **燃料类型**：化学燃料
- **功率消耗**：90 kW
- **燃料槽位**：1个
- **特点**：基础冶炼设备

#### 钢炉 (Steel Furnace)
- **燃料类型**：化学燃料
- **功率消耗**：90 kW
- **燃料槽位**：1个
- **特点**：高效冶炼设备

#### 热能机械臂 (Burner Inserter)
- **燃料类型**：化学燃料
- **功率消耗**：13.4 kW
- **燃料槽位**：1个
- **特点**：早期物流设备

#### 锅炉 (Boiler)
- **燃料类型**：化学燃料
- **功率消耗**：1800 kW
- **燃料槽位**：1个
- **特点**：蒸汽发电设备

#### 加热塔 (Heating Tower)
- **燃料类型**：化学燃料
- **功率消耗**：40000 kW
- **燃料槽位**：1个
- **特点**：高级加热设备

#### 机车 (Locomotive)
- **燃料类型**：化学燃料
- **功率消耗**：600 kW
- **燃料槽位**：3个
- **特点**：运输设备

### 2. 核燃料机器 (Nuclear Fuel)

#### 核反应堆 (Nuclear Reactor)
- **燃料类型**：核燃料
- **功率消耗**：40000 kW
- **燃料槽位**：1个
- **特点**：高级发电设备

### 3. 营养燃料机器 (Nutrients Fuel)

#### 农业塔 (Agricultural Tower)
- **燃料类型**：营养燃料
- **功率消耗**：500 kW
- **燃料槽位**：1个
- **特点**：农业设备

### 4. 食物燃料机器 (Food Fuel)

#### 俘虏虫巢 (Captive Biter Spawner)
- **燃料类型**：食物燃料
- **功率消耗**：100 kW
- **燃料槽位**：1个
- **特点**：生物设备

## 燃料类别

```typescript
export type FuelCategory = 'chemical' | 'nuclear' | 'nutrients' | 'food';
```

### 燃料优先级

```typescript
export const FUEL_PRIORITY = [
  'coal',           // 4 MJ - 优先使用煤炭
  'solid-fuel',     // 12 MJ - 其次使用固体燃料
  'rocket-fuel',    // 100 MJ - 高级燃料
  'nuclear-fuel',   // 1.21 GJ - 核燃料
  'wood'            // 2 MJ - 最后使用木材
];
```

## 技术实现

### 1. 燃料配置系统

```typescript
export interface FuelConfig {
  acceptedCategories: FuelCategory[];
  fuelSlots: number;
  maxStackPerSlot: number;
  basePowerConsumption: number;
}
```

### 2. 燃料缓存区

```typescript
export interface FuelBuffer {
  slots: FuelSlot[];
  maxSlots: number;
  totalEnergy: number;
  maxEnergy: number;
  consumptionRate: number;
  lastUpdate: number;
}
```

### 3. 设施初始化

```typescript
// 在设施添加时初始化燃料缓存区
const fuelService = FuelService.getInstance();
const fuelBuffer = fuelService.initializeFuelBuffer(facilityType);

const newFacility: FacilityInstance = {
  // ... 其他属性
  fuelBuffer: fuelBuffer || undefined
};
```

## 燃料消耗机制

### 1. 实时消耗

```typescript
// 每秒更新燃料消耗
updateFuelConsumption(deltaTime: number) {
  facilities.forEach(facility => {
    if (facility.fuelBuffer && facility.status === 'running') {
      const result = fuelService.updateFuelConsumption(facility, deltaTime);
      if (!result.success) {
        // 燃料耗尽，停止生产
        updateFacility(facility.id, { status: 'no_fuel' });
      }
    }
  });
}
```

### 2. 自动补充

```typescript
// 自动补充燃料
autoRefuelFacilities() {
  facilities.forEach(facility => {
    if (facility.fuelBuffer && facility.status !== 'stopped') {
      const result = fuelService.autoRefuel(facility, getInventoryItem);
      if (result.success) {
        // 扣除库存中的燃料
        Object.entries(result.itemsConsumed).forEach(([itemId, amount]) => {
          updateInventory(itemId, -amount);
        });
      }
    }
  });
}
```

## 用户界面

### 1. 燃料状态显示

```typescript
// 显示燃料状态
<FuelStatusDisplay
  fuelBuffer={facility.fuelBuffer}
  compact={false}
/>
```

### 2. 燃料进度条

- **填充进度**：显示燃料缓存区的填充百分比
- **燃烧进度**：显示当前燃料的燃烧进度（100%到0%）
- **运行时间**：估算剩余运行时间

## 燃料管理策略

### 1. 智能分配

```typescript
// 智能燃料分配
smartFuelDistribution(facilities, getInventoryItem, updateInventory) {
  // 根据设施优先级分配燃料
  // 优先保证关键设施运行
  // 平衡燃料消耗
}
```

### 2. 优先级管理

```typescript
// 燃料优先级
const FUEL_PRIORITY = [
  'coal',           // 基础燃料
  'solid-fuel',     // 中级燃料
  'rocket-fuel',    // 高级燃料
  'nuclear-fuel',   // 顶级燃料
  'wood'            // 备用燃料
];
```

## 生产限制

### 1. 燃料依赖

```typescript
// 检查燃料状态
if (facility.status === 'no_fuel') {
  // 停止生产
  return;
}
```

### 2. 材料检查

```typescript
// 检查输入材料
let hasEnoughMaterials = true;
if (recipe.in) {
  for (const [itemId, required] of Object.entries(recipe.in)) {
    const inventory = getInventoryItem(itemId);
    if (inventory.currentAmount < required) {
      hasEnoughMaterials = false;
      break;
    }
  }
}

// 如果材料不足，不消耗燃料
if (!hasEnoughMaterials) {
  return { energyConsumed: 0 };
}
```

## 系统优势

### 1. 真实性

- 符合Factorio原版游戏机制
- 所有机器都需要能源才能工作
- 燃料管理是游戏策略的重要组成部分

### 2. 平衡性

- 燃料消耗限制了生产速度
- 需要平衡不同资源的消耗
- 促进了资源管理的策略性

### 3. 用户体验

- 清晰的燃料状态显示
- 自动燃料补充功能
- 智能燃料分配策略

## 总结

燃料系统的完整实现确保了：

1. **真实性**：所有需要能源的机器都正确消耗燃料
2. **平衡性**：燃料消耗限制了生产，增加了策略性
3. **用户体验**：清晰的界面和自动管理功能
4. **扩展性**：支持多种燃料类型和机器类型

这个系统为游戏提供了真实的资源管理体验，符合Factorio原版游戏的设计理念。 