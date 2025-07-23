// 手动合成配方过滤测试
// 验证需要producer的配方不会显示在手动合成分类中

import ManualCraftingValidator from './manualCraftingValidator';
import DataService from '../services/DataService';

export class ManualCraftingTest {
  private validator: ManualCraftingValidator;
  private dataService: DataService;

  constructor() {
    this.validator = ManualCraftingValidator.getInstance();
    this.dataService = DataService.getInstance();
  }

  /**
   * 测试配方过滤功能
   */
  async testRecipeFiltering() {
    console.log('=== 测试配方过滤功能 ===');
    
    const testItems = [
      'iron-ore',      // 原材料，可手动采集
      'iron-plate',    // 需要熔炉，不可手动制作
      'wood',          // 有树木生长配方，可手动制作
      'engine-unit',   // 需要装配机，不可手动制作
      'electronic-circuit', // 需要装配机，不可手动制作
      'transport-belt' // 需要装配机，不可手动制作
    ];

    for (const itemId of testItems) {
      console.log(`\n--- 测试物品: ${itemId} ---`);
      
      const itemRecipes = this.dataService.getRecipesForItem(itemId);
      console.log(`配方数量: ${itemRecipes.length}`);
      
      // 使用验证器检查哪些配方可以手动制作
      const manualCraftableRecipes = itemRecipes.filter(recipe => {
        const validation = this.validator.validateRecipe(recipe);
        return validation.canCraftManually;
      });

      // 检查是否有需要特定生产者的配方
      const restrictedRecipes = itemRecipes.filter(recipe => {
        const validation = this.validator.validateRecipe(recipe);
        return !validation.canCraftManually && validation.category === 'restricted';
      });

      console.log(`可手动制作的配方: ${manualCraftableRecipes.length}`);
      console.log(`需要生产设备的配方: ${restrictedRecipes.length}`);

      // 显示配方详情
      if (manualCraftableRecipes.length > 0) {
        console.log('✅ 可手动制作的配方:');
        manualCraftableRecipes.forEach(recipe => {
          const validation = this.validator.validateRecipe(recipe);
          console.log(`  - ${recipe.id}: ${validation.reason}`);
        });
      }

      if (restrictedRecipes.length > 0) {
        console.log('❌ 需要生产设备的配方:');
        restrictedRecipes.forEach(recipe => {
          const validation = this.validator.validateRecipe(recipe);
          console.log(`  - ${recipe.id}: ${validation.reason}`);
          if (recipe.producers) {
            console.log(`    需要设备: ${recipe.producers.join(', ')}`);
          }
        });
      }

      // 验证UI逻辑
      if (itemRecipes.length === 0) {
        console.log('📋 UI显示: 手动合成（原材料）');
      } else if (manualCraftableRecipes.length > 0) {
        console.log('📋 UI显示: 手动合成（可手动制作）');
      } else if (restrictedRecipes.length > 0) {
        console.log('📋 UI显示: 需要生产设备（不可手动制作）');
      } else {
        console.log('📋 UI显示: 无可用配方');
      }
    }
  }

  /**
   * 测试特定物品的配方过滤
   */
  async testSpecificItem(itemId: string) {
    console.log(`\n=== 测试特定物品: ${itemId} ===`);
    
    const itemRecipes = this.dataService.getRecipesForItem(itemId);
    const validator = ManualCraftingValidator.getInstance();
    
    console.log(`配方总数: ${itemRecipes.length}`);
    
    // 分类配方
    const manualCraftableRecipes = itemRecipes.filter(recipe => {
      const validation = validator.validateRecipe(recipe);
      return validation.canCraftManually;
    });

    const restrictedRecipes = itemRecipes.filter(recipe => {
      const validation = validator.validateRecipe(recipe);
      return !validation.canCraftManually && validation.category === 'restricted';
    });

    console.log(`\n可手动制作的配方 (${manualCraftableRecipes.length}):`);
    manualCraftableRecipes.forEach(recipe => {
      const validation = validator.validateRecipe(recipe);
      console.log(`  ✅ ${recipe.id} - ${validation.reason}`);
    });

    console.log(`\n需要生产设备的配方 (${restrictedRecipes.length}):`);
    restrictedRecipes.forEach(recipe => {
      const validation = validator.validateRecipe(recipe);
      console.log(`  ❌ ${recipe.id} - ${validation.reason}`);
      if (recipe.producers) {
        console.log(`     需要设备: ${recipe.producers.join(', ')}`);
      }
    });

    // 预测UI显示
    if (itemRecipes.length === 0) {
      console.log('\n📋 预期UI显示: 手动合成（原材料）');
    } else if (manualCraftableRecipes.length > 0) {
      console.log('\n📋 预期UI显示: 手动合成（可手动制作）');
      console.log(`   使用配方: ${manualCraftableRecipes[0].id}`);
    } else if (restrictedRecipes.length > 0) {
      console.log('\n📋 预期UI显示: 需要生产设备（不可手动制作）');
      console.log(`   限制原因: ${validator.validateRecipe(restrictedRecipes[0]).reason}`);
    } else {
      console.log('\n📋 预期UI显示: 无可用配方');
    }
  }
}

// 导出测试实例
export const manualCraftingTest = new ManualCraftingTest(); 