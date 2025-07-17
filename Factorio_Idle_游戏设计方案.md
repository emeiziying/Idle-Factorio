# Factorio Idle 游戏设计方案

## 🎮 游戏概念

### 核心理念
一款基于 Factorio 宇宙的放置类游戏，玩家作为自动化工程师，从手工制作开始，逐步建立庞大的自动化生产帝国。游戏强调**渐进式自动化**和**效率优化**，让玩家体验从原始手工到超级工厂的完整进化过程。

## 🎯 核心玩法设计

### 1. 游戏循环
```
资源采集 → 物品制造 → 科技研发 → 自动化升级 → 规模扩张 → 星际探索
```

### 2. 渐进式解锁系统
```
第一阶段：手工时代 (0-30分钟)
- 手动采集原始资源
- 基础手工制作台
- 简单的生产链

第二阶段：机械时代 (30分钟-2小时)
- 解锁第一批自动化设备
- 传送带系统
- 基础电力网络

第三阶段：自动化时代 (2-8小时)
- 复杂生产线
- 智能机器人
- 高级材料制造

第四阶段：工业时代 (8-24小时)
- 大规模工厂
- 模块化生产
- 效率优化系统

第五阶段：太空时代 (24小时+)
- 火箭发射
- 多星球生产网络
- 无限扩张模式
```

## ⚙️ 详细合成机制

### 1. 基础资源系统
```typescript
interface Resource {
  // 原始资源 (自动采集)
  iron_ore: {
    baseRate: 1/sec,
    unlocked: true,
    upgrades: ['mining_drill', 'electric_drill', 'advanced_drill']
  },
  
  copper_ore: {
    baseRate: 0.8/sec,
    unlocked: true,
    upgrades: ['mining_drill', 'electric_drill', 'advanced_drill']
  },
  
  coal: {
    baseRate: 0.6/sec,
    unlocked: true,
    upgrades: ['mining_drill', 'electric_drill', 'advanced_drill']
  },
  
  stone: {
    baseRate: 0.5/sec,
    unlocked: true,
    upgrades: ['mining_drill', 'electric_drill', 'advanced_drill']
  },
  
  // 高级资源 (需要解锁)
  oil: {
    baseRate: 0.2/sec,
    unlocked: false,
    requiresTech: 'oil_processing'
  },
  
  uranium: {
    baseRate: 0.1/sec,
    unlocked: false,
    requiresTech: 'nuclear_power'
  }
}
```

### 2. 制造设备层级
```typescript
interface CraftingStation {
  // 手工制作 (初始状态)
  hand_crafting: {
    speed: 1x,
    slots: 1,
    powerCost: 0,
    recipes: ['basic_items']
  },
  
  // 基础制作台
  crafting_table: {
    speed: 2x,
    slots: 2,
    powerCost: 0,
    recipes: ['basic_items', 'simple_components']
  },
  
  // 电力制作台
  assembling_machine_1: {
    speed: 4x,
    slots: 4,
    powerCost: 10kW,
    recipes: ['all_basic', 'intermediate_products']
  },
  
  // 高级制作台
  assembling_machine_2: {
    speed: 8x,
    slots: 6,
    powerCost: 20kW,
    recipes: ['all_basic', 'advanced_products'],
    moduleSlots: 2
  },
  
  // 超级制作台
  assembling_machine_3: {
    speed: 16x,
    slots: 8,
    powerCost: 40kW,
    recipes: ['all_recipes'],
    moduleSlots: 4
  }
}
```

### 3. 详细合成配方树

