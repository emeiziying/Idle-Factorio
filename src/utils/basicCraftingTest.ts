// 基础制作物品测试
// 验证wooden-chest等基础物品可以手动制作

import ManualCraftingValidator from './manualCraftingValidator';
import DataService from '../services/DataService';

export class BasicCraftingTest {
  private validator: ManualCraftingValidator;
  private dataService: DataService;

  constructor() {
    this.validator = ManualCraftingValidator.getInstance();
    this.dataService = DataService.getInstance();
  }

  /**
   * 测试基础制作物品的手动合成功能
   */
  async testBasicCraftingItems() {
    console.log('=== 测试基础制作物品的手动合成功能 ===');
    
    const basicItems = [
      'wooden-chest',      // 木箱
      'iron-chest',        // 铁箱
      'iron-gear-wheel',   // 铁齿轮
      'copper-cable',      // 铜线
      'pipe',              // 管道
      'stone-brick',       // 石砖
      'iron-stick',        // 铁棒
      'iron-plate',        // 铁板
      'copper-plate',      // 铜板
      'steel-plate',       // 钢板
      'electronic-circuit', // 电子电路
      'transport-belt',    // 传送带
      'inserter',          // 机械臂
      'stone-furnace',     // 石炉
      'assembling-machine-1' // 装配机1型
    ];

    for (const itemId of basicItems) {
      console.log(`\n--- 测试物品: ${itemId} ---`);
      
      const itemRecipes = this.dataService.getRecipesForItem(itemId);
      console.log(`配方数量: ${itemRecipes.length}`);
      
      if (itemRecipes.length === 0) {
        console.log('❌ 没有配方');
        continue;
      }

      // 测试每个配方
      itemRecipes.forEach((recipe, index) => {
        const validation = this.validator.validateRecipe(recipe);
        console.log(`配方 ${index + 1}: ${recipe.id}`);
        console.log(`  可手动制作: ${validation.canCraftManually ? '✅ 是' : '❌ 否'}`);
        console.log(`  原因: ${validation.reason}`);
        console.log(`  类别: ${validation.category}`);
        
        if (recipe.producers) {
          console.log(`  生产者: ${recipe.producers.join(', ')}`);
        }
        
        if (recipe.in) {
          console.log(`  输入材料: ${Object.entries(recipe.in).map(([id, qty]) => `${id} x${qty}`).join(', ')}`);
        }
        
        if (recipe.out) {
          console.log(`  输出产品: ${Object.entries(recipe.out).map(([id, qty]) => `${id} x${qty}`).join(', ')}`);
        }
        
        console.log(`  制作时间: ${recipe.time}秒`);
      });

      // 预测UI显示
      const manualCraftableRecipes = itemRecipes.filter(recipe => {
        const validation = this.validator.validateRecipe(recipe);
        return validation.canCraftManually;
      });

      const producerRecipes = itemRecipes.filter(recipe => {
        const validation = this.validator.validateRecipe(recipe);
        return !validation.canCraftManually && validation.category === 'restricted';
      });

      console.log('\n📋 预期UI显示:');
      if (manualCraftableRecipes.length > 0) {
        console.log('  手动合成区域: ✅ 显示（可手动制作）');
        console.log(`    配方: ${manualCraftableRecipes.map(r => r.id).join(', ')}`);
      } else {
        console.log('  手动合成区域: ❌ 不显示');
      }

      if (producerRecipes.length > 0) {
        console.log('  生产设备区域: ✅ 显示（需要设备）');
        console.log(`    配方: ${producerRecipes.map(r => r.id).join(', ')}`);
      } else {
        console.log('  生产设备区域: ❌ 不显示');
      }
    }
  }

  /**
   * 测试特定基础物品
   */
  async testSpecificBasicItem(itemId: string) {
    console.log(`\n=== 测试特定基础物品: ${itemId} ===`);
    
    const itemRecipes = this.dataService.getRecipesForItem(itemId);
    const validator = ManualCraftingValidator.getInstance();
    
    console.log(`配方总数: ${itemRecipes.length}`);
    
    if (itemRecipes.length === 0) {
      console.log('❌ 此物品没有配方');
      return;
    }

    // 分类配方
    const manualCraftableRecipes = itemRecipes.filter(recipe => {
      const validation = validator.validateRecipe(recipe);
      return validation.canCraftManually;
    });

    const producerRecipes = itemRecipes.filter(recipe => {
      const validation = validator.validateRecipe(recipe);
      return !validation.canCraftManually && validation.category === 'restricted';
    });

    console.log(`\n手动合成配方 (${manualCraftableRecipes.length}):`);
    manualCraftableRecipes.forEach(recipe => {
      const validation = validator.validateRecipe(recipe);
      console.log(`  ✅ ${recipe.id} - ${validation.reason}`);
      console.log(`     时间: ${recipe.time}秒`);
      if (recipe.in) {
        console.log(`     材料: ${Object.entries(recipe.in).map(([id, qty]) => `${id} x${qty}`).join(', ')}`);
      }
    });

    console.log(`\n生产设备配方 (${producerRecipes.length}):`);
    producerRecipes.forEach(recipe => {
      const validation = validator.validateRecipe(recipe);
      console.log(`  🏭 ${recipe.id} - ${validation.reason}`);
      if (recipe.producers) {
        console.log(`     需要设备: ${recipe.producers.join(', ')}`);
      }
    });

    // 预测UI显示
    console.log('\n📋 预期UI显示:');
    if (manualCraftableRecipes.length > 0) {
      console.log('  手动合成区域: ✅ 显示（可手动制作）');
      console.log(`    使用配方: ${manualCraftableRecipes[0].id}`);
      console.log(`    制作时间: ${manualCraftableRecipes[0].time}秒`);
      if (manualCraftableRecipes[0].in) {
        console.log(`    需要材料: ${Object.entries(manualCraftableRecipes[0].in).map(([id, qty]) => `${id} x${qty}`).join(', ')}`);
      }
    } else {
      console.log('  手动合成区域: ❌ 不显示（无可手动制作配方）');
    }

    if (producerRecipes.length > 0) {
      console.log('  生产设备区域: ✅ 显示（需要设备）');
      console.log(`    配方: ${producerRecipes.map(r => r.id).join(', ')}`);
    } else {
      console.log('  生产设备区域: ❌ 不显示（无需要设备的配方）');
    }
  }

  /**
   * 对比测试：基础物品 vs 高级物品
   */
  async testComparison() {
    console.log('\n=== 对比测试：基础物品 vs 高级物品 ===');
    
    const testCases = [
      {
        name: '基础物品',
        items: ['wooden-chest', 'iron-gear-wheel', 'electronic-circuit']
      },
      {
        name: '高级物品',
        items: ['engine-unit', 'rocket-fuel', 'flying-robot-frame']
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n--- ${testCase.name} ---`);
      
      for (const itemId of testCase.items) {
        const itemRecipes = this.dataService.getRecipesForItem(itemId);
        const validator = ManualCraftingValidator.getInstance();
        
        const manualCraftableRecipes = itemRecipes.filter(recipe => {
          const validation = validator.validateRecipe(recipe);
          return validation.canCraftManually;
        });

        console.log(`${itemId}: ${manualCraftableRecipes.length > 0 ? '✅ 可手动制作' : '❌ 不可手动制作'}`);
      }
    }
  }
}

// 导出测试实例
export const basicCraftingTest = new BasicCraftingTest(); 