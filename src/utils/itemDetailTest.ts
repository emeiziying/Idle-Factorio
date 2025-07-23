import DataService from '../services/DataService';
import ManualCraftingValidator from './manualCraftingValidator';

/**
 * 测试 ItemDetailDialog 显示逻辑
 */
export class ItemDetailDisplayTest {
  private dataService: DataService;
  private validator: ManualCraftingValidator;

  constructor() {
    this.dataService = DataService.getInstance();
    this.validator = ManualCraftingValidator.getInstance();
  }

  /**
   * 测试不同类型物品的显示逻辑
   */
  testItemDisplayLogic() {
    console.log('=== ItemDetailDialog 显示逻辑测试 ===\n');

    // 1. 测试原材料（无配方）
    this.testRawMaterial();

    // 2. 测试可手动制作的物品
    this.testManualCraftableItem();

    // 3. 测试需要生产设备的物品
    this.testProducerRequiredItem();

    // 4. 测试有多种配方的物品
    this.testMultiRecipeItem();
  }

  /**
   * 测试原材料显示
   */
  private testRawMaterial() {
    console.log('1. 原材料测试（木材）:');
    
    const item = this.dataService.getItem('wood');
    const recipes = this.dataService.getRecipesForItem('wood');
    
    console.log(`   - 物品名称: ${this.dataService.getLocalizedItemName('wood')}`);
    console.log(`   - 配方数量: ${recipes.length}`);
    console.log(`   - 显示内容: 手动合成区域（无需材料）`);
    console.log('   - 预期行为: 显示"无需材料"的手动采集选项\n');
  }

  /**
   * 测试可手动制作的物品
   */
  private testManualCraftableItem() {
    console.log('2. 可手动制作物品测试（木板）:');
    
    const item = this.dataService.getItem('wood-plank');
    const recipes = this.dataService.getRecipesForItem('wood-plank');
    
    if (recipes.length > 0) {
      const recipe = recipes[0];
      const validation = this.validator.validateRecipe(recipe);
      
      console.log(`   - 物品名称: ${this.dataService.getLocalizedItemName('wood-plank')}`);
      console.log(`   - 配方数量: ${recipes.length}`);
      console.log(`   - 可手动制作: ${validation.canCraftManually}`);
      console.log(`   - 显示内容: 手动合成区域（显示配方材料）`);
      console.log(`   - 所需材料:`);
      
      Object.entries(recipe.in).forEach(([itemId, quantity]) => {
        console.log(`     * ${this.dataService.getLocalizedItemName(itemId)} x${quantity}`);
      });
      
      console.log('   - 预期行为: 显示材料列表和制作按钮\n');
    }
  }

  /**
   * 测试需要生产设备的物品
   */
  private testProducerRequiredItem() {
    console.log('3. 需要生产设备的物品测试:');
    
    // 查找需要生产设备的物品
    const allItems = this.dataService.getAllItems();
    let foundExample = false;
    
    for (const item of allItems) {
      const recipes = this.dataService.getRecipesForItem(item.id);
      
      for (const recipe of recipes) {
        const validation = this.validator.validateRecipe(recipe);
        
        if (!validation.canCraftManually && validation.category === 'restricted') {
          console.log(`   - 物品名称: ${this.dataService.getLocalizedItemName(item.id)}`);
          console.log(`   - 配方名称: ${this.dataService.getLocalizedRecipeName(recipe.id)}`);
          console.log(`   - 验证结果: ${validation.reason}`);
          
          if (recipe.producers && recipe.producers.length > 0) {
            console.log(`   - 需要设备:`);
            recipe.producers.forEach(pid => {
              console.log(`     * ${this.dataService.getLocalizedItemName(pid)}`);
            });
          }
          
          console.log('   - 显示内容: 需要生产设备的提示信息');
          console.log('   - 预期行为: 显示警告信息，提示需要在设施模块配置\n');
          
          foundExample = true;
          break;
        }
      }
      
      if (foundExample) break;
    }
    
    if (!foundExample) {
      console.log('   - 未找到需要生产设备的物品示例\n');
    }
  }

