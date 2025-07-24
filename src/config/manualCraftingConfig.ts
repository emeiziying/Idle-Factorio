/**
 * 手动制作配置文件
 * 基于 Factorio Wiki 规则，并允许自定义修改
 */

export interface ManualCraftingConfig {
  // 可以手动制作的配方类别
  manualCraftableCategories: string[];
  
  // 需要特殊设备的配方类别
  restrictedCategories: string[];
  
  // 流体物品列表
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
}

// 默认配置
export const defaultManualCraftingConfig: ManualCraftingConfig = {
  // 可以手动制作的配方类别
  manualCraftableCategories: [
    'crafting',              // 基础制作
    'advanced-crafting',     // 高级制作
    'crafting-with-fluid',   // 包含流体的制作（部分）
    'recycling-or-hand-crafting' // 回收或手动制作
  ],
  
  // 需要特殊设备的配方类别
  restrictedCategories: [
    'smelting',             // 熔炼
    'chemistry',            // 化工
    'oil-processing',       // 炼油
    'centrifuging',         // 离心
    'rocket-building',      // 火箭建造
    'electromagnetics',     // 电磁（太空时代）
    'cryogenics',          // 低温（太空时代）
    'metallurgy',          // 冶金（太空时代）
    'organic',             // 有机（太空时代）
    'recycling'            // 回收（太空时代）
  ],
  
  // 流体物品列表
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
  
  // 不能手动制作的特殊物品
  restrictedItems: [
    'engine-unit',
    'electric-engine-unit',
    'flying-robot-frame',
    'rocket-fuel',
    'rocket-control-unit',
    'satellite',
    'uranium-235',
    'uranium-238',
    'uranium-fuel-cell',
    'used-up-uranium-fuel-cell',
    'nuclear-fuel',
    'kovarex-enrichment-process'
  ],
  
  // 需要特殊设备的生产者
  restrictedProducers: [
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
    // 太空时代生产者
    'foundry',
    'electromagnetic-plant',
    'cryogenic-plant',
    'biochamber',
    'recycler'
  ],
  
  // 手动制作白名单（覆盖其他规则，强制允许）
  manualCraftingWhitelist: [
    // 在这里添加应该能手动制作的物品ID
    // 例如：'wooden-chest', 'iron-stick', 'iron-gear-wheel'
  ],
  
  // 手动制作黑名单（覆盖其他规则，强制禁止）
  manualCraftingBlacklist: [
    // 在这里添加不应该能手动制作的物品ID
  ],
  
  // 严格模式
  strictMode: false
};

/**
 * 自定义配置示例：允许更多物品手动制作
 */
export const relaxedManualCraftingConfig: ManualCraftingConfig = {
  ...defaultManualCraftingConfig,
  
  // 移除一些生产者限制
  restrictedProducers: [
    'chemical-plant',
    'oil-refinery',
    'centrifuge',
    'nuclear-reactor',
    'foundry',
    'electromagnetic-plant',
    'cryogenic-plant',
    'biochamber',
    'recycler'
  ],
  
  // 添加更多白名单物品
  manualCraftingWhitelist: [
    'wooden-chest',
    'iron-chest',
    'stone-furnace',
    'burner-mining-drill',
    'burner-inserter',
    'iron-stick',
    'iron-gear-wheel',
    'copper-cable',
    'electronic-circuit',
    'pistol',
    'firearm-magazine',
    'light-armor',
    'repair-pack',
    'stone-brick',
    'wood-plank'
  ],
  
  strictMode: false
};

/**
 * 游戏早期配置：只允许最基础的手动制作
 */
export const earlyGameConfig: ManualCraftingConfig = {
  ...defaultManualCraftingConfig,
  
  // 只允许最基础的物品
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
  
  // 严格模式：默认禁止所有配方
  strictMode: true
};