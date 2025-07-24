/**
 * 手动制作配置文件
 * 基于 Factorio Wiki 官方规则
 * 参考：
 * - https://wiki.factorio.com/Crafting#Manual_crafting
 * - https://wiki.factorio.com/Recycler
 */

export interface ManualCraftingConfig {
  // 可以手动制作的配方类别
  manualCraftableCategories: string[];
  
  // 需要特殊设备的配方类别
  restrictedCategories: string[];
  
  // 流体物品列表（不能手动制作包含流体的配方）
  fluidItems: string[];
  
  // 不能手动制作的特殊物品
  restrictedItems: string[];
  
  // 需要特殊设备的生产者
  restrictedProducers: string[];
  
  // 手动制作白名单（强制允许）
  manualCraftingWhitelist: string[];
  
  // 手动制作黑名单（强制禁止）
  manualCraftingBlacklist: string[];
  
  // 是否启用严格模式（默认禁止所有有生产者的配方）
  strictMode: boolean;
  
  // 是否将没有生产者的配方视为可手动制作
  allowNoProducerRecipes: boolean;
}

// 默认配置 - 基于Factorio Wiki
export const defaultManualCraftingConfig: ManualCraftingConfig = {
  // 根据Wiki，只有这些类别可以手动制作
  manualCraftableCategories: [
    'crafting',              // 基础制作 - 可以手动制作
    'advanced-crafting',     // 高级制作 - 可以手动制作（需要解锁）
    // 注意：'crafting-with-fluid' 通常不能手动制作
  ],
  
  // 需要特殊设备的配方类别
  restrictedCategories: [
    'smelting',             // 熔炼 - 需要熔炉
    'chemistry',            // 化工 - 需要化工厂
    'oil-processing',       // 炼油 - 需要炼油厂
    'centrifuging',         // 离心 - 需要离心机
    'rocket-building',      // 火箭建造 - 需要火箭发射井
    // 太空时代新增
    'electromagnetics',     // 电磁 - 需要电磁工厂
    'cryogenics',          // 低温 - 需要低温工厂
    'metallurgy',          // 冶金 - 需要铸造厂
    'organic',             // 有机 - 需要生物室
    'recycling',           // 回收 - 需要回收机
    'crafting-with-fluid', // 包含流体的制作 - 不能手动制作
    'recycling-or-hand-crafting' // 特殊：可以在回收机或手动制作
  ],
  
  // 流体物品列表 - 根据Wiki，包含流体的配方不能手动制作
  fluidItems: [
    'water',
    'crude-oil',
    'petroleum-gas',
    'light-oil',
    'heavy-oil',
    'lubricant',
    'sulfuric-acid',
    'steam',
    // 太空时代流体
    'ammonia',
    'ammoniacal-solution',
    'electrolyte',
    'fluoroketone-cold',
    'fluoroketone-hot',
    'holmium-solution',
    'lithium-brine',
    'molten-copper',
    'molten-iron',
    'thruster-fuel',
    'thruster-oxidizer'
  ],
  
  // 根据Wiki明确不能手动制作的物品
  restrictedItems: [
    // Wiki明确提到的例子
    'engine-unit',              // 引擎单元
    'electric-engine-unit',     // 电动引擎单元
    'flying-robot-frame',       // 飞行机器人框架
    
    // 其他需要特殊处理的高级物品
    'rocket-fuel',
    'rocket-control-unit',
    'satellite',
    'uranium-235',
    'uranium-238',
    'uranium-fuel-cell',
    'used-up-uranium-fuel-cell',
    'nuclear-fuel',
    'kovarex-enrichment-process',
    
    // 太空时代物品
    'quantum-processor',
    'fusion-power-cell',
    'superconductor',
    'supercapacitor'
  ],
  
  // 受限生产者 - 这些生产者的配方不能手动制作
  restrictedProducers: [
    // 基础游戏
    'stone-furnace',
    'steel-furnace',
    'electric-furnace',
    'assembling-machine-1',
    'assembling-machine-2',
    'assembling-machine-3',
    'chemical-plant',
    'oil-refinery',
    'centrifuge',
    'nuclear-reactor',
    'rocket-silo',
    
    // 太空时代
    'foundry',
    'electromagnetic-plant',
    'cryogenic-plant',
    'biochamber',
    'recycler'
  ],
  
  // 手动制作白名单 - 覆盖其他规则
  manualCraftingWhitelist: [
    // 基础物品应该可以手动制作
    'wood',
    'stone',
    'coal',
    'iron-ore',
    'copper-ore',
    
    // 一些基础的制作物品
    'wooden-chest',
    'iron-chest',
    'stone-furnace',
    'burner-mining-drill',
    'burner-inserter',
    'inserter',
    'long-handed-inserter',
    'pipe',
    'pipe-to-ground',
    'transport-belt',
    'underground-belt',
    'splitter',
    'stone-brick',
    'repair-pack',
    'small-electric-pole',
    'medium-electric-pole',
    'big-electric-pole',
    'lamp',
    'arithmetic-combinator',
    'decider-combinator',
    'constant-combinator',
    'power-switch',
    'programmable-speaker',
    
    // 基础中间产品
    'iron-stick',
    'iron-gear-wheel',
    'copper-cable',
    'electronic-circuit',
    'advanced-circuit',
    
    // 武器和弹药
    'pistol',
    'submachine-gun',
    'shotgun',
    'combat-shotgun',
    'firearm-magazine',
    'piercing-rounds-magazine',
    'shotgun-shell',
    'piercing-shotgun-shell',
    'grenade',
    'cluster-grenade',
    
    // 护甲和装备
    'light-armor',
    'heavy-armor',
    'modular-armor',
    
    // 科技包
    'automation-science-pack',
    'logistic-science-pack',
    'military-science-pack'
  ],
  
  // 手动制作黑名单
  manualCraftingBlacklist: [
    // 明确不能手动制作的物品
  ],
  
  // 不使用严格模式
  strictMode: false,
  
  // 允许没有生产者的配方（默认可手动制作）
  allowNoProducerRecipes: true
};

