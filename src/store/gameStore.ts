// 游戏状态管理 - Zustand Store

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { InventoryItem, CraftingTask, Recipe, DeployedContainer, OperationResult } from '../types/index';
import type { FacilityInstance } from '../types/facilities';
import { RecipeService } from '../services/RecipeService';
import { getStorageConfig } from '../data/storageConfigs';
import DataService from '../services/DataService';

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
  totalItemsProduced: number;
  
  // 配方相关
  favoriteRecipes: Set<string>;
  recentRecipes: string[];
  maxRecentRecipes: number;
  
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
  clearGameData: () => void;
  
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
      totalItemsProduced: 0,
      favoriteRecipes: new Set(),
      recentRecipes: [],
      maxRecentRecipes: 10,

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
          // 移除任务
          get().removeCraftingTask(taskId);
        }
      },

      // 设施管理
      addFacility: (facility) => {
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
            startTime: Date.now(),
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

      clearGameData: () => {
        // 清除localStorage
        localStorage.removeItem('factorio-game-storage');
        
        // 重置状态
        set(() => ({
          inventory: new Map(),
          craftingQueue: [],
          facilities: [],
          deployedContainers: [],
          gameTime: 0,
          totalItemsProduced: 0,
          favoriteRecipes: new Set(),
          recentRecipes: [],
        }));
        
        console.log('Game data cleared successfully');
      }
    }),
    {
      name: 'factorio-game-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        ...state,
        inventory: Array.from(state.inventory.entries()),
        favoriteRecipes: Array.from(state.favoriteRecipes)
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 恢复 Map 和 Set 结构
          state.inventory = new Map(state.inventory as unknown as [string, InventoryItem][]);
          state.favoriteRecipes = new Set(state.favoriteRecipes as unknown as string[]);
        }
      }
    }
  )
);

export default useGameStore;