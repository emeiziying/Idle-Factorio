import { useState } from 'react';
import type { Recipe } from '../types/index';
import useGameStore from '../store/gameStore';

export const useCrafting = () => {
  const [showMessage, setShowMessage] = useState<{ 
    open: boolean; 
    message: string; 
    severity: 'error' | 'warning' | 'info' | 'success' 
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  const { getInventoryItem, addCraftingTask } = useGameStore();

  const handleCraft = (recipe: Recipe, quantity: number = 1) => {
    // 检查材料是否足够
    const canCraft = Object.entries(recipe.in).every(([itemId, required]) => {
      const available = getInventoryItem(itemId).currentAmount;
      return available >= required * quantity;
    });

    if (!canCraft) {
      setShowMessage({
        open: true,
        message: '材料不足，无法制作',
        severity: 'error'
      });
      return;
    }

    // 添加到制作队列
    const success = addCraftingTask({
      recipeId: recipe.id,
      itemId: Object.keys(recipe.out)[0],
      quantity,
      progress: 0,
      startTime: 0, // 任务开始时再设定
      craftingTime: recipe.time,
      status: 'pending'
    });

    if (success) {
      console.log(`Added crafting task: ${recipe.name} x${quantity}`);
    } else {
      setShowMessage({
        open: true,
        message: '制作队列已满',
        severity: 'warning'
      });
    }
  };

  const handleManualCraft = (itemId: string, quantity: number = 1, recipe?: Recipe) => {
    // 如果没有配方（原材料），直接添加到制作队列
    if (!recipe) {
      const success = addCraftingTask({
        recipeId: `manual_${itemId}`,
        itemId: itemId,
        quantity,
        progress: 0,
        startTime: 0, // 任务开始时再设定
        craftingTime: 0,
        status: 'pending'
      });

      if (success) {
        console.log(`Added manual crafting task: ${itemId} x${quantity}`);
        setShowMessage({
          open: true,
          message: `已添加手动合成任务: ${itemId} x${quantity}`,
          severity: 'success'
        });
      } else {
        setShowMessage({
          open: true,
          message: '制作队列已满',
          severity: 'warning'
        });
      }
      return;
    }

    // 检查材料是否足够（采矿配方无需材料）
    const isMiningRecipe = recipe.flags && recipe.flags.includes('mining');
    const hasInputMaterials = Object.keys(recipe.in).length > 0;
    
    if (hasInputMaterials && !isMiningRecipe) {
      const canCraft = Object.entries(recipe.in).every(([itemId, required]) => {
        const available = getInventoryItem(itemId).currentAmount;
        return available >= required * quantity;
      });

      if (!canCraft) {
        setShowMessage({
          open: true,
          message: '材料不足，无法手动合成',
          severity: 'error'
        });
        return;
      }
    }

    // 添加到制作队列
    const success = addCraftingTask({
      recipeId: `manual_${itemId}`,
      itemId: itemId,
      quantity,
      progress: 0,
      startTime: 0, // 任务开始时再设定
      craftingTime: recipe.time,
      status: 'pending'
    });

    if (success) {
      console.log(`Added manual crafting task: ${itemId} x${quantity}`);
      setShowMessage({
        open: true,
        message: `已添加手动合成任务: ${itemId} x${quantity}`,
        severity: 'success'
      });
    } else {
      setShowMessage({
        open: true,
        message: '制作队列已满',
        severity: 'warning'
      });
    }
  };

  const closeMessage = () => {
    setShowMessage(prev => ({ ...prev, open: false }));
  };

  return {
    handleCraft,
    handleManualCraft,
    showMessage,
    closeMessage
  };
}; 