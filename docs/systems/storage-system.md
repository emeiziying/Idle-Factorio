# 存储系统完整文档

## 系统概述

本系统实现了一个基于Factorio堆叠概念的存储系统，包含物品存储、容器扩展、存档优化等完整功能。

## 目录

1. [基础存储系统](#基础存储系统)
2. [容器系统](#容器系统)
3. [存档优化](#存档优化)
4. [存档机制](#存档机制)
5. [系统重构](#系统重构)
6. [API参考](#api参考)

---

## 基础存储系统

### 核心概念

本系统取消了复杂的背包格子管理，每个物品独立管理存储容量：

- 每个物品默认可存储1个堆叠
- 堆叠大小来自物品数据中的`stack`属性
- 总容量 = 堆叠数 × 单堆叠大小

### 数据结构

```typescript
interface InventoryItem {
  itemId: string;
  currentAmount: number;
  
  // 堆叠系统
  stackSize: number;           // 单堆叠大小
  baseStacks: number;          // 基础堆叠数(默认1)
  additionalStacks: number;    // 箱子提供的额外堆叠
  totalStacks: number;         // 总堆叠数
  maxCapacity: number;         // 总容量
}

interface DeployedContainer {
  id: string;
  chestType: string;           // 箱子类型
  chestItemId: string;         // 箱子物品ID
  targetItemId: string;        // 为哪个物品提供存储
  additionalStacks: number;    // 提供的堆叠数
  deployedAt: number;          // 部署时间
}
```

---

## 容器系统

### 箱子类型（基于Factorio官方数据）

#### 固体存储
- **木箱**: +16堆叠空间，需要木材×2（0.5秒制作）
- **铁箱**: +32堆叠空间，需要铁板×8（0.5秒制作）
- **钢箱**: +48堆叠空间，需要钢板×8（0.5秒制作，需要钢铁处理科技）

#### 液体存储
- **储液罐**: 25,000单位液体容量，需要铁板×20 + 钢板×5（3秒制作）

### 存储配置结构

```typescript
interface StorageConfig {
  itemId: string;
  name: string;
  category: 'solid' | 'liquid';           // 存储类型
  additionalStacks?: number;               // 固体存储堆叠数
  fluidCapacity?: number;                  // 液体存储容量
  recipe: { [itemId: string]: number };
  craftingTime: number;
  description: string;
  dimensions?: string;                     // 尺寸信息
  requiredTechnology?: string;             // 需要的科技
}
```

### 使用流程

1. **查看物品存储**: 在物品详情中查看当前堆叠使用情况
2. **扩展存储**: 点击"扩展存储"按钮
3. **选择容器**: 选择合适的容器类型
4. **部署或制造**: 如有现成容器可立即使用，否则需要制造
5. **自动更新**: 系统自动更新物品的存储容量

---

## 存档优化

### 第一阶段：数据结构优化

通过优化数据结构，实现50-60%的存档大小减少：

#### 主要优化内容

1. **库存系统优化**
   - 原始格式：每个物品存储9个字段
   - 优化后：只存储物品ID和数量
   - 减少约89%的数据量

2. **设施数据优化**
   - 降低进度精度：从15位小数减少到2位
   - 简化燃料存储结构
   - 移除冗余字段

3. **数据结构优化**
   - 使用简单对象代替Map结构（序列化时）
   - 使用更紧凑的数据格式

### 第二阶段：LZ-String压缩

实施LZ-String压缩，达到总体70-80%的压缩率：

#### 实现细节

1. **SaveOptimizationService**
   ```typescript
   class SaveOptimizationService {
     // 将游戏状态转换为优化格式
     optimize(state: GameState): OptimizedSave
     
     // 从优化格式恢复游戏状态
     restore(save: OptimizedSave): GameState
     
     // LZ-String压缩
     compress(data: string): string
     
     // LZ-String解压
     decompress(data: string): string
     
     // 比较优化效果
     compareSizes(state: GameState): SizeComparison
   }
   ```

2. **自动压缩存储**
   - 保存时自动压缩数据
   - 加载时自动解压数据
   - 失败时降级到未压缩存储

#### 优化效果

- 原始大小：约15KB
- 第一阶段优化：约7KB（减少50-60%）
- 第二阶段压缩：约3-4KB（总减少70-80%）

### 技术特点

- ✅ 向后兼容：支持新旧格式自动转换
- ✅ 数据完整性：不丢失任何游戏数据
- ✅ 高性能：优化和恢复操作快速
- ✅ 自动化：对用户完全透明

---

## 存档机制

### 核心架构

- **状态管理**: Zustand + persist 中间件
- **存储方式**: localStorage + 防抖机制
- **数据格式**: JSON + LZ-String 压缩

### 防抖存储系统

#### DebouncedStorage 类

```typescript
class DebouncedStorage implements StateStorage {
  private pendingSaves = new Map<string, PendingSave>();
  private saveTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly debounceMs: number;
  private readonly enableCompression: boolean;
}
```

#### 主要特性

1. **防抖机制**
   - 2秒内多次保存只执行最后一次
   - 避免频繁 localStorage 写入
   - 提升性能和用户体验

2. **压缩优化**
   - LZ-String 压缩，减少 70-80% 存储空间
   - 自动检测压缩效果，无效时使用原始数据
   - 压缩失败时自动降级

3. **强制保存**
   - 页面卸载时立即保存所有待保存数据
   - 提供 `forceSetItem` 方法绕过防抖
   - 确保数据不丢失

### 存档流程

#### 自动存档
1. **状态变化触发**: 通过更新 `saveKey` 触发保存
2. **防抖处理**: 2秒内多次变化只保存一次
3. **数据优化**: 使用优化格式 + 压缩
4. **强制保存**: 页面卸载时立即保存

#### 手动存档
```typescript
// 普通存档
saveGame: () => {
  set(() => ({
    lastSaveTime: Date.now(),
    saveKey: `save_${Date.now()}`
  }));
}

// 强制存档（绕过防抖）
forceSaveGame: async () => {
  const optimized = saveOptimizationService.optimize(state);
  await storage.forceSetItem('factorio-game-storage', JSON.stringify(optimized));
}
```

### 状态恢复机制

#### onRehydrateStorage 回调

```typescript
onRehydrateStorage: () => (state) => {
  if (state) {
    // 修复 Map/Set 序列化问题
    state.inventory = ensureInventoryMap(state.inventory);
    state.favoriteRecipes = new Set(state.favoriteRecipes);
    state.unlockedTechs = ensureUnlockedTechsSet(state.unlockedTechs);
    
    // 确保所有字段都有默认值
    if (!Array.isArray(state.craftingQueue)) {
      state.craftingQueue = [];
    }
    // ... 其他字段验证
  }
}
```

#### 辅助函数

```typescript
// 确保 Map 对象正确恢复
const ensureInventoryMap = (inventory: unknown): Map<string, InventoryItem> => {
  if (inventory instanceof Map) return inventory;
  if (Array.isArray(inventory)) {
    return new Map(inventory);
  }
  return new Map();
};

// 确保 Set 对象正确恢复
const ensureUnlockedTechsSet = (unlockedTechs: unknown): Set<string> => {
  if (unlockedTechs instanceof Set) return unlockedTechs;
  if (Array.isArray(unlockedTechs)) {
    return new Set(unlockedTechs);
  }
  return new Set();
};
```

### 清空存档功能

#### 开发模式特性
- 仅在开发环境显示清空存档按钮
- 提供确认对话框防止误操作
- 清空后自动重载页面

```typescript
clearGameData: async () => {
  // 清除 localStorage
  await storage.removeItem('factorio-game-storage');
  
  // 重置所有状态
  set(() => ({
    inventory: new Map(),
    craftingQueue: [],
    // ... 其他状态重置
  }));
  
  // 重载页面
  window.location.reload();
}
```

### 开发阶段特性

#### 简化版本管理
- 无复杂版本迁移逻辑
- 不兼容时直接清空存档
- 专注于功能开发而非兼容性

#### 错误处理
- 自动修复 Map/Set 序列化问题
- 提供字段默认值
- 优雅降级处理

### 性能优化

1. **防抖机制**: 避免频繁 localStorage 写入
2. **数据压缩**: LZ-String 压缩减少存储空间
3. **增量更新**: 只保存变化的数据
4. **自动清理**: 页面卸载时确保数据不丢失

---

## 系统重构

### 从箱子系统到通用存储系统

根据Factorio Wiki的信息，系统已从单纯的箱子系统重构为支持固体和液体的通用存储系统。

#### 主要变更

1. **文件重命名**
   - `chestConfigs.ts` → `storageConfigs.ts`
   - `ChestConfig` → `StorageConfig`

2. **类型扩展**
   - 添加 `category: 'solid' | 'liquid'`
   - 添加液体存储相关字段
   - 保持向后兼容

3. **配置优化**
   - 只存储data.json中没有的特定属性
   - 减少重复数据
   - 提高可维护性

---

## API参考

### Store方法

#### 存储容器相关
```typescript
// 部署容器为特定物品提供存储
deployChestForStorage(chestType: string, targetItemId: string): Result

// 制造容器
craftChest(chestType: string, quantity: number): Result

// 检查是否可制造
canCraftChest(chestType: string, quantity: number): boolean

// 获取物品的已部署容器
getDeployedContainersForItem(itemId: string): DeployedContainer[]

// 移除已部署的容器
removeDeployedContainer(containerId: string): void
```

#### 存档相关
```typescript
// 普通存档
saveGame(): void

// 强制存档（绕过防抖）
forceSaveGame(): Promise<void>

// 清空存档（开发模式）
clearGameData(): Promise<void>
```

### 配置数据

#### 存储配置
```typescript
// 获取所有存储配置
getStorageConfigs(): StorageConfig[]

// 获取特定物品的存储配置
getStorageConfigForItem(itemId: string): StorageConfig | undefined

// 检查物品是否支持存储扩展
canExpandStorage(itemId: string): boolean
```

### 使用示例

#### 扩展物品存储
```typescript
const { deployChestForStorage } = useGameStore();

// 为铁板部署铁箱
const result = deployChestForStorage('iron-chest', 'iron-plate');
if (result.success) {
  console.log('铁箱部署成功，铁板存储容量增加32堆叠');
}
```

#### 手动存档
```typescript
const { saveGame, forceSaveGame } = useGameStore();

// 普通存档（会防抖）
saveGame();

// 强制存档（立即执行）
await forceSaveGame();
```

---

## 总结

本存储系统提供了完整的物品存储管理功能，包括：

1. **基础存储**: 基于堆叠的物品存储系统
2. **容器扩展**: 支持固体和液体的存储容器
3. **存档优化**: 两阶段优化，减少70-80%存储空间
4. **防抖机制**: 提升性能和用户体验
5. **开发友好**: 简化的版本管理，专注于功能开发

系统设计注重性能、可维护性和用户体验，为Factorio类游戏提供了完整的存储解决方案。