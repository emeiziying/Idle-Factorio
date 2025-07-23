// 配方分类测试
// 验证手动合成配方和依赖producer的配方分类功能

import ManualCraftingValidator from './manualCraftingValidator';
import DataService from '../services/DataService';
import type { Recipe } from '../types/index';

export class RecipeCategoryTest {
  private validator: ManualCraftingValidator;
  private dataService: DataService;

  constructor() {
    this.validator = ManualCraftingValidator.getInstance();
    this.dataService = DataService.getInstance();
  }

  /**
   * 测试配方分类功能
   */
  async testRecipeCategorization() {
    console.log('=== 测试配方分类功能 ===');
    
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
      console.log(`配方总数: ${itemRecipes.length}`);
      
      // 分类配方
      const manualCraftableRecipes = itemRecipes.filter(recipe => {
        const validation = this.validator.validateRecipe(recipe);
        return validation.canCraftManually;
      });

      const producerRecipes = itemRecipes.filter(recipe => {
        const validation = this.validator.validateRecipe(recipe);
        return !validation.canCraftManually && validation.category === 'restricted';
      });

      // 检查producer解锁状态
      const isProducerUnlocked = (recipe: Recipe) => {
        if (!recipe.producers || recipe.producers.length === 0) return true;
        return recipe.producers.some((pid: string) => this.dataService.isItemUnlocked(pid));
      };

      const unlockedProducerRecipes = producerRecipes.filter(isProducerUnlocked);

      console.log(`手动合成配方: ${manualCraftableRecipes.length}`);
      console.log(`生产设备配方: ${producerRecipes.length}`);
      console.log(`已解锁的生产设备配方: ${unlockedProducerRecipes.length}`);

      // 显示配方详情
      if (manualCraftableRecipes.length > 0) {
        console.log('✅ 手动合成配方:');
        manualCraftableRecipes.forEach(recipe => {
          const validation = this.validator.validateRecipe(recipe);
          console.log(`  - ${recipe.id}: ${validation.reason}`);
        });
      }

      if (unlockedProducerRecipes.length > 0) {
        console.log('🏭 已解锁的生产设备配方:');
        unlockedProducerRecipes.forEach(recipe => {
          const validation = this.validator.validateRecipe(recipe);
          console.log(`  - ${recipe.id}: ${validation.reason}`);
          if (recipe.producers) {
            console.log(`    需要设备: ${recipe.producers.join(', ')}`);
          }
        });
      }

      if (producerRecipes.length > unlockedProducerRecipes.length) {
        console.log('🔒 未解锁的生产设备配方:');
        const lockedRecipes = producerRecipes.filter(recipe => !isProducerUnlocked(recipe));
        lockedRecipes.forEach(recipe => {
          const validation = this.validator.validateRecipe(recipe);
          console.log(`  - ${recipe.id}: ${validation.reason}`);
          if (recipe.producers) {
            console.log(`    需要设备: ${recipe.producers.join(', ')}`);
          }
        });
      }

      // 预测UI显示
      console.log('\n📋 预期UI显示:');
      if (itemRecipes.length === 0) {
        console.log('  手动合成区域: 显示（原材料）');
        console.log('  生产设备区域: 不显示');
      } else if (manualCraftableRecipes.length > 0) {
        console.log('  手动合成区域: 显示（可手动制作）');
        if (unlockedProducerRecipes.length > 0) {
          console.log('  生产设备区域: 显示（已解锁的配方）');
        } else {
          console.log('  生产设备区域: 不显示（无解锁配方）');
        }
      } else if (unlockedProducerRecipes.length > 0) {
        console.log('  手动合成区域: 不显示（无可手动制作配方）');
        console.log('  生产设备区域: 显示（已解锁的配方）');
      } else {
        console.log('  手动合成区域: 不显示（无可手动制作配方）');
        console.log('  生产设备区域: 不显示（无解锁配方）');
      }
    }
  }

  /**
   * 测试特定物品的配方分类
   */
  async testSpecificItemRecipeCategories(itemId: string) {
    console.log(`\n=== 测试特定物品: ${itemId} ===`);
    
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

    // 检查producer解锁状态
    const isProducerUnlocked = (recipe: Recipe) => {
      if (!recipe.producers || recipe.producers.length === 0) return true;
      return recipe.producers.some((pid: string) => this.dataService.isItemUnlocked(pid));
    };

    const unlockedProducerRecipes = producerRecipes.filter(isProducerUnlocked);
    const lockedProducerRecipes = producerRecipes.filter(recipe => !isProducerUnlocked(recipe));

    console.log(`\n手动合成配方 (${manualCraftableRecipes.length}):`);
    manualCraftableRecipes.forEach(recipe => {
      const validation = validator.validateRecipe(recipe);
      console.log(`  ✅ ${recipe.id} - ${validation.reason}`);
    });

    console.log(`\n已解锁的生产设备配方 (${unlockedProducerRecipes.length}):`);
    unlockedProducerRecipes.forEach(recipe => {
      const validation = validator.validateRecipe(recipe);
      console.log(`  🏭 ${recipe.id} - ${validation.reason}`);
      if (recipe.producers) {
        console.log(`     需要设备: ${recipe.producers.join(', ')}`);
      }
    });

    console.log(`\n未解锁的生产设备配方 (${lockedProducerRecipes.length}):`);
    lockedProducerRecipes.forEach(recipe => {
      const validation = validator.validateRecipe(recipe);
      console.log(`  🔒 ${recipe.id} - ${validation.reason}`);
      if (recipe.producers) {
        console.log(`     需要设备: ${recipe.producers.join(', ')}`);
      }
    });

    // 预测UI显示
    console.log('\n📋 预期UI显示:');
    if (itemRecipes.length === 0) {
      console.log('  手动合成区域: 显示（原材料）');
      console.log('  生产设备区域: 不显示');
    } else if (manualCraftableRecipes.length > 0) {
      console.log('  手动合成区域: 显示（可手动制作）');
      if (unlockedProducerRecipes.length > 0) {
        console.log('  生产设备区域: 显示（已解锁的配方）');
        console.log(`    显示配方: ${unlockedProducerRecipes.map(r => r.id).join(', ')}`);
      } else {
        console.log('  生产设备区域: 不显示（无解锁配方）');
      }
    } else if (unlockedProducerRecipes.length > 0) {
      console.log('  手动合成区域: 不显示（无可手动制作配方）');
      console.log('  生产设备区域: 显示（已解锁的配方）');
      console.log(`    显示配方: ${unlockedProducerRecipes.map(r => r.id).join(', ')}`);
    } else {
      console.log('  手动合成区域: 不显示（无可手动制作配方）');
      console.log('  生产设备区域: 不显示（无解锁配方）');
    }
  }

  /**
   * 测试producer解锁状态
   */
  async testProducerUnlockStatus() {
    console.log('\n=== 测试Producer解锁状态 ===');
    
    const testProducers = [
      'stone-furnace',
      'steel-furnace', 
      'electric-furnace',
      'assembling-machine-1',
      'assembling-machine-2',
      'assembling-machine-3',
      'chemical-plant',
      'oil-refinery'
    ];

    for (const producerId of testProducers) {
      const isUnlocked = this.dataService.isItemUnlocked(producerId);
      console.log(`${producerId}: ${isUnlocked ? '✅ 已解锁' : '🔒 未解锁'}`);
    }
  }
}

// 导出测试实例
export const recipeCategoryTest = new RecipeCategoryTest(); 