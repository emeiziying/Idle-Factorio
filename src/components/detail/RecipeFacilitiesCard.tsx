import React from 'react';
import {
  Box,
  Typography,
  Button,
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
import { FuelStatusDisplay } from '../facilities/FuelStatusDisplay';

interface RecipeFacilitiesCardProps {
  item: Item;
  onItemSelect?: (item: Item) => void;
}

const RecipeFacilitiesCard: React.FC<RecipeFacilitiesCardProps> = ({ item, onItemSelect }) => {
  const { getInventoryItem, facilities, addFacility, removeFacility } = useGameStore();
  const { recipes } = useItemRecipes(item);
  const dataService = DataService.getInstance();
  const validator = ManualCraftingValidator.getInstance();

  // 处理设施图标点击
  const handleFacilityClick = (facilityId: string) => {
    if (onItemSelect) {
      const facilityItem = dataService.getItem(facilityId);
      if (facilityItem) {
        onItemSelect(facilityItem);
      }
    }
  };

  // 获取需要设施的配方（排除手动合成配方）
  const facilityRecipes = recipes.filter(recipe => {
    const validation = validator.validateRecipe(recipe);
    return !validation.canCraftManually && recipe.producers && recipe.producers.length > 0;
  });

  // 获取所有可用且已解锁的设施类型
  const getAllFacilityTypes = (): string[] => {
    const facilityTypes = new Set<string>();
    facilityRecipes.forEach(recipe => {
      if (recipe.producers) {
        recipe.producers.forEach(producer => {
          // 只添加已解锁的设施
          if (dataService.isItemUnlocked(producer)) {
            facilityTypes.add(producer);
          }
        });
      }
    });
    return Array.from(facilityTypes);
  };

  const facilityTypes = getAllFacilityTypes();

  // 获取已部署的设施数量
  const getDeployedFacilityCount = (facilityType: string): number => {
    return facilities.filter(f => f.facilityId === facilityType).length;
  };

  // 计算设施的生产效率
  const calculateProductionRate = (facilityType: string): number => {
    // 查找该设施能生产的当前物品的配方
    const relevantRecipe = facilityRecipes.find(recipe => 
      recipe.producers?.includes(facilityType)
    );
    
    if (!relevantRecipe || !relevantRecipe.time) {
      return 0;
    }

    // 假设设施的制作速度为1.0（可以从设施数据中获取）
    const facilitySpeed = 1.0;
    
    // 计算该配方中当前物品的输出量
    const outputQuantity = relevantRecipe.out[item.id] || 0;
    
    // 产能 = 输出量 / 制作时间 * 设施速度
    return (outputQuantity / relevantRecipe.time) * facilitySpeed;
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
    
    // 扣除库存中的设施
    useGameStore.getState().updateInventory(facilityType, -1);
  };

  // 移除设施
  const handleRemoveFacility = (facilityType: string) => {
    const facilityToRemove = facilities.find(f => f.facilityId === facilityType);
    if (facilityToRemove) {
      removeFacility(facilityToRemove.id);
      
      // 将设施返回到库存
      useGameStore.getState().updateInventory(facilityType, 1);
    }
  };

  if (facilityTypes.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
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
            const productionRate = calculateProductionRate(facilityType);
            const totalProductionRate = productionRate * deployedCount;

            // 获取已部署的此类型设施实例
            const deployedFacilities = facilities.filter(f => f.facilityId === facilityType);
            
            return (
              <Box
                key={facilityType}
                sx={{
                  p: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  {/* 左侧：设施图标和产能信息 */}
                  <Box display="flex" alignItems="center" gap={1}>
                  <Box 
                    onClick={() => handleFacilityClick(facilityType)}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { opacity: 0.8 }
                    }}
                  >
                    <FactorioIcon
                      itemId={facilityType}
                      size={40}
                      quantity={deployedCount}
                    />
                  </Box>
                  
                  {/* 产能信息 */}
                  {deployedCount > 0 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        产能: {totalProductionRate.toFixed(1)}/s
                      </Typography>
                      <br />
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        单机: {productionRate.toFixed(2)}/s
                      </Typography>
                    </Box>
                  )}
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
              
              {/* 燃料状态显示 */}
              {deployedCount > 0 && deployedFacilities.length > 0 && deployedFacilities[0].fuelBuffer && (
                <Box sx={{ mt: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                  <FuelStatusDisplay
                    fuelBuffer={deployedFacilities[0].fuelBuffer}
                    compact={false}
                  />
                </Box>
              )}
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
    </Box>
  );
};

export default RecipeFacilitiesCard; 