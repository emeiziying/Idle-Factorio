import React from 'react';
import {
  Box
} from '@mui/material';
import { Add as AddIcon, ArrowForward as ArrowIcon } from '@mui/icons-material';
import type { Recipe } from '../../types/index';
import FactorioIcon from '../common/FactorioIcon';
import useGameStore from '../../store/gameStore';
import TimeIcon from '../../assets/Time.png';

interface RecipeFlowDisplayProps {
  recipe: Recipe;
  themeColor?: string;
  showTime?: boolean;
  iconSize?: number;
}

const RecipeFlowDisplay: React.FC<RecipeFlowDisplayProps> = ({ 
  recipe, 
  themeColor = 'text.primary',
  showTime = true,
  iconSize = 24
}) => {
  const { getInventoryItem } = useGameStore();

  // 通用的材料/产品渲染函数
  const renderItems = (items: { [itemId: string]: number }, isInput: boolean = true) => {
    return Object.entries(items).map(([itemId, quantity], index) => {
      const available = isInput ? getInventoryItem(itemId).currentAmount : 0;
      const isShortage = isInput && available < quantity;
      
      return (
        <React.Fragment key={itemId}>
          <FactorioIcon 
            itemId={itemId} 
            size={iconSize} 
            quantity={quantity}
            shortage={isShortage}
          />
          {index < Object.entries(items).length - 1 && (
            <AddIcon sx={{ fontSize: iconSize * 0.6, color: 'text.secondary' }} />
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <Box 
      display="flex" 
      alignItems="center" 
      justifyContent="center" 
      gap={0.25}
      sx={{ 
        p: 1.5,
        bgcolor: 'background.default',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      {/* 时间图标 */}
      {showTime && (
        <>
          <FactorioIcon 
            customImage={TimeIcon}
            size={iconSize} 
            quantity={recipe.time}
          />
          {/* 加号连接 */}
          <AddIcon sx={{ color: 'text.secondary', fontSize: iconSize * 0.6 }} />
        </>
      )}

      {/* 输入材料 */}
      {renderItems(recipe.in)}

      {/* 箭头 */}
      <ArrowIcon sx={{ color: themeColor, fontSize: iconSize * 0.6 }} />

      {/* 输出产品 */}
      {renderItems(recipe.out, false)}
    </Box>
  );
};

export default RecipeFlowDisplay; 