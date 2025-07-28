# 燃料功率数据修正总结

## 问题发现

在分析燃料消耗计算时，发现 `src/data/fuelConfigs.ts` 中的功率数据与 `src/data/spa/data.json` 中的 `usage` 字段不一致。

## 数据对比

### 原始错误数据
```typescript
// src/data/fuelConfigs.ts (错误)
'stone-furnace': {
  basePowerConsumption: 0.18  // 180kW (错误)
}
```

### 正确的数据
```json
// src/data/spa/data.json (正确)
"stone-furnace": {
  "machine": {
    "usage": 90  // 90kW = 0.09 MW
  }
}
```

## 修正内容

### 1. 核心配置文件
- **文件**：`src/data/fuelConfigs.ts`
- **修正**：石炉和钢炉的 `basePowerConsumption` 从 0.18 MW 改为 0.09 MW

### 2. 文档更新
- **文件**：`docs/design/fuel-buffer-capacity-analysis.md`
- **修正**：更新所有功率相关的计算和表格

- **文件**：`docs/implementation/fuel-system-implementation-summary.md`
- **修正**：更新燃料消耗计算示例

- **文件**：`docs/implementation/fuel-system-implementation-plan.md`
- **修正**：更新功率数据和计算示例

- **文件**：`docs/design/fuel-distribution-scenarios.md`
- **修正**：更新运行时间计算

- **文件**：`docs/design/fuel-system-design.md`
- **修正**：更新配置示例

## 修正后的关键数据

### 石炉功率
- **功率**：90 kW = 0.09 MW
- **每块铁板消耗**：0.09 × 3.2 = 0.288 MJ
- **一块煤炭燃烧时间**：4 ÷ 0.09 = 44.4秒
- **一块煤炭可生产铁板**：4 ÷ 0.288 ≈ 13.9个

### 对比表

| 数据项 | 修正前 | 修正后 | 变化 |
|--------|--------|--------|------|
| 石炉功率 | 180 kW | 90 kW | -50% |
| 每块铁板消耗 | 0.576 MJ | 0.288 MJ | -50% |
| 煤炭燃烧时间 | 22.2秒 | 44.4秒 | +100% |
| 煤炭可生产铁板 | 6.9个 | 13.9个 | +100% |

## 影响范围

### 1. 游戏平衡
- 燃料消耗速度减半
- 玩家有更多时间管理燃料
- 生产效率计算更准确

### 2. 用户体验
- 燃料管理压力减轻
- 更符合Factorio原版设定
- 数据一致性提高

### 3. 代码质量
- 配置数据统一
- 减少数据不一致导致的bug
- 提高代码可维护性

## 验证方法

### 1. 数据一致性检查
```typescript
// 验证data.json中的usage字段
const stoneFurnace = data.find(item => item.id === 'stone-furnace');
console.log('Usage:', stoneFurnace.machine.usage); // 应该输出 90

// 验证fuelConfigs.ts中的配置
console.log('Config:', FACILITY_FUEL_CONFIGS['stone-furnace'].basePowerConsumption); // 应该输出 0.09
```

### 2. 计算验证
```typescript
// 验证燃烧时间计算
const coalEnergy = 4; // MJ
const power = 0.09; // MW
const burnTime = coalEnergy / power; // 44.4秒

// 验证铁板生产计算
const plateTime = 3.2; // 秒
const energyPerPlate = power * plateTime; // 0.288 MJ
const platesPerCoal = coalEnergy / energyPerPlate; // 13.9个
```

## 总结

这次修正确保了：
1. **数据一致性**：所有配置文件使用相同的数据源
2. **准确性**：燃料消耗计算基于正确的功率数据
3. **可维护性**：未来修改只需要更新data.json
4. **用户体验**：更合理的燃料管理机制

修正后的系统更符合Factorio原版游戏的平衡设计，为玩家提供了更好的游戏体验。 