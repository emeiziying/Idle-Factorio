import { useDependencyService } from '@/hooks/useDIServices';
import useGameStore from '@/store/gameStore';
import type { Recipe } from '@/types/index';
import { useState } from 'react';
import {
  type CraftingChainAnalysis,
  type CraftingDependency,
} from '../services/crafting/DependencyService';

// 手动合成结果：成功返回合成数量（用于飘字），失败返回 null
export type ManualCraftResult = number | null;

export const useCrafting = () => {
  const [showMessage, setShowMessage] = useState({
    open: false,
    message: '',
    severity: 'error' as 'error' | 'warning' | 'info',
  });

  // 保持Hook顺序一致性
  const [showChainConfirmation] = useState({
    open: false,
    chain: null,
    onConfirm: () => {},
    onCancel: () => {},
  });

  const { getInventoryItem, addCraftingTask, addCraftingChain, inventory } = useGameStore();
  const dependencyService = useDependencyService();

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
        severity: 'error',
      });
      return;
    }

    // 添加到制作队列
    const success = addCraftingTask({
      recipeId: recipe.id,
      itemId: Object.keys(recipe.out)[0],
      quantity,
      progress: 0,
      startTime: 0,
      craftingTime: recipe.time,
      status: 'pending',
    });

    if (!success) {
      setShowMessage({
        open: true,
        message: '制作队列已满',
        severity: 'warning',
      });
    }
  };

  // 返回成功合成的数量（用于飘字），失败返回 null
  const handleManualCraft = (
    itemId: string,
    quantity: number = 1,
    recipe: Recipe
  ): ManualCraftResult => {
    // 检查材料是否足够（采矿配方无需材料）
    const isMiningRecipe = recipe.flags && recipe.flags.includes('mining');
    const hasInputMaterials = Object.keys(recipe.in).length > 0;

    if (hasInputMaterials && !isMiningRecipe) {
      const canCraft = Object.entries(recipe.in).every(([inputItemId, required]) => {
        const available = getInventoryItem(inputItemId).currentAmount;
        return available >= (required as number) * quantity;
      });

      if (!canCraft) {
        // 检查是否可以创建依赖链
        const hasDependencies = dependencyService.hasMissingDependencies(
          itemId,
          quantity,
          inventory
        );

        if (hasDependencies) {
          const chain = dependencyService.analyzeCraftingChain(itemId, quantity, inventory);

          if (chain && chain.dependencies.length > 0) {
            // 检查是否所有依赖都可以手动制作
            const allDependenciesCraftable = chain.dependencies.every(
              (dep: CraftingDependency) => dep.canCraftManually
            );

            if (allDependenciesCraftable) {
              return executeChainCrafting(chain);
            }
          } else if (chain === null) {
            setShowMessage({
              open: true,
              message: '基础材料不足，无法创建制作链。请先获取足够的基础材料。',
              severity: 'error',
            });
            return null;
          }
        }

        setShowMessage({
          open: true,
          message: '材料不足，无法手动合成',
          severity: 'error',
        });
        return null;
      }
    }

    // 添加到制作队列，使用真实的配方ID
    const success = addCraftingTask({
      recipeId: recipe.id,
      itemId: itemId,
      quantity,
      progress: 0,
      startTime: 0,
      craftingTime: recipe.time,
      status: 'pending',
    });

    if (success) {
      return quantity;
    } else {
      setShowMessage({
        open: true,
        message: '制作队列已满',
        severity: 'warning',
      });
      return null;
    }
  };

  const closeMessage = () => {
    setShowMessage(prev => ({ ...prev, open: false }));
  };

  // 返回成功合成的数量（用于飘字），失败返回 null
  const executeChainCrafting = (chainAnalysis: CraftingChainAnalysis): ManualCraftResult => {
    // 预先扣除总基础材料库存
    if (chainAnalysis.totalBasicMaterialNeeds) {
      for (const [materialId, totalNeeded] of chainAnalysis.totalBasicMaterialNeeds) {
        const available = getInventoryItem(materialId).currentAmount;
        if (available < totalNeeded) {
          setShowMessage({
            open: true,
            message: `基础材料${materialId}不足，需要${totalNeeded}个，只有${available}个`,
            severity: 'error',
          });
          return null;
        }
      }

      // 扣除基础材料库存
      const { updateInventory } = useGameStore.getState();
      for (const [materialId, totalNeeded] of chainAnalysis.totalBasicMaterialNeeds) {
        updateInventory(materialId, -totalNeeded);
      }
    }

    // 创建链式任务数据结构
    const chainTasks = chainAnalysis.tasks.map((task, index) => {
      const isIntermediate = index < chainAnalysis.tasks.length - 1;
      return {
        ...task,
        isIntermediateProduct: isIntermediate,
        dependsOnTasks: index > 0 ? [chainAnalysis.tasks[index - 1].id] : undefined,
      };
    });

    const chainData = {
      name: `制作${chainAnalysis.mainTask.itemId}(含依赖)`,
      tasks: chainTasks,
      finalProduct: {
        itemId: chainAnalysis.mainTask.itemId,
        quantity: chainAnalysis.mainTask.quantity,
      },
      status: 'pending' as const,
      totalProgress: 0,
      rawMaterialsConsumed: chainAnalysis.totalBasicMaterialNeeds,
    };

    const chainId = addCraftingChain(chainData);

    if (chainId) {
      return chainAnalysis.mainTask.quantity;
    } else {
      setShowMessage({
        open: true,
        message: '制作队列已满，无法添加链式任务',
        severity: 'warning',
      });
      return null;
    }
  };

  return {
    handleCraft,
    handleManualCraft,
    showMessage,
    closeMessage,
    showChainConfirmation,
  };
};
