// 游戏状态管理 - Zustand Store

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createDebouncedStorage } from '../utils/debouncedStorage';
import type { InventoryItem, CraftingTask, Recipe, DeployedContainer, OperationResult } from '../types/index';
import type { 
  Technology, 
  TechResearchState, 
  ResearchQueueItem, 
  TechCategory,
  ResearchPriority
} from '../types/technology';
import type { InventoryOperations } from '../types/inventory';
import type { FacilityInstance } from '../types/facilities';
import { RecipeService } from '../services/RecipeService';
import { getStorageConfig } from '../data/storageConfigs';
import { DataService } from '../services/DataService';
import { TechnologyService } from '../services/TechnologyService';
import { FuelService } from '../services/FuelService';
import { FACILITY_FUEL_CONFIGS } from '../data/fuelConfigs';

// 页面卸载时立即保存
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    // 页面卸载时会自动触发persist保存
  });
}
import { error as logError } from '../utils/logger';

interface GameState {
  // 库存系统
  inventory: Map<string, InventoryItem>;
  
  // 制作队列
  craftingQueue: CraftingTask[];
  maxQueueSize: number;
  
  // 设施系统
  facilities: FacilityInstance[];
  
  // 存储容器系统
  deployedContainers: DeployedContainer[];
  
  // 游戏统计
  gameTime: number;
  lastSaveTime: number; // 上次保存时的时间戳
  totalItemsProduced: number;
  
  // 配方相关
  favoriteRecipes: Set<string>;
  recentRecipes: string[];
  maxRecentRecipes: number;

  // 科技系统
  technologies: Map<string, Technology>;
  researchState: TechResearchState | null;
  researchQueue: ResearchQueueItem[];
  unlockedTechs: Set<string>;
  autoResearch: boolean;
  techCategories: TechCategory[];
  
  // 研究触发器追踪
  craftedItemCounts: Map<string, number>; // 追踪制造物品数量
  builtEntityCounts: Map<string, number>; // 追踪建造实体数量
  minedEntityCounts: Map<string, number>; // 追踪挖掘实体数量
  
  // Actions
  updateInventory: (itemId: string, amount: number) => void;
  getInventoryItem: (itemId: string) => InventoryItem;
  recalculateItemCapacity: (itemId: string) => void;
  addCraftingTask: (task: Omit<CraftingTask, 'id'>) => boolean;
  removeCraftingTask: (taskId: string) => void;
  updateCraftingProgress: (taskId: string, progress: number) => void;
  completeCraftingTask: (taskId: string) => void;
  addFacility: (facility: FacilityInstance) => void;
  updateFacility: (facilityId: string, updates: Partial<FacilityInstance>) => void;
  removeFacility: (facilityId: string) => void;
  incrementGameTime: (deltaTime: number) => void;
  setGameTime: (time: number) => void;
  clearGameData: () => Promise<void>;
  saveGame: () => void;
  
  // 存储容器相关 Actions
  deployChestForStorage: (chestType: string, targetItemId: string) => OperationResult;
  craftChest: (chestType: string, quantity?: number) => OperationResult;
  canCraftChest: (chestType: string, quantity?: number) => boolean;
  getDeployedContainersForItem: (itemId: string) => DeployedContainer[];
  removeDeployedContainer: (containerId: string) => void;
  
  // 配方相关 Actions
  addFavoriteRecipe: (recipeId: string) => void;
  removeFavoriteRecipe: (recipeId: string) => void;
  isFavoriteRecipe: (recipeId: string) => boolean;
  addRecentRecipe: (recipeId: string) => void;
  getRecentRecipes: () => Recipe[];
  getFavoriteRecipes: () => Recipe[];
  getRecommendedRecipes: (itemId: string) => Recipe[];
  getRecipeStats: (itemId: string) => {
    totalRecipes: number;
    manualRecipes: number;
    automatedRecipes: number;
    miningRecipes: number;
    recyclingRecipes: number;
    mostEfficientRecipe?: Recipe;
  };
  searchRecipes: (query: string) => Recipe[];

  // 科技系统 Actions
  initializeTechnologyService: () => Promise<void>;
  startResearch: (techId: string) => Promise<boolean>;
  completeResearch: (techId: string) => void;
  addToResearchQueue: (techId: string, priority?: ResearchPriority) => boolean;
  removeFromResearchQueue: (techId: string) => void;
  reorderResearchQueue: (techId: string, newPosition: number) => boolean;
  setAutoResearch: (enabled: boolean) => void;
  getTechnology: (techId: string) => Technology | undefined;
  isTechUnlocked: (techId: string) => boolean;
  isTechAvailable: (techId: string) => boolean;
  updateResearchProgress: (deltaTime: number) => void;
  
