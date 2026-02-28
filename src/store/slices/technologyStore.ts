// 科技系统切片
import type { SliceCreator, TechnologySlice } from '@/store/types';
import type { ResearchPriority } from '@/types/technology';
import type { InventoryOperations } from '@/types/inventory';
import type { Recipe } from '@/types/index';
import { ensureMap, ensureUnlockedTechsSet } from '@/store/utils/mapSetHelpers';
import { getStoreRecipeQuery, getStoreTechnologyService } from '@/store/storeRuntimeServices';
import { error as logError } from '@/utils/logger';

export const createTechnologySlice: SliceCreator<TechnologySlice> = (set, get) => ({
  // 科技系统初始状态
  technologies: new Map(),
  researchState: null,
  researchQueue: [],
  unlockedTechs: new Set(),
  autoResearch: true,
  techCategories: [],

  // 研究触发器追踪初始状态
  craftedItemCounts: new Map(),
  builtEntityCounts: new Map(),
  minedEntityCounts: new Map(),

  // ========== 科技系统 Actions ==========

  // 初始化科技服务
  initializeTechnologyService: async () => {
    try {
      const techService = getStoreTechnologyService();
      const syncStateFromService = () => {
        const allTechs = techService.getAllTechnologies();
        const techMap = new Map(allTechs.map(tech => [tech.id, tech]));
        const techTreeState = techService.getTechTreeState();
        const techCategories = techService.getTechCategories();

        set(() => ({
          technologies: techMap,
          unlockedTechs: new Set(techTreeState.unlockedTechs),
          researchState: techTreeState.currentResearch || null,
          researchQueue: techTreeState.researchQueue,
          autoResearch: techTreeState.autoResearch,
          techCategories,
        }));
      };

      const inventoryOps: InventoryOperations = {
        getItemAmount: (itemId: string) => {
          return get().getInventoryItem(itemId).currentAmount;
        },
        updateItemAmount: (itemId: string, change: number) => {
          get().updateInventory(itemId, change);
        },
        hasEnoughItems: (requirements: Record<string, number>) => {
          return Object.entries(requirements).every(([itemId, required]) => {
            const available = get().getInventoryItem(itemId).currentAmount;
            return available >= required;
          });
        },
        consumeItems: (requirements: Record<string, number>) => {
          // 先检查是否有足够的物品
          const hasEnough = Object.entries(requirements).every(([itemId, required]) => {
            const available = get().getInventoryItem(itemId).currentAmount;
            return available >= required;
          });

          if (!hasEnough) {
            return false;
          }

          // 消耗物品
          Object.entries(requirements).forEach(([itemId, required]) => {
            get().updateInventory(itemId, -required);
          });

          return true;
        },
      };

      techService.setInventoryOperations(inventoryOps);
      await techService.hydrateState({
        unlockedTechs: get().unlockedTechs,
        researchState: get().researchState,
        researchQueue: get().researchQueue,
        autoResearch: get().autoResearch,
      });
      syncStateFromService();
    } catch (error) {
      logError('Failed to initialize TechnologyService:', error);
    }
  },

  // 开始研究
  startResearch: async (techId: string) => {
    const techService = getStoreTechnologyService();
    const result = await techService.startResearch(techId);

    if (result.success) {
      set(() => ({
        researchState: techService.getCurrentResearch() || null,
        researchQueue: techService.getResearchQueue(),
        autoResearch: techService.getTechTreeState().autoResearch,
      }));
    }

    return result.success;
  },

  // 完成研究
  completeResearch: (techId: string) => {
    const techService = getStoreTechnologyService();
    techService.completeResearch(techId);

    set(() => ({
      unlockedTechs: new Set(techService.getTechTreeState().unlockedTechs),
      researchState: techService.getCurrentResearch() || null,
      researchQueue: techService.getResearchQueue(),
      autoResearch: techService.getTechTreeState().autoResearch,
    }));
  },

  // 添加到研究队列
  addToResearchQueue: (techId: string, priority?: ResearchPriority) => {
    const techService = getStoreTechnologyService();
    const result = techService.addToResearchQueue(techId, priority);

    if (result.success) {
      set(() => ({
        researchQueue: techService.getResearchQueue(),
        autoResearch: techService.getTechTreeState().autoResearch,
      }));
    }

    return result.success;
  },

  // 从队列移除
  removeFromResearchQueue: (techId: string) => {
    const techService = getStoreTechnologyService();
    const success = techService.removeFromResearchQueue(techId);

    if (success) {
      set(() => ({
        researchQueue: techService.getResearchQueue(),
        autoResearch: techService.getTechTreeState().autoResearch,
      }));
    }
  },

  // 重新排序队列
  reorderResearchQueue: (techId: string, newPosition: number) => {
    const techService = getStoreTechnologyService();
    const success = techService.reorderResearchQueue(techId, newPosition);

    if (success) {
      set(() => ({
        researchQueue: techService.getResearchQueue(),
        autoResearch: techService.getTechTreeState().autoResearch,
      }));
    }

    return success;
  },

  // 设置自动研究
  setAutoResearch: (enabled: boolean) => {
    const techService = getStoreTechnologyService();
    techService.setAutoResearch(enabled);

    set(() => ({
      autoResearch: techService.getTechTreeState().autoResearch,
    }));
  },

  // 获取科技
  getTechnology: (techId: string) => {
    return get().technologies.get(techId);
  },

  // 检查科技是否已解锁
  isTechUnlocked: (techId: string) => {
    get()._repairUnlockedTechsState();
    return get().unlockedTechs.has(techId);
  },

  // 检查科技是否可研究
  isTechAvailable: (techId: string) => {
    const techService = getStoreTechnologyService();
    return techService.isTechAvailable(techId);
  },

  // 更新研究进度
  updateResearchProgress: (deltaTime: number) => {
    const techService = getStoreTechnologyService();
    techService.updateResearchProgress(deltaTime);
    const techTreeState = techService.getTechTreeState();

    set(() => ({
      researchState: techTreeState.currentResearch || null,
      researchQueue: techTreeState.researchQueue,
      unlockedTechs: new Set(techTreeState.unlockedTechs),
      autoResearch: techTreeState.autoResearch,
    }));
  },

  _repairUnlockedTechsState: () => {
    const unlockedTechs = get().unlockedTechs;
    if (!(unlockedTechs instanceof Set)) {
      const safeUnlockedTechs = ensureUnlockedTechsSet(unlockedTechs);
      set(() => ({ unlockedTechs: safeUnlockedTechs }));
    }
  },

  // 研究触发器相关方法
  trackCraftedItem: (itemId: string, count: number) => {
    set(state => {
      const safeCraftedItemCounts = ensureMap<string, number>(
        state.craftedItemCounts,
        'craftedItemCounts'
      );
      const newCraftedItemCounts = new Map(safeCraftedItemCounts);
      const currentCount = newCraftedItemCounts.get(itemId) || 0;
      newCraftedItemCounts.set(itemId, currentCount + count);
      return { craftedItemCounts: newCraftedItemCounts };
    });

    // 检查研究触发器
    get().checkResearchTriggers();
  },

  trackBuiltEntity: (entityId: string, count: number) => {
    set(state => {
      const safeBuiltEntityCounts = ensureMap<string, number>(
        state.builtEntityCounts,
        'builtEntityCounts'
      );
      const newBuiltEntityCounts = new Map(safeBuiltEntityCounts);
      const currentCount = newBuiltEntityCounts.get(entityId) || 0;
      newBuiltEntityCounts.set(entityId, currentCount + count);
      return { builtEntityCounts: newBuiltEntityCounts };
    });

    // 检查研究触发器
    get().checkResearchTriggers();
  },

  trackMinedEntity: (entityId: string, count: number) => {
    set(state => {
      const safeMinedEntityCounts = ensureMap<string, number>(
        state.minedEntityCounts,
        'minedEntityCounts'
      );
      const newMinedEntityCounts = new Map(safeMinedEntityCounts);
      const currentCount = newMinedEntityCounts.get(entityId) || 0;
      newMinedEntityCounts.set(entityId, currentCount + count);
      return { minedEntityCounts: newMinedEntityCounts };
    });

    // 检查研究触发器
    get().checkResearchTriggers();
  },

  checkResearchTriggers: async () => {
    const state = get();

    try {
      // 获取所有配方数据
      const recipeService = getStoreRecipeQuery();
      const allRecipes = recipeService.getAllRecipes();

      // 查找科技类配方
      const techRecipes = allRecipes.filter(
        (
          recipe: Recipe & {
            researchTrigger?: { type: string; item?: string; entity?: string; count?: number };
          }
        ) =>
          recipe.category === 'technology' &&
          recipe.researchTrigger &&
          !state.unlockedTechs.has(recipe.id)
      );

      for (const recipe of techRecipes) {
        const trigger = recipe.researchTrigger!;
        let shouldUnlock = false;

        switch (trigger.type) {
          case 'craft-item':
            if (trigger.item) {
              const safeCraftedItemCounts = ensureMap<string, number>(
                state.craftedItemCounts,
                'craftedItemCounts'
              );
              const craftedCount = safeCraftedItemCounts.get(trigger.item) || 0;
              const requiredCount = trigger.count || 1;
              shouldUnlock = craftedCount >= requiredCount;
            }
            break;

          case 'build-entity':
            if (trigger.entity) {
              const safeBuiltEntityCounts = ensureMap<string, number>(
                state.builtEntityCounts,
                'builtEntityCounts'
              );
              const builtCount = safeBuiltEntityCounts.get(trigger.entity) || 0;
              const requiredCount = trigger.count || 1;
              shouldUnlock = builtCount >= requiredCount;
            }
            break;

          case 'mine-entity':
            if (trigger.entity) {
              const safeMinedEntityCounts = ensureMap<string, number>(
                state.minedEntityCounts,
                'minedEntityCounts'
              );
              const minedCount = safeMinedEntityCounts.get(trigger.entity) || 0;
              const requiredCount = trigger.count || 1;
              shouldUnlock = minedCount >= requiredCount;
            }
            break;

          case 'create-space-platform':
            // TODO: 实现太空平台创建逻辑
            break;

          case 'capture-spawner':
            // TODO: 实现虫巢捕获逻辑
            break;
        }

        if (shouldUnlock) {
          // 通过 completeResearch action 统一同步：
          // 1. TechUnlockService.unlockTechnology(techId)（Service 层权威来源）
          // 2. Store 的 unlockedTechs（响应式 UI 数据源）
          // 避免两处状态独立维护导致不一致
          get().completeResearch(recipe.id);
        }
      }
    } catch (error) {
      logError('Error checking research triggers:', error);
    }
  },
});
