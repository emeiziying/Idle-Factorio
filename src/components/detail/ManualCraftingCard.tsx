import React from 'react';
import {
  Box,
  Typography,
  Alert,
  Chip
} from '@mui/material';
import type { Item, Recipe } from '@/types/index';
import { RecipeService } from '@/services/data/RecipeService';
import { DataService } from '@/services/data/DataService';
import useGameStore from '@/store/gameStore';
import { getValidationReasonText, type ValidationReasonType } from '@/utils/manualCraftingValidator';
import CraftingButtons from './CraftingButtons';
import RecipeFlowDisplay from './RecipeFlowDisplay';
import FactorioIcon from '@/components/common/FactorioIcon';
// import ChainCraftingDialog from '../common/ChainCraftingDialog';

interface ManualCraftingCardProps {
  item: Item;
  onManualCraft: (itemId: string, quantity: number, recipe?: Recipe) => void;
  onItemSelect?: (item: Item) => void;
}

const ManualCraftingCard: React.FC<ManualCraftingCardProps> = ({ item, onManualCraft, onItemSelect }) => {
  const { getInventoryItem } = useGameStore();
  const dataService = DataService.getInstance();
  
  // 使用 RecipeService 的新方法获取手动制作信息
  const manualCraftingInfo = RecipeService.getManualCraftingInfo(item.id);
  
  // 如果不能手动制作，显示受限提示
  if (!manualCraftingInfo.canCraft) {
    return (
      <Box sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            {getValidationReasonText(manualCraftingInfo.validation.reason as ValidationReasonType, 'zh')}
          </Typography>
        </Alert>
        <Typography variant="body2" color="text.secondary">
          此物品无法手动制作。
        </Typography>
      </Box>
    );
  }

  // 如果是原材料（无需配方），显示无需材料
  if (manualCraftingInfo.validation.reason === 'raw_material') {
    return (
      <Box sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
        {/* 简单显示：无需材料的配方 */}
        <Box sx={{ 
          p: 1.5,
          bgcolor: 'background.default',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          mb: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1
        }}>
          <Typography variant="body2" color="text.secondary">
            无需材料
          </Typography>
          <Typography variant="body2" color="text.secondary">
            →
          </Typography>
          <FactorioIcon itemId={item.id} size={32} />
          <Typography variant="body2">
            {dataService.getLocalizedItemName(item.id)} x1
          </Typography>
        </Box>

        {/* 制作按钮 */}
        <CraftingButtons 
          onCraft={(quantity) => onManualCraft(item.id, quantity)}
        />
      </Box>
    );
  }
  
  // 如果有可手动制作的配方，显示第一个
  if (manualCraftingInfo.recipe) {
    const recipe = manualCraftingInfo.recipe;
    const isMiningRecipe = recipe.flags && recipe.flags.includes('mining');
    const hasInputMaterials = Object.keys(recipe.in).length > 0;
    
    // 计算手动制作的实际时间
    const manualEfficiency = 0.5; // 手动效率 50%
    const actualTime = recipe.time / manualEfficiency;
    
    // 检查材料可用性
    const materialStatus = hasInputMaterials ? Object.entries(recipe.in).map(([itemId, required]) => {
      const available = getInventoryItem(itemId).currentAmount;
      return {
        itemId,
        required,
        available,
        sufficient: available >= required
      };
    }) : [];
    
    // 采矿配方或无输入材料的配方总是可以制作
    const canCraft = !hasInputMaterials || isMiningRecipe || materialStatus.every(m => m.sufficient);
    
    // 查找缺少的材料
    const missingMaterials = materialStatus.filter(m => !m.sufficient);
    
    return (
      <Box sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
        {/* 配方流程显示 */}
        <Box sx={{ mb: 1.5 }}>
          <RecipeFlowDisplay 
            recipe={recipe}
            themeColor="primary.main"
            showTime={true}
            iconSize={32}
            onItemSelect={onItemSelect}
            customTime={actualTime}
          />
        </Box>

        {/* 材料不足提示 */}
        {missingMaterials.length > 0 && (
          <Box sx={{ mb: 1.5 }}>
            <Alert severity="warning" sx={{ py: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                材料不足：
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {missingMaterials.map(({ itemId, required, available }) => (
                  <Chip
                    key={itemId}
                    size="small"
                    avatar={<FactorioIcon itemId={itemId} size={16} />}
                    label={`${dataService.getLocalizedItemName(itemId)}: ${available}/${required}`}
                    color="warning"
                    variant="outlined"
                    onClick={() => onItemSelect && onItemSelect({ id: itemId } as Item)}
                    sx={{ cursor: onItemSelect ? 'pointer' : 'default' }}
                  />
                ))}
              </Box>
            </Alert>
          </Box>
        )}

        {/* 制作按钮 */}
        <CraftingButtons 
          onCraft={(quantity) => onManualCraft(item.id, quantity, recipe)}
          disabled={!canCraft && missingMaterials.length === 0}  // 只有在无材料需求或其他错误时才禁用
          variant={!canCraft && missingMaterials.length > 0 ? 'outlined' : 'contained'}  // 材料不足时使用轮廓样式
        />
      </Box>
    );
  }

  // 如果逻辑到达这里，说明有问题，显示默认信息
  return (
    <Box sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
      <Typography variant="body2" color="text.secondary">
        无法确定此物品的制作方式。
      </Typography>
    </Box>
  );
};

export default ManualCraftingCard; 