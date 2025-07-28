# 燃料系统实现计划

## 实现步骤

### 第一阶段：核心数据结构 (2-3小时)

1. **更新类型定义** `src/types/facilities.ts`
   - 添加 `FuelBuffer`、`FuelSlot` 接口
   - 更新 `FacilityInstance` 接口
   - 添加 `no_fuel` 状态到 `FacilityStatus`

2. **创建燃料配置** `src/data/fuelConfigs.ts`
   - 定义 `FuelConfig` 接口
   - 创建 `FACILITY_FUEL_CONFIGS` 配置对象
   - 定义 `FUEL_PRIORITY` 数组

### 第二阶段：服务层实现 (3-4小时)

3. **实现 FuelService** `src/services/FuelService.ts`
   - 基础框架和单例模式
   - `initializeFuelBuffer` 方法
   - `updateFuelConsumption` 方法
   - `addFuel` 方法
   - `autoRefuel` 方法
   - `getFuelStatus` 方法

4. **更新 GameStore** `src/store/gameStore.ts`
   - 修改 `addFacility` 方法，初始化燃料缓存
   - 添加 `refuelFacility` 方法
   - 添加 `autoRefuelFacilities` 方法

### 第三阶段：UI组件开发 (2-3小时)

5. **创建燃料显示组件** `src/components/facilities/FuelStatusDisplay.tsx`
   - 紧凑模式和完整模式
   - 燃料进度条
   - 剩余时间显示
   - 燃料槽位显示

6. **更新设施卡片** `src/components/detail/RecipeFacilitiesCard.tsx`
   - 集成燃料状态显示
   - 添加手动加燃料按钮（可选）
   - 显示燃料警告状态

### 第四阶段：游戏循环集成 (2-3小时)

7. **创建生产循环Hook** `src/hooks/useProductionLoop.ts`
   - 燃料消耗更新逻辑
   - 自动补充燃料
   - 状态切换处理

8. **集成到主循环**
   - 在 `ProductionModule` 中使用 `useProductionLoop`
   - 设置更新频率（建议1秒）

### 第五阶段：测试和优化 (2-3小时)

9. **单元测试**
   - FuelService 各方法测试
   - 边界条件测试
   - 性能测试

10. **集成测试**
    - 多设施燃料管理
    - UI响应测试
    - 内存泄漏检查

## 实现细节

### 燃料消耗计算示例

```typescript
// 石炉生产铁板的燃料消耗
const stoneFurnaceConfig = {
  basePowerConsumption: 0.18, // MW
  craftingSpeed: 1.0
};

const ironPlateRecipe = {
  time: 3.2, // 秒
  output: 1
};

// 每个铁板消耗的能量
const energyPerPlate = stoneFurnaceConfig.basePowerConsumption * ironPlateRecipe.time;
// = 0.18 * 3.2 = 0.576 MJ

// 使用煤炭（4 MJ）
const platesPerCoal = 4 / 0.576; // ≈ 6.94 个铁板
```

### 性能优化建议

1. **批量更新**
   ```typescript
   // 不好的做法：每帧更新
   useEffect(() => {
     const interval = setInterval(() => {
       updateFuelConsumption();
     }, 16); // 60 FPS
   });
   
   // 好的做法：每秒更新
   useEffect(() => {
     const interval = setInterval(() => {
       updateFuelConsumption();
     }, 1000); // 1秒
   });
   ```

2. **缓存计算结果**
   ```typescript
   const fuelStatusCache = new Map<string, FuelStatus>();
   
   getFuelStatus(buffer: FuelBuffer): FuelStatus {
     const cacheKey = `${buffer.totalEnergy}-${buffer.consumptionRate}`;
     if (fuelStatusCache.has(cacheKey)) {
       return fuelStatusCache.get(cacheKey)!;
     }
     // ... 计算逻辑
     fuelStatusCache.set(cacheKey, status);
     return status;
   }
   ```

## 注意事项

1. **向后兼容**：确保没有燃料系统的设施仍能正常工作
2. **数据持久化**：燃料缓存需要保存到 localStorage
3. **UI响应**：避免频繁更新导致的性能问题
4. **错误处理**：妥善处理燃料配置缺失等异常情况

## 测试用例

### 基础功能测试
- [ ] 石炉可以添加煤炭作为燃料
- [ ] 燃料消耗正确计算
- [ ] 燃料耗尽时设施停止
- [ ] 自动补充燃料功能正常
- [ ] UI显示燃料状态

### 边界条件测试
- [ ] 燃料槽已满时不能继续添加
- [ ] 多种燃料按优先级使用
- [ ] 设施暂停时不消耗燃料
- [ ] 快速切换设施状态时燃料计算正确

### 性能测试
- [ ] 100个石炉同时运行时性能正常
- [ ] 内存使用稳定，无泄漏
- [ ] UI更新流畅，无卡顿

## 后续扩展

1. **燃料效率科技**：研究提升燃料利用率
2. **燃料物流**：机械臂自动添加燃料
3. **混合燃料**：支持多种燃料混合使用
4. **燃料指示器**：更丰富的视觉反馈
5. **智能燃料管理**：根据生产需求自动调配燃料