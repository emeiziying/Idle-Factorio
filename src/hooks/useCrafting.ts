import { useState } from 'react';
import type { Recipe } from '../types/index';
import useGameStore from '../store/gameStore';
import DependencyService, { type CraftingChainAnalysis, type CraftingDependency } from '../services/DependencyService';

export const useCrafting = () => {
  const [showMessage, setShowMessage] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });
  
  // 保持Hook顺序一致性
  const [showChainConfirmation] = useState({
    open: false,
    chain: null,
    onConfirm: () => {},
    onCancel: () => {}
  });
  
  const { getInventoryItem, addCraftingTask, addCraftingChain, inventory } = useGameStore();
  const dependencyService = DependencyService.getInstance();

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
      setShowMessage({
        open: true,
        message: `已添加制作任务: ${recipe.name} x${quantity}`,
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
        // 检查是否可以创建依赖链
        const hasDependencies = dependencyService.hasMissingDependencies(itemId, quantity, inventory);
        
        if (hasDependencies) {
          const chain = dependencyService.analyzeCraftingChain(itemId, quantity, inventory);
          
          if (chain && chain.dependencies.length > 0) {
            // 检查是否所有依赖都可以手动制作
            const allDependenciesCraftable = chain.dependencies.every((dep: CraftingDependency) => dep.canCraftManually);
            
            if (allDependenciesCraftable) {
              // 直接执行链式制作，无需确认
              executeChainCrafting(chain);
              return;
            }
          }
        }

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

  const executeChainCrafting = (chainAnalysis: CraftingChainAnalysis) => {
    // 预先扣除总原材料库存
    if (chainAnalysis.totalRawMaterialNeeds) {
      for (const [materialId, totalNeeded] of chainAnalysis.totalRawMaterialNeeds) {
        const available = getInventoryItem(materialId).currentAmount;
        if (available < totalNeeded) {
          setShowMessage({
            open: true,
            message: `原材料${materialId}不足，需要${totalNeeded}个，只有${available}个`,
            severity: 'error'
          });
          return;
        }
      }
      
      // 扣除原材料库存
      const { updateInventory } = useGameStore.getState();
      for (const [materialId, totalNeeded] of chainAnalysis.totalRawMaterialNeeds) {
        updateInventory(materialId, -totalNeeded);
      }
    }

    // 创建链式任务数据结构
    const chainTasks = chainAnalysis.tasks.map((task, index) => ({
      ...task,
      // 标记中间产物（除了最后一个任务）
      isIntermediateProduct: index < chainAnalysis.tasks.length - 1,
      // 设置任务依赖关系
      dependsOnTasks: index > 0 ? [chainAnalysis.tasks[index - 1].id] : undefined
    }));

    const chainData = {
      name: `制作${chainAnalysis.mainTask.itemId}(含依赖)`,
      tasks: chainTasks,
      finalProduct: {
        itemId: chainAnalysis.mainTask.itemId,
        quantity: chainAnalysis.mainTask.quantity
      },
      status: 'pending' as const,
      totalProgress: 0,
      rawMaterialsConsumed: chainAnalysis.totalRawMaterialNeeds // 记录已消耗的原材料
    };

    const chainId = addCraftingChain(chainData);
    
    if (chainId) {
      const duration = dependencyService.calculateChainDuration(chainAnalysis);
      setShowMessage({
        open: true,
        message: `已创建链式制作任务: ${chainData.name}，预计${Math.ceil(duration)}秒完成`,
        severity: 'success'
      });
    } else {
      setShowMessage({
        open: true,
        message: '制作队列已满，无法添加链式任务',
        severity: 'warning'
      });
    }
  };

  return {
    handleCraft,
    handleManualCraft,
    showMessage,
    closeMessage,
    showChainConfirmation
  };
}; 