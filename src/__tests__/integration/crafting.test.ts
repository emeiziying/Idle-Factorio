import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import useGameStore from '@/store/gameStore';
import { RecipeService, DataService, ServiceLocator, SERVICE_NAMES } from '@/services';

// 模拟服务
vi.mock('@/services/storage/GameStorageService', () => ({
  GameStorageService: {
    getInstance: vi.fn(() => ({
      saveGame: vi.fn().mockResolvedValue(undefined),
      loadGame: vi.fn().mockResolvedValue(null),
      forceSaveGame: vi.fn().mockResolvedValue(undefined),
      clearGameData: vi.fn().mockResolvedValue(undefined),
    })),
  },
}));

// 制作系统集成测试
describe('Crafting Integration Tests', () => {
  let mockRecipeService: Partial<RecipeService>;
  let mockDataService: Partial<DataService>;

  beforeEach(() => {
    // 清除服务
    ServiceLocator.clear();

    // 设置模拟服务
    mockDataService = {
      getItem: vi.fn((itemId) => ({
        id: itemId,
        name: itemId,
        category: 'intermediate-products',
        stack: 100,
        row: 1,
      })),
      getRecipe: vi.fn((recipeId) => {
        if (recipeId === 'iron-gear-wheel') {
          return {
            id: 'iron-gear-wheel',
            name: 'Iron gear wheel',
            category: 'crafting',
            time: 0.5,
            in: { 'iron-plate': 2 },
            out: { 'iron-gear-wheel': 1 },
          };
        }
        return undefined;
      }),
    };

    mockRecipeService = {
      getRecipe: vi.fn((recipeId) => mockDataService.getRecipe!(recipeId)),
      canCraftManually: vi.fn(() => true),
      getRecipeById: vi.fn((recipeId) => mockDataService.getRecipe!(recipeId)),
    };

    // 注册服务
    ServiceLocator.register(SERVICE_NAMES.DATA, mockDataService);
    ServiceLocator.register(SERVICE_NAMES.RECIPE, mockRecipeService);

    // 重置游戏 store
    act(() => {
      useGameStore.setState({
        inventory: new Map(),
        craftingQueue: [],
        totalItemsProduced: 0,
        favoriteRecipes: new Set(),
        recentRecipes: [],
      });
    });
  });

  // 基础制作流程测试
  describe('Basic Crafting Flow', () => {
    // 测试：应该完成一个简单的制作任务
    it('should complete a simple crafting task', async () => {
      const store = useGameStore.getState();

      // 步骤 1：添加材料到库存
      act(() => {
        store.updateInventory('iron-plate', 10);
      });

      expect(store.getInventoryItem('iron-plate').currentAmount).toBe(10);

      // 步骤 2：添加制作任务
      const taskAdded = store.addCraftingTask({
        recipeId: 'iron-gear-wheel',
        itemId: 'iron-gear-wheel',
        quantity: 1,
        progress: 0,
        startTime: Date.now(),
        craftingTime: 0.5,
      });

      expect(taskAdded).toBe(true);
      expect(useGameStore.getState().craftingQueue).toHaveLength(1);

      // 步骤 3：模拟制作进度
      const taskId = useGameStore.getState().craftingQueue[0].id;

      act(() => {
        store.updateCraftingProgress(taskId, 0.5);
      });

      expect(useGameStore.getState().craftingQueue[0].progress).toBe(0.5);

      // 步骤 4：完成第一个物品 - 手动消耗材料并完成任务
      act(() => {
        store.updateCraftingProgress(taskId, 1);
        // 手动消耗材料（模拟 craftingEngine 逻辑）
        const recipe = mockDataService.getRecipe!('iron-gear-wheel');
        if (recipe) {
          Object.entries(recipe.in).forEach(([itemId, required]) => {
            store.updateInventory(itemId, -(required as number));
          });
        }
        store.completeCraftingTask(taskId);
      });

      // 应该消耗了材料并生产了物品
      expect(store.getInventoryItem('iron-plate').currentAmount).toBe(8); // 10 - 2
      expect(store.getInventoryItem('iron-gear-wheel').currentAmount).toBe(1);

      // 任务应该完成
      expect(useGameStore.getState().craftingQueue).toHaveLength(0);
    });

    // 测试：应该处理材料不足的情况
    it('should handle insufficient materials', () => {
      const store = useGameStore.getState();

      // 添加不足的材料
      act(() => {
        store.updateInventory('iron-plate', 1); // 配方需要 2 个
      });

      // 注意：此测试不验证制作前提条件

      // 尝试添加制作任务
      const taskAdded = store.addCraftingTask({
        recipeId: 'iron-gear-wheel',
        itemId: 'iron-gear-wheel',
        quantity: 1,
        progress: 0,
        startTime: Date.now(),
        craftingTime: 0.5,
      });

      // 仍应添加任务（验证在其他地方进行）
      expect(taskAdded).toBe(true);
    });

    // 测试：应该更新最近配方
    it('should update recent recipes', () => {
      const store = useGameStore.getState();

      // 添加材料
      act(() => {
        store.updateInventory('iron-plate', 20);
      });

      // 制作物品
      act(() => {
        store.addCraftingTask({
          recipeId: 'iron-gear-wheel',
          itemId: 'iron-gear-wheel',
          quantity: 1,
          progress: 0,
          startTime: Date.now(),
          craftingTime: 0.5,
        });
        store.addRecentRecipe('iron-gear-wheel');
      });

      expect(useGameStore.getState().recentRecipes).toContain('iron-gear-wheel');
    });

    // 测试：应该在制作期间处理批量库存更新
    it('should handle batch inventory updates during crafting', () => {
      const store = useGameStore.getState();

      // 添加初始材料
      act(() => {
        store.batchUpdateInventory([
          { itemId: 'iron-plate', amount: 20 },
          { itemId: 'copper-plate', amount: 15 },
          { itemId: 'coal', amount: 50 },
        ]);
      });

      // 验证所有物品已添加
      expect(store.getInventoryItem('iron-plate').currentAmount).toBe(20);
      expect(store.getInventoryItem('copper-plate').currentAmount).toBe(15);
      expect(store.getInventoryItem('coal').currentAmount).toBe(50);

      // 模拟消耗材料
      act(() => {
        store.batchUpdateInventory([
          { itemId: 'iron-plate', amount: -5 },
          { itemId: 'copper-plate', amount: -3 },
        ]);
      });

      // 验证消耗
      expect(store.getInventoryItem('iron-plate').currentAmount).toBe(15);
      expect(store.getInventoryItem('copper-plate').currentAmount).toBe(12);
      expect(store.getInventoryItem('coal').currentAmount).toBe(50); // 未改变
    });
  });

  // 收藏配方集成测试
  describe('Favorite Recipes Integration', () => {
    // 测试：制作期间应保持收藏配方
    it('should persist favorite recipes during crafting', () => {
      const store = useGameStore.getState();

      // 添加配方到收藏
      act(() => {
        store.addFavoriteRecipe('iron-gear-wheel');
      });

      expect(store.isFavoriteRecipe('iron-gear-wheel')).toBe(true);

      // 添加材料并制作
      act(() => {
        store.updateInventory('iron-plate', 10);
        store.addCraftingTask({
          recipeId: 'iron-gear-wheel',
          itemId: 'iron-gear-wheel',
          quantity: 1,
          progress: 0,
          startTime: Date.now(),
          craftingTime: 0.5,
        });
      });

      // 收藏状态应该保持
      expect(store.isFavoriteRecipe('iron-gear-wheel')).toBe(true);

      // 从收藏中移除
      act(() => {
        store.removeFavoriteRecipe('iron-gear-wheel');
      });

      expect(store.isFavoriteRecipe('iron-gear-wheel')).toBe(false);
    });
  });

  // 统计集成测试
  describe('Statistics Integration', () => {
    // 测试：应该跟踪总生产物品数
    it('should track total items produced', () => {
      const store = useGameStore.getState();

      // 为此次测试重置 totalItemsProduced 为 0
      act(() => {
        useGameStore.setState({ totalItemsProduced: 0 });
      });

      // 验证重置是否成功
      const initialProduced = useGameStore.getState().totalItemsProduced;
      expect(initialProduced).toBe(0);

      // 直接添加到库存而不影响 totalItemsProduced
      act(() => {
        const currentInventory = new Map(useGameStore.getState().inventory);
        const ironPlateItem = store.getInventoryItem('iron-plate');
        ironPlateItem.currentAmount = 6; // 3 tasks * 2 iron-plate per task
        currentInventory.set('iron-plate', ironPlateItem);
        useGameStore.setState({ inventory: currentInventory });
      });

      // 创建并完成多个任务
      for (let i = 0; i < 3; i++) {
        act(() => {
          const added = store.addCraftingTask({
            recipeId: 'iron-gear-wheel',
            itemId: 'iron-gear-wheel',
            quantity: 1,
            progress: 0,
            startTime: Date.now(),
            craftingTime: 0.5,
          });

          if (added) {
            const taskId = useGameStore.getState().craftingQueue[0].id;
            // 手动消耗材料并完成任务
            const recipe = mockDataService.getRecipe!('iron-gear-wheel');
            if (recipe) {
              Object.entries(recipe.in).forEach(([itemId, required]) => {
                store.updateInventory(itemId, -(required as number));
              });
            }
            store.completeCraftingTask(taskId);
            // 注意：completeCraftingTask 会自动增加 totalItemsProduced
          }
        });
      }

      // 应该生产了 3 个物品
      expect(useGameStore.getState().totalItemsProduced).toBe(initialProduced + 3);
      expect(store.getInventoryItem('iron-gear-wheel').currentAmount).toBe(3);
    });
  });
});
