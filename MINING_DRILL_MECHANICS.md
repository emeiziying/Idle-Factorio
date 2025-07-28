# 采掘机工作机制说明

## 概述

在Factorio中，采掘机（Mining Drill）是专门用于开采资源的设施。每个采掘机只能开采一种特定的资源，这是游戏的核心机制。

## 采掘机类型

### 1. 热能采掘机 (Burner Mining Drill)
- **燃料类型**：化学燃料（煤炭、木材等）
- **功率消耗**：150 kW
- **开采速度**：0.25
- **尺寸**：2x2
- **特点**：早期采矿设备，需要燃料

### 2. 电力采掘机 (Electric Mining Drill)
- **燃料类型**：电力
- **功率消耗**：90 kW
- **开采速度**：0.5
- **尺寸**：3x3
- **特点**：中期采矿设备，效率更高

### 3. 大型采掘机 (Big Mining Drill)
- **燃料类型**：电力
- **功率消耗**：300 kW
- **开采速度**：2.5
- **尺寸**：5x5
- **特点**：高级采矿设备，效率最高

## 工作机制

### 配方分配

每个采掘机在部署时都会被分配一个特定的采矿配方：

```typescript
// 采掘机添加时的配方选择逻辑
const relevantRecipe = facilityRecipes.find(recipe => 
  recipe.producers?.includes(facilityType) && 
  recipe.out && 
  recipe.out[item.id] !== undefined
);
```

### 生产限制

1. **单一资源**：每个采掘机只能生产一种特定的资源
2. **配方锁定**：采掘机一旦被分配配方，就不能更改
3. **资源专用**：采掘机只能开采它被分配的那种资源

### 部署逻辑

```typescript
// 在煤矿页面添加采掘机
const coalMiningRecipe = {
  id: "coal",
  out: { "coal": 1 },
  producers: ["burner-mining-drill", "electric-mining-drill", "big-mining-drill"]
};

// 在铁矿页面添加采掘机
const ironOreMiningRecipe = {
  id: "iron-ore-mining", 
  out: { "iron-ore": 1 },
  producers: ["burner-mining-drill", "electric-mining-drill", "big-mining-drill"]
};
```

## 用户界面说明

### 设施显示

在物品详情页面，采掘机会显示为"生产设施"：

- **煤矿页面**：显示采掘机，用于生产煤炭
- **铁矿页面**：显示采掘机，用于生产铁矿
- **铜矿页面**：显示采掘机，用于生产铜矿

### 添加逻辑

1. **页面上下文**：用户在哪个物品页面，采掘机就生产哪种物品
2. **配方分配**：采掘机被分配对应物品的采矿配方
3. **生产限制**：采掘机只能生产它被分配的那种物品

## 常见误解

### 误解1：采掘机可以生产多种物品

**事实**：每个采掘机只能生产一种特定的资源。在Factorio中，采掘机是资源专用的。

### 误解2：采掘机可以切换生产目标

**事实**：采掘机一旦被分配配方，就不能更改。如果需要生产其他资源，需要部署新的采掘机。

### 误解3：采掘机是通用的

**事实**：采掘机是资源专用的。煤矿需要专门的采掘机，铁矿需要专门的采掘机。

## 正确的使用方式

### 1. 按需部署

- 需要煤炭 → 在煤矿页面添加采掘机
- 需要铁矿 → 在铁矿页面添加采掘机
- 需要铜矿 → 在铜矿页面添加采掘机

### 2. 专用设备

- 每个采掘机只生产一种资源
- 不要期望一个采掘机生产多种资源
- 按资源类型分别部署采掘机

### 3. 效率优化

- 根据需求部署适当数量的采掘机
- 考虑燃料供应和电力需求
- 平衡不同资源的生产

## 技术实现

### 配方数据结构

```json
{
  "id": "coal",
  "name": "Coal", 
  "out": {
    "coal": 1
  },
  "producers": [
    "burner-mining-drill",
    "electric-mining-drill",
    "big-mining-drill"
  ],
  "flags": ["mining"]
}
```

### 设施实例结构

```typescript
interface FacilityInstance {
  id: string;
  facilityId: string; // 设施类型
  production: {
    currentRecipeId: string; // 固定的配方ID
    progress: number;
    inputBuffer: any[];
    outputBuffer: any[];
  };
  status: 'running' | 'stopped' | 'no_fuel' | 'no_materials';
  efficiency: number;
}
```

## 总结

采掘机的工作机制是：

1. **资源专用**：每个采掘机只能生产一种特定资源
2. **配方锁定**：采掘机一旦被分配配方就不能更改
3. **按需部署**：根据需要的资源类型部署相应的采掘机
4. **效率优先**：根据生产需求选择合适的采掘机类型

这种设计确保了：
- 游戏平衡性
- 资源管理的策略性
- 符合Factorio原版游戏机制
- 清晰的用户界面逻辑 