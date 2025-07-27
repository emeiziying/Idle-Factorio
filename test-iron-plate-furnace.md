# 铁板详情页面添加石炉测试说明

## 概述

当在铁板（iron-plate）详情页面添加石炉（stone-furnace）时，会发生以下事情：

## 流程步骤

### 1. 前置条件
- 用户在查看铁板的详情页面
- 用户的库存中有至少1个石炉
- 铁板的生产配方已解锁（通常是默认解锁的）

### 2. 添加石炉的过程

#### 2.1 点击"添加"按钮
在 `RecipeFacilitiesCard` 组件中，用户点击石炉旁边的"添加"按钮：

```javascript
// RecipeFacilitiesCard.tsx
const handleAddFacility = (facilityType: string) => {
  // 检查库存中是否有石炉
  const facilityInventory = getInventoryItem(facilityType);
  if (facilityInventory.currentAmount <= 0) {
    return; // 库存不足，无法添加
  }

  // 创建新的设施实例
  const newFacility: FacilityInstance = {
    id: `facility_${facilityType}_${Date.now()}`,
    facilityId: facilityType,
    count: 1,
    status: 'running',
    efficiency: 1.0
  };

  // 添加到游戏状态
  addFacility(newFacility);
  
  // 从库存中扣除1个石炉
  useGameStore.getState().updateInventory(facilityType, -1);
};
```

### 3. 发生的变化

#### 3.1 游戏状态更新
1. **设施列表更新**：
   - 在 `gameStore` 的 `facilities` 数组中添加一个新的石炉实例
   - 石炉状态设置为 `running`（运行中）
   - 效率设置为 1.0（100%）

2. **库存更新**：
   - 石炉的库存数量减少1个
   - 例如：如果原本有10个石炉，现在变成9个

#### 3.2 UI显示更新
1. **设施卡片显示**：
   - 石炉图标上的数字显示已部署的数量（如从0变为1）
   - 显示产能信息：
     - 单机产能：约0.31/秒（1个铁板需要3.2秒）
     - 总产能：0.31/秒 × 部署数量

2. **按钮状态**：
   - 如果库存中没有更多石炉，"添加"按钮变为禁用状态
   - "移除"按钮变为可用状态

### 4. 铁板生产配方信息

根据数据文件，铁板的生产配方如下：
```json
{
  "id": "iron-plate",
  "name": "Iron plate",
  "category": "intermediate-products",
  "time": 3.2,  // 制作时间：3.2秒
  "producers": [
    "stone-furnace",    // 石炉
    "steel-furnace",    // 钢炉
    "electric-furnace"  // 电炉
  ],
  "in": {
    "iron-ore": 1  // 输入：1个铁矿石
  },
  "out": {
    "iron-plate": 1  // 输出：1个铁板
  }
}
```

### 5. 实际效果

添加石炉后：
1. **生产能力**：石炉将开始自动生产铁板（假设有足够的铁矿石）
2. **生产速度**：每3.2秒生产1个铁板
3. **资源消耗**：每生产1个铁板消耗1个铁矿石
4. **燃料需求**：石炉需要燃料（如煤炭）才能运行

### 6. 相关组件

- `ItemDetailPanel`: 物品详情主面板
- `RecipeFacilitiesCard`: 生产设施管理卡片
- `gameStore`: 游戏状态管理（设施和库存）
- `FacilityInstance`: 设施实例数据结构

## 总结

在铁板详情页面添加石炉是一个将生产设施部署到生产线的过程。这个操作会：
1. 从库存中扣除一个石炉
2. 创建一个新的石炉设施实例
3. 更新UI显示产能信息
4. 使石炉开始自动生产铁板（需要铁矿石和燃料）