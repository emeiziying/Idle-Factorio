# 基于堆叠的存储系统

## 系统概述

本项目实现了一个基于Factorio堆叠概念的存储系统，取消了复杂的背包格子管理，每个物品独立管理存储容量。

## 核心特性

### 1. 堆叠存储机制
- 每个物品默认可存储1个堆叠
- 堆叠大小来自物品数据中的`stack`属性
- 总容量 = 堆叠数 × 单堆叠大小

### 2. 箱子扩展系统（基于Factorio官方数据）
- **木箱**: +16堆叠空间，需要木材×2（0.5秒制作）
- **铁箱**: +32堆叠空间，需要铁板×8（0.5秒制作）
- **钢箱**: +48堆叠空间，需要钢板×8（0.5秒制作，需要钢铁处理科技）

### 3. 箱子制造与部署
- 箱子本身是游戏物品，需要先制造
- 使用箱子时从库存中扣除
- 支持批量制造箱子

## 数据结构

### InventoryItem (更新)
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
```

### DeployedContainer (新增)
```typescript
interface DeployedContainer {
  id: string;
  chestType: string;           // 箱子类型
  chestItemId: string;         // 箱子物品ID
  targetItemId: string;        // 为哪个物品提供存储
  additionalStacks: number;    // 提供的堆叠数
  deployedAt: number;          // 部署时间
}
```

## 新增组件

### StorageExpansionDialog
- 显示可用箱子类型和库存状态
- 支持立即使用现有箱子
- 支持制造新箱子
- 显示制造材料需求

### 更新的InventoryCard
- 显示堆叠信息 (x/y 堆叠)
- 区分基础堆叠和箱子堆叠
- 显示每堆叠容量
- 提供扩展存储按钮

## 新增Store方法

### 存储容器相关
- `deployChestForStorage(chestType, targetItemId)` - 部署箱子
- `craftChest(chestType, quantity)` - 制造箱子
- `canCraftChest(chestType, quantity)` - 检查是否可制造
- `getDeployedContainersForItem(itemId)` - 获取物品的容器
- `removeDeployedContainer(containerId)` - 移除容器
- `recalculateItemCapacity(itemId)` - 重新计算容量

## 使用流程

1. **查看物品存储**: 在物品详情中查看当前堆叠使用情况
2. **扩展存储**: 点击"扩展存储"按钮
3. **选择箱子**: 选择合适的箱子类型
4. **部署或制造**: 如有现成箱子可立即使用，否则需要制造
5. **自动更新**: 系统自动更新物品的存储容量

## 技术特点

- ✅ 保持现有API兼容性
- ✅ 简化的数据结构，避免复杂的格子管理
- ✅ 真实的资源管理：箱子需要制造和消耗
- ✅ 清晰的UI反馈和操作流程
- ✅ 自动容量计算和更新
- ✅ 支持持久化存储

## 示例

```typescript
// 获取物品存储信息
const ironPlateStorage = getInventoryItem('iron-plate');
console.log(`铁板: ${ironPlateStorage.currentAmount}/${ironPlateStorage.maxCapacity}`);
console.log(`堆叠: ${ironPlateStorage.totalStacks} (${ironPlateStorage.baseStacks}基础 + ${ironPlateStorage.additionalStacks}箱子)`);

// 为铁板部署一个铁箱
const result = deployChestForStorage('iron-chest', 'iron-plate');
if (result.success) {
  console.log('铁板存储容量增加了32个堆叠！（基于Factorio官方数据）');
}
```