#### 基础材料链
```typescript
const recipes = {
  // 第一层：基础冶炼
  iron_plate: {
    ingredients: { iron_ore: 1 },
    output: { iron_plate: 1 },
    time: 3.2,
    station: 'furnace'
  },
  
  copper_plate: {
    ingredients: { copper_ore: 1 },
    output: { copper_plate: 1 },
    time: 3.2,
    station: 'furnace'
  },
  
  steel_plate: {
    ingredients: { iron_plate: 5 },
    output: { steel_plate: 1 },
    time: 16,
    station: 'furnace'
  },
  
  // 第二层：基础组件
  iron_gear_wheel: {
    ingredients: { iron_plate: 2 },
    output: { iron_gear_wheel: 1 },
    time: 0.5,
    station: 'assembling_machine'
  },
  
  copper_cable: {
    ingredients: { copper_plate: 1 },
    output: { copper_cable: 2 },
    time: 0.5,
    station: 'assembling_machine'
  },
  
  electronic_circuit: {
    ingredients: { 
      iron_plate: 1, 
      copper_cable: 3 
    },
    output: { electronic_circuit: 1 },
    time: 0.5,
    station: 'assembling_machine'
  },
  
  // 第三层：中级组件
  advanced_circuit: {
    ingredients: {
      electronic_circuit: 2,
      plastic_bar: 2,
      copper_cable: 4
    },
    output: { advanced_circuit: 1 },
    time: 6,
    station: 'assembling_machine'
  },
  
  engine_unit: {
    ingredients: {
      steel_plate: 1,
      iron_gear_wheel: 1,
      pipe: 2
    },
    output: { engine_unit: 1 },
    time: 10,
    station: 'assembling_machine'
  },
  
  // 第四层：高级组件
  processing_unit: {
    ingredients: {
      electronic_circuit: 20,
      advanced_circuit: 2,
      sulfuric_acid: 5
    },
    output: { processing_unit: 1 },
    time: 15,
    station: 'assembling_machine'
  },
  
  // 特殊产品线：石油化工
  plastic_bar: {
    ingredients: {
      petroleum_gas: 20,
      coal: 1
    },
    output: { plastic_bar: 2 },
    time: 1,
    station: 'chemical_plant'
  },
  
  // 军事产品线
  piercing_rounds_magazine: {
    ingredients: {
      firearm_magazine: 1,
      steel_plate: 1,
      copper_plate: 5
    },
    output: { piercing_rounds_magazine: 1 },
    time: 3,
    station: 'assembling_machine'
  }
}
```

### 4. 自动化设备配方
```typescript
const automationRecipes = {
  // 传送带系统
  transport_belt: {
    ingredients: {
      iron_plate: 1,
      iron_gear_wheel: 1
    },
    output: { transport_belt: 2 },
    time: 0.5
  },
  
  fast_transport_belt: {
    ingredients: {
      iron_gear_wheel: 5,
      transport_belt: 1
    },
    output: { fast_transport_belt: 1 },
    time: 0.5
  },
  
  // 机械臂系统
  inserter: {
    ingredients: {
      electronic_circuit: 1,
      iron_gear_wheel: 1,
      iron_plate: 1
    },
    output: { inserter: 1 },
    time: 0.5
  },
  
  fast_inserter: {
    ingredients: {
      electronic_circuit: 2,
      iron_plate: 2,
      inserter: 1
    },
    output: { fast_inserter: 1 },
    time: 0.5
  },
  
  // 制造设备
  assembling_machine_1: {
    ingredients: {
      electronic_circuit: 3,
      iron_gear_wheel: 5,
      iron_plate: 9
    },
    output: { assembling_machine_1: 1 },
    time: 0.5
  },
  
  // 电力系统
  steam_engine: {
    ingredients: {
      iron_gear_wheel: 8,
      pipe: 5,
      iron_plate: 10
    },
    output: { steam_engine: 1 },
    time: 0.5
  },
  
  solar_panel: {
    ingredients: {
      steel_plate: 5,
      electronic_circuit: 15,
      copper_plate: 5
    },
    output: { solar_panel: 1 },
    time: 10
  }
}
```

## 🔬 科技树系统

### 科技解锁机制
```typescript
interface Technology {
  logistics: {
    cost: { red_science: 100 },
    effects: ['transport_belt', 'inserter', 'chest'],
    prerequisites: []
  },
  
  automation: {
    cost: { red_science: 100 },
    effects: ['assembling_machine_1'],
    prerequisites: []
  },
  
  electronics: {
    cost: { red_science: 100 },
    effects: ['electronic_circuit', 'copper_cable'],
    prerequisites: []
  },
  
  fast_inserter: {
    cost: { red_science: 100, green_science: 100 },
    effects: ['fast_inserter'],
    prerequisites: ['logistics', 'electronics']
  },
  
  steel_processing: {
    cost: { red_science: 100, green_science: 100 },
    effects: ['steel_plate'],
    prerequisites: ['logistics']
  },
  
  oil_processing: {
    cost: { red_science: 150, green_science: 150 },
    effects: ['oil_refinery', 'chemical_plant', 'plastic_bar'],
    prerequisites: ['steel_processing']
  },
  
  advanced_electronics: {
    cost: { red_science: 200, green_science: 200, blue_science: 100 },
    effects: ['advanced_circuit', 'processing_unit'],
    prerequisites: ['oil_processing', 'electronics']
  },
  
  rocket_silo: {
    cost: { 
      red_science: 2000, 
      green_science: 2000, 
      blue_science: 2000,
      production_science: 2000
    },
    effects: ['rocket_silo', 'satellite'],
    prerequisites: ['advanced_electronics', 'nuclear_power']
  }
}
```

