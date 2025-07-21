# 异星工厂 v2 技术设计文档

## 目录
1. [系统架构](#系统架构)
2. [核心算法](#核心算法)
3. [数据流设计](#数据流设计)
4. [性能优化](#性能优化)
5. [未来改进](#未来改进)

## 系统架构

### 整体架构
```
┌─────────────────────────────────────────────────┐
│                   前端应用层                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │  React组件   │  │  Material-UI │  │  Hooks  │ │
│  └─────────────┘  └─────────────┘  └─────────┘ │
├─────────────────────────────────────────────────┤
│                   服务层                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │ DataService │  │LogisticsServ│  │Facility │ │
│  │             │  │     ice     │  │ Service │ │
│  └─────────────┘  └─────────────┘  └─────────┘ │
├─────────────────────────────────────────────────┤
│                   数据层                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │  游戏数据   │  │  LocalStorage│  │  State  │ │
│  └─────────────┘  └─────────────┘  └─────────┘ │
└─────────────────────────────────────────────────┘
```

### 服务职责划分

#### DataService
- 游戏数据加载和缓存
- 库存管理（CRUD操作）
- 制作队列管理
- 物品搜索和分类

#### SimpleLogisticsService
- 物流效率计算
- 瓶颈识别
- 优化建议生成
- 库存消耗验证

#### FacilityService
- 设施数据管理
- 产能计算
- 配方匹配
- 生产链分析

#### PersistenceService
- 游戏状态保存/加载
- 自动保存机制
- 存档导入/导出

## 核心算法

### 1. 物流效率计算

```typescript
// 核心计算流程
function calculateProductionEfficiency(facility: Facility): EfficiencyResult {
  // Step 1: 计算基础产能
  const baseProduction = facility.baseRate * facility.count;
  
  // Step 2: 计算输入物流能力
  const inputCapacity = calculateLogisticsCapacity(facility.inputLogistics);
  const inputRequirement = facility.inputRate * facility.count;
  const inputEfficiency = inputRequirement > 0 
    ? Math.min(1, inputCapacity / inputRequirement)
    : 1;
  
  // Step 3: 计算输出物流能力
  const outputCapacity = calculateLogisticsCapacity(facility.outputLogistics);
  const outputEfficiency = Math.min(1, outputCapacity / baseProduction);
  
  // Step 4: 确定瓶颈
  const actualProduction = baseProduction * Math.min(inputEfficiency, outputEfficiency);
  const efficiency = actualProduction / baseProduction;
  
  let bottleneck: 'none' | 'input' | 'output' = 'none';
  if (inputEfficiency < 0.95) bottleneck = 'input';
  else if (outputEfficiency < 0.95) bottleneck = 'output';
  
  return {
    baseProduction,
    actualProduction,
    efficiency,
    bottleneck,
    inputCapacity,
    outputCapacity
  };
}

// 物流能力计算
function calculateLogisticsCapacity(config: LogisticsConfig): number {
  const beltCapacity = config.conveyors * BELT_SPEEDS[config.conveyorType];
  const armCapacity = config.inserters * ARM_SPEEDS[config.inserterType];
  
  // 瓶颈是速度最慢的环节
  return Math.min(beltCapacity, armCapacity);
}
```

### 2. 自动优化算法

```typescript
// 优化策略生成
function generateOptimizationStrategies(
  current: FacilityState,
  target: TargetEfficiency
): OptimizationStrategy[] {
  const strategies = [];
  
  // 策略1: 增加设备数量
  const additionalEquipment = calculateAdditionalEquipment(current, target);
  strategies.push({
    type: 'add_equipment',
    cost: calculateCost(additionalEquipment),
    efficiency: target,
    actions: additionalEquipment
  });
  
  // 策略2: 升级设备等级
  const upgradePlan = calculateUpgradePlan(current, target);
  strategies.push({
    type: 'upgrade_equipment',
    cost: calculateUpgradeCost(upgradePlan),
    efficiency: target,
    actions: upgradePlan
  });
  
  // 策略3: 混合优化（成本效益最优）
  const hybridPlan = optimizeForCostEfficiency(current, target);
  strategies.push({
    type: 'hybrid',
    cost: hybridPlan.cost,
    efficiency: hybridPlan.efficiency,
    actions: hybridPlan.actions
  });
  
  // 按评分排序
  return strategies.sort((a, b) => 
    scoreStrategy(b) - scoreStrategy(a)
  );
}

// 策略评分
function scoreStrategy(strategy: OptimizationStrategy): number {
  const weights = {
    efficiency: 0.4,
    cost: 0.3,
    complexity: 0.2,
    reliability: 0.1
  };
  
  return (
    weights.efficiency * (strategy.efficiency / 100) +
    weights.cost * (1 - normalizedCost(strategy.cost)) +
    weights.complexity * (1 - strategy.actions.length / 10) +
    weights.reliability * reliabilityScore(strategy)
  );
}
```

### 3. 库存溢出处理

```typescript
// 智能库存溢出处理
function handleInventoryOverflow(
  item: ItemStack,
  context: GameContext
): OverflowSolution {
  const solutions = [];
  
  // 方案1: 立即使用
  const immediateUses = findImmediateUses(item, context);
  if (immediateUses.length > 0) {
    solutions.push({
      type: 'immediate_use',
      priority: 1,
      actions: immediateUses
    });
  }
  
  // 方案2: 转换为其他物品
  const conversions = findConversionOptions(item);
  conversions.forEach(conv => {
    solutions.push({
      type: 'convert',
      priority: 2,
      action: conv
    });
  });
  
  // 方案3: 临时存储
  if (canCreateTemporaryStorage(context)) {
    solutions.push({
      type: 'temporary_storage',
      priority: 3,
      action: createTempStorageAction(item)
    });
  }
  
  // 选择最优方案
  return solutions.sort((a, b) => a.priority - b.priority)[0];
}
```

## 数据流设计

### 状态管理模式
```typescript
// 单向数据流
User Action 
  → Service Method 
  → State Update 
  → React Re-render 
  → UI Update

// 示例：配置物流
1. 用户点击"+"按钮
2. FacilityLogisticsPanel.adjustLogistics()
3. SimpleLogisticsService.updateFacilityLogistics()
4. 状态更新 + 库存消耗
5. React重新渲染
6. UI显示新的效率
```

### 数据同步策略
```typescript
// 定期同步
useEffect(() => {
  const interval = setInterval(() => {
    // 更新库存
    updateInventory();
    
    // 更新制作进度
    updateCraftingProgress();
    
    // 检查生产状态
    checkProductionStatus();
  }, 1000); // 每秒更新
  
  return () => clearInterval(interval);
}, []);

// 防抖优化
const debouncedUpdate = useMemo(
  () => debounce(updateLogistics, 300),
  []
);
```

## 性能优化

### 1. React优化
```typescript
// Memo优化
const ItemCard = React.memo(({ item, inventory }) => {
  // 只在item或inventory变化时重新渲染
}, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.inventory?.currentAmount === nextProps.inventory?.currentAmount
  );
});

// useMemo缓存计算结果
const efficiency = useMemo(() => {
  return calculateEfficiency(logistics);
}, [logistics]);
```

### 2. 计算优化
```typescript
// 缓存计算结果
class EfficiencyCache {
  private cache = new Map<string, CachedResult>();
  
  get(key: string): number | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < 5000) {
      return cached.value;
    }
    return null;
  }
  
  set(key: string, value: number) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
}
```

### 3. 批量更新
```typescript
// 批量状态更新
function batchUpdate(updates: StateUpdate[]) {
  ReactDOM.unstable_batchedUpdates(() => {
    updates.forEach(update => {
      update.setter(update.value);
    });
  });
}
```

## 未来改进

### 1. 传送带拓扑系统
```typescript
interface BeltTopology {
  nodes: BeltNode[];
  connections: Connection[];
  
  // 计算实际流量
  calculateFlow(): FlowMap;
  
  // 识别瓶颈点
  findBottlenecks(): BottleneckPoint[];
  
  // 优化建议
  suggestImprovements(): Improvement[];
}
```

### 2. 高级优化算法
```typescript
// 基于约束的优化
interface ConstraintOptimizer {
  // 定义约束
  constraints: {
    maxCost: number;
    maxSpace: number;
    minEfficiency: number;
  };
  
  // 目标函数
  objective: 'minimize_cost' | 'maximize_efficiency' | 'balanced';
  
  // 求解
  solve(): OptimalSolution;
}
```

### 3. 可视化系统
```typescript
// 物流网络可视化
interface LogisticsVisualizer {
  // 渲染网络图
  renderNetwork(canvas: HTMLCanvasElement): void;
  
  // 动画流量
  animateFlow(speed: number): void;
  
  // 高亮瓶颈
  highlightBottlenecks(): void;
  
  // 交互编辑
  enableEditing(): void;
}
```

### 4. AI辅助优化
```typescript
// 机器学习优化建议
interface AIOptimizer {
  // 训练模型
  train(historicalData: GameHistory[]): void;
  
  // 预测最优配置
  predict(currentState: GameState): OptimalConfig;
  
  // 学习玩家偏好
  learnPreferences(playerActions: Action[]): void;
}
```

## 代码质量保证

### 测试策略
```typescript
// 单元测试示例
describe('LogisticsService', () => {
  it('should calculate efficiency correctly', () => {
    const result = calculateEfficiency({
      baseProduction: 10,
      outputCapacity: 5
    });
    expect(result).toBe(0.5);
  });
  
  it('should identify bottlenecks', () => {
    const bottleneck = identifyBottleneck({
      inputCapacity: 10,
      outputCapacity: 5,
      requirement: 8
    });
    expect(bottleneck).toBe('output');
  });
});
```

### 错误处理
```typescript
// 全局错误边界
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Game error:', error, errorInfo);
    
    // 发送错误报告
    reportError({
      error: error.toString(),
      stack: errorInfo.componentStack,
      gameState: this.context.gameState
    });
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorRecoveryUI />;
    }
    return this.props.children;
  }
}
```

## 总结

异星工厂v2的技术设计注重：
1. **模块化架构**：清晰的服务层划分
2. **性能优化**：多层次的优化策略
3. **用户体验**：智能化的辅助功能
4. **可扩展性**：为未来功能预留接口

通过这些设计，系统能够提供流畅的游戏体验，同时保持代码的可维护性和可扩展性。