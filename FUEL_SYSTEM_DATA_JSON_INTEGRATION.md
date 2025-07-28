# 燃料系统与data.json集成

## 概述

燃料系统现在完全基于 `data.json` 中的数据，而不是硬编码的配置。这确保了数据的一致性和可维护性。

## 数据源

### data.json中的机器信息

每个机器在 `data.json` 中都包含完整的配置信息：

```json
{
  "id": "burner-mining-drill",
  "name": "Burner mining drill",
  "machine": {
    "speed": 0.25,
    "type": "burner",
    "fuelCategories": ["chemical"],
    "usage": 150,
    "pollution": 12,
    "size": [2, 2],
    "entityType": "mining-drill"
  }
}
```

### 关键字段说明

- **`type`**: 机器类型
  - `"burner"`: 需要燃料的机器
  - `"electric"`: 电力驱动的机器
- **`fuelCategories`**: 可接受的燃料类别数组
  - `["chemical"]`: 化学燃料
  - `["nuclear"]`: 核燃料
  - `["nutrients"]`: 营养燃料
  - `["food"]`: 食物燃料
- **`usage`**: 功率消耗（kW）
- **`size`**: 机器尺寸 `[宽度, 高度]`
- **`entityType`**: 实体类型

## 技术实现

### 1. 动态燃料配置

```typescript
// 从data.json读取机器信息
const itemData = this.dataService.getItem(facilityId);
if (!itemData || !itemData.machine) {
  return null;
}

const machineData = itemData.machine;

// 只有burner类型的机器需要燃料
if (machineData.type !== 'burner') {
  return null;
}

// 从data.json读取燃料类别
const fuelCategories = machineData.fuelCategories || [];

// 从data.json读取功率消耗（kW转换为MW）
const powerConsumption = (machineData.usage || 0) / 1000;
```

### 2. 燃料兼容性检查

```typescript
isFuelCompatible(facilityId: string, fuelItemId: string): boolean {
  // 从data.json获取机器信息
  const itemData = this.dataService.getItem(facilityId);
  const machineData = itemData.machine;
  
  // 检查机器类型
  if (machineData.type !== 'burner') {
    return false;
  }

  // 检查燃料类别匹配
  const fuelCategories = machineData.fuelCategories || [];
  const fuelCategory = getFuelCategory(fuelItemId);
  
  return fuelCategories.includes(fuelCategory);
}
```

### 3. 设施初始化

```typescript
// 在设施添加时自动初始化燃料缓存区
const fuelService = FuelService.getInstance();
const fuelBuffer = fuelService.initializeFuelBuffer(facilityType);

const newFacility: FacilityInstance = {
  // ... 其他属性
  fuelBuffer: fuelBuffer || undefined
};
```

## 支持的燃料机器

### 化学燃料机器

| 机器 | 功率消耗 | 燃料类别 |
|------|----------|----------|
| 热能采掘机 | 150 kW | chemical |
| 石炉 | 90 kW | chemical |
| 钢炉 | 90 kW | chemical |
| 热能机械臂 | 13.4 kW | chemical |
| 锅炉 | 1800 kW | chemical |
| 加热塔 | 40000 kW | chemical |
| 机车 | 600 kW | chemical |

### 核燃料机器

| 机器 | 功率消耗 | 燃料类别 |
|------|----------|----------|
| 核反应堆 | 40000 kW | nuclear |

### 营养燃料机器

| 机器 | 功率消耗 | 燃料类别 |
|------|----------|----------|
| 农业塔 | 500 kW | nutrients |

### 食物燃料机器

| 机器 | 功率消耗 | 燃料类别 |
|------|----------|----------|
| 俘虏虫巢 | 100 kW | food |

## 优势

### 1. 数据一致性

- 所有机器配置都来自同一个数据源
- 避免了硬编码配置与数据文件不一致的问题
- 数据更新时自动反映到游戏中

### 2. 可维护性

- 新增机器时只需在 `data.json` 中添加配置
- 修改机器属性时只需更新 `data.json`
- 无需修改代码即可调整燃料系统

### 3. 扩展性

- 支持任意数量的燃料类别
- 支持任意功率消耗值
- 支持复杂的燃料兼容性规则

### 4. 类型安全

```typescript
// 完整的类型定义
export interface Machine {
  speed: number;
  type: 'burner' | 'electric';
  fuelCategories?: string[];
  usage: number; // 功率消耗（kW）
  pollution?: number;
  size: [number, number];
  entityType: string;
  locations?: string[];
  modules?: number;
  drain?: number;
  disallowedEffects?: string[];
  baseEffect?: {
    productivity?: number;
  };
}
```

## 迁移说明

### 移除的硬编码配置

- `FACILITY_FUEL_CONFIGS`: 硬编码的机器配置
- `FuelConfig` 接口: 不再需要
- 静态的燃料槽位和堆叠配置

### 新增的动态配置

- 从 `data.json` 读取机器类型
- 从 `data.json` 读取燃料类别
- 从 `data.json` 读取功率消耗
- 动态计算燃料缓存区大小

## 总结

这个改进确保了：

1. **数据驱动**: 所有配置都来自 `data.json`
2. **一致性**: 避免了硬编码与数据文件的不一致
3. **可维护性**: 新增或修改机器时只需更新数据文件
4. **类型安全**: 完整的TypeScript类型定义
5. **扩展性**: 支持任意复杂的燃料系统配置

现在燃料系统完全基于 `data.json` 中的数据，确保了数据的权威性和一致性。 