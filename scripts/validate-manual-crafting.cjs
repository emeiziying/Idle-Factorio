#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 读取游戏数据
const gameData = fs.readFileSync(path.join(__dirname, '../public/data.json'), 'utf8');
const data = JSON.parse(gameData);

const items = data.items || [];
const recipes = data.recipes || [];

// 受限生产者列表（基于 Factorio Wiki）
const restrictedProducers = [
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
  'foundry',
  'electromagnetic-plant',
  'cryogenic-plant',
  'biochamber',
  'recycler'
];

// 流体物品列表
const fluidItems = [
  'water',
  'crude-oil',
  'petroleum-gas',
  'light-oil',
  'heavy-oil',
  'lubricant',
  'sulfuric-acid',
  'steam',
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
];

// 受限物品列表（无法手动制作）
const restrictedItems = [
  'engine-unit',
  'electric-engine-unit',
  'flying-robot-frame',
  'satellite',
  'uranium-235',
  'uranium-238',
  'uranium-fuel-cell',
  'used-up-uranium-fuel-cell',
  'nuclear-fuel',
  'rocket-fuel',
  'solid-fuel',
  'explosives',
  'explosive-rocket',
  'explosive-cannon-shell',
  'poison-capsule',
  'slowdown-capsule',
  'combat-shotgun',
  'rocket-launcher',
  'atomic-bomb'
];

// 需要特殊设备的配方类别
const restrictedCategories = [
  'smelting',
  'chemistry',
  'oil-processing',
  'centrifuging',
  'rocket-building',
  'electromagnetics',
  'cryogenics',
  'metallurgy',
  'organic',
  'recycling'
];

/**
 * 验证配方是否可以手动制作
 */
function validateRecipe(recipe) {
  // 1. 检查配方标志
  if (recipe.flags) {
    if (recipe.flags.includes('mining')) {
      return { canCraft: true, reason: '采矿配方（可手动采集）' };
    }
  }
  
  // 2. 检查配方类别
  if (recipe.category) {
    if (recipe.category === 'crafting' || recipe.category === 'advanced-crafting') {
      // 基础和高级制作类别通常可以手动制作
    } else if (recipe.category === 'recycling-or-hand-crafting') {
      return { canCraft: true, reason: '可手动制作或回收' };
    } else if (restrictedCategories.includes(recipe.category)) {
      return { canCraft: false, reason: `需要特殊设备（${recipe.category}）` };
    }
  }
  
  // 3. 检查生产者限制
  if (recipe.producers && recipe.producers.length > 0) {
    // 特殊的生产者不算限制
    const specialProducers = ['burner-mining-drill', 'electric-mining-drill', 'pumpjack', 'offshore-pump'];
    const nonSpecialProducers = recipe.producers.filter(p => !specialProducers.includes(p));
    
    // 如果有非特殊生产者，就需要设备
    if (nonSpecialProducers.length > 0) {
      return { canCraft: false, reason: `需要生产设备: ${nonSpecialProducers.join(', ')}` };
    }
  }
  
  // 4. 检查输入材料是否包含流体 (使用 in 字段)
  if (recipe.in) {
    const hasFluid = Object.keys(recipe.in).some(itemName => 
      fluidItems.includes(itemName)
    );
    if (hasFluid) {
      return { canCraft: false, reason: '材料包含流体' };
    }
  }
  
  // 5. 检查特殊限制物品 (使用 out 字段)
  if (recipe.out) {
    const outputItems = Object.keys(recipe.out);
    const hasRestricted = outputItems.some(itemName => 
      restrictedItems.includes(itemName)
    );
    if (hasRestricted) {
      return { canCraft: false, reason: '高级物品需要特殊设备' };
    }
  }
  
  return { canCraft: true, reason: '可以手动制作' };
}

/**
 * 获取物品的配方
 */
function getRecipesByResult(itemId) {
  return recipes.filter(recipe => {
    if (!recipe.out) return false;
    return Object.keys(recipe.out).includes(itemId);
  });
}

/**
 * 验证物品是否可以手动制作
 */
function validateManualCrafting(itemId) {
  const item = items.find(i => i.id === itemId);
  if (!item) {
    return { canCraft: false, category: 'unknown', reason: '物品不存在' };
  }
  
  const itemRecipes = getRecipesByResult(itemId);
  
  // 无配方 = 原材料
  if (itemRecipes.length === 0) {
    return { canCraft: true, category: 'raw_material', reason: '原材料（可手动采集）' };
  }
  
  // 检查所有配方
  let hasManualRecipe = false;
  let restrictionReason = '';
  
  for (const recipe of itemRecipes) {
    const validation = validateRecipe(recipe);
    if (validation.canCraft) {
      hasManualRecipe = true;
      break;
    } else {
      restrictionReason = validation.reason;
    }
  }
  
  if (hasManualRecipe) {
    return { canCraft: true, category: 'craftable', reason: '可以手动制作' };
  } else {
    return { canCraft: false, category: 'restricted', reason: restrictionReason || '所有配方都需要特殊设备' };
  }
}

// 主验证函数
function runValidation() {
  console.log('🔍 开始验证手动制作物品...\n');
  
  const categories = {
    raw_material: [],
    craftable: [],
    restricted: []
  };
  
  // 验证所有物品
  for (const item of items) {
    const validation = validateManualCrafting(item.id);
    categories[validation.category].push({
      item,
      validation
    });
  }
  
  // 打印结果
  console.log('📊 统计结果：\n');
  
  console.log(`🌿 原材料（可手动采集）: ${categories.raw_material.length} 个`);
  console.log('   示例:', categories.raw_material.slice(0, 5).map(i => i.item.name).join(', '));
  console.log();
  
  console.log(`🔨 可手动制作物品: ${categories.craftable.length} 个`);
  console.log('   示例:', categories.craftable.slice(0, 5).map(i => i.item.name).join(', '));
  console.log();
  
  console.log(`🏭 需要生产设备: ${categories.restricted.length} 个`);
  console.log('   示例:', categories.restricted.slice(0, 5).map(i => i.item.name).join(', '));
  console.log();
  
  const total = items.length;
  const canManual = categories.raw_material.length + categories.craftable.length;
  console.log(`📈 总计: ${total} 个物品`);
  console.log(`   - 可手动获得: ${canManual} 个 (${(canManual / total * 100).toFixed(1)}%)`);
  console.log(`   - 需要设备: ${categories.restricted.length} 个 (${(categories.restricted.length / total * 100).toFixed(1)}%)`);
  
  // 详细列出可手动制作的物品
  console.log('\n\n📋 可手动制作物品详情：\n');
  console.log('='.repeat(60));
  
  for (const { item, validation } of categories.craftable.slice(0, 20)) {
    console.log(`\n📦 ${item.name} (${item.id})`);
    console.log(`   原因: ${validation.reason}`);
    
    const itemRecipes = getRecipesByResult(item.id);
    if (itemRecipes.length > 0) {
      console.log(`   配方数量: ${itemRecipes.length}`);
      for (const recipe of itemRecipes) {
        const recipeValidation = validateRecipe(recipe);
        console.log(`     - ${recipe.name || '未命名配方'}`);
        console.log(`       类别: ${recipe.category || '无'}`);
        console.log(`       生产者: ${recipe.producers ? recipe.producers.join(', ') : '手动'}`);
        console.log(`       可手动: ${recipeValidation.canCraft ? '✅' : '❌'} - ${recipeValidation.reason}`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 验证完成！');
}

// 运行验证
runValidation();