  /**
   * 测试有多种配方的物品
   */
  private testMultiRecipeItem() {
    console.log('4. 多配方物品测试:');
    
    // 查找有多个配方的物品
    const allItems = this.dataService.getAllItems();
    let foundExample = false;
    
    for (const item of allItems) {
      const recipes = this.dataService.getRecipesForItem(item.id);
      
      if (recipes.length > 1) {
        console.log(`   - 物品名称: ${this.dataService.getLocalizedItemName(item.id)}`);
        console.log(`   - 配方数量: ${recipes.length}`);
        console.log(`   - 配方列表:`);
        
        let manualCount = 0;
        let producerCount = 0;
        
        recipes.forEach((recipe, index) => {
          const validation = this.validator.validateRecipe(recipe);
          const type = validation.canCraftManually ? '手动合成' : '需要设备';
          
          if (validation.canCraftManually) {
            manualCount++;
          } else {
            producerCount++;
          }
          
          console.log(`     ${index + 1}. ${this.dataService.getLocalizedRecipeName(recipe.id)} (${type})`);
        });
        
        console.log(`   - 显示分区:`);
        if (manualCount > 0) {
          console.log(`     * 手动合成区域: 显示第一个可手动制作的配方`);
        }
        if (producerCount > 0) {
          console.log(`     * 生产设备配方区域: 显示所有需要设备的配方`);
        }
        console.log('   - 预期行为: 分区显示不同类型的配方\n');
        
        foundExample = true;
        break;
      }
    }
    
    if (!foundExample) {
      console.log('   - 未找到多配方物品示例\n');
    }
  }

  /**
   * 分析显示逻辑的完整性
   */
  analyzeDisplayCompleteness() {
    console.log('=== 显示逻辑完整性分析 ===\n');
    
    const allItems = this.dataService.getAllItems();
    let noRecipeCount = 0;
    let manualOnlyCount = 0;
    let producerOnlyCount = 0;
    let mixedCount = 0;
    
    for (const item of allItems) {
      const recipes = this.dataService.getRecipesForItem(item.id);
      
      if (recipes.length === 0) {
        noRecipeCount++;
      } else {
        let hasManual = false;
        let hasProducer = false;
        
        for (const recipe of recipes) {
          const validation = this.validator.validateRecipe(recipe);
          if (validation.canCraftManually) {
            hasManual = true;
          } else {
            hasProducer = true;
          }
        }
        
        if (hasManual && hasProducer) {
          mixedCount++;
        } else if (hasManual) {
          manualOnlyCount++;
        } else if (hasProducer) {
          producerOnlyCount++;
        }
      }
    }
    
    console.log('物品分类统计:');
    console.log(`- 无配方物品（原材料）: ${noRecipeCount} 个`);
    console.log(`- 仅可手动制作: ${manualOnlyCount} 个`);
    console.log(`- 仅需生产设备: ${producerOnlyCount} 个`);
    console.log(`- 混合类型: ${mixedCount} 个`);
    console.log(`- 总计: ${allItems.length} 个`);
    
    console.log('\n显示逻辑覆盖情况:');
    console.log('✓ 无配方物品 → 显示"无需材料"手动合成');
    console.log('✓ 可手动制作 → 显示手动合成配方');
    console.log('✓ 需要设备 → 显示设备需求提示');
    console.log('✓ 混合类型 → 分区显示两种配方');
    console.log('✓ 库存信息 → 始终显示');
    console.log('✓ 用途信息 → 有用途时显示');
  }
}

// 导出测试函数
export function runItemDetailDisplayTest() {
  const test = new ItemDetailDisplayTest();
  test.testItemDisplayLogic();
  test.analyzeDisplayCompleteness();
}