### 科学包制造链
```typescript
const scienceRecipes = {
  red_science: {
    ingredients: {
      copper_plate: 1,
      iron_gear_wheel: 1
    },
    output: { red_science: 1 },
    time: 5
  },
  
  green_science: {
    ingredients: {
      transport_belt: 1,
      inserter: 1
    },
    output: { green_science: 1 },
    time: 6
  },
  
  blue_science: {
    ingredients: {
      advanced_circuit: 3,
      engine_unit: 2,
      electric_mining_drill: 1
    },
    output: { blue_science: 2 },
    time: 24
  },
  
  production_science: {
    ingredients: {
      electric_furnace: 1,
      productivity_module: 1,
      rail: 30
    },
    output: { production_science: 3 },
    time: 21
  }
}
```

## 📈 进度与升级系统

### 1. 效率升级
```typescript
interface Upgrades {
  // 采矿效率
  mining_productivity: {
    levels: 20,
    baseCost: { red_science: 100, green_science: 100 },
    costMultiplier: 1.5,
    effect: '+10% mining yield per level'
  },
  
  // 制造速度
  automation_speed: {
    levels: 15,
    baseCost: { red_science: 200, green_science: 200, blue_science: 100 },
    costMultiplier: 2.0,
    effect: '+20% crafting speed per level'
  },
  
  // 机器人效率
  worker_robot_speed: {
    levels: 10,
    baseCost: { red_science: 500, green_science: 500, blue_science: 300 },
    costMultiplier: 3.0,
    effect: '+35% robot speed per level'
  }
}
```

### 2. 模块系统
```typescript
interface Modules {
  speed_module_1: {
    effects: {
      speed: '+20%',
      energy_consumption: '+50%'
    },
    craftCost: {
      advanced_circuit: 5,
      electronic_circuit: 5
    }
  },
  
  efficiency_module_1: {
    effects: {
      energy_consumption: '-30%'
    },
    craftCost: {
      advanced_circuit: 5,
      electronic_circuit: 5
    }
  },
  
  productivity_module_1: {
    effects: {
      productivity: '+10%',
      energy_consumption: '+40%',
      pollution: '+30%'
    },
    craftCost: {
      advanced_circuit: 5,
      electronic_circuit: 5
    }
  }
}
```

## 🌌 后期内容设计

### 1. 火箭发射系统
```typescript
const rocketParts = {
  rocket_part: {
    ingredients: {
      processing_unit: 10,
      low_density_structure: 10,
      rocket_fuel: 10
    },
    output: { rocket_part: 1 },
    time: 3,
    requiredAmount: 100
  },
  
  satellite: {
    ingredients: {
      low_density_structure: 100,
      solar_panel: 100,
      accumulator: 100,
      radar: 5,
      processing_unit: 100,
      rocket_fuel: 50
    },
    output: { satellite: 1 },
    time: 5
  }
}
```

### 2. 无限研究
```typescript
const infiniteResearch = {
  mining_productivity: {
    baseCost: { red_science: 2500, green_science: 2500, blue_science: 2500, production_science: 2500 },
    costIncrease: 'exponential',
    effect: '+10% mining productivity per level'
  },
  
  worker_robot_speed: {
    baseCost: { red_science: 2500, green_science: 2500, blue_science: 2500, production_science: 2500 },
    costIncrease: 'exponential',
    effect: '+35% robot speed per level'
  }
}
```

## 🎲 特色机制

### 1. 瓶颈分析系统
- 自动检测生产链瓶颈
- 提供优化建议
- 效率评分系统

### 2. 蓝图系统
- 预设优化工厂布局
- 一键复制粘贴
- 社区分享功能

### 3. 污染与环保
- 生产产生污染
- 污染影响效率
- 清洁技术研发

