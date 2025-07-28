// 优化后的存档格式示例

// 1. 最小化存档格式
const optimizedSaveFormat = {
  // 版本号用于兼容性
  version: 2,
  
  // 简化的库存 - 只存储物品ID和数量
  inventory: {
    "stone": 50,
    "stone-furnace": 3,
    "coal": 41,
    "iron-ore": 6,
    "iron-plate": 41,
    "iron-gear-wheel": 0,
    "burner-mining-drill": 1,
    "copper-ore": 15,
    "copper-plate": 7
  },
  
  // 简化的制作链 - 只存储关键信息
  crafting: [
    { id: "c1", recipe: "stone-furnace", start: 1753719306303, tasks: 2 },
    { id: "c2", recipe: "stone-furnace", start: 1753719307036, tasks: 2 },
    { id: "c3", recipe: "burner-mining-drill", start: 1753719373408, tasks: 2 },
    // ... 更多制作链
  ],
  
  // 简化的设施 - 压缩格式
  facilities: [
    ["sf1", "stone-furnace", "iron-plate", 0.37, { coal: 2.5 }],
    ["bmd1", "burner-mining-drill", "iron-ore", 9.13, { coal: 0.37 }, "full"],
    ["bmd2", "burner-mining-drill", "coal", 6.76, { coal: 2.84 }, "full"],
    ["bmd3", "burner-mining-drill", "stone", 10.75, { coal: 1.16 }, "full"],
    ["sf2", "stone-furnace", "iron-plate", 0.09, { coal: 2.4 }],
    ["bmd4", "burner-mining-drill", "copper-ore", 3.54, { coal: 0.39 }],
    ["sf3", "stone-furnace", "copper-plate", 0.52, { coal: 2.0 }]
  ],
  
  // 统计数据 - 使用数组格式
  stats: {
    total: 344,
    crafted: [["stone", 97], ["stone-furnace", 11], ["coal", 60], ["iron-ore", 81], 
              ["iron-plate", 75], ["iron-gear-wheel", 15], ["burner-mining-drill", 5], 
              ["copper-ore", 22], ["copper-plate", 7]],
    built: [["stone-furnace", 3], ["burner-mining-drill", 4]],
    mined: [["stone", 97], ["coal", 60], ["iron-ore", 81], ["copper-ore", 22]]
  },
  
  // 研究状态 - 简化
  research: {
    unlocked: ["steam-power"],
    auto: true
  },
  
  // 时间戳
  time: 1753719583673
};

// 2. 转换函数：从旧格式到新格式
function convertToOptimizedFormat(oldSave) {
  const optimized = {
    version: 2,
    inventory: {},
    crafting: [],
    facilities: [],
    stats: {
      total: oldSave.totalItemsProduced,
      crafted: oldSave.craftedItemCounts,
      built: oldSave.builtEntityCounts,
      mined: oldSave.minedEntityCounts
    },
    research: {
      unlocked: oldSave.unlockedTechs,
      auto: oldSave.autoResearch
    },
    time: oldSave.lastSaveTime
  };
  
  // 转换库存
  for (const [itemId, itemData] of oldSave.inventory) {
    optimized.inventory[itemId] = itemData.currentAmount;
  }
  
  // 转换制作链（简化）
  oldSave.craftingChains.forEach((chain, index) => {
    optimized.crafting.push({
      id: `c${index}`,
      recipe: chain.finalProduct.itemId,
      start: chain.tasks[0].startTime,
      tasks: chain.tasks.length
    });
  });
  
  // 转换设施
  oldSave.facilities.forEach(facility => {
    const fuel = facility.fuelBuffer.slots[0];
    const fuelData = fuel ? { [fuel.itemId]: fuel.remainingEnergy } : {};
    
    optimized.facilities.push([
      facility.id.split('_').slice(-1)[0].substring(0, 3), // 简化ID
      facility.facilityId,
      facility.targetItemId,
      Math.round(facility.production.progress * 100) / 100, // 降低精度
      fuelData,
      facility.status === 'output_full' ? 'full' : undefined
    ].filter(v => v !== undefined)); // 移除undefined值
  });
  
  return optimized;
}

