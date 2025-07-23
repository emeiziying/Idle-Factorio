// 测试基于配方的判断逻辑
import { recipeBasedCraftingTest } from './recipeBasedCraftingTest';

// 运行测试
async function runTests() {
  console.log('🚀 开始测试基于配方的判断逻辑...\n');
  
  try {
    // 测试基本判断逻辑
    await recipeBasedCraftingTest.testRecipeBasedCrafting();
    
    // 测试配方特征分析
    await recipeBasedCraftingTest.testRecipeFeatureAnalysis();
    
    // 测试多配方物品
    await recipeBasedCraftingTest.testMultiRecipeItems();
    
    // 测试配方标志
    await recipeBasedCraftingTest.testRecipeFlags();
    
    console.log('\n✅ 所有测试完成！');
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 如果直接运行此文件，执行测试
if (typeof window !== 'undefined') {
  // 在浏览器环境中运行
  (window as unknown as Record<string, unknown>).testRecipeBasedLogic = runTests;
} else {
  // 在Node.js环境中运行
  runTests();
}

export { runTests }; 