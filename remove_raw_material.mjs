import fs from 'fs';
import path from 'path';

console.log('Starting to remove raw material logic...');

// Read and modify manualCraftingValidator.ts
const validatorPath = './src/utils/manualCraftingValidator.ts';
if (fs.existsSync(validatorPath)) {
  let content = fs.readFileSync(validatorPath, 'utf8');
  
  // Remove RAW_MATERIAL enum
  content = content.replace(/RAW_MATERIAL: 'raw_material',\s*/g, '');
  
  // Remove raw material check logic
  content = content.replace(
    /\/\/\s*1\.\s*检查是否为原材料.*?\n\s*if\s*\(recipes\.length\s*===\s*0\)\s*{[\s\S]*?return result;\s*}\s*\n/g,
    ''
  );
  
  fs.writeFileSync(validatorPath, content);
  console.log('✓ Modified manualCraftingValidator.ts');
}

console.log('Done!');
