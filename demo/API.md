# 异星工厂 v2 API 文档

本文档详细说明了游戏中各个服务的API接口和使用方法。

## 目录

1. [DataService - 数据服务](#dataservice)
2. [SimpleLogisticsService - 物流计算服务](#simplelogisticsservice)
3. [FacilityService - 设施管理服务](#facilityservice)
4. [PersistenceService - 持久化服务](#persistenceservice)

---

## DataService

数据服务负责管理游戏数据、库存和制作队列。

### 初始化

```typescript
import { dataService } from './services/DataService';

// 加载游戏数据
const gameData = await dataService.loadGameData();
```

### 库存管理

```typescript
// 获取所有库存物品
const allItems: InventoryItem[] = dataService.getAllInventoryItems();

// 获取特定物品的库存
const ironPlate = dataService.getInventoryItem('iron-plate');

// 更新库存
dataService.updateInventory('iron-plate', {
  currentAmount: 100,
  productionRate: 5.5
});

// 添加物品到库存
const success = dataService.addToInventory('copper-plate', 50);
```

### 制作队列

```typescript
// 添加到制作队列
const taskAdded = dataService.addToCraftingQueue('transport-belt', 10);

// 获取制作队列
const queue = dataService.getCraftingQueue();

// 移除制作任务
const removed = dataService.removeCraftingTask(taskId);

// 手动制作物品（检查材料并消耗）
const crafted = dataService.craftItem('iron-gear-wheel', 5);
```

### 分类和搜索

```typescript
// 按分类获取物品
const logisticsItems = dataService.getItemsByCategory('logistics');

// 搜索物品
const results = dataService.searchItems('iron');

// 获取配方
const recipe = dataService.getRecipe('electronic-circuit');
```

---

## SimpleLogisticsService

物流计算服务负责计算设施的物流效率和提供优化建议。

### 基本使用

```typescript
import { simpleLogisticsService } from './services/SimpleLogisticsService';

// 更新设施物流配置
const logistics = simpleLogisticsService.updateFacilityLogistics(
  'iron-plate',           // 物品ID
  'electric-furnace',     // 设施类型
  5,                      // 设施数量
  1.0,                    // 基础消耗率(铁矿/秒)
  1.0,                    // 基础产出率(铁板/秒)
  {                       // 输入物流配置
    conveyors: 2,
    conveyorType: 'transport-belt',
    inserters: 2,
    inserterType: 'inserter'
  },
  {                       // 输出物流配置
    conveyors: 2,
    conveyorType: 'transport-belt',
    inserters: 1,
    inserterType: 'fast-inserter'
  }
);
```

### 获取物流信息

```typescript
// 获取设施的物流配置
const facilityLogistics = simpleLogisticsService.getFacilityLogistics('iron-plate');

// 生成优化建议
const recommendations = simpleLogisticsService.generateRecommendations(facilityLogistics);
```

### 库存检查

```typescript
// 检查物流设备库存是否足够
const canConfigure = simpleLogisticsService.checkLogisticsInventory({
  conveyors: 5,
  conveyorType: 'fast-transport-belt',
  inserters: 3,
  inserterType: 'stack-inserter'
});

// 消耗物流设备库存
if (canConfigure) {
  simpleLogisticsService.consumeLogisticsInventory(config);
}
```

### 返回的数据结构

```typescript
interface FacilityLogistics {
  itemId: string;
  facilityType: string;
  facilityCount: number;
  
  // 能力数据
  baseInputCapacity: number;
  baseOutputCapacity: number;
  actualInputCapacity: number;
  actualOutputCapacity: number;
  actualProductionRate: number;
  
  // 效率指标
  efficiency: number;
  bottleneck: 'none' | 'input' | 'output';
  
  // 物流配置
  inputLogistics: LogisticsConfig;
  outputLogistics: LogisticsConfig;
}
```

---

## FacilityService

设施管理服务负责管理生产设施和配方。

### 初始化

```typescript
import { facilityService } from './services/FacilityService';

// 初始化设施服务（需要游戏数据）
facilityService.initialize(gameData);
```

### 设施管理

```typescript
// 获取物品的生产设施
const ironFacilities = facilityService.getFacilitiesForItem('iron-plate');

// 添加新设施
facilityService.addFacility('copper-cable', {
  id: 'copper-cable-assembly-1',
  itemId: 'copper-cable',
  type: 'assembling-machine-2',
  category: 'crafting',
  count: 3,
  baseSpeed: 0.75,
  baseInputRate: { 'copper-plate': 0.5 },
  baseOutputRate: 1.0,
  powerType: 'electric',
  powerConsumption: 150,
  recipeId: 'copper-cable',
  canProduce: ['copper-cable']
});

// 更新设施数量
facilityService.updateFacilityCount('iron-plate-smelting-1', 10);
```

### 产能计算

```typescript
// 计算设施的实际产能
const production = facilityService.calculateFacilityProduction(facility);
// 返回: { inputRate: {...}, outputRate: number }

// 获取物品的总产能
const totalProduction = facilityService.getTotalProductionForItem('iron-plate');

// 获取物品的总消耗
const totalConsumption = facilityService.getTotalConsumptionForItem('iron-ore');
```

### 配方相关

```typescript
// 获取物品的配方
const recipe = facilityService.getRecipeForItem('electronic-circuit');

// 获取适合配方的设施类型
const facilityTypes = facilityService.getFacilityTypesForRecipe('steel-plate');
// 返回: ['stone-furnace', 'steel-furnace', 'electric-furnace']
```

---

## PersistenceService

持久化服务负责保存和恢复游戏状态。

### 基本操作

```typescript
import { persistenceService } from './services/PersistenceService';

// 保存完整游戏状态
persistenceService.saveGameState({
  inventory: inventoryData,
  facilities: facilitiesData,
  logistics: logisticsData,
  craftingQueue: queueData
});

// 加载游戏状态
const savedState = persistenceService.loadGameState();
if (savedState) {
  // 恢复各项数据...
}

// 清除存档
persistenceService.clearSave();
```

### 部分保存

```typescript
// 只保存库存
persistenceService.saveInventory(inventoryData);

// 只保存设施
persistenceService.saveFacilities(facilitiesData);

// 只保存物流配置
persistenceService.saveLogistics(logisticsData);
```

### 导入导出

```typescript
// 导出存档为字符串
const saveString = persistenceService.exportSave();

// 导入存档
const success = persistenceService.importSave(saveString);
```

### 自动保存

```typescript
// 启动自动保存（默认30秒）
const stopAutoSave = persistenceService.enableAutoSave(30000);

// 停止自动保存
stopAutoSave();
```

---

## 使用示例

### 完整的物流配置流程

```typescript
// 1. 检查库存
const hasEnoughBelts = dataService.getInventoryItem('fast-transport-belt').currentAmount >= 4;
const hasEnoughInserters = dataService.getInventoryItem('fast-inserter').currentAmount >= 2;

if (hasEnoughBelts && hasEnoughInserters) {
  // 2. 配置物流
  const logistics = simpleLogisticsService.updateFacilityLogistics(
    'steel-plate',
    'electric-furnace',
    5,
    5.0,  // 5个铁板/秒
    1.0,  // 1个钢板/秒
    {
      conveyors: 2,
      conveyorType: 'fast-transport-belt',
      inserters: 1,
      inserterType: 'fast-inserter'
    },
    {
      conveyors: 2,
      conveyorType: 'fast-transport-belt',
      inserters: 1,
      inserterType: 'fast-inserter'
    }
  );
  
  // 3. 检查效率
  if (logistics.efficiency < 0.9) {
    // 4. 获取优化建议
    const recommendations = simpleLogisticsService.generateRecommendations(logistics);
    console.log('需要优化:', recommendations);
  }
}
```

### 生产链分析

```typescript
// 递归构建生产链
function analyzeProductionChain(itemId: string, requiredRate: number) {
  const facilities = facilityService.getFacilitiesForItem(itemId);
  const logistics = simpleLogisticsService.getFacilityLogistics(itemId);
  const recipe = facilityService.getRecipeForItem(itemId);
  
  const node = {
    itemId,
    requiredRate,
    actualRate: logistics?.actualProductionRate || 0,
    efficiency: logistics?.efficiency || 0,
    bottleneck: logistics?.bottleneck || 'none',
    children: []
  };
  
  // 递归分析原料
  if (recipe) {
    for (const [inputId, amount] of Object.entries(recipe.in)) {
      const inputRate = (amount / recipe.time) * requiredRate;
      node.children.push(analyzeProductionChain(inputId, inputRate));
    }
  }
  
  return node;
}
```

---

## 最佳实践

1. **错误处理**：所有服务方法都可能返回null或false，始终检查返回值
2. **批量操作**：尽量批量更新数据，减少重复计算
3. **性能考虑**：使用防抖和缓存机制避免频繁更新
4. **数据一致性**：修改库存时同时更新相关的生产/消耗率

## 调试技巧

```typescript
// 开启调试日志
localStorage.setItem('debug', 'true');

// 查看当前游戏状态
console.log({
  inventory: dataService.getAllInventoryItems(),
  facilities: facilityService.getAllFacilities(),
  queue: dataService.getCraftingQueue()
});

// 导出存档用于分析
const save = persistenceService.exportSave();
console.log(atob(save)); // 解码后查看
```