### 4. 随机事件
- 陨石撞击（资源补给）
- 设备故障（维护需求）
- 效率加成时段

## 🎯 游戏平衡性设计

### 1. 时间缩放
```typescript
const timeScaling = {
  early_game: {
    realTimeToGameTime: 1:60,  // 1秒现实时间 = 1分钟游戏时间
    适用阶段: '手工时代到机械时代'
  },
  
  mid_game: {
    realTimeToGameTime: 1:120, // 1秒现实时间 = 2分钟游戏时间
    适用阶段: '自动化时代到工业时代'
  },
  
  late_game: {
    realTimeToGameTime: 1:300, // 1秒现实时间 = 5分钟游戏时间
    适用阶段: '太空时代及以后'
  }
}
```

### 2. 难度曲线
```typescript
const difficultyProgression = {
  complexity_increase: {
    物品种类: [5, 15, 40, 80, 150],  // 按阶段递增
    配方复杂度: [1, 2, 4, 6, 10],    // 最大材料种类数
    科技成本: [100, 500, 2000, 8000, 30000]  // 每阶段代表性科技成本
  },
  
  automation_level: {
    stage1: '100%手工',
    stage2: '80%手工 + 20%自动',
    stage3: '40%手工 + 60%自动',
    stage4: '10%手工 + 90%自动',
    stage5: '0%手工 + 100%自动'
  }
}
```

## 💰 商业化设计

### 1. 可选付费内容
```typescript
const monetization = {
  cosmetics: {
    工厂主题皮肤: '不影响游戏性的视觉定制',
    特殊效果: '生产动画、粒子效果等',
    音效包: '不同风格的音效主题'
  },
  
  convenience: {
    离线加速: '付费获得短时间离线收益加速',
    蓝图插槽: '额外的蓝图保存位置',
    数据分析: '高级生产效率分析工具'
  },
  
  seasonal_content: {
    限时活动: '特殊事件和奖励',
    纪念物品: '限时获得的装饰性物品',
    挑战模式: '特殊规则的游戏模式'
  }
}
```

### 2. 社交功能
```typescript
const socialFeatures = {
  leaderboards: {
    生产效率排行: '单位时间产量对比',
    科技进度排行: '研究进度对比',
    建造速度排行: '工厂建设效率对比'
  },
  
  sharing: {
    工厂截图: '分享工厂布局图片',
    蓝图分享: '分享和导入蓝图',
    成就展示: '个人成就展示页面'
  },
  
  cooperative: {
    联盟系统: '玩家组成联盟共同目标',
    资源交易: '玩家间资源交换',
    合作建造: '多人协作大型项目'
  }
}
```

## 🔧 技术实现要点

### 1. 性能优化策略
```typescript
const performanceOptimization = {
  计算优化: {
    批量处理: '批量更新生产计算',
    预计算: '常用配方预计算结果缓存',
    增量更新: '只更新变化的部分'
  },
  
  渲染优化: {
    虚拟滚动: '大列表虚拟化渲染',
    LOD系统: '根据缩放级别调整细节',
    对象池: '重用图形对象减少GC'
  },
  
  数据优化: {
    压缩存储: '游戏数据压缩保存',
    懒加载: '按需加载游戏内容',
    CDN分发: '静态资源CDN加速'
  }
}
```

### 2. 架构设计
```typescript
const architecture = {
  前端架构: {
    状态管理: 'Redux Toolkit + RTK Query',
    UI框架: 'React + TypeScript',
    图形渲染: 'Canvas 2D + WebGL (可选)',
    数据持久化: 'IndexedDB + 云端同步'
  },
  
  后端架构: {
    API服务: 'Node.js + Express',
    数据库: 'PostgreSQL + Redis缓存',
    实时通信: 'WebSocket + Socket.io',
    文件存储: 'AWS S3 / 阿里云OSS'
  },
  
  部署方案: {
    前端: 'Vercel / Netlify',
    后端: 'Docker + Kubernetes',
    CDN: 'Cloudflare',
    监控: 'Sentry + 自定义指标'
  }
}
```

---

**文档版本**: v1.0  
**创建日期**: 2024年  
**最后更新**: 2024年  

这个设计方案提供了完整的从手工到自动化的游戏体验，保持了 Factorio 的核心魅力同时适应了 idle 游戏的特点。方案涵盖了游戏机制、技术实现、商业化等各个方面，可作为开发的完整指导文档。