/**
 * 宽松配置 - 允许更多物品手动制作（适合休闲游戏）
 */
export const relaxedManualCraftingConfig: ManualCraftingConfig = {
  ...defaultManualCraftingConfig,
  
  // 添加更多可手动制作的类别
  manualCraftableCategories: [
    'crafting',
    'advanced-crafting',
    'crafting-with-fluid', // 允许包含流体的配方
    'recycling-or-hand-crafting'
  ],
  
  // 减少受限生产者
  restrictedProducers: [
    'chemical-plant',
    'oil-refinery',
    'centrifuge',
    'nuclear-reactor',
    'rocket-silo',
    'foundry',
    'electromagnetic-plant',
    'cryogenic-plant',
    'biochamber',
    'recycler'
  ],
  
  // 扩展白名单
  manualCraftingWhitelist: [
    ...defaultManualCraftingConfig.manualCraftingWhitelist,
    // 允许更多中间产品
    'processing-unit',
    'plastic-bar',
    'sulfur',
    'battery',
    'explosives',
    'cliff-explosives',
    
    // 允许一些生产建筑
    'assembling-machine-1',
    'lab',
    'electric-mining-drill',
    'pumpjack',
    'oil-refinery',
    'chemical-plant',
    
    // 更多装备
    'power-armor',
    'power-armor-mk2',
    'solar-panel-equipment',
    'fusion-reactor-equipment',
    'battery-equipment',
    'battery-mk2-equipment',
    'personal-laser-defense-equipment',
    'discharge-defense-equipment',
    'exoskeleton-equipment',
    'personal-roboport-equipment',
    'night-vision-equipment',
    
    // 机器人相关
    'roboport',
    'logistic-robot',
    'construction-robot',
    'logistic-chest-passive-provider',
    'logistic-chest-active-provider',
    'logistic-chest-storage',
    'logistic-chest-buffer',
    'logistic-chest-requester'
  ],
  
  // 清空某些限制
  restrictedItems: [],
  fluidItems: [], // 允许流体配方
  
  strictMode: false,
  allowNoProducerRecipes: true
};

/**
 * 严格配置 - 遵循Wiki规则（适合原版体验）
 */
export const strictManualCraftingConfig: ManualCraftingConfig = {
  ...defaultManualCraftingConfig,
  
  // 只允许明确的手动制作类别
  manualCraftableCategories: [
    'crafting',
    'advanced-crafting'
  ],
  
  // 严格的白名单（只包含确定可以手动制作的物品）
  manualCraftingWhitelist: [
    // 原材料
    'wood',
    'stone',
    'coal',
    'iron-ore',
    'copper-ore',
    
    // Wiki确认的基础物品
    'wooden-chest',
    'iron-chest',
    'transport-belt',
    'burner-inserter',
    'inserter',
    'small-electric-pole',
    'pipe',
    'stone-furnace',
    'burner-mining-drill',
    
    // 基础中间产品
    'iron-stick',
    'iron-gear-wheel', 
    'copper-cable',
    'electronic-circuit',
    
    // 基础武器装备
    'pistol',
    'firearm-magazine',
    'light-armor',
    'repair-pack',
    
    // 科技包
    'automation-science-pack',
    'logistic-science-pack'
  ],
  
  // 使用严格模式
  strictMode: true,
  allowNoProducerRecipes: false
};

/**
 * 游戏早期配置 - 只允许最基础的手动制作
 */
export const earlyGameConfig: ManualCraftingConfig = {
  ...strictManualCraftingConfig,
  
  // 极少的白名单
  manualCraftingWhitelist: [
    'wood',
    'stone', 
    'coal',
    'iron-ore',
    'copper-ore',
    'wooden-chest',
    'stone-furnace',
    'burner-mining-drill',
    'burner-inserter'
  ],
  
  strictMode: true,
  allowNoProducerRecipes: false
};