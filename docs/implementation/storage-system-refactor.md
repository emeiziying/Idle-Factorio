# 存储系统重构文档

## 重构概述

根据 [Factorio Wiki 储液罐页面](https://wiki.factorio.com/Storage_tank) 的信息，我们将原来的 `chestConfigs.ts` 重构为更通用的 `storageConfigs.ts`，以支持固体存储（箱子）和液体存储（储液罐）。

## 主要变更

### 1. 类型定义更新

**原类型：**
```typescript
interface ChestConfig {
  itemId: string;
  name: string;
  additionalStacks: number;
  recipe: { [itemId: string]: number };
  craftingTime: number;
  description: string;
}
```

**新类型：**
```typescript
interface StorageConfig {
  itemId: string;
  name: string;
  category: 'solid' | 'liquid';           // 新增：存储类型
  additionalStacks?: number;               // 可选：固体存储堆叠数
  fluidCapacity?: number;                  // 新增：液体存储容量
  recipe: { [itemId: string]: number };
  craftingTime: number;
  description: string;
  dimensions?: string;                     // 新增：尺寸信息
  requiredTechnology?: string;             // 新增：需要的科技
}

// 向后兼容
type ChestConfig = StorageConfig;
```

### 2. 配置文件重构

**原文件：** `src/data/chestConfigs.ts`
**新文件：** `src/data/storageConfigs.ts`

**优化后的配置结构：**
```typescript
// 只包含data.json中没有的特定存储属性
export const STORAGE_SPECIFIC_CONFIGS: { [key: string]: Partial<StorageConfig> } = {
  'wooden-chest': {
    category: 'solid',
    additionalStacks: 16,
    description: '基础存储箱，提供16个额外堆叠的存储空间'
  },
  'storage-tank': {
    category: 'liquid',
    fluidCapacity: 25000,
    dimensions: '3×3',
    requiredTechnology: 'fluid-handling',
    description: '液体存储设备，可存储25,000单位的液体，需要流体处理科技'
  }
};
```

### 3. 新增服务层

**StorageService.ts：**
- 合并 data.json 和特定配置数据
- 提供统一的存储配置访问接口
- 自动处理本地化名称
- 向后兼容原有 API

```typescript
export class StorageService {
  // 获取完整的存储配置（合并data.json和特定配置）
  getStorageConfig(storageType: string): StorageConfig | undefined
  
  // 获取存储类型分类
  getSolidStorageTypes(): string[]
  getLiquidStorageTypes(): string[]
  
  // 检查是否为存储设备
  isStorageDevice(itemId: string): boolean
}
```

### 4. 数据源优化

**移除冗余字段：**
- ❌ `itemId` - 从 data.json 获取
- ❌ `name` - 从 data.json 获取（支持本地化）
- ❌ `recipe` - 从 data.json 获取
- ❌ `craftingTime` - 从 data.json 获取

**保留特定字段：**
- ✅ `category` - 存储类型分类
- ✅ `additionalStacks` - 固体存储堆叠数
- ✅ `fluidCapacity` - 液体存储容量
- ✅ `dimensions` - 尺寸信息
- ✅ `requiredTechnology` - 科技要求
- ✅ `description` - 自定义描述

### 5. 新增功能

#### 存储类型分类
```typescript
// 获取所有存储类型
getAvailableStorageTypes(): string[]

// 获取固体存储类型
getSolidStorageTypes(): string[]

// 获取液体存储类型
getLiquidStorageTypes(): string[]
```

#### 向后兼容
```typescript
// 保持原有 API 兼容
getChestConfig(chestType: string): StorageConfig | undefined
getAvailableChestTypes(): string[]
```

### 6. 更新的组件

- `StorageExpansionDialog.tsx`：更新引用和类型处理
- `gameStore.ts`：更新存储相关的方法
- 新增测试组件：`StorageConfigTest.tsx`
- 新增服务：`StorageService.ts`

## 技术细节

### 储液罐配置
根据 Factorio Wiki，储液罐具有以下特性：
- **液体容量：** 25,000 单位
- **堆叠大小：** 50
- **尺寸：** 3×3
- **制作配方：** 3秒 + 20铁板 + 5钢板
- **科技要求：** 流体处理科技

### 数据源分离
- **data.json：** 基础物品信息、配方、制作时间
- **storageConfigs.ts：** 存储特定属性（堆叠数、液体容量等）
- **StorageService：** 合并数据，提供统一接口

### 类型安全
- 使用可选字段处理不同存储类型的属性
- 提供类型守卫和默认值处理
- 保持向后兼容性

## 优化效果

### 数据冗余消除
- ✅ 移除重复的 `itemId` 字段
- ✅ 移除重复的 `name` 字段（支持本地化）
- ✅ 移除重复的 `recipe` 字段
- ✅ 移除重复的 `craftingTime` 字段

### 维护性提升
- ✅ 单一数据源：基础信息来自 data.json
- ✅ 配置分离：特定属性独立管理
- ✅ 服务层封装：统一的数据访问接口

### 扩展性增强
- ✅ 支持本地化名称
- ✅ 自动同步 data.json 更新
- ✅ 易于添加新的存储类型

## 未来扩展

这个重构为将来添加更多存储类型奠定了基础：

1. **物流箱子**：主动提供者、被动提供者、请求者等
2. **缓冲箱子**：用于生产线的缓冲存储
3. **存储箱子**：机器人网络的通用存储
4. **其他液体存储**：如管道、流体车厢等

## 测试验证

创建了 `StorageConfigTest.tsx` 组件来验证：
- 固体存储配置的正确性
- 液体存储配置的正确性
- 类型系统的兼容性
- UI 显示的正确性
- 数据合并的正确性

## 影响评估

### 正面影响
- ✅ 更准确的 Factorio 游戏机制模拟
- ✅ 支持液体存储系统
- ✅ 更好的类型安全性
- ✅ 为未来扩展做好准备
- ✅ 保持向后兼容性
- ✅ 消除数据冗余
- ✅ 提升维护性

### 风险控制
- ✅ 所有现有功能保持工作
- ✅ 类型错误已修复
- ✅ 向后兼容 API 保留
- ✅ 测试组件验证功能
- ✅ 数据源分离，降低耦合

## 总结

这次重构成功地将存储系统从仅支持箱子扩展到支持固体和液体存储，更准确地反映了 Factorio 的实际游戏机制。通过数据源分离和服务层封装，我们消除了冗余数据，提升了系统的维护性和扩展性，同时保持了向后兼容性。 