// 3. 转换函数：从新格式到旧格式（用于加载）
function convertFromOptimizedFormat(optimized) {
  const restored = {
    inventory: new Map(),
    craftingQueue: [],
    craftingChains: [],
    facilities: [],
    deployedContainers: [],
    totalItemsProduced: optimized.stats.total,
    favoriteRecipes: [],
    recentRecipes: [],
    researchState: null,
    researchQueue: [],
    unlockedTechs: optimized.research.unlocked,
    autoResearch: optimized.research.auto,
    craftedItemCounts: optimized.stats.crafted,
    builtEntityCounts: optimized.stats.built,
    minedEntityCounts: optimized.stats.mined,
    lastSaveTime: optimized.time,
    saveKey: `force_${optimized.time}`
  };
  
  // 恢复库存（需要从游戏配置获取stackSize等信息）
  for (const [itemId, amount] of Object.entries(optimized.inventory)) {
    restored.inventory.set(itemId, {
      itemId,
      currentAmount: amount,
      stackSize: getItemStackSize(itemId), // 从游戏配置获取
      baseStacks: 1,
      additionalStacks: 0,
      totalStacks: 1,
      maxCapacity: getItemStackSize(itemId),
      productionRate: 0,
      consumptionRate: 0,
      status: 'normal'
    });
  }
  
  // 恢复设施
  optimized.facilities.forEach(facility => {
    const [shortId, type, recipe, progress, fuel, status] = facility;
    const fuelItem = Object.keys(fuel)[0];
    
    restored.facilities.push({
      id: `facility_${type}_${optimized.time}_${shortId}`,
      facilityId: type,
      targetItemId: recipe,
      count: 1,
      status: status === 'full' ? 'output_full' : 'running',
      efficiency: 1,
      production: {
        currentRecipeId: recipe,
        progress: progress,
        inputBuffer: [],
        outputBuffer: []
      },
      fuelBuffer: {
        slots: fuelItem ? [{
          itemId: fuelItem,
          quantity: 1,
          remainingEnergy: fuel[fuelItem]
        }] : [],
        maxSlots: 1,
        totalEnergy: fuel[fuelItem] || 0,
        maxEnergy: getFacilityMaxEnergy(type), // 从游戏配置获取
        consumptionRate: getFacilityConsumptionRate(type), // 从游戏配置获取
        lastUpdate: optimized.time
      }
    });
  });
  
  return restored;
}

// 4. 压缩工具函数
function compressSave(save) {
  // 使用短键名
  const compressed = {
    v: save.version,
    i: save.inventory,
    c: save.crafting,
    f: save.facilities,
    s: save.stats,
    r: save.research,
    t: save.time
  };
  
  return JSON.stringify(compressed);
}

function decompressSave(compressedStr) {
  const compressed = JSON.parse(compressedStr);
  
  return {
    version: compressed.v,
    inventory: compressed.i,
    crafting: compressed.c,
    facilities: compressed.f,
    stats: compressed.s,
    research: compressed.r,
    time: compressed.t
  };
}

// 5. 增量保存示例
class IncrementalSaveManager {
  constructor() {
    this.baseSnapshot = null;
    this.changes = [];
    this.changeThreshold = 100; // 每100个变更创建新快照
  }
  
  saveChange(change) {
    this.changes.push({
      type: change.type,
      data: change.data,
      time: Date.now()
    });
    
    if (this.changes.length >= this.changeThreshold) {
      this.createSnapshot();
    }
  }
  
  createSnapshot() {
    // 应用所有变更到基础快照
    const newSnapshot = this.applyChanges(this.baseSnapshot, this.changes);
    this.baseSnapshot = newSnapshot;
    this.changes = [];
    return newSnapshot;
  }
  
  applyChanges(base, changes) {
    const result = JSON.parse(JSON.stringify(base)); // 深拷贝
    
    changes.forEach(change => {
      switch (change.type) {
        case 'inventory':
          result.inventory[change.data.item] = change.data.amount;
          break;
        case 'facility':
          // 更新设施状态
          const facilityIndex = result.facilities.findIndex(f => f[0] === change.data.id);
          if (facilityIndex >= 0) {
            result.facilities[facilityIndex] = change.data.state;
          }
          break;
        // ... 其他类型的变更
      }
    });
    
    return result;
  }
}

// 6. 二进制格式示例（使用 MessagePack 风格）
function toBinaryFormat(save) {
  // 这是一个简化的示例，实际实现需要使用专门的库
  const buffer = [];
  
  // 写入版本号
  buffer.push(0x01); // 类型标记：整数
  buffer.push(save.version);
  
  // 写入库存
  buffer.push(0x02); // 类型标记：对象
  const items = Object.entries(save.inventory);
  buffer.push(items.length);
  
  items.forEach(([id, amount]) => {
    // 写入物品ID和数量
    buffer.push(id.length);
    buffer.push(...id.split('').map(c => c.charCodeAt(0)));
    buffer.push(amount);
  });
  
  // ... 继续写入其他数据
  
  return new Uint8Array(buffer);
}

// 导出
module.exports = {
  optimizedSaveFormat,
  convertToOptimizedFormat,
  convertFromOptimizedFormat,
  compressSave,
  decompressSave,
  IncrementalSaveManager,
  toBinaryFormat
};

// 辅助函数（需要从游戏配置获取）
function getItemStackSize(itemId) {
  // 从游戏配置获取
  const stackSizes = {
    'stone': 50,
    'coal': 50,
    'iron-ore': 50,
    'copper-ore': 50,
    'iron-plate': 100,
    'copper-plate': 100,
    'iron-gear-wheel': 100,
    'stone-furnace': 50,
    'burner-mining-drill': 50
  };
  return stackSizes[itemId] || 50;
}

function getFacilityMaxEnergy(facilityType) {
  const energyLimits = {
    'stone-furnace': 90,
    'burner-mining-drill': 150
  };
  return energyLimits[facilityType] || 100;
}

function getFacilityConsumptionRate(facilityType) {
  const consumptionRates = {
    'stone-furnace': 0.09,
    'burner-mining-drill': 0.15
  };
  return consumptionRates[facilityType] || 0.1;
}