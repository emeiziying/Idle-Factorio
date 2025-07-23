// 手动采集验证使用示例
// 展示如何识别哪些物品可以手动采集

import ManualCraftingValidator from './manualCraftingValidator';
import DataService from '../services/DataService';

export class ManualCraftingExamples {
  private validator: ManualCraftingValidator;
  private dataService: DataService;

  constructor() {
    this.validator = ManualCraftingValidator.getInstance();
    this.dataService = DataService.getInstance();
  }

  /**
   * 示例1：检查特定物品是否可以手动采集
   */
  async checkSpecificItems() {
    console.log('=== 检查特定物品的手动采集能力 ===');
    
    const testItems = [
      'iron-ore',      // 铁矿石 - 原材料，可手动采集
      'iron-plate',    // 铁板 - 需要熔炉，不可手动制作
      'wood',          // 木材 - 原材料，可手动采集
      'stone',         // 石头 - 原材料，可手动采集
      'coal',          // 煤炭 - 原材料，可手动采集
      'engine-unit',   // 发动机单元 - 需要装配机，不可手动制作
      'electronic-circuit', // 电子电路 - 需要装配机，不可手动制作
      'transport-belt' // 传送带 - 需要装配机，不可手动制作
    ];

    for (const itemId of testItems) {
      const validation = this.validator.validateManualCrafting(itemId);
      const itemName = this.dataService.getLocalizedItemName(itemId);
      
      console.log(`${itemName} (${itemId}):`);
      console.log(`  可手动采集: ${validation.canCraftManually ? '✅ 是' : '❌ 否'}`);
      console.log(`  原因: ${validation.reason}`);
      console.log(`  类别: ${validation.category}`);
      console.log('');
    }
  }

  /**
   * 示例2：获取所有可手动采集的物品
   */
  async getAllManualCraftableItems() {
    console.log('=== 所有可手动采集的物品 ===');
    
    const manualCraftableItems = this.validator.getManualCraftableItems();
    
    console.log(`总共找到 ${manualCraftableItems.length} 个可手动采集的物品:`);
    
    // 按类别分组显示
    const rawMaterials = this.validator.getRawMaterials();
    const miningItems = this.validator.getMiningItems();
    
    console.log('\n📦 原材料 (无配方):');
    for (const itemId of rawMaterials.slice(0, 10)) { // 只显示前10个
      const itemName = this.dataService.getLocalizedItemName(itemId);
      console.log(`  - ${itemName} (${itemId})`);
    }
    if (rawMaterials.length > 10) {
      console.log(`  ... 还有 ${rawMaterials.length - 10} 个`);
    }
    
    console.log('\n⛏️ 采矿物品:');
    for (const itemId of miningItems.slice(0, 10)) { // 只显示前10个
      const itemName = this.dataService.getLocalizedItemName(itemId);
      console.log(`  - ${itemName} (${itemId})`);
    }
    if (miningItems.length > 10) {
      console.log(`  ... 还有 ${miningItems.length - 10} 个`);
    }
  }

  /**
   * 示例3：检查物品的配方限制
   */
  async checkRecipeRestrictions() {
    console.log('=== 配方限制检查 ===');
    
    const restrictedItems = [
      'engine-unit',
      'electric-engine-unit',
      'flying-robot-frame',
      'rocket-fuel',
      'rocket-control-unit'
    ];

    for (const itemId of restrictedItems) {
      const validation = this.validator.validateManualCrafting(itemId);
      const itemName = this.dataService.getLocalizedItemName(itemId);
      
      console.log(`${itemName} (${itemId}):`);
      console.log(`  可手动制作: ${validation.canCraftManually ? '✅ 是' : '❌ 否'}`);
      console.log(`  限制原因: ${validation.reason}`);
      console.log('');
    }
  }

  /**
   * 示例4：检查流体相关物品
   */
  async checkFluidItems() {
    console.log('=== 流体物品检查 ===');
    
    const fluidItems = [
      'water',
      'steam', 
      'crude-oil',
      'sulfuric-acid',
      'lubricant'
    ];

    for (const itemId of fluidItems) {
      const validation = this.validator.validateManualCrafting(itemId);
      const itemName = this.dataService.getLocalizedItemName(itemId);
      
      console.log(`${itemName} (${itemId}):`);
      console.log(`  可手动制作: ${validation.canCraftManually ? '✅ 是' : '❌ 否'}`);
      console.log(`  原因: ${validation.reason}`);
      console.log('');
    }
  }

  /**
   * 运行所有示例
   */
  async runAllExamples() {
    console.log('🚀 开始手动采集验证示例\n');
    
    await this.checkSpecificItems();
    await this.getAllManualCraftableItems();
    await this.checkRecipeRestrictions();
    await this.checkFluidItems();
    
    console.log('✅ 所有示例运行完成');
  }
}

// 导出使用示例
export default ManualCraftingExamples; 