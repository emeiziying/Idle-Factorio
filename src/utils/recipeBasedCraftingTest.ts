// 基于配方的制作测试
// 验证根据配方特征判断能否手动制作的逻辑

import ManualCraftingValidator from './manualCraftingValidator';
import DataService from '../services/DataService';

export class RecipeBasedCraftingTest {
  private validator: ManualCraftingValidator;
  private dataService: DataService;

  constructor() {
    this.validator = ManualCraftingValidator.getInstance();
    this.dataService = DataService.getInstance();
  }

  /**
   * 测试基于配方的判断逻辑
   */
  async testRecipeBasedCrafting() {
    console.log('=== 测试基于配方的判断逻辑 ===');
    
    const testCases = [
      {
        name: '可以手动制作的配方',
        items: [
          'wooden-chest',      // 木箱 - 基础制作
          'iron-gear-wheel',   // 铁齿轮 - 基础制作
          'copper-cable',      // 铜线 - 基础制作
          'pipe',              // 管道 - 基础制作
          'stone-brick',       // 石砖 - 基础制作
          'iron-stick',        // 铁棒 - 基础制作
          'transport-belt',    // 传送带 - 基础制作
          'inserter',          // 机械臂 - 基础制作
          'stone-furnace',     // 石炉 - 基础制作
          'assembling-machine-1' // 装配机1型 - 基础制作
        ],
        expectedResult: true
      },
      {
        name: '不能手动制作的配方（冶炼）',
        items: [
          'iron-plate',        // 铁板 - 需要冶炼炉
          'copper-plate',      // 铜板 - 需要冶炼炉
          'steel-plate'        // 钢板 - 需要冶炼炉
        ],
        expectedResult: false
      },
      {
        name: '不能手动制作的配方（高级）',
        items: [
          'engine-unit',       // 内燃机 - 需要机器制造
          'advanced-circuit',  // 高级电路 - 需要机器制造
          'processing-unit',   // 处理器单元 - 需要机器制造
          'rocket-fuel',       // 火箭燃料 - 需要机器制造
          'flying-robot-frame' // 飞行机器人框架 - 需要机器制造
        ],
        expectedResult: false
      },
      {
        name: '涉及流体的配方',
        items: [
          'sulfuric-acid',     // 硫酸 - 涉及流体
          'lubricant',         // 润滑油 - 涉及流体
          'plastic-bar'        // 塑料棒 - 涉及流体
        ],
        expectedResult: false
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n--- ${testCase.name} ---`);
      
      for (const itemId of testCase.items) {
        const itemRecipes = this.dataService.getRecipesForItem(itemId);
        const validator = ManualCraftingValidator.getInstance();
        
        if (itemRecipes.length === 0) {
          console.log(`${itemId}: ❌ 没有配方`);
          continue;
        }

        // 检查是否有可手动制作的配方
        const manualCraftableRecipes = itemRecipes.filter(recipe => {
          const validation = validator.validateRecipe(recipe);
          return validation.canCraftManually;
        });

        const canCraftManually = manualCraftableRecipes.length > 0;
        const status = canCraftManually === testCase.expectedResult ? '✅' : '❌';
        
        console.log(`${itemId}: ${status} ${canCraftManually ? '可手动制作' : '不可手动制作'}`);
        
        // 显示配方详情
        itemRecipes.forEach((recipe, index) => {
          const validation = validator.validateRecipe(recipe);
          console.log(`  配方 ${index + 1}: ${recipe.id} - ${validation.reason}`);
          if (recipe.producers) {
            console.log(`    需要设备: ${recipe.producers.join(', ')}`);
          }
          if (recipe.flags) {
            console.log(`    配方标志: ${recipe.flags.join(', ')}`);
          }
        });
      }
    }
  }

  /**
   * 测试配方特征分析
   */
  async testRecipeFeatureAnalysis() {
    console.log('\n=== 测试配方特征分析 ===');
    
    const testItems = [
      'wooden-chest',      // 基础制作
      'iron-plate',        // 冶炼配方
      'engine-unit',       // 高级物品
      'sulfuric-acid',     // 涉及流体
      'iron-ore'           // 采矿配方
    ];

    for (const itemId of testItems) {
      console.log(`\n--- ${itemId} ---`);
      
      const itemRecipes = this.dataService.getRecipesForItem(itemId);
      const validator = ManualCraftingValidator.getInstance();
      
      console.log(`配方数量: ${itemRecipes.length}`);
      
      itemRecipes.forEach((recipe, index) => {
        const validation = validator.validateRecipe(recipe);
        console.log(`\n配方 ${index + 1}: ${recipe.id}`);
        console.log(`  可手动制作: ${validation.canCraftManually ? '✅ 是' : '❌ 否'}`);
        console.log(`  原因: ${validation.reason}`);
        console.log(`  类别: ${validation.category}`);
        
        // 分析配方特征
        console.log(`  配方特征:`);
        if (recipe.flags) {
          console.log(`    标志: ${recipe.flags.join(', ')}`);
        }
        if (recipe.producers) {
          console.log(`    生产者: ${recipe.producers.join(', ')}`);
        }
        if (recipe.in) {
          console.log(`    输入材料: ${Object.entries(recipe.in).map(([id, qty]) => `${id} x${qty}`).join(', ')}`);
        }
        if (recipe.out) {
          console.log(`    输出产品: ${Object.entries(recipe.out).map(([id, qty]) => `${id} x${qty}`).join(', ')}`);
        }
        console.log(`    制作时间: ${recipe.time}秒`);
      });

      // 预测UI显示
      const manualCraftableRecipes = itemRecipes.filter(recipe => {
        const validation = validator.validateRecipe(recipe);
        return validation.canCraftManually;
      });

      const producerRecipes = itemRecipes.filter(recipe => {
        const validation = validator.validateRecipe(recipe);
        return !validation.canCraftManually && validation.category === 'restricted';
      });

      console.log('\n📋 预期UI显示:');
      if (manualCraftableRecipes.length > 0) {
        console.log('  手动合成区域: ✅ 显示（可手动制作）');
        console.log(`    配方: ${manualCraftableRecipes.map(r => r.id).join(', ')}`);
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
  }

  /**
   * 测试多配方物品
   */
  async testMultiRecipeItems() {
    console.log('\n=== 测试多配方物品 ===');
    
    const multiRecipeItems = [
      'iron-plate',        // 可能有冶炼配方和回收配方
      'copper-plate',      // 可能有冶炼配方和回收配方
      'steel-plate',       // 可能有冶炼配方和回收配方
      'wooden-chest',      // 基础制作配方
      'iron-gear-wheel'    // 基础制作配方
    ];

    for (const itemId of multiRecipeItems) {
      console.log(`\n--- ${itemId} ---`);
      
      const itemRecipes = this.dataService.getRecipesForItem(itemId);
      const validator = ManualCraftingValidator.getInstance();
      
      console.log(`配方总数: ${itemRecipes.length}`);
      
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
        if (recipe.flags) {
          console.log(`     标志: ${recipe.flags.join(', ')}`);
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
  }

  /**
   * 测试配方标志
   */
  async testRecipeFlags() {
    console.log('\n=== 测试配方标志 ===');
    
    const flagTestItems = [
      'iron-ore',          // 采矿配方
      'copper-ore',        // 采矿配方
      'stone',             // 采矿配方
      'coal'               // 采矿配方
    ];

    for (const itemId of flagTestItems) {
      console.log(`\n--- ${itemId} ---`);
      
      const itemRecipes = this.dataService.getRecipesForItem(itemId);
      const validator = ManualCraftingValidator.getInstance();
      
      itemRecipes.forEach((recipe, index) => {
        const validation = validator.validateRecipe(recipe);
        console.log(`配方 ${index + 1}: ${recipe.id}`);
        console.log(`  可手动制作: ${validation.canCraftManually ? '✅ 是' : '❌ 否'}`);
        console.log(`  原因: ${validation.reason}`);
        console.log(`  类别: ${validation.category}`);
        
        if (recipe.flags) {
          console.log(`  配方标志: ${recipe.flags.join(', ')}`);
        }
      });
    }
  }
}

// 导出测试实例
export const recipeBasedCraftingTest = new RecipeBasedCraftingTest(); 