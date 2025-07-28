# 煤矿热力采掘机不产出问题分析

## 问题描述

煤矿的热力采掘机配置了，但没有产出煤矿。

## 可能的原因分析

### 1. 燃料问题
- 热力采掘机需要燃料才能运行
- 如果燃料不足，状态会是`'no_fuel'`
- 状态为`'no_fuel'`的设施不会进行生产

### 2. 配方问题
- 煤矿的采矿配方ID是`'coal'`
- 配方配置：
  ```json
  {
    "id": "coal",
    "name": "Coal",
    "in": {},
    "out": {
      "coal": 1
    },
    "flags": ["mining"],
    "producers": [
      "burner-mining-drill",
      "electric-mining-drill", 
      "big-mining-drill"
    ]
  }
  ```

### 3. 设施状态问题
- 设施状态必须是`'running'`才会生产
- 如果状态是`'no_fuel'`、`'stopped'`等，不会生产

### 4. 生产进度问题
- 设施必须有`production.currentRecipeId`设置
- 生产进度会从0开始累积到1.0

## 调试步骤

### 1. 检查设施状态
```javascript
// 在浏览器控制台中运行
const facilities = useGameStore.getState().facilities;
const coalDrills = facilities.filter(f => f.facilityId === 'burner-mining-drill');
console.log('热力采掘机状态:', coalDrills);
```

### 2. 检查燃料状态
```javascript
// 检查燃料缓存
coalDrills.forEach(drill => {
  if (drill.fuelBuffer) {
    const status = FuelService.getInstance().getFuelStatus(drill.fuelBuffer);
    console.log(`设施 ${drill.id} 燃料状态:`, status);
  }
});
```

### 3. 检查生产配置
```javascript
// 检查生产配置
coalDrills.forEach(drill => {
  console.log(`设施 ${drill.id} 生产配置:`, drill.production);
});
```

### 4. 检查库存
```javascript
// 检查煤矿库存
const coalInventory = useGameStore.getState().getInventoryItem('coal');
console.log('煤矿库存:', coalInventory);
```

## 解决方案

### 1. 确保燃料充足
- 检查热力采掘机是否有燃料
- 如果没有燃料，手动添加燃料或等待自动补充

### 2. 检查设施配置
- 确保热力采掘机的`production.currentRecipeId`设置为`'coal'`
- 确保设施状态为`'running'`

### 3. 检查库存容量
- 确保煤矿库存有足够空间
- 如果库存已满，设施会停止生产

## 预期行为

1. **燃料充足时**：
   - 热力采掘机状态：`'running'`
   - 生产进度：从0逐渐增加到1.0
   - 产出：每秒增加1个煤矿

2. **燃料不足时**：
   - 热力采掘机状态：`'no_fuel'`
   - 生产进度：停止
   - 产出：无

3. **库存已满时**：
   - 热力采掘机状态：`'output_full'`
   - 生产进度：停止
   - 产出：无 