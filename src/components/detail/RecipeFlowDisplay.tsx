import React from 'react';
import {
  Box
} from '@mui/material';
import { Add as AddIcon, ArrowForward as ArrowIcon } from '@mui/icons-material';
import type { Recipe } from '@/types/index';
import FactorioIcon from '@/components/common/FactorioIcon';
import useGameStore from '@/store/gameStore';
import { DataService } from '@/services/data/DataService';
import TimeIcon from '@/assets/Time.png';

interface RecipeFlowDisplayProps {
  recipe: Recipe;
  themeColor?: string;
  showTime?: boolean;
  iconSize?: number;
  onItemSelect?: (item: import('../../types/index').Item) => void;
  customTime?: number; // 自定义时间，用于手动制作时显示实际时间
}

const RecipeFlowDisplay: React.FC<RecipeFlowDisplayProps> = ({ 
  recipe, 
  themeColor = 'text.primary',
  showTime = true,
  iconSize = 24,
  onItemSelect,
  customTime
}) => {
  const { getInventoryItem } = useGameStore();
  const dataService = DataService.getInstance();

  // 处理物品图标点击
  const handleItemClick = (itemId: string) => {
    if (onItemSelect) {
      const clickedItem = dataService.getItem(itemId);
      if (clickedItem) {
        onItemSelect(clickedItem);
      }
    }
  };

  // 通用的材料/产品渲染函数
  const renderItems = (items: { [itemId: string]: number }, isInput: boolean = true) => {
    return Object.entries(items).map(([itemId, quantity], index) => {
      const available = isInput ? getInventoryItem(itemId).currentAmount : 0;
      const isShortage = isInput && available < quantity;
      
      return (
        <React.Fragment key={itemId}>
          <Box 
            onClick={() => handleItemClick(itemId)}
            sx={{ 
              cursor: onItemSelect ? 'pointer' : 'default',
              '&:hover': onItemSelect ? { opacity: 0.8 } : {},
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FactorioIcon 
              itemId={itemId} 
              size={iconSize} 
              quantity={quantity}
              shortage={isShortage}
            />
          </Box>
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
        borderColor: 'divider',
        minHeight: 'fit-content',
        width: '100%',
        textAlign: 'center'
      }}
    >
      {/* 时间图标 */}
      {showTime && (
        <>
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FactorioIcon 
              customImage={TimeIcon}
              size={iconSize} 
              quantity={customTime !== undefined ? customTime : recipe.time}
            />
          </Box>
          {/* 加号连接 - 只有在有输入材料时才显示 */}
          {Object.keys(recipe.in).length > 0 && (
            <AddIcon sx={{ color: 'text.secondary', fontSize: iconSize * 0.6 }} />
          )}
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