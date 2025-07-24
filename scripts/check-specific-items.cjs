const fs = require('fs');
const path = require('path');

// 读取游戏数据
const gameData = fs.readFileSync(path.join(__dirname, '../public/data.json'), 'utf8');
const data = JSON.parse(gameData);

// 应该可以手动制作的物品列表（根据 Factorio Wiki）
const shouldBeManualCraftable = [
  'wood-plank',           // 木板
  'iron-stick',           // 铁棒
  'iron-gear-wheel',      // 铁齿轮
  'copper-cable',         // 铜线
  'electronic-circuit',   // 电路板
  'burner-mining-drill',  // 燃烧采矿机
  'wooden-chest',         // 木箱
  'pistol',               // 手枪
  'firearm-magazine',     // 弹匣
  'stone-furnace'         // 石炉
];

console.log('检查应该可以手动制作的物品：\n');

shouldBeManualCraftable.forEach(itemId => {
  console.log(`\n🔍 检查 ${itemId}:`);
  
  // 查找该物品的配方
  const recipes = data.recipes.filter(recipe => {
    if (!recipe.out) return false;
    return Object.keys(recipe.out).includes(itemId);
  });
  
  if (recipes.length === 0) {
    console.log('   ❌ 没有找到配方');
  } else {
    recipes.forEach(recipe => {
      console.log(`   配方: ${recipe.name}`);
      console.log(`   - 类别: ${recipe.category || '无'}`);
      console.log(`   - 生产者: ${recipe.producers ? recipe.producers.join(', ') : '无'}`);
      console.log(`   - 材料: ${recipe.in ? Object.entries(recipe.in).map(([k, v]) => `${v}x ${k}`).join(', ') : '无'}`);
      console.log(`   - 时间: ${recipe.time}秒`);
      
      // 简单判断是否可手动制作
      const needsSpecialEquipment = 
        (recipe.category && ['smelting', 'chemistry', 'oil-processing'].includes(recipe.category)) ||
        (recipe.producers && recipe.producers.length > 0 && 
         !recipe.producers.every(p => ['burner-mining-drill', 'electric-mining-drill'].includes(p)));
      
      console.log(`   - 需要特殊设备: ${needsSpecialEquipment ? '是' : '否'}`);
    });
  }
});