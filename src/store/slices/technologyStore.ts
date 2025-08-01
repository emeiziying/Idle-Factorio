// 科技系统切片
import type { SliceCreator, TechnologySlice } from '../types';
import type { ResearchPriority } from '../../types/technology';
import type { InventoryOperations } from '../../types/inventory';
import { TechnologyService } from '../../services/TechnologyService';
import { DataService } from '../../services/DataService';
import { RecipeService } from '../../services/RecipeService';
import { ensureMap, ensureUnlockedTechsSet } from '../utils/mapSetHelpers';
import { error as logError } from '../../utils/logger';

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
      const techService = TechnologyService.getInstance();

      // 如果服务未初始化，先初始化
      if (!techService.isServiceInitialized()) {
        await techService.initialize();
      }

      // 创建库存操作实现并注入到科技服务
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

      // 注入库存操作到科技服务
      techService.setInventoryOperations(inventoryOps);

      // 总是同步科技状态到store（无论服务是否已初始化）
      const allTechs = techService.getAllTechnologies();
      const techMap = new Map(allTechs.map(tech => [tech.id, tech]));
      const techTreeState = techService.getTechTreeState();
      const unlockedTechs = new Set(techTreeState.unlockedTechs);
      const techCategories = techService.getTechCategories();

      set(() => ({
        technologies: techMap,
        unlockedTechs,
        techCategories,
      }));
    } catch (error) {
      logError('Failed to initialize TechnologyService:', error);
    }
  },

  // 开始研究
  startResearch: async (techId: string) => {
    const techService = TechnologyService.getInstance();
    const result = await techService.startResearch(techId);

    if (result.success) {
      const currentResearch = techService.getCurrentResearch();
      const queue = techService.getResearchQueue();

      set(() => ({
        researchState: currentResearch || null,
        researchQueue: queue,
      }));
    }

    return result.success;
  },

  // 完成研究
  completeResearch: (techId: string) => {
    const techService = TechnologyService.getInstance();
    techService.completeResearch(techId);

    // 更新store状态
    const unlockedTechs = new Set([...get().unlockedTechs, techId]);
    const currentResearch = techService.getCurrentResearch();
    const queue = techService.getResearchQueue();

    set(() => ({
      unlockedTechs,
      researchState: currentResearch || null,
      researchQueue: queue,
    }));

    // 清理DataService的解锁缓存，使新解锁的配方生效
    const dataService = DataService.getInstance();
    dataService.clearUnlockCache();
  },

  // 添加到研究队列
  addToResearchQueue: (techId: string, priority?: ResearchPriority) => {
    const techService = TechnologyService.getInstance();
    const result = techService.addToResearchQueue(techId, priority);

    if (result.success) {
      const queue = techService.getResearchQueue();
      set(() => ({
        researchQueue: queue,
      }));
    }

    return result.success;
  },

  // 从队列移除
  removeFromResearchQueue: (techId: string) => {
    const techService = TechnologyService.getInstance();
    const success = techService.removeFromResearchQueue(techId);

    if (success) {
      const queue = techService.getResearchQueue();
      set(() => ({
        researchQueue: queue,
      }));
    }
  },

  // 重新排序队列
  reorderResearchQueue: (techId: string, newPosition: number) => {
    const techService = TechnologyService.getInstance();
    const success = techService.reorderResearchQueue(techId, newPosition);

    if (success) {
      const queue = techService.getResearchQueue();
      set(() => ({
        researchQueue: queue,
      }));
    }

    return success;
  },

  // 设置自动研究
  setAutoResearch: (enabled: boolean) => {
    const techService = TechnologyService.getInstance();
    techService.setAutoResearch(enabled);

    set(() => ({
      autoResearch: enabled,
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
    const techService = TechnologyService.getInstance();
    return techService.isTechAvailable(techId);
  },

  // 更新研究进度
  updateResearchProgress: (deltaTime: number) => {
    const techService = TechnologyService.getInstance();
    techService.updateResearchProgress(deltaTime);

    // 更新store中的研究状态
    const currentResearch = techService.getCurrentResearch();
    if (currentResearch) {
      set(() => ({
        researchState: currentResearch,
      }));
    }
  },

  _repairUnlockedTechsState: () => {
    const unlockedTechs = get().unlockedTechs;
    if (!(unlockedTechs instanceof Set)) {
      const safeUnlockedTechs = ensureUnlockedTechsSet(unlockedTechs);
      set(() => ({ unlockedTechs: safeUnlockedTechs }));
      console.log('Repaired unlockedTechs state');
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
      const allRecipes = RecipeService.getAllRecipes();

      // 查找科技类配方
      const techRecipes = allRecipes.filter(
        recipe =>
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
          // 解锁科技
          set(state => ({
            unlockedTechs: new Set([...state.unlockedTechs, recipe.id]),
          }));

          // 清理DataService的解锁缓存，使新解锁的配方生效
          const dataService = DataService.getInstance();
          dataService.clearUnlockCache();

          // Research unlocked by trigger

          // 可以在这里添加通知系统
          // TODO: 添加科技解锁通知
        }
      }
    } catch (error) {
      logError('Error checking research triggers:', error);
    }
  },
});
