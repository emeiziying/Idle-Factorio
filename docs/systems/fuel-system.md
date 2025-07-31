# 燃料系统完整文档

## 系统概述

燃料消耗系统用于管理游戏中所有燃料型设施（如石炉、钢炉、热能采矿机等）的燃料供应和消耗。每个设施实例都有独立的燃料缓存区，可以存储一定量的燃料来维持运行。

## 目录

1. [核心设计](#核心设计)
2. [数据结构](#数据结构)
3. [燃料配置](#燃料配置)
4. [服务层实现](#服务层实现)
5. [UI组件](#ui组件)
6. [游戏循环集成](#游戏循环集成)
7. [使用场景](#使用场景)
8. [性能优化](#性能优化)
9. [测试与验证](#测试与验证)

---

## 核心设计

### 设计原则

1. **独立性**：每个设施实例拥有独立的燃料缓存区
2. **灵活性**：支持多种燃料类型，不同燃料有不同的能量值
3. **自动化**：自动从库存补充燃料，智能选择最优燃料
4. **可视化**：清晰显示燃料状态和消耗情况
5. **性能优化**：批量处理，避免频繁的小额更新

### 关键计算

#### 石炉燃料消耗

- 功率：90 kW (0.09 MW) - 基于data.json中的usage字段
- 煤炭能量：4 MJ/块
- 单块煤炭运行时间：4 ÷ 0.09 = 44.4秒
- 满载50块煤炭：运行37.0分钟

#### 生产效率

```typescript
// 每个铁板消耗的能量
const energyPerPlate = 0.09 MW × 3.2秒 = 0.288 MJ

// 使用煤炭（4 MJ）
const platesPerCoal = 4 / 0.288 ≈ 13.9 个铁板
```

---

## 数据结构

### FacilityInstance 扩展

```typescript
export interface FacilityInstance {
  id: string;
  facilityId: string;
  count: number;
  status: FacilityStatus;
  efficiency: number;
  powerConsumption?: number;
  powerGeneration?: number;
  production?: ProductionData;

  // 新增：燃料缓存区
  fuelBuffer?: FuelBuffer;
}
```

### 燃料缓存区结构

```typescript
export interface FuelBuffer {
  // 当前燃料槽
  slots: FuelSlot[];
  // 最大槽位数（石炉1个，钢炉1个）
  maxSlots: number;
  // 当前总能量 (MJ)
  totalEnergy: number;
  // 最大能量存储 (MJ)
  maxEnergy: number;
  // 能量消耗率 (MW)
  consumptionRate: number;
  // 上次更新时间
  lastUpdate: number;
}

export interface FuelSlot {
  // 燃料物品ID
  itemId: string;
  // 数量
  quantity: number;
  // 剩余能量 (MJ)
  remainingEnergy: number;
}
```

---

## 燃料配置

### 设施燃料配置

```typescript
export const FACILITY_FUEL_CONFIGS: Record<string, FuelConfig> = {
  'stone-furnace': {
    acceptedCategories: ['chemical'],
    fuelSlots: 1,
    maxStackPerSlot: 50,
    basePowerConsumption: 0.09, // 90kW
  },
  'steel-furnace': {
    acceptedCategories: ['chemical'],
    fuelSlots: 1,
    maxStackPerSlot: 50,
    basePowerConsumption: 0.09, // 90kW
  },
  'burner-mining-drill': {
    acceptedCategories: ['chemical'],
    fuelSlots: 1,
    maxStackPerSlot: 50,
    basePowerConsumption: 0.15, // 150kW
  },
};
```

### 燃料优先级

```typescript
// 燃料优先级（从低到高）
export const FUEL_PRIORITY = [
  'wood', // 2 MJ
  'coal', // 4 MJ
  'solid-fuel', // 12 MJ
  'rocket-fuel', // 100 MJ
  'nuclear-fuel', // 1.21 GJ
];
```

### 缓存区容量分析

| 燃料类型 | 单位能量 | 最大数量 | 总能量   | 满载运行时间 |
| -------- | -------- | -------- | -------- | ------------ |
| 木材     | 2 MJ     | 50       | 100 MJ   | 18.5 分钟    |
| 煤炭     | 4 MJ     | 50       | 200 MJ   | 37.0 分钟    |
| 固体燃料 | 12 MJ    | 50       | 600 MJ   | 111.1 分钟   |
| 火箭燃料 | 100 MJ   | 50       | 5000 MJ  | 15.4 小时    |
| 核燃料   | 1210 MJ  | 50       | 60500 MJ | 7.8 天       |

---

## 服务层实现

### FuelService 核心服务

```typescript
export class FuelService {
  private static instance: FuelService;

  // 单例模式
  static getInstance(): FuelService {
    if (!FuelService.instance) {
      FuelService.instance = new FuelService();
    }
    return FuelService.instance;
  }

  // 初始化设施的燃料缓存区
  initializeFuelBuffer(facilityId: string): FuelBuffer;

  // 更新燃料消耗
  updateFuelConsumption(facility: FacilityInstance, deltaTime: number, isProducing: boolean = true): FuelUpdateResult;

  // 添加燃料到缓存区
  addFuel(buffer: FuelBuffer, itemId: string, quantity: number): AddFuelResult;

  // 自动补充燃料
  autoRefuel(facility: FacilityInstance, getInventoryItem: (itemId: string) => InventoryItem): AutoRefuelResult;

  // 获取燃料状态信息
  getFuelStatus(buffer: FuelBuffer): FuelStatus;

  // 智能燃料分配（可选功能）
  smartFuelDistribution(facilities: FacilityInstance[], availableFuel: number): void;
}
```

### 状态管理集成

```typescript
// GameStore 中的燃料相关方法
interface GameStore {
  // 添加设施时自动初始化燃料缓存
  addFacility: (facility: FacilityInstance) => void;

  // 手动添加燃料
  refuelFacility: (facilityId: string, fuelItemId: string, quantity: number) => boolean;

  // 自动补充所有设施的燃料
  autoRefuelFacilities: () => void;

  // 更新燃料消耗（生产循环中调用）
  updateFuelConsumption: (deltaTime: number) => void;
}
```

---

## UI组件

### FuelStatusDisplay 组件

显示设施的燃料状态，支持两种模式：

#### 紧凑模式

- 燃料图标
- 进度条
- 剩余时间

#### 完整模式

- 燃料槽位可视化
- 详细能量信息
- 空槽位指示
- 燃料物品数量

```typescript
interface FuelStatusDisplayProps {
  fuelBuffer: FuelBuffer;
  facilityId: string;
  compact?: boolean;
}
```

### 集成示例

```typescript
// 在设施卡片中显示燃料状态
{facilityInstance.fuelBuffer && (
  <Box sx={{ mt: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
    <FuelStatusDisplay
      fuelBuffer={facilityInstance.fuelBuffer}
      facilityId={facilityType}
      compact={true}
    />
  </Box>
)}
```

---

## 游戏循环集成

### useProductionLoop Hook

```typescript
export const useProductionLoop = () => {
  const updateProduction = useCallback(
    (deltaTime: number) => {
      facilities.forEach((facility) => {
        // 检查是否需要燃料
        if (facility.fuelBuffer) {
          // 更新燃料消耗
          const fuelResult = fuelService.updateFuelConsumption(facility, deltaTime, facility.status === 'running');

          // 燃料不足时停止生产
          if (!fuelResult.success && facility.status === 'running') {
            updateFacility(facility.id, { status: 'no_fuel' });

            // 尝试自动补充燃料
            const refuelResult = fuelService.autoRefuel(facility, getInventoryItem);
            if (refuelResult.success) {
              // 扣除库存并恢复运行
              Object.entries(refuelResult.itemsConsumed).forEach(([itemId, amount]) => {
                updateInventory(itemId, -amount);
              });
              updateFacility(facility.id, { status: 'running' });
            }
          }
        }
      });
    },
    [facilities, updateFacility]
  );
};
```

---

## 使用场景

### 场景1：基础使用流程

1. **部署设施**：用户在物品详情页面点击"添加"按钮
2. **初始化**：系统自动为设施创建燃料缓存区
3. **自动补充**：从库存中自动添加燃料
4. **生产运行**：设施开始生产，消耗燃料
5. **状态监控**：UI显示燃料状态和剩余时间

### 场景2：燃料分配策略

#### 当前设计（独立缓存）

- 每个设施独立管理燃料
- "先到先得"的分配方式
- 简单可靠，适合大多数情况

#### 智能分配（可选功能）

- 根据需求动态分配燃料
- 优先满足燃料不足的设施
- 提高整体生产效率

### 场景3：多设施管理

**案例：10个石炉，5块煤炭**

- **独立模式**：前5个石炉各得1块煤炭，后5个无燃料
- **智能模式**：10个石炉轮流使用燃料，均匀分配产能
- **总产出相同**：两种模式的总产出一致，但分配更均匀

---

## 性能优化

### 1. 批量更新策略

```typescript
// 不推荐：每帧更新（60 FPS）
setInterval(() => updateFuelConsumption(), 16);

// 推荐：每秒更新
setInterval(() => updateFuelConsumption(), 1000);
```

### 2. 缓存优化

```typescript
const fuelStatusCache = new Map<string, FuelStatus>();

getFuelStatus(buffer: FuelBuffer): FuelStatus {
  const cacheKey = `${buffer.totalEnergy}-${buffer.consumptionRate}`;
  if (fuelStatusCache.has(cacheKey)) {
    return fuelStatusCache.get(cacheKey)!;
  }
  // 计算并缓存结果
  const status = calculateFuelStatus(buffer);
  fuelStatusCache.set(cacheKey, status);
  return status;
}
```

### 3. 分组处理

- 将相同类型的设施分组
- 批量计算燃料消耗
- 减少重复计算

---

## 测试与验证

### 功能测试清单

- [x] 石炉可以添加煤炭作为燃料
- [x] 燃料消耗正确计算
- [x] 燃料耗尽时设施停止
- [x] 自动补充燃料功能正常
- [x] UI显示燃料状态
- [x] 多种燃料按优先级使用
- [x] 设施暂停时不消耗燃料

### 边界条件测试

- [x] 燃料槽已满时不能继续添加
- [x] 快速切换设施状态时燃料计算正确
- [x] 持久化存储保存燃料状态

### 性能测试

- [x] 100个石炉同时运行时性能正常
- [x] 内存使用稳定，无泄漏
- [x] UI更新流畅，无卡顿

---

## 已知问题与限制

1. **存储限制**：燃料槽位最大堆叠数固定为50
2. **UI显示**：多个相同类型设施只显示第一个的燃料状态
3. **手动管理**：暂无拖拽添加燃料的功能

## 未来扩展

1. **燃料效率研究**：通过科技提升燃料利用率
2. **混合燃料**：支持同时使用多种燃料
3. **燃料管道**：自动化燃料配送系统
4. **余热利用**：将废热转化为额外能量
5. **智能燃料选择**：根据任务自动选择最优燃料
6. **燃料预警系统**：低燃料时的视觉/音频提醒
7. **统计面板**：显示燃料消耗率和效率

## 总结

燃料系统已经完整实现并集成到游戏中。系统设计遵循了Factorio的核心理念，既保持了游戏的策略深度，又提供了良好的用户体验。通过独立的燃料缓存、自动补充机制和清晰的UI反馈，玩家可以专注于生产规划而不是繁琐的燃料管理。
