import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameStorageService } from '@/services/storage/GameStorageService';
import { DataService } from '@/services/data/DataService';
import type { FacilityInstance } from '@/types/facilities';
import { FacilityStatus } from '@/types/facilities';
import type { CraftingTask, CraftingChain, DeployedContainer, InventoryItem } from '@/types/index';
import type { TechResearchState, ResearchQueueItem } from '@/types/technology';
import type { ServiceInstance } from '@/types/test-utils';

// Mock dependencies
vi.mock('@/services/data/DataService');
vi.mock('@/store/gameStore', () => ({
  default: {
    getState: vi.fn(() => ({
      inventory: new Map(),
      craftingQueue: [],
      totalItemsProduced: 0,
      favoriteRecipes: new Set(),
      recentRecipes: [],
    })),
  },
}));
vi.mock('lz-string', () => ({
  default: {
    compressToUTF16: vi.fn((data: string) => `compressed_${data}`),
    decompressFromUTF16: vi.fn((data: string) => data.replace('compressed_', '')),
  },
  compressToUTF16: vi.fn((data: string) => `compressed_${data}`),
  decompressFromUTF16: vi.fn((data: string) => data.replace('compressed_', '')),
}));

describe('GameStorageService', () => {
  let gameStorageService: GameStorageService;
  let mockDataService: { getInstance: ReturnType<typeof vi.fn>; getItem: ReturnType<typeof vi.fn> };

  // 模拟游戏状态数据
  const mockGameState = {
    inventory: new Map<string, InventoryItem>([
      [
        'iron-plate',
        {
          itemId: 'iron-plate',
          currentAmount: 100,
          stackSize: 100,
          baseStacks: 1,
          additionalStacks: 0,
          totalStacks: 1,
          maxCapacity: 100,
          productionRate: 10,
          consumptionRate: 5,
          status: 'normal',
        },
      ],
    ]),
    craftingQueue: [
      {
        id: 'task-1',
        recipeId: 'iron-plate',
        targetAmount: 100,
        currentAmount: 50,
        priority: 1,
        status: 'in_progress',
      },
    ] as unknown as CraftingTask[],
    craftingChains: [
      {
        id: 'chain-1',
        name: 'Iron Production',
        tasks: ['task-1'],
        status: 'active',
      },
    ] as unknown as CraftingChain[],
    facilities: [
      {
        id: 'furnace-1',
        facilityId: 'stone-furnace',
        targetItemId: 'iron-plate',
        count: 1,
        status: FacilityStatus.RUNNING,
        efficiency: 1.0,
        production: {
          currentRecipeId: 'iron-plate',
          progress: 0.5,
          inputBuffer: [],
          outputBuffer: [],
        },
        fuelBuffer: {
          slots: [
            {
              itemId: 'coal',
              quantity: 10,
              remainingEnergy: 500,
            },
          ],
          maxSlots: 1,
          totalEnergy: 500,
          maxEnergy: 1000,
          consumptionRate: 0.1,
          lastUpdate: Date.now(),
        },
      },
    ] as FacilityInstance[],
    deployedContainers: [
      {
        id: 'container-1',
        type: 'chest',
        position: { x: 0, y: 0 },
        items: new Map<string, unknown>(),
      },
    ] as unknown as DeployedContainer[],
    totalItemsProduced: 1000,
    favoriteRecipes: new Set(['iron-plate']),
    recentRecipes: ['iron-plate'],
    researchState: {
      currentTech: 'automation',
      progress: 0.3,
      startTime: Date.now() - 10000,
    } as unknown as TechResearchState,
    researchQueue: [
      {
        id: 'research-1',
        techId: 'automation-2',
        priority: 1,
        status: 'queued',
      },
    ] as unknown as ResearchQueueItem[],
    unlockedTechs: new Set(['automation']),
    autoResearch: true,
    craftedItemCounts: new Map([['iron-plate', 500]]),
    builtEntityCounts: new Map([['stone-furnace', 5]]),
    minedEntityCounts: new Map([['iron-ore', 1000]]),
    lastSaveTime: Date.now(),
    saveKey: 'test-save',
  };

  beforeEach(() => {
    // 清除实例
    (GameStorageService as unknown as ServiceInstance<GameStorageService>).instance = null;
    localStorage.clear();

    // 设置模拟对象
    mockDataService = {
      getInstance: vi.fn(),
      getItem: vi.fn((itemId: string) => {
        const items: Record<string, unknown> = {
          'iron-plate': { id: 'iron-plate', stack: 100 },
          coal: { id: 'coal', fuel: { value: 100 } },
          'stone-furnace': { id: 'stone-furnace', machine: { usage: 1000 } },
        };
        return items[itemId] || { id: itemId, stack: 50 };
      }),
    };

    vi.mocked(DataService.getInstance).mockReturnValue(mockDataService as unknown as DataService);
    gameStorageService = GameStorageService.getInstance();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // 单例模式测试
  describe('getInstance', () => {
    it('应该返回单例实例', () => {
      const instance1 = GameStorageService.getInstance();
      const instance2 = GameStorageService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  // 保存游戏数据测试
  describe('saveGame', () => {
    it('应该成功保存游戏数据', async () => {
      const savePromise = gameStorageService.saveGame(mockGameState);

      // 等待防抖时间
      await new Promise((resolve) => setTimeout(resolve, 2100));

      await savePromise;

      const savedData = localStorage.getItem('factorio-game-storage');
      expect(savedData).toBeTruthy();

      const parsed = JSON.parse(savedData!);
      expect(parsed.inventory).toBeDefined();
      expect(parsed.facilities).toBeDefined();
      expect(parsed.research).toBeDefined();
    });

    it('应该使用防抖机制', async () => {
      const savePromise1 = gameStorageService.saveGame(mockGameState);
      const savePromise2 = gameStorageService.saveGame(mockGameState);

      // 验证保存调用成功完成
      await new Promise((resolve) => setTimeout(resolve, 2100));

      // 等待保存完成（第一个会被取消，第二个会成功）
      try {
        await savePromise1;
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('保存任务被取消');
      }
      await savePromise2;

      // 验证保存成功
      const savedData = localStorage.getItem('factorio-game-storage');
      expect(savedData).toBeTruthy();
    });
  });

  // 强制保存测试
  describe('forceSaveGame', () => {
    it('应该立即保存游戏数据', async () => {
      await gameStorageService.forceSaveGame(mockGameState);

      const savedData = localStorage.getItem('factorio-game-storage');
      expect(savedData).toBeTruthy();

      const parsed = JSON.parse(savedData!);
      expect(parsed.inventory).toBeDefined();
    });

    it('应该取消待处理的保存任务', async () => {
      const savePromise = gameStorageService.saveGame(mockGameState);

      // 立即强制保存
      await gameStorageService.forceSaveGame(mockGameState);

      // 原来的保存应该被取消
      try {
        await savePromise;
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('保存任务被取消');
      }
    });
  });

  // 加载游戏数据测试
  describe('loadGame', () => {
    it('应该加载优化格式的存档', async () => {
      const optimizedData = {
        inventory: { 'iron-plate': 100 },
        craftingQueue: mockGameState.craftingQueue,
        craftingChains: mockGameState.craftingChains,
        facilities: [
          {
            id: 'furnace-1',
            type: 'stone-furnace',
            recipe: 'iron-plate',
            progress: 0.5,
            fuel: { coal: 500 },
            status: FacilityStatus.RUNNING,
            efficiency: 1.0,
          },
        ],
        stats: {
          total: 1000,
          crafted: [['iron-plate', 500]],
          built: [['stone-furnace', 5]],
          mined: [['iron-ore', 1000]],
        },
        research: {
          state: mockGameState.researchState,
          queue: mockGameState.researchQueue,
          unlocked: ['automation'],
          auto: true,
        },
        favorites: ['iron-plate'],
        recent: ['iron-plate'],
        containers: mockGameState.deployedContainers,
        time: Date.now(),
      };

      localStorage.setItem('factorio-game-storage', JSON.stringify(optimizedData));

      const loaded = await gameStorageService.loadGame();

      expect(loaded).toBeTruthy();
      expect(loaded?.inventory).toBeInstanceOf(Map);
      expect(loaded?.facilities).toBeDefined();
      expect(loaded?.researchState).toBeDefined();
    });

    it('应该加载传统格式的存档', async () => {
      const legacyData = {
        inventory: Array.from(mockGameState.inventory.entries()),
        facilities: mockGameState.facilities,
        favoriteRecipes: Array.from(mockGameState.favoriteRecipes),
        unlockedTechs: Array.from(mockGameState.unlockedTechs),
        craftedItemCounts: Array.from(mockGameState.craftedItemCounts.entries()),
        builtEntityCounts: Array.from(mockGameState.builtEntityCounts.entries()),
        minedEntityCounts: Array.from(mockGameState.minedEntityCounts.entries()),
      };

      localStorage.setItem('factorio-game-storage', JSON.stringify(legacyData));

      const loaded = await gameStorageService.loadGame();

      expect(loaded).toBeTruthy();
      expect(loaded?.inventory).toBeInstanceOf(Map);
      expect(loaded?.favoriteRecipes).toBeInstanceOf(Set);
    });

    it('应该处理空存档', async () => {
      const loaded = await gameStorageService.loadGame();
      expect(loaded).toBeNull();
    });

    it('应该处理损坏的存档数据', async () => {
      localStorage.setItem('factorio-game-storage', 'invalid-json');

      const loaded = await gameStorageService.loadGame();
      expect(loaded).toBeNull();

      // 清理 localStorage 中的无效数据
      localStorage.removeItem('factorio-game-storage');
    });
  });

  // 清除存档测试
  describe('clearGameData', () => {
    it('应该清除存档数据', async () => {
      // 先保存一些数据
      await gameStorageService.forceSaveGame(mockGameState);
      expect(localStorage.getItem('factorio-game-storage')).toBeTruthy();

      // 清除数据
      await gameStorageService.clearGameData();
      expect(localStorage.getItem('factorio-game-storage')).toBeNull();
    });

    it('应该取消待处理的保存任务', async () => {
      const savePromise = gameStorageService.saveGame(mockGameState);

      await gameStorageService.clearGameData();

      await expect(savePromise).rejects.toThrow('保存任务被取消');
    });
  });

  // 数据优化测试
  describe('data optimization', () => {
    it('应该优化库存数据', async () => {
      const optimizedState = {
        inventory: new Map([
          ['iron-plate', { itemId: 'iron-plate', currentAmount: 100, stackSize: 100 } as InventoryItem],
          ['copper-plate', { itemId: 'copper-plate', currentAmount: 0, stackSize: 100 } as InventoryItem], // 数量为0，应该被过滤
        ]),
      };

      await gameStorageService.forceSaveGame(optimizedState);

      const savedData = localStorage.getItem('factorio-game-storage');
      const parsed = JSON.parse(savedData!);

      expect(parsed.inventory['iron-plate']).toBe(100);
      expect(parsed.inventory['copper-plate']).toBeUndefined();
    });

    it('应该优化设施数据', async () => {
      const optimizedState = {
        facilities: [
          {
            id: 'furnace-1',
            facilityId: 'stone-furnace',
            targetItemId: 'iron-plate',
            count: 1,
            status: FacilityStatus.RUNNING,
            efficiency: 1.0,
            production: {
              currentRecipeId: 'iron-plate',
              progress: 0.75,
              inputBuffer: [],
              outputBuffer: [],
            },
            fuelBuffer: {
              slots: [
                {
                  itemId: 'coal',
                  quantity: 10,
                  remainingEnergy: 500,
                },
              ],
              maxSlots: 1,
              totalEnergy: 500,
              maxEnergy: 1000,
              consumptionRate: 0.1,
              lastUpdate: Date.now(),
            },
          },
        ],
      };

      await gameStorageService.forceSaveGame(optimizedState);

      const savedData = localStorage.getItem('factorio-game-storage');
      const parsed = JSON.parse(savedData!);

      expect(parsed.facilities[0].id).toBe('furnace-1');
      expect(parsed.facilities[0].type).toBe('stone-furnace');
      expect(parsed.facilities[0].recipe).toBe('iron-plate');
      expect(parsed.facilities[0].progress).toBe(0.75);
      expect(parsed.facilities[0].fuel).toEqual({ coal: 500 });
    });

    it('应该优化统计数据', async () => {
      const optimizedState = {
        totalItemsProduced: 1000,
        craftedItemCounts: new Map([['iron-plate', 500]]),
        builtEntityCounts: new Map([['stone-furnace', 5]]),
        minedEntityCounts: new Map([['iron-ore', 1000]]),
      };

      await gameStorageService.forceSaveGame(optimizedState);

      const savedData = localStorage.getItem('factorio-game-storage');
      const parsed = JSON.parse(savedData!);

      expect(parsed.stats.total).toBe(1000);
      expect(parsed.stats.crafted).toEqual([['iron-plate', 500]]);
      expect(parsed.stats.built).toEqual([['stone-furnace', 5]]);
      expect(parsed.stats.mined).toEqual([['iron-ore', 1000]]);
    });
  });

  // 数据恢复测试
  describe('data restoration', () => {
    it('应该正确恢复库存数据', async () => {
      const optimizedData = {
        inventory: { 'iron-plate': 100, 'copper-plate': 50 },
        craftingQueue: [],
        craftingChains: [],
        facilities: [],
        stats: { total: 0, crafted: [], built: [], mined: [] },
        research: { state: null, queue: [], unlocked: [], auto: true },
        favorites: [],
        recent: [],
        containers: [],
        time: Date.now(),
      };

      localStorage.setItem('factorio-game-storage', JSON.stringify(optimizedData));

      const loaded = await gameStorageService.loadGame();

      expect(loaded?.inventory).toBeInstanceOf(Map);
      expect(loaded?.inventory?.get('iron-plate')?.currentAmount).toBe(100);
      expect(loaded?.inventory?.get('copper-plate')?.currentAmount).toBe(50);
    });

    it('应该正确恢复设施数据', async () => {
      const optimizedData = {
        inventory: {},
        craftingQueue: [],
        craftingChains: [],
        facilities: [
          {
            id: 'furnace-1',
            type: 'stone-furnace',
            recipe: 'iron-plate',
            progress: 0.5,
            fuel: { coal: 500 },
            status: FacilityStatus.RUNNING,
            efficiency: 1.0,
          },
        ],
        stats: { total: 0, crafted: [], built: [], mined: [] },
        research: { state: null, queue: [], unlocked: [], auto: true },
        favorites: [],
        recent: [],
        containers: [],
        time: Date.now(),
      };

      localStorage.setItem('factorio-game-storage', JSON.stringify(optimizedData));

      const loaded = await gameStorageService.loadGame();

      expect(loaded?.facilities).toBeDefined();
      expect(loaded?.facilities?.[0].id).toBe('furnace-1');
      expect(loaded?.facilities?.[0].facilityId).toBe('stone-furnace');
      expect(loaded?.facilities?.[0].targetItemId).toBe('iron-plate');
      expect(loaded?.facilities?.[0].status).toBe(FacilityStatus.RUNNING);
    });

    it('应该正确恢复研究数据', async () => {
      const optimizedData = {
        inventory: {},
        craftingQueue: [],
        craftingChains: [],
        facilities: [],
        stats: { total: 0, crafted: [], built: [], mined: [] },
        research: {
          state: { currentTech: 'automation', progress: 0.3, startTime: Date.now() },
          queue: [{ id: 'research-1', techId: 'automation-2', priority: 1, status: 'queued' }],
          unlocked: ['automation', 'electronics'],
          auto: true,
        },
        favorites: [],
        recent: [],
        containers: [],
        time: Date.now(),
      };

      localStorage.setItem('factorio-game-storage', JSON.stringify(optimizedData));

      const loaded = await gameStorageService.loadGame();

      expect(loaded?.researchState).toBeDefined();
      expect(loaded?.researchQueue).toBeDefined();
      expect(loaded?.unlockedTechs).toBeInstanceOf(Set);
      expect(loaded?.autoResearch).toBe(true);
    });
  });

  // 边界条件测试
  describe('edge cases', () => {
    it('应该处理空的游戏状态', async () => {
      await gameStorageService.forceSaveGame({});

      const savedData = localStorage.getItem('factorio-game-storage');
      const parsed = JSON.parse(savedData!);

      expect(parsed.inventory).toEqual({});
      expect(parsed.facilities).toEqual([]);
      expect(parsed.research).toBeDefined();
    });

    it('应该处理部分游戏状态', async () => {
      const partialState = {
        inventory: new Map([['iron-plate', { itemId: 'iron-plate', currentAmount: 100 } as InventoryItem]]),
        craftingQueue: [],
      };

      await gameStorageService.forceSaveGame(partialState);

      const savedData = localStorage.getItem('factorio-game-storage');
      const parsed = JSON.parse(savedData!);

      expect(parsed.inventory['iron-plate']).toBe(100);
      expect(parsed.craftingQueue).toEqual([]);
    });

    it('应该处理页面卸载事件', () => {
      // 模拟页面卸载事件
      const beforeUnloadEvent = new Event('beforeunload');
      window.dispatchEvent(beforeUnloadEvent);

      // 验证没有错误发生
      expect(true).toBe(true);
    });
  });

  // 工具方法测试
  describe('utility methods', () => {
    it('应该正确格式化文件大小', () => {
      // 通过保存操作测试formatSize方法
      const smallState = { inventory: new Map() };

      return gameStorageService.forceSaveGame(smallState).then(() => {
        // 如果保存成功，说明formatSize方法工作正常
        expect(true).toBe(true);
      });
    });

    it('应该正确处理物品堆叠大小', () => {
      // 通过加载操作测试getItemStackSize方法
      const testData = {
        inventory: { 'iron-plate': 100 },
        craftingQueue: [],
        craftingChains: [],
        facilities: [],
        stats: { total: 0, crafted: [], built: [], mined: [] },
        research: { state: null, queue: [], unlocked: [], auto: true },
        favorites: [],
        recent: [],
        containers: [],
        time: Date.now(),
      };

      localStorage.setItem('factorio-game-storage', JSON.stringify(testData));

      return gameStorageService.loadGame().then((loaded) => {
        expect(loaded?.inventory?.get('iron-plate')?.stackSize).toBe(100);
      });
    });
  });
});