  // 研究触发器相关
  trackCraftedItem: (itemId: string, count: number) => void;
  trackBuiltEntity: (entityId: string, count: number) => void;
  trackMinedEntity: (entityId: string, count: number) => void;
  checkResearchTriggers: () => void;
  
  // 燃料系统 Actions
  refuelFacility: (facilityId: string, fuelItemId: string, quantity: number) => boolean;
  autoRefuelFacilities: () => void;
  updateFuelConsumption: (deltaTime: number) => void;
}

const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // 初始状态
      inventory: new Map(),
      craftingQueue: [],
      maxQueueSize: 50,
      facilities: [],
      deployedContainers: [],
      gameTime: 0,
      lastSaveTime: Date.now(),
      totalItemsProduced: 0,
      favoriteRecipes: new Set(),
      recentRecipes: [],
      maxRecentRecipes: 10,

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

      // 库存管理
      updateInventory: (itemId: string, amount: number) => {
        set((state) => {
          const newInventory = new Map(state.inventory);
          const currentItem = newInventory.get(itemId) || get().getInventoryItem(itemId);

          const newAmount = Math.max(0, currentItem.currentAmount + amount);
          const updatedItem = {
            ...currentItem,
            currentAmount: Math.min(newAmount, currentItem.maxCapacity)
          };

          newInventory.set(itemId, updatedItem);
          
          return {
            inventory: newInventory,
            totalItemsProduced: state.totalItemsProduced + (amount > 0 ? amount : 0)
          };
        });
      },

      getInventoryItem: (itemId: string) => {
        const inventory = get().inventory;
        const existing = inventory.get(itemId);
        
        if (existing) {
          return existing;
        }
        
        // 新物品，计算默认容量
        const dataService = DataService.getInstance();
        const item = dataService.getItem(itemId);
        const stackSize = item?.stack || 100; // 默认堆叠大小
        
        // 获取已部署的容器
        const containers = get().deployedContainers.filter(c => c.targetItemId === itemId);
        const additionalStacks = containers.reduce((sum, c) => sum + c.additionalStacks, 0);
        
        const baseStacks = 1; // 默认1个堆叠
        const totalStacks = baseStacks + additionalStacks;
        
        return {
          itemId,
          currentAmount: 0,
          stackSize,
          baseStacks,
          additionalStacks,
          totalStacks,
          maxCapacity: totalStacks * stackSize,
          productionRate: 0,
          consumptionRate: 0,
          status: 'normal' as const
        };
      },

      recalculateItemCapacity: (itemId: string) => {
        set(state => {
          const newInventory = new Map(state.inventory);
          const currentItem = newInventory.get(itemId);
          
          if (currentItem) {
            // 获取最新的容器信息
            const containers = state.deployedContainers.filter(c => c.targetItemId === itemId);
            const additionalStacks = containers.reduce((sum, c) => sum + c.additionalStacks, 0);
            const totalStacks = currentItem.baseStacks + additionalStacks;
            
            const updatedItem = {
              ...currentItem,
              additionalStacks,
              totalStacks,
              maxCapacity: totalStacks * currentItem.stackSize
            };
            
            newInventory.set(itemId, updatedItem);
          }
          
          return { inventory: newInventory };
        });
      },

      // 制作队列管理
      addCraftingTask: (task) => {
        const state = get();
        if (state.craftingQueue.length >= state.maxQueueSize) {
          return false;
        }

        const newTask: CraftingTask = {
          ...task,
          id: `craft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        set((state) => ({
          craftingQueue: [...state.craftingQueue, newTask]
        }));

        return true;
      },

      removeCraftingTask: (taskId: string) => {
        const state = get();
        const task = state.craftingQueue.find(t => t.id === taskId);
        
        if (task) {
          // 如果是手动合成任务，不需要归还库存（因为手动合成没有消耗库存）
          if (!task.recipeId.startsWith('manual_')) {
            // 获取配方信息并归还库存
            const recipe = RecipeService.getRecipeById(task.recipeId);
            if (recipe) {
              // 归还输入材料
              Object.entries(recipe.in).forEach(([itemId, required]) => {
                get().updateInventory(itemId, (required as number) * task.quantity);
              });
            }
          }
          
          // 移除任务
          set((state) => ({
            craftingQueue: state.craftingQueue.filter(task => task.id !== taskId)
          }));
        }
      },

      updateCraftingProgress: (taskId: string, progress: number) => {
        set((state) => ({
          craftingQueue: state.craftingQueue.map(task =>
            task.id === taskId ? { ...task, progress, status: 'crafting' as const } : task
          )
        }));
      },

      completeCraftingTask: (taskId: string) => {
        const state = get();
        const task = state.craftingQueue.find(t => t.id === taskId);
        if (task) {
          // 添加产品到库存
          get().updateInventory(task.itemId, task.quantity);
          // 追踪制造的物品（用于研究触发器）
          get().trackCraftedItem(task.itemId, task.quantity);
          // 移除任务
          get().removeCraftingTask(taskId);
        }
      },

      // 设施管理
      addFacility: (facility) => {
        const fuelService = FuelService.getInstance();
        
        // 检查是否需要燃料缓存
        // 检查燃料配置而不是 powerType，因为 powerType 可能在 item 中没有定义
        if (FACILITY_FUEL_CONFIGS[facility.facilityId]) {
          facility.fuelBuffer = fuelService.initializeFuelBuffer(facility.facilityId) || undefined;
        }
        
        set((state) => ({
          facilities: [...state.facilities, facility]
        }));
      },

      updateFacility: (facilityId: string, updates) => {
        set((state) => ({
          facilities: state.facilities.map(facility =>
            facility.id === facilityId ? { ...facility, ...updates } : facility
          )
        }));
      },

      removeFacility: (facilityId: string) => {
        set((state) => ({
          facilities: state.facilities.filter(facility => facility.id !== facilityId)
        }));
      },

      // 游戏时间
      incrementGameTime: (deltaTime: number) => {
        set((state) => ({
          gameTime: state.gameTime + deltaTime
        }));
      },

      setGameTime: (time: number) => {
        set(() => ({
          gameTime: time
        }));
      },

      // 配方相关 Actions
      addFavoriteRecipe: (recipeId: string) => {
        set((state) => {
          const newFavorites = new Set(state.favoriteRecipes);
          newFavorites.add(recipeId);
          return { favoriteRecipes: newFavorites };
        });
      },

      removeFavoriteRecipe: (recipeId: string) => {
        set((state) => {
          const newFavorites = new Set(state.favoriteRecipes);
          newFavorites.delete(recipeId);
          return { favoriteRecipes: newFavorites };
        });
      },

      isFavoriteRecipe: (recipeId: string) => {
        return get().favoriteRecipes.has(recipeId);
      },

      addRecentRecipe: (recipeId: string) => {
        set((state) => {
          const newRecent = [recipeId, ...state.recentRecipes.filter(id => id !== recipeId)];
          return {
            recentRecipes: newRecent.slice(0, state.maxRecentRecipes)
          };
        });
      },

      getRecentRecipes: () => {
        const recentIds = get().recentRecipes;
        return recentIds
          .map(id => RecipeService.getRecipeById(id))
          .filter((recipe): recipe is Recipe => recipe !== undefined);
      },

      getFavoriteRecipes: () => {
        const favoriteIds = Array.from(get().favoriteRecipes);
        return favoriteIds
          .map(id => RecipeService.getRecipeById(id))
          .filter((recipe): recipe is Recipe => recipe !== undefined);
      },

      getRecommendedRecipes: (itemId: string) => {
        const recipes = RecipeService.getRecipesThatProduce(itemId);
        const mostEfficient = RecipeService.getMostEfficientRecipe(itemId);
        
        if (mostEfficient) {
          // 将最高效率配方放在第一位
          return [
            mostEfficient,
            ...recipes.filter(r => r.id !== mostEfficient.id)
          ];
        }
        
        return recipes;
      },

      getRecipeStats: (itemId: string) => {
        return RecipeService.getRecipeStats(itemId);
      },

      searchRecipes: (query: string) => {
        return RecipeService.searchRecipes(query);
      },

      // 存储容器相关方法
      deployChestForStorage: (chestType: string, targetItemId: string) => {
        const config = getStorageConfig(chestType);
        if (!config) {
          return {
            success: false,
            reason: 'invalid_chest_type',
            message: `无效的箱子类型: ${chestType}`
          };
        }
        
        const chestItem = get().getInventoryItem(config.itemId);
        
        // 检查是否有现成的箱子
        if (chestItem.currentAmount <= 0) {
          return {
            success: false,
            reason: 'insufficient_chest',
            message: `没有可用的${config.name}，请先制造`
          };
        }
        
        // 消耗1个箱子
        get().updateInventory(config.itemId, -1);
        
        // 创建部署记录
        const deployment: DeployedContainer = {
          id: `deployed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          chestType,
          chestItemId: config.itemId,
          targetItemId,
          additionalStacks: config.additionalStacks || 0,
          deployedAt: Date.now()
        };
        
        set(state => ({
          deployedContainers: [...state.deployedContainers, deployment]
        }));
        
        // 重新计算目标物品的容量
        get().recalculateItemCapacity(targetItemId);
        
        return {
          success: true,
          message: `为 ${targetItemId} 成功部署了${config.name}`
        };
      },

      craftChest: (chestType: string, quantity: number = 1) => {
        const config = getStorageConfig(chestType);
        if (!config) {
          return {
            success: false,
            reason: 'invalid_chest_type',
            message: `无效的箱子类型: ${chestType}`
          };
        }
        
        // 检查原材料是否足够
        const hasEnoughMaterials = Object.entries(config.recipe).every(([itemId, required]) => {
          const available = get().getInventoryItem(itemId).currentAmount;
          return available >= required * quantity;
        });
        
        if (!hasEnoughMaterials) {
          return {
            success: false,
            reason: 'insufficient_materials',
            message: '原材料不足'
          };
        }
        
        // 消耗原材料
        Object.entries(config.recipe).forEach(([itemId, required]) => {
          get().updateInventory(itemId, -required * quantity);
        });
        
        // 添加到制作队列
        for (let i = 0; i < quantity; i++) {
          get().addCraftingTask({
            recipeId: `craft_${config.itemId}`,
            itemId: config.itemId,
            quantity: 1,
            progress: 0,
            startTime: 0, // 任务开始时再设定
            craftingTime: config.craftingTime * 1000,
            status: 'pending'
          });
        }
        
        return {
          success: true,
          message: `开始制造${quantity}个${config.name}`
        };
      },

      canCraftChest: (chestType: string, quantity: number = 1) => {
        const config = getStorageConfig(chestType);
        if (!config) return false;
        
        return Object.entries(config.recipe).every(([itemId, required]) => {
          const available = get().getInventoryItem(itemId).currentAmount;
          return available >= required * quantity;
        });
      },

      getDeployedContainersForItem: (itemId: string) => {
        return get().deployedContainers.filter(c => c.targetItemId === itemId);
      },

      removeDeployedContainer: (containerId: string) => {
        const container = get().deployedContainers.find(c => c.id === containerId);
        if (!container) return;
        
        // 移除容器
        set(state => ({
          deployedContainers: state.deployedContainers.filter(c => c.id !== containerId)
        }));
        
        // 重新计算目标物品的容量
        get().recalculateItemCapacity(container.targetItemId);
      },

      // ========== 科技系统 Actions ==========

      // 初始化科技服务
      initializeTechnologyService: async () => {
        try {
          const techService = TechnologyService.getInstance();
          if (!techService.isServiceInitialized()) {
            await techService.initialize();
            
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
              }
            };
            
            // 注入库存操作到科技服务
            techService.setInventoryOperations(inventoryOps);
            
            // 同步科技状态到store
            const allTechs = techService.getAllTechnologies();
            const techMap = new Map(allTechs.map(tech => [tech.id, tech]));
            const techTreeState = techService.getTechTreeState();
            const unlockedTechs = new Set(techTreeState.unlockedTechs);
            const techCategories = techService.getTechCategories();
            
            set(() => ({
              technologies: techMap,
              unlockedTechs,
              techCategories
            }));
          }
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
            researchQueue: queue
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
          researchQueue: queue
        }));
      },

      // 添加到研究队列
      addToResearchQueue: (techId: string, priority?: ResearchPriority) => {
        const techService = TechnologyService.getInstance();
        const result = techService.addToResearchQueue(techId, priority);
        
        if (result.success) {
          const queue = techService.getResearchQueue();
          set(() => ({
            researchQueue: queue
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
            researchQueue: queue
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
            researchQueue: queue
          }));
        }
        
        return success;
      },

      // 设置自动研究
      setAutoResearch: (enabled: boolean) => {
        const techService = TechnologyService.getInstance();
        techService.setAutoResearch(enabled);
        
        set(() => ({
          autoResearch: enabled
        }));
      },

      // 获取科技
      getTechnology: (techId: string) => {
        return get().technologies.get(techId);
      },

      // 检查科技是否已解锁
      isTechUnlocked: (techId: string) => {
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
            researchState: currentResearch
          }));
        }
      },

      // 研究触发器相关方法
      trackCraftedItem: (itemId: string, count: number) => {
        set((state) => {
          const newCraftedItemCounts = new Map(state.craftedItemCounts);
          const currentCount = newCraftedItemCounts.get(itemId) || 0;
          newCraftedItemCounts.set(itemId, currentCount + count);
          return { craftedItemCounts: newCraftedItemCounts };
        });
        
        // 检查研究触发器
        get().checkResearchTriggers();
      },

      trackBuiltEntity: (entityId: string, count: number) => {
        set((state) => {
          const newBuiltEntityCounts = new Map(state.builtEntityCounts);
          const currentCount = newBuiltEntityCounts.get(entityId) || 0;
          newBuiltEntityCounts.set(entityId, currentCount + count);
          return { builtEntityCounts: newBuiltEntityCounts };
        });
        
        // 检查研究触发器
        get().checkResearchTriggers();
      },

      trackMinedEntity: (entityId: string, count: number) => {
        set((state) => {
          const newMinedEntityCounts = new Map(state.minedEntityCounts);
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
          const techRecipes = allRecipes.filter(recipe => 
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
                  const craftedCount = state.craftedItemCounts.get(trigger.item) || 0;
                  const requiredCount = trigger.count || 1;
                  shouldUnlock = craftedCount >= requiredCount;
                }
                break;
                
              case 'build-entity':
                if (trigger.entity) {
                  const builtCount = state.builtEntityCounts.get(trigger.entity) || 0;
                  const requiredCount = trigger.count || 1;
                  shouldUnlock = builtCount >= requiredCount;
                }
                break;
                
              case 'mine-entity':
                if (trigger.entity) {
                  const minedCount = state.minedEntityCounts.get(trigger.entity) || 0;
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
              set((state) => ({
                unlockedTechs: new Set([...state.unlockedTechs, recipe.id])
              }));
              
              // Research unlocked by trigger
              
              // 可以在这里添加通知系统
              // TODO: 添加科技解锁通知
            }
          }
        } catch (error) {
                      logError('Error checking research triggers:', error);
        }
      },
      
      // 燃料系统方法
      refuelFacility: (facilityId: string, fuelItemId: string, quantity: number) => {
        const facility = get().facilities.find(f => f.id === facilityId);
        if (!facility?.fuelBuffer) return false;
        
        const fuelService = FuelService.getInstance();
        const result = fuelService.addFuel(facility.fuelBuffer, fuelItemId, quantity, facility.facilityId);
        
        if (result.success && result.quantityAdded) {
          // 从库存扣除
          get().updateInventory(fuelItemId, -result.quantityAdded);
          
          // 更新设施
          get().updateFacility(facilityId, { fuelBuffer: facility.fuelBuffer });
          
          return true;
        }
        
        return false;
      },
      
      autoRefuelFacilities: () => {
        const fuelService = FuelService.getInstance();
        const facilities = get().facilities;
        
        facilities.forEach(facility => {
          if (facility.fuelBuffer && facility.status !== 'stopped') {
            const result = fuelService.autoRefuel(facility, get().getInventoryItem);
            
            if (result.success) {
              // 扣除库存
              Object.entries(result.itemsConsumed).forEach(([itemId, amount]) => {
                get().updateInventory(itemId, -amount);
              });
              
              // 更新设施
              get().updateFacility(facility.id, { fuelBuffer: facility.fuelBuffer });
            }
          }
        });
      },
      
      updateFuelConsumption: (deltaTime: number) => {
        const fuelService = FuelService.getInstance();
        const facilities = get().facilities;
        
        facilities.forEach(facility => {
          if (facility.fuelBuffer) {
            const isProducing = facility.status === 'running' && facility.production?.progress !== undefined;
            const result = fuelService.updateFuelConsumption(facility, deltaTime, isProducing);
            
            if (!result.success && facility.status === 'running') {
              // 燃料耗尽，更新状态
              get().updateFacility(facility.id, { 
                status: 'no_fuel',
                fuelBuffer: facility.fuelBuffer
              });
              
              // 尝试自动补充
              const refuelResult = fuelService.autoRefuel(facility, get().getInventoryItem);
              if (refuelResult.success) {
                // 扣除库存
                Object.entries(refuelResult.itemsConsumed).forEach(([itemId, amount]) => {
                  get().updateInventory(itemId, -amount);
                });
                
                // 恢复运行
                get().updateFacility(facility.id, { 
                  status: 'running',
                  fuelBuffer: facility.fuelBuffer
                });
              }
            } else if (result.success) {
              // 更新燃料缓存
              get().updateFacility(facility.id, { fuelBuffer: facility.fuelBuffer });
            }
          }
        });
      },

      clearGameData: async () => {
        // 清除异步存储
        const storage = createDebouncedStorage();
        await storage.removeItem('factorio-game-storage');
        
        // 重置状态
        set(() => ({
          inventory: new Map(),
          craftingQueue: [],
          facilities: [],
          deployedContainers: [],
          gameTime: 0,
          lastSaveTime: Date.now(),
          totalItemsProduced: 0,
          favoriteRecipes: new Set(),
          recentRecipes: [],
          // 重置科技系统状态
          technologies: new Map(),
          researchState: null,
          researchQueue: [],
          unlockedTechs: new Set(),
          autoResearch: true,
          techCategories: [],
          // 重置统计数据
          craftedItemCounts: new Map(),
          builtEntityCounts: new Map(),
          minedEntityCounts: new Map(),
        }));
        
        // 立即重载页面以确保完全重置
        window.location.reload();
      },

      saveGame: () => {
        // 这个方法主要用于触发存档的更新
        // 通过更新lastSaveTime来触发persist中间件保存
        set(() => ({
          lastSaveTime: Date.now()
        }));
      }
    }),
    {
      name: 'factorio-game-storage',
      storage: createJSONStorage(() => createDebouncedStorage(2000)), // 2秒防抖
      partialize: (state) => ({
        inventory: Array.from(state.inventory.entries()),
        craftingQueue: state.craftingQueue,
        facilities: state.facilities,
        deployedContainers: state.deployedContainers,
        // 保存游戏时间和时间戳用于恢复计算
        gameTime: state.gameTime,
        lastSaveTime: Date.now(), // 保存当前时间戳
        totalItemsProduced: state.totalItemsProduced,
        favoriteRecipes: Array.from(state.favoriteRecipes),
        recentRecipes: state.recentRecipes,
        technologies: Array.from(state.technologies.entries()),
        researchState: state.researchState,
        researchQueue: state.researchQueue,
        unlockedTechs: Array.from(state.unlockedTechs),
        autoResearch: state.autoResearch,
        techCategories: state.techCategories,
        craftedItemCounts: Array.from(state.craftedItemCounts.entries()),
        builtEntityCounts: Array.from(state.builtEntityCounts.entries()),
        minedEntityCounts: Array.from(state.minedEntityCounts.entries())
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.inventory = new Map(state.inventory as unknown as [string, InventoryItem][]);
          state.craftingQueue = state.craftingQueue as CraftingTask[];
          state.facilities = state.facilities as FacilityInstance[];
          state.deployedContainers = state.deployedContainers as DeployedContainer[];
          
          // 基于时间戳恢复游戏时间，补偿离线时间
          const savedGameTime = state.gameTime as number;
          const savedLastSaveTime = state.lastSaveTime as number;
          const currentTime = Date.now();
          const offlineTime = currentTime - savedLastSaveTime;
          // 限制离线时间补偿，避免异常情况
          const maxOfflineTime = 24 * 60 * 60 * 1000; // 最多补偿24小时
          const compensatedOfflineTime = Math.min(offlineTime, maxOfflineTime);
          state.gameTime = savedGameTime + compensatedOfflineTime;
          state.lastSaveTime = currentTime;
          
          state.totalItemsProduced = state.totalItemsProduced as number;
          state.favoriteRecipes = new Set(state.favoriteRecipes as unknown as string[]);
          state.recentRecipes = state.recentRecipes as string[];
          state.technologies = new Map(state.technologies as unknown as [string, Technology][]);
          state.researchState = state.researchState as TechResearchState | null;
          state.researchQueue = state.researchQueue as ResearchQueueItem[];
          state.unlockedTechs = new Set(state.unlockedTechs as unknown as string[]);
          state.autoResearch = state.autoResearch as boolean;
          state.techCategories = state.techCategories as TechCategory[];
          state.craftedItemCounts = new Map(state.craftedItemCounts as unknown as [string, number][]);
          state.builtEntityCounts = new Map(state.builtEntityCounts as unknown as [string, number][]);
          state.minedEntityCounts = new Map(state.minedEntityCounts as unknown as [string, number][]);
        }
      }
    }
  )
);

export default useGameStore;