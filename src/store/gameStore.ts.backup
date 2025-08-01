// 游戏状态管理 - Zustand Store

/// <reference types="../vite-env" />

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { InventoryItem, CraftingTask, CraftingChain, Recipe, DeployedContainer, OperationResult } from '../types/index';
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
import { gameStorageService } from '../services/GameStorageService';

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
  craftingChains: CraftingChain[];
  maxQueueSize: number;
  
  // 设施系统
  facilities: FacilityInstance[];
  
  // 存储容器系统
  deployedContainers: DeployedContainer[];
  
  // 游戏统计
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
  _repairInventoryState: () => void;
  _repairUnlockedTechsState: () => void;
  addCraftingTask: (task: Omit<CraftingTask, 'id'>) => boolean;
  addCraftingChain: (chain: Omit<CraftingChain, 'id'>) => string;
  removeCraftingTask: (taskId: string) => void;
  updateCraftingProgress: (taskId: string, progress: number) => void;
  completeCraftingTask: (taskId: string) => void;
  addFacility: (facility: FacilityInstance) => void;
  updateFacility: (facilityId: string, updates: Partial<FacilityInstance>) => void;
  removeFacility: (facilityId: string) => void;
  _repairFacilityState: () => void; // 新增：修复设施状态
  saveKey: string; // 存档触发键，只有这个值变化时才触发存档
  clearGameData: () => Promise<void>;
  loadGameData: () => Promise<void>; // 新增：加载存档方法
  saveGame: () => void;
  forceSaveGame: () => Promise<void>; // 新增：强制存档方法
  batchUpdateInventory: (updates: Array<{ itemId: string; amount: number }>) => void; // 新增：批量更新库存
  
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

// 确保Map对象正确初始化的辅助函数
const ensureMap = <K, V>(map: unknown, typeName: string): Map<K, V> => {
  if (map instanceof Map) {
    return map;
  }
  
  if (Array.isArray(map)) {
    try {
      // 验证数组格式是否正确
      const isValidArray = map.every(entry => 
        Array.isArray(entry) && entry.length === 2
      );
      
      if (isValidArray) {
        return new Map(map as [K, V][]);
      }
    } catch (error) {
      console.error(`Failed to convert ${typeName} array to Map:`, error);
    }
  }
  
  console.warn(`Invalid ${typeName} format, creating empty Map`);
  return new Map();
};

// 确保inventory始终是Map的辅助函数
const ensureInventoryMap = (inventory: unknown): Map<string, InventoryItem> => {
  return ensureMap<string, InventoryItem>(inventory, 'inventory');
};

const ensureSet = <T>(set: unknown, typeName: string): Set<T> => {
  if (set instanceof Set) {
    return set;
  }
  if (Array.isArray(set)) {
    try {
      return new Set(set as T[]);
    } catch (error) {
      console.error(`Failed to convert ${typeName} array to Set:`, error);
    }
  }
  console.warn(`Invalid ${typeName} format, creating empty Set`);
  return new Set();
};

const ensureUnlockedTechsSet = (unlockedTechs: unknown): Set<string> => {
  return ensureSet<string>(unlockedTechs, 'unlockedTechs');
};

const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
      // 初始状态
      inventory: (() => {
        // 确保初始状态是有效的Map
        try {
          return new Map();
        } catch (error) {
          console.error('Failed to initialize inventory Map:', error);
          return new Map();
        }
      })(),
      craftingQueue: [],
      craftingChains: [],
      maxQueueSize: 50,
      facilities: [],
      deployedContainers: [],
      lastSaveTime: Date.now(),
      totalItemsProduced: 0,
      favoriteRecipes: new Set(),
      recentRecipes: [],
      maxRecentRecipes: 10,
      saveKey: 'initial', // 存档触发键

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
        // 在更新库存前修复状态
        get()._repairInventoryState();
        
        set((state) => {
          const safeInventory = ensureInventoryMap(state.inventory);
          const newInventory = new Map(safeInventory);
          const currentItem = newInventory.get(itemId) || get().getInventoryItem(itemId);

          const newAmount = Math.max(0, currentItem.currentAmount + amount);
          
          if (newAmount === 0) {
            // 如果数量为零，从库存中移除物品
            newInventory.delete(itemId);
          } else {
            const updatedItem = {
              ...currentItem,
              currentAmount: Math.min(newAmount, currentItem.maxCapacity)
            };
            newInventory.set(itemId, updatedItem);
          }
          
          return {
            inventory: newInventory,
            totalItemsProduced: state.totalItemsProduced + (amount > 0 ? amount : 0)
          };
        });
        
        // 存档由10秒定时器自动处理
      },

      // 批量更新库存
      batchUpdateInventory: (updates: Array<{ itemId: string; amount: number }>) => {
        // 在更新库存前修复状态
        get()._repairInventoryState();
        
        set((state) => {
          const safeInventory = ensureInventoryMap(state.inventory);
          const newInventory = new Map(safeInventory);
          let totalItemsAdded = 0;

          // 批量处理所有更新
          updates.forEach(({ itemId, amount }) => {
            const currentItem = newInventory.get(itemId) || get().getInventoryItem(itemId);
            const newAmount = Math.max(0, currentItem.currentAmount + amount);
            
            if (newAmount === 0) {
              // 如果数量为零，从库存中移除物品
              newInventory.delete(itemId);
            } else {
              const updatedItem = {
                ...currentItem,
                currentAmount: Math.min(newAmount, currentItem.maxCapacity)
              };
              newInventory.set(itemId, updatedItem);
            }
            
            if (amount > 0) {
              totalItemsAdded += amount;
            }
          });
          
          return {
            inventory: newInventory,
            totalItemsProduced: state.totalItemsProduced + totalItemsAdded
          };
        });
      },

      // 修复inventory状态的内部函数
        _repairInventoryState: () => {
    const inventory = get().inventory;
    if (!(inventory instanceof Map)) {
      const safeInventory = ensureInventoryMap(inventory);
      set(() => ({ inventory: safeInventory }));
      console.log('Repaired inventory state');
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
  _repairFacilityState: () => {
    const facilities = get().facilities;
    const dataService = DataService.getInstance();
    const needsRepair = facilities.filter(facility => 
      !facility.targetItemId && facility.production?.currentRecipeId
    );
    
    if (needsRepair.length > 0) {
      set((state) => ({
        facilities: state.facilities.map(facility => {
          if (!facility.targetItemId && facility.production?.currentRecipeId) {
            const recipe = dataService.getRecipe(facility.production.currentRecipeId);
            if (recipe && recipe.out) {
              // 从配方的输出物品中找到第一个作为目标物品
              const targetItemId = Object.keys(recipe.out)[0];
              console.log(`Repaired facility ${facility.id}: targetItemId set to ${targetItemId}`);
              return { ...facility, targetItemId };
            }
          }
          return facility;
        })
      }));
    }
  },

      getInventoryItem: (itemId: string) => {
        const inventory = get().inventory;
        
        // 使用辅助函数确保inventory是Map
        const safeInventory = ensureInventoryMap(inventory);
        
        // 从安全的inventory中获取项目
        const existing = safeInventory.get(itemId);
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
        // 在重新计算容量前修复状态
        get()._repairInventoryState();
        
        set(state => {
          const safeInventory = ensureInventoryMap(state.inventory);
          const newInventory = new Map(safeInventory);
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
          id: `craft_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
        };

        set((state) => ({
          craftingQueue: [...state.craftingQueue, newTask]
        }));

        return true;
      },

      addCraftingChain: (chainData) => {
        const chainId = `chain_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        
        // 为链中的每个任务分配ID和链ID
        const tasksWithIds = chainData.tasks.map((task, index) => ({
          ...task,
          id: `${chainId}_task_${index}`,
          chainId: chainId
        }));

        const newChain: CraftingChain = {
          ...chainData,
          id: chainId,
          tasks: tasksWithIds,
          status: 'pending',
          totalProgress: 0
        };

        // 将任务添加到队列中
        const currentTaskCount = get().craftingQueue.length;
        if (currentTaskCount + tasksWithIds.length > get().maxQueueSize) {
          return ''; // 队列空间不足
        }

        set((state) => ({
          craftingQueue: [...state.craftingQueue, ...tasksWithIds],
          craftingChains: [...state.craftingChains, newChain]
        }));

        return chainId;
      },

      removeCraftingTask: (taskId: string) => {
        const state = get();
        const task = state.craftingQueue.find(t => t.id === taskId);
        
        if (task) {
          // 检查是否为链式任务的一部分
          if (task.chainId) {
            const chain = state.craftingChains.find(c => c.id === task.chainId);
            if (chain) {
              // 检查这是任务完成(completed)还是手动取消
              const isTaskCompleted = task.status === 'completed';
              
              if (isTaskCompleted) {
                // 任务完成，只移除这个任务，保留链和其他任务
                console.log(`[链式任务] 移除已完成任务: ${taskId}`);
                set((state) => ({
                  craftingQueue: state.craftingQueue.filter(t => t.id !== taskId)
                }));
                return;
              } else {
                // 任务被手动取消，需要取消整个链
                if (chain.rawMaterialsConsumed) {
                  // 归还所有预扣的原材料
                  for (const [materialId, amount] of chain.rawMaterialsConsumed) {
                    get().updateInventory(materialId, amount);
                  }
                }
                
                console.log(`[链式任务] 取消整个链: ${chain.name}`);
                // 移除整个链
                set((state) => ({
                  craftingQueue: state.craftingQueue.filter(task => task.chainId !== chain.id),
                  craftingChains: state.craftingChains.filter(c => c.id !== chain.id)
                }));
                return;
              }
            }
          }
          
          // 普通任务处理
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
        if (!task) return;

        // 追踪制造的物品（用于研究触发器）
        get().trackCraftedItem(task.itemId, task.quantity);

        // 如果是链式任务的中间产物，不添加到库存
        if (task.isIntermediateProduct && task.chainId) {
          console.log(`中间产物完成: ${task.itemId} x${task.quantity} (不添加到库存)`);
          
          // 检查链中是否有依赖于此任务的任务，如果有则可以开始执行
          const chain = state.craftingChains.find(c => c.id === task.chainId);
          if (chain) {
            // 更新链的进度
            const completedTasks = chain.tasks.filter(t => 
              state.craftingQueue.find(qt => qt.id === t.id)?.status === 'completed'
            ).length + 1; // +1 for the current task
            const totalProgress = completedTasks / chain.tasks.length;
            
            set((state) => ({
              craftingChains: state.craftingChains.map(c => 
                c.id === task.chainId 
                  ? { ...c, totalProgress }
                  : c
              )
            }));
            
            // 检查是否是链的最后一个任务
            const isLastTask = chain.tasks[chain.tasks.length - 1].id === taskId;
            console.log(`[链式任务] 任务完成: ${task.itemId} x${task.quantity}, chainId: ${task.chainId}, taskId: ${taskId}`);
            console.log(`[链式任务] 链中最后任务ID: ${chain.tasks[chain.tasks.length - 1].id}, 当前任务ID: ${taskId}, 是否最后任务: ${isLastTask}`);
            console.log(`[链式任务] 是否中间产物: ${task.isIntermediateProduct}`);
            
            if (isLastTask) {
              // 最后一个任务完成，将最终产物添加到库存
              get().updateInventory(task.itemId, task.quantity);
              console.log(`[链式任务] 链式任务完成: ${chain.name}, 最终产物: ${task.itemId} x${task.quantity} 已添加到库存`);
              
              // 标记链为完成
              set((state) => ({
                craftingChains: state.craftingChains.map(c => 
                  c.id === task.chainId 
                    ? { ...c, status: 'completed' as const, totalProgress: 1 }
                    : c
                )
              }));
            }
          }
        } else {
          // 普通任务，直接添加产品到库存
          get().updateInventory(task.itemId, task.quantity);
        }
        
        // 先标记任务为已完成，然后移除
        set((state) => ({
          craftingQueue: state.craftingQueue.map(t => 
            t.id === taskId ? { ...t, status: 'completed' as const } : t
          )
        }));
        
        // 移除任务
        get().removeCraftingTask(taskId);
        
        // 存档由10秒定时器自动处理
      },

      // 设施管理
      addFacility: (facility) => {
        const fuelService = FuelService.getInstance();
        
        // 检查是否需要燃料缓存
        const fuelBuffer = fuelService.initializeFuelBuffer(facility.facilityId);
        if (fuelBuffer) {
          facility.fuelBuffer = fuelBuffer;
        }
        
        set((state) => ({
          facilities: [...state.facilities, facility]
        }));
        
        // 追踪建造的实体（用于研究触发器）
        get().trackBuiltEntity(facility.facilityId, 1);
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
          id: `deployed_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
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
            }
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
            techCategories
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
            researchState: currentResearch
          }));
        }
      },

      // 研究触发器相关方法
      trackCraftedItem: (itemId: string, count: number) => {
        set((state) => {
          const safeCraftedItemCounts = ensureMap<string, number>(state.craftedItemCounts, 'craftedItemCounts');
          const newCraftedItemCounts = new Map(safeCraftedItemCounts);
          const currentCount = newCraftedItemCounts.get(itemId) || 0;
          newCraftedItemCounts.set(itemId, currentCount + count);
          return { craftedItemCounts: newCraftedItemCounts };
        });
        
        // 检查研究触发器
        get().checkResearchTriggers();
      },

      trackBuiltEntity: (entityId: string, count: number) => {
        set((state) => {
          const safeBuiltEntityCounts = ensureMap<string, number>(state.builtEntityCounts, 'builtEntityCounts');
          const newBuiltEntityCounts = new Map(safeBuiltEntityCounts);
          const currentCount = newBuiltEntityCounts.get(entityId) || 0;
          newBuiltEntityCounts.set(entityId, currentCount + count);
          return { builtEntityCounts: newBuiltEntityCounts };
        });
        
        // 检查研究触发器
        get().checkResearchTriggers();
      },

      trackMinedEntity: (entityId: string, count: number) => {
        set((state) => {
          const safeMinedEntityCounts = ensureMap<string, number>(state.minedEntityCounts, 'minedEntityCounts');
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
                  const safeCraftedItemCounts = ensureMap<string, number>(state.craftedItemCounts, 'craftedItemCounts');
                  const craftedCount = safeCraftedItemCounts.get(trigger.item) || 0;
                  const requiredCount = trigger.count || 1;
                  shouldUnlock = craftedCount >= requiredCount;
                }
                break;
                
              case 'build-entity':
                if (trigger.entity) {
                  const safeBuiltEntityCounts = ensureMap<string, number>(state.builtEntityCounts, 'builtEntityCounts');
                  const builtCount = safeBuiltEntityCounts.get(trigger.entity) || 0;
                  const requiredCount = trigger.count || 1;
                  shouldUnlock = builtCount >= requiredCount;
                }
                break;
                
              case 'mine-entity':
                if (trigger.entity) {
                  const safeMinedEntityCounts = ensureMap<string, number>(state.minedEntityCounts, 'minedEntityCounts');
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
              set((state) => ({
                unlockedTechs: new Set([...state.unlockedTechs, recipe.id])
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
        
        // 使用智能燃料分配
        fuelService.smartFuelDistribution(
          facilities,
          get().getInventoryItem,
          get().updateInventory
        );
        
        // 更新设施状态
        facilities.forEach(facility => {
          if (facility.fuelBuffer) {
            get().updateFacility(facility.id, { fuelBuffer: facility.fuelBuffer });
          }
        });
      },
      
      updateFuelConsumption: (deltaTime: number) => {
        const fuelService = FuelService.getInstance();
        const facilities = get().facilities;
        
        facilities.forEach(facility => {
          if (facility.fuelBuffer) {
            const isProducing = facility.status === 'running' && facility.production?.progress !== undefined;
            const result = fuelService.updateFuelConsumption(facility, deltaTime, isProducing, get().getInventoryItem);
            
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
        // 清除游戏存档
        await gameStorageService.clearGameData();
        
        // 重置状态
        set(() => ({
          inventory: new Map(),
          craftingQueue: [],
          craftingChains: [],
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
        // 使用GameStorageService保存游戏数据
        const state = get();
        gameStorageService.saveGame(state).catch(error => {
          console.error('[SaveGame] 保存失败:', error);
        });
      },

      // 加载存档方法
      loadGameData: async () => {
        try {
          const loadedState = await gameStorageService.loadGame();
          if (loadedState) {
            set(() => loadedState);
            console.log('[Load] 存档加载完成');
          }
        } catch (error) {
          console.error('[Load] 存档加载失败:', error);
        }
      },

      // 新增：强制存档方法，绕过防抖
      forceSaveGame: async () => {
        const state = get();
        try {
          await gameStorageService.forceSaveGame(state);
          console.log('[ForceSave] 强制存档完成');
        } catch (error) {
          console.error('[ForceSave] 强制存档失败:', error);
          throw error;
        }
      }
    }))
);

// 初始化加载存档
const initializeStore = async () => {
  try {
    await useGameStore.getState().loadGameData();
  } catch (error) {
    console.error('[Init] 存档初始化失败:', error);
  }
};

// 立即执行初始化
initializeStore();

// 全局变量存储定时器ID，防止热更新时创建多个定时器
let autoSaveIntervalId: ReturnType<typeof setInterval> | null = null;
let lastAutoSaveTime = Date.now();

// 清理自动存档定时器
const clearAutoSaveInterval = () => {
  if (autoSaveIntervalId) {
    clearInterval(autoSaveIntervalId);
    autoSaveIntervalId = null;
    console.log('[AutoSave] 清理自动存档定时器');
  }
};

// 创建自动存档定时器
const createAutoSaveInterval = () => {
  // 先清理旧的定时器，防止热更新时重复创建
  clearAutoSaveInterval();
  
  // 创建新的定时器
  autoSaveIntervalId = setInterval(async () => {
    const state = useGameStore.getState();
    const now = Date.now();
    
    // 只有当游戏时间有变化时才存档（说明游戏在运行）
    if (now - lastAutoSaveTime > 10000) {
      console.log('[AutoSave] 定期强制存档触发');
      try {
        await state.forceSaveGame(); // 使用强制存档确保可靠性
        lastAutoSaveTime = now;
      } catch (error) {
        console.error('[AutoSave] 自动存档失败:', error);
        // 强制存档失败，但会在下次定时器触发时重试
      }
    }
  }, 10000);
  
  console.log('[AutoSave] 创建自动存档定时器');
};

// 初始化自动存档定时器
createAutoSaveInterval();

// 在开发环境中，监听热更新事件（如果可用）
if (typeof import.meta !== 'undefined' && import.meta.env?.DEV && import.meta.hot) {
  import.meta.hot.dispose(() => {
    console.log('[AutoSave] 热更新时清理定时器');
    clearAutoSaveInterval();
  });
}

export default useGameStore;