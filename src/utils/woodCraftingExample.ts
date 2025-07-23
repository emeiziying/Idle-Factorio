// 木材采集示例
// 展示如何采集木材

import ManualCraftingValidator from './manualCraftingValidator';
import DataService from '../services/DataService';

export class WoodCraftingExample {
  private validator: ManualCraftingValidator;
  private dataService: DataService;

  constructor() {
    this.validator = ManualCraftingValidator.getInstance();
    this.dataService = DataService.getInstance();
  }

  /**
   * 检查木材的采集方式
   */
  async checkWoodCrafting() {
    console.log('=== 木材采集方式检查 ===');
    
    const woodId = 'wood';
    const validation = this.validator.validateManualCrafting(woodId);
    const woodName = this.dataService.getLocalizedItemName(woodId);
    
    console.log(`${woodName} (${woodId}):`);
    console.log(`  可手动采集: ${validation.canCraftManually ? '✅ 是' : '❌ 否'}`);
    console.log(`  原因: ${validation.reason}`);
    console.log(`  类别: ${validation.category}`);
    
    // 获取木材的配方
    const recipes = this.dataService.getRecipesForItem(woodId);
    console.log(`\n木材配方数量: ${recipes.length}`);
    
    if (recipes.length > 0) {
      console.log('\n📋 木材相关配方:');
      recipes.forEach((recipe, index) => {
        console.log(`  ${index + 1}. ${recipe.name} (${recipe.id})`);
        console.log(`     时间: ${recipe.time}秒`);
        console.log(`     输入: ${JSON.stringify(recipe.in)}`);
        console.log(`     输出: ${JSON.stringify(recipe.out)}`);
        if (recipe.producers) {
          console.log(`     生产者: ${recipe.producers.join(', ')}`);
        }
        if (recipe.flags) {
          console.log(`     标志: ${recipe.flags.join(', ')}`);
        }
        console.log('');
      });
    }
  }

  /**
   * 显示木材采集的最佳方法
   */
  async showBestWoodCraftingMethod() {
    console.log('=== 木材采集最佳方法 ===');
    
    const recipes = this.dataService.getRecipesForItem('wood');
    
    // 找到树木生长配方
    const treePlantRecipe = recipes.find(recipe => recipe.id === 'tree-plant');
    
    if (treePlantRecipe) {
      console.log('🌳 推荐方法：树木生长');
      console.log(`  配方: ${treePlantRecipe.name}`);
      console.log(`  时间: ${treePlantRecipe.time}秒 (${Math.round(treePlantRecipe.time / 60)}分钟)`);
      console.log(`  输入: ${JSON.stringify(treePlantRecipe.in)}`);
      console.log(`  输出: ${JSON.stringify(treePlantRecipe.out)}`);
      console.log(`  效率: ${treePlantRecipe.out.wood / treePlantRecipe.in['tree-seed']} 木材/种子`);
      console.log(`  生产者: ${treePlantRecipe.producers?.join(', ')}`);
    }
    
    // 检查手动采集
    const validation = this.validator.validateManualCrafting('wood');
    if (validation.canCraftManually) {
      console.log('\n✋ 手动采集方法');
      console.log('  可以直接在物品详情页面手动采集木材');
      console.log('  无需材料，立即完成');
    }
  }

  /**
   * 计算木材生产效率
   */
  async calculateWoodProductionEfficiency() {
    console.log('=== 木材生产效率计算 ===');
    
    const recipes = this.dataService.getRecipesForItem('wood');
    const treePlantRecipe = recipes.find(recipe => recipe.id === 'tree-plant');
    
    if (treePlantRecipe) {
      const woodPerSecond = treePlantRecipe.out.wood / treePlantRecipe.time;
      const seedsPerSecond = treePlantRecipe.in['tree-seed'] / treePlantRecipe.time;
      
      console.log('📊 生产效率:');
      console.log(`  木材产出: ${woodPerSecond.toFixed(3)} 木材/秒`);
      console.log(`  种子消耗: ${seedsPerSecond.toFixed(3)} 种子/秒`);
      console.log(`  效率比: ${(woodPerSecond / seedsPerSecond).toFixed(2)} 木材/种子`);
      
      // 计算不同数量的农业塔产量
      const agriculturalTowers = [1, 5, 10, 20];
      console.log('\n🏭 不同农业塔数量的产量:');
      agriculturalTowers.forEach(towers => {
        const totalWoodPerSecond = woodPerSecond * towers;
        const totalSeedsPerSecond = seedsPerSecond * towers;
        console.log(`  ${towers}个农业塔: ${totalWoodPerSecond.toFixed(1)} 木材/秒 (需要 ${totalSeedsPerSecond.toFixed(1)} 种子/秒)`);
      });
    }
  }

  /**
   * 运行所有木材采集示例
   */
  async runAllExamples() {
    console.log('🌳 开始木材采集示例\n');
    
    await this.checkWoodCrafting();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await this.showBestWoodCraftingMethod();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await this.calculateWoodProductionEfficiency();
    
    console.log('\n✅ 木材采集示例完成');
  }
}

export default WoodCraftingExample; 