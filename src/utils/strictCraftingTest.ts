// 严格手动制作测试
// 验证新的手动制作规则：冶炼物品和高级物品不能手动制作

import ManualCraftingValidator from './manualCraftingValidator';
import DataService from '../services/DataService';

export class StrictCraftingTest {
  private validator: ManualCraftingValidator;
  private dataService: DataService;

  constructor() {
    this.validator = ManualCraftingValidator.getInstance();
    this.dataService = DataService.getInstance();
  }

  /**
   * 测试新的严格手动制作规则
   */
  async testStrictCraftingRules() {
    console.log('=== 测试严格手动制作规则 ===');
    
    const testCases = [
      {
        name: '可以手动制作的物品',
        items: [
          'wooden-chest',      // 木箱
          'iron-chest',        // 铁箱
          'iron-gear-wheel',   // 铁齿轮
          'copper-cable',      // 铜线
          'pipe',              // 管道
          'stone-brick',       // 石砖
          'iron-stick',        // 铁棒
          'transport-belt',    // 传送带
          'inserter',          // 机械臂
          'stone-furnace',     // 石炉
          'assembling-machine-1' // 装配机1型
        ],
        expectedResult: true
      },
      {
        name: '不能手动制作的物品（冶炼）',
        items: [
          'iron-plate',        // 铁板 - 需要冶炼炉
          'copper-plate',      // 铜板 - 需要冶炼炉
          'steel-plate'        // 钢板 - 需要冶炼炉
        ],
        expectedResult: false
      },
      {
        name: '不能手动制作的物品（高级）',
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
        });
      }
    }
  }

  /**
   * 测试冶炼配方
   */
  async testSmeltingRecipes() {
    console.log('\n=== 测试冶炼配方 ===');
    
    const smeltingItems = [
      'iron-plate',
      'copper-plate', 
      'steel-plate'
    ];

    for (const itemId of smeltingItems) {
      console.log(`\n--- ${itemId} ---`);
      
      const itemRecipes = this.dataService.getRecipesForItem(itemId);
      const validator = ManualCraftingValidator.getInstance();
      
      console.log(`配方数量: ${itemRecipes.length}`);
      
      itemRecipes.forEach((recipe, index) => {
        const validation = validator.validateRecipe(recipe);
        console.log(`配方 ${index + 1}: ${recipe.id}`);
        console.log(`  可手动制作: ${validation.canCraftManually ? '❌ 是（错误）' : '✅ 否（正确）'}`);
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
        const validation = validator.validateRecipe(recipe);
        return validation.canCraftManually;
      });

      const producerRecipes = itemRecipes.filter(recipe => {
        const validation = validator.validateRecipe(recipe);
        return !validation.canCraftManually && validation.category === 'restricted';
      });

      console.log('\n📋 预期UI显示:');
      if (manualCraftableRecipes.length > 0) {
        console.log('  手动合成区域: ❌ 显示（错误）');
      } else {
        console.log('  手动合成区域: ✅ 不显示（正确）');
      }

      if (producerRecipes.length > 0) {
        console.log('  生产设备区域: ✅ 显示（正确）');
        console.log(`    配方: ${producerRecipes.map(r => r.id).join(', ')}`);
      } else {
        console.log('  生产设备区域: ❌ 不显示（错误）');
      }
    }
  }

  /**
   * 测试高级物品
   */
  async testAdvancedItems() {
    console.log('\n=== 测试高级物品 ===');
    
    const advancedItems = [
      'engine-unit',
      'advanced-circuit',
      'processing-unit',
      'rocket-fuel',
      'flying-robot-frame'
    ];

    for (const itemId of advancedItems) {
      console.log(`\n--- ${itemId} ---`);
      
      const itemRecipes = this.dataService.getRecipesForItem(itemId);
      const validator = ManualCraftingValidator.getInstance();
      
      console.log(`配方数量: ${itemRecipes.length}`);
      
      itemRecipes.forEach((recipe, index) => {
        const validation = validator.validateRecipe(recipe);
        console.log(`配方 ${index + 1}: ${recipe.id}`);
        console.log(`  可手动制作: ${validation.canCraftManually ? '❌ 是（错误）' : '✅ 否（正确）'}`);
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
        const validation = validator.validateRecipe(recipe);
        return validation.canCraftManually;
      });

      const producerRecipes = itemRecipes.filter(recipe => {
        const validation = validator.validateRecipe(recipe);
        return !validation.canCraftManually && validation.category === 'restricted';
      });

      console.log('\n📋 预期UI显示:');
      if (manualCraftableRecipes.length > 0) {
        console.log('  手动合成区域: ❌ 显示（错误）');
      } else {
        console.log('  手动合成区域: ✅ 不显示（正确）');
      }

      if (producerRecipes.length > 0) {
        console.log('  生产设备区域: ✅ 显示（正确）');
        console.log(`    配方: ${producerRecipes.map(r => r.id).join(', ')}`);
      } else {
        console.log('  生产设备区域: ❌ 不显示（错误）');
      }
    }
  }

  /**
   * 测试基础制作物品
   */
  async testBasicCraftableItems() {
    console.log('\n=== 测试基础制作物品 ===');
    
    const basicItems = [
      'wooden-chest',
      'iron-gear-wheel',
      'copper-cable',
      'pipe',
      'stone-brick',
      'iron-stick',
      'transport-belt',
      'inserter',
      'stone-furnace',
      'assembling-machine-1'
    ];

    for (const itemId of basicItems) {
      console.log(`\n--- ${itemId} ---`);
      
      const itemRecipes = this.dataService.getRecipesForItem(itemId);
      const validator = ManualCraftingValidator.getInstance();
      
      console.log(`配方数量: ${itemRecipes.length}`);
      
      itemRecipes.forEach((recipe, index) => {
        const validation = validator.validateRecipe(recipe);
        console.log(`配方 ${index + 1}: ${recipe.id}`);
        console.log(`  可手动制作: ${validation.canCraftManually ? '✅ 是（正确）' : '❌ 否（错误）'}`);
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
        const validation = validator.validateRecipe(recipe);
        return validation.canCraftManually;
      });

      const producerRecipes = itemRecipes.filter(recipe => {
        const validation = validator.validateRecipe(recipe);
        return !validation.canCraftManually && validation.category === 'restricted';
      });

      console.log('\n📋 预期UI显示:');
      if (manualCraftableRecipes.length > 0) {
        console.log('  手动合成区域: ✅ 显示（正确）');
        console.log(`    配方: ${manualCraftableRecipes.map(r => r.id).join(', ')}`);
      } else {
        console.log('  手动合成区域: ❌ 不显示（错误）');
      }

      if (producerRecipes.length > 0) {
        console.log('  生产设备区域: ✅ 显示（正确）');
        console.log(`    配方: ${producerRecipes.map(r => r.id).join(', ')}`);
      } else {
        console.log('  生产设备区域: ❌ 不显示（错误）');
      }
    }
  }
}

// 导出测试实例
export const strictCraftingTest = new StrictCraftingTest(); 