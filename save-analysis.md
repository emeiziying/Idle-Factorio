# 存档数据分析报告

## 当前存档结构概览

### 1. 库存系统 (inventory)
- 存储格式：Map结构，包含每个物品的详细信息
- 字段分析：
  - `itemId`: 必需
  - `currentAmount`: 必需
  - `stackSize`: 可以从物品定义中获取
  - `baseStacks`: 固定为1，冗余
  - `additionalStacks`: 固定为0，冗余
  - `totalStacks`: 固定为1，冗余
  - `maxCapacity`: 等于stackSize，冗余
  - `productionRate`: 固定为0，冗余
  - `consumptionRate`: 固定为0，冗余
  - `status`: 固定为"normal"，冗余

### 2. 制作队列 (craftingQueue)
- 当前为空数组

### 3. 制作链 (craftingChains)
- 包含大量重复的任务结构
- 每个任务都有完整的时间戳和状态信息
- 依赖关系使用字符串ID引用

### 4. 设施 (facilities)
- 包含每个设施的完整状态
- 燃料缓冲区包含详细的能量计算
- 生产进度精确到小数点后15位

### 5. 统计数据
- `craftedItemCounts`: 制作统计
- `builtEntityCounts`: 建造统计
- `minedEntityCounts`: 开采统计
- `totalItemsProduced`: 总产量

### 6. 研究系统
- `researchState`: null
- `researchQueue`: 空数组
- `unlockedTechs`: 已解锁科技
- `autoResearch`: 自动研究标志

## 冗余字段分析

### 库存系统冗余
1. **stackSize, maxCapacity**: 可从游戏配置获取
2. **baseStacks, additionalStacks, totalStacks**: 始终为固定值
3. **productionRate, consumptionRate**: 库存物品始终为0
4. **status**: 始终为"normal"

### 制作链冗余
1. **重复的配方信息**: 可以只存储配方ID
2. **固定的制作时间**: 可从配方定义获取
3. **详细的时间戳**: 可以简化

### 设施冗余
1. **过高的精度**: 进度不需要15位小数
2. **重复的配方信息**: 可以引用配方ID

## 优化方案

### 1. 简化库存存储
```javascript
// 当前
"stone": {
  "itemId": "stone",
  "currentAmount": 50,
  "stackSize": 50,
  "baseStacks": 1,
  "additionalStacks": 0,
  "totalStacks": 1,
  "maxCapacity": 50,
  "productionRate": 0,
  "consumptionRate": 0,
  "status": "normal"
}

// 优化后
"stone": 50  // 只存储数量，其他信息从配置获取
```

### 2. 压缩制作链
```javascript
// 当前：完整的任务对象
// 优化后：只存储必要信息
{
  "chainId": "chain_xxx",
  "recipe": "burner-mining-drill",
  "startTime": 1753719486724,
  "status": "pending"
}
```

### 3. 简化设施状态
```javascript
// 优化后
{
  "id": "facility_stone-furnace_xxx",
  "type": "stone-furnace",
  "recipe": "iron-plate",
  "progress": 0.37,  // 降低精度
  "fuel": {
    "coal": 2.5  // 简化燃料存储
  }
}
```

### 4. 使用增量保存
- 只保存变化的数据
- 定期创建完整快照
- 使用版本控制

### 5. 数据压缩
- 使用短键名
- 移除默认值
- 使用数组代替对象（适用于固定结构）

## 存储大小优化预估

当前JSON大小：约15KB
优化后预计：约3-5KB（减少60-70%）

## 实施建议

1. **分层存储**：
   - 核心数据：库存、设施状态
   - 临时数据：制作队列、进度
   - 统计数据：单独存储，可选加载

2. **配置分离**：
   - 将游戏配置与存档分离
   - 存档只引用配置ID

3. **版本管理**：
   - 添加存档版本号
   - 支持旧版本迁移

4. **压缩选项**：
   - 提供压缩存档选项
   - 使用二进制格式（如MessagePack）