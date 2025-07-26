import React from 'react';
import {
  Box,
  Typography,
  Alert
} from '@mui/material';
import type { Item, Recipe } from '../../types/index';
import FactorioIcon from '../common/FactorioIcon';
import { DataService } from '../../services/DataService';
import { RecipeService } from '../../services/RecipeService';
import useGameStore from '../../store/gameStore';
import ManualCraftingValidator from '../../utils/manualCraftingValidator';
import CraftingButtons from './CraftingButtons';

interface ManualCraftingCardProps {
  item: Item;
  onManualCraft: (itemId: string, quantity: number, recipe?: Recipe) => void;
}

const ManualCraftingCard: React.FC<ManualCraftingCardProps> = ({ item, onManualCraft }) => {
  const { getInventoryItem } = useGameStore();
  const dataService = DataService.getInstance();
  const validator = ManualCraftingValidator.getInstance();

  const getLocalizedItemName = (itemId: string): string => {
    return dataService.getLocalizedItemName(itemId);
  };

  const itemRecipes = RecipeService.getRecipesThatProduce(item.id);
  
  // 如果物品没有配方（原材料），显示无需材料
  if (itemRecipes.length === 0) {
    return (
      <Box sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="body2" fontWeight="bold" color="primary.main">
            手动合成
          </Typography>
          <Typography variant="body2" color="text.secondary">
            立即完成
          </Typography>
        </Box>

        {/* 输入材料 */}
        <Typography variant="caption" color="text.secondary">
          需要材料:
        </Typography>
        <Box display="flex" alignItems="center" gap={1} mt={0.5}>
          <Typography variant="body2" color="text.secondary">
            无需材料
          </Typography>
        </Box>

        {/* 输出产品 */}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          输出产品:
        </Typography>
        <Box display="flex" alignItems="center" gap={1} mt={0.5}>
          <FactorioIcon itemId={item.id} size={32} />
          <Typography variant="body2">
            {getLocalizedItemName(item.id)} x1
          </Typography>
        </Box>

        {/* 制作时间 */}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          制作时间: 0秒
        </Typography>

        {/* 制作按钮 */}
        <CraftingButtons 
          onCraft={(quantity) => onManualCraft(item.id, quantity)}
        />
      </Box>
    );
  }
  
  // 使用验证器检查哪些配方可以手动制作
  const recipeValidations = itemRecipes.map(recipe => ({
    recipe,
    validation: validator.validateRecipe(recipe)
  }));
  
  const manualCraftableRecipes = recipeValidations
    .filter(({ validation }) => validation.canCraftManually)
    .map(({ recipe }) => recipe);

  const restrictedRecipes = recipeValidations
    .filter(({ validation }) => !validation.canCraftManually && validation.category === 'restricted')
    .map(({ recipe }) => recipe);

  // 如果有可手动制作的配方，显示第一个
  if (manualCraftableRecipes.length > 0) {
    const recipe = manualCraftableRecipes[0];
    const isMiningRecipe = recipe.flags && recipe.flags.includes('mining');
    const hasInputMaterials = Object.keys(recipe.in).length > 0;
    
    // 采矿配方或无输入材料的配方总是可以制作
    const canCraft = !hasInputMaterials || isMiningRecipe || Object.entries(recipe.in).every(([itemId, required]) => {
      const available = getInventoryItem(itemId).currentAmount;
      return available >= required;
    });

    return (
      <Box sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="body2" fontWeight="bold" color="primary.main">
            手动合成
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {recipe.time}秒
          </Typography>
        </Box>

        {/* 输入材料 */}
        <Typography variant="caption" color="text.secondary">
          需要材料:
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1} mt={0.5}>
          {Object.entries(recipe.in).map(([itemId, required]) => {
            const available = getInventoryItem(itemId).currentAmount;
            const hasEnough = available >= required;
            return (
              <Box key={itemId} display="flex" alignItems="center" gap={0.5}>
                <FactorioIcon itemId={itemId} size={32} />
                <Typography 
                  variant="body2" 
                  color={hasEnough ? "text.primary" : "error.main"}
                >
                  {getLocalizedItemName(itemId)} x{required}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({available})
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* 输出产品 */}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          输出产品:
        </Typography>
        <Box display="flex" alignItems="center" gap={1} mt={0.5}>
          <FactorioIcon itemId={item.id} size={32} />
          <Typography variant="body2">
            {getLocalizedItemName(item.id)} x{recipe.out[item.id] || 1}
          </Typography>
        </Box>

        {/* 制作时间 */}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          制作时间: {recipe.time}秒
        </Typography>

        {/* 制作按钮 */}
        <CraftingButtons 
          onCraft={(quantity) => onManualCraft(item.id, quantity, recipe)}
          disabled={!canCraft}
        />
      </Box>
    );
  }

  // 如果没有可手动制作的配方，但有需要特定生产者的配方，显示提示
  if (restrictedRecipes.length > 0) {
    const recipe = restrictedRecipes[0];
    const validation = validator.validateRecipe(recipe);
    
    return (
      <Box sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="body2" fontWeight="bold" color="warning.main">
            需要生产设备
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {recipe.time}秒
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            {validation.reason}
          </Typography>
          {recipe.producers && recipe.producers.length > 0 && (
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
              需要设备: {recipe.producers.join(', ')}
            </Typography>
          )}
        </Alert>

        {/* 输入材料 */}
        <Typography variant="caption" color="text.secondary">
          需要材料:
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1} mt={0.5}>
          {Object.entries(recipe.in).map(([itemId, required]) => {
            const available = getInventoryItem(itemId).currentAmount;
            const hasEnough = available >= required;
            return (
              <Box key={itemId} display="flex" alignItems="center" gap={0.5}>
                <FactorioIcon itemId={itemId} size={20} />
                <Typography 
                  variant="body2" 
                  color={hasEnough ? "text.primary" : "error.main"}
                >
                  {getLocalizedItemName(itemId)} x{required}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({available})
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* 输出产品 */}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          输出产品:
        </Typography>
        <Box display="flex" alignItems="center" gap={1} mt={0.5}>
          <FactorioIcon itemId={item.id} size={32} />
          <Typography variant="body2">
            {getLocalizedItemName(item.id)} x{recipe.out[item.id] || 1}
          </Typography>
        </Box>

        {/* 制作时间 */}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          制作时间: {recipe.time}秒
        </Typography>

        {/* 提示：需要在设施模块中生产 */}
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            请在设施模块中配置相应的生产设备来制作此物品。
          </Typography>
        </Box>
      </Box>
    );
  }

  // 如果没有任何配方，显示默认信息
  return (
    <Box sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
      <Typography variant="body2" color="text.secondary">
        此物品没有可用的制作配方。
      </Typography>
    </Box>
  );
};

export default ManualCraftingCard; 