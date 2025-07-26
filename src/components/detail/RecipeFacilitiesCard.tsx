import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Alert
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import type { Item } from '../../types/index';
import type { FacilityInstance } from '../../types/facilities';
import { useItemRecipes } from '../../hooks/useItemRecipes';
import { DataService } from '../../services/DataService';
import useGameStore from '../../store/gameStore';
import FactorioIcon from '../common/FactorioIcon';
import ManualCraftingValidator from '../../utils/manualCraftingValidator';

interface RecipeFacilitiesCardProps {
  item: Item;
}

const RecipeFacilitiesCard: React.FC<RecipeFacilitiesCardProps> = ({ item }) => {
  const { getInventoryItem, facilities, addFacility, removeFacility } = useGameStore();
  const { recipes } = useItemRecipes(item);
  const dataService = DataService.getInstance();
  const validator = ManualCraftingValidator.getInstance();

  const getLocalizedItemName = (itemId: string): string => {
    return dataService.getLocalizedItemName(itemId);
  };

  // 获取需要设施的配方（排除手动合成配方）
  const facilityRecipes = recipes.filter(recipe => {
    const validation = validator.validateRecipe(recipe);
    return !validation.canCraftManually && recipe.producers && recipe.producers.length > 0;
  });

  // 获取所有可用的设施类型
  const getAllFacilityTypes = (): string[] => {
    const facilityTypes = new Set<string>();
    facilityRecipes.forEach(recipe => {
      if (recipe.producers) {
        recipe.producers.forEach(producer => facilityTypes.add(producer));
      }
    });
    return Array.from(facilityTypes);
  };

  const facilityTypes = getAllFacilityTypes();

  // 获取已部署的设施数量
  const getDeployedFacilityCount = (facilityType: string): number => {
    return facilities.filter(f => f.facilityId === facilityType).length;
  };

  // 添加设施
  const handleAddFacility = (facilityType: string) => {
    const facilityInventory = getInventoryItem(facilityType);
    if (facilityInventory.currentAmount <= 0) {
      return;
    }

    // 扣除库存中的设施
    const newFacility: FacilityInstance = {
      id: `facility_${facilityType}_${Date.now()}`,
      facilityId: facilityType,
      count: 1,
      status: 'running',
      efficiency: 1.0
    };

    addFacility(newFacility);
    
    // 这里应该调用减少库存的方法，但目前gameStore没有这个方法
    // 可能需要在实际项目中添加
  };

  // 移除设施
  const handleRemoveFacility = (facilityType: string) => {
    const facilityToRemove = facilities.find(f => f.facilityId === facilityType);
    if (facilityToRemove) {
      removeFacility(facilityToRemove.id);
      
      // 这里应该将设施返回到库存，但目前gameStore没有这个方法
      // 可能需要在实际项目中添加
    }
  };

  if (facilityTypes.length === 0) {
    return null;
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Typography variant="subtitle2" gutterBottom sx={{ 
          fontSize: '0.9rem',
          fontWeight: 600,
          color: 'text.primary',
          mb: 1.5
        }}>
          生产设施
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {facilityTypes.map((facilityType) => {
            const facilityInventory = getInventoryItem(facilityType);
            const deployedCount = getDeployedFacilityCount(facilityType);
            const canAdd = facilityInventory.currentAmount > 0;
            const canRemove = deployedCount > 0;

            return (
              <Box
                key={facilityType}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: 'background.default'
                }}
              >
                {/* 左侧：设施信息 */}
                <Box display="flex" alignItems="center" gap={1.5}>
                  <FactorioIcon
                    itemId={facilityType}
                    size={40}
                    quantity={deployedCount}
                  />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {getLocalizedItemName(facilityType)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      库存: {facilityInventory.currentAmount} | 已部署: {deployedCount}
                    </Typography>
                    
                    {/* 显示可以生产的配方 */}
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        可生产: 
                      </Typography>
                      <Box display="flex" gap={0.5} mt={0.25}>
                        {facilityRecipes
                          .filter(recipe => recipe.producers?.includes(facilityType))
                          .map(recipe => (
                            <Chip
                              key={recipe.id}
                              label={dataService.getLocalizedRecipeName(recipe.id)}
                              size="small"
                              sx={{ 
                                fontSize: '0.6rem', 
                                height: 20,
                                '& .MuiChip-label': { px: 0.5 }
                              }}
                            />
                          ))
                        }
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* 右侧：添加和移除按钮 */}
                <Box display="flex" gap={1}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => handleAddFacility(facilityType)}
                    disabled={!canAdd}
                    sx={{ 
                      minWidth: 60,
                      fontSize: '0.75rem'
                    }}
                  >
                    添加
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    startIcon={<RemoveIcon />}
                    onClick={() => handleRemoveFacility(facilityType)}
                    disabled={!canRemove}
                    sx={{ 
                      minWidth: 60,
                      fontSize: '0.75rem'
                    }}
                  >
                    移除
                  </Button>
                </Box>
              </Box>
            );
          })}
        </Box>

        {facilityTypes.some(type => getInventoryItem(type).currentAmount === 0) && (
          <Alert severity="info" sx={{ mt: 2, fontSize: '0.8rem' }}>
            <Typography variant="body2">
              部分设施库存不足，无法部署。请先制作或获取所需的设施。
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default RecipeFacilitiesCard; 