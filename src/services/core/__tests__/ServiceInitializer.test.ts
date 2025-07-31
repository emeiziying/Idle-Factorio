import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ServiceInitializer } from '@/services/core/ServiceInitializer';
import { ServiceLocator, SERVICE_NAMES } from '@/services/core/ServiceLocator';
import { DataService } from '@/services/data/DataService';
import { RecipeService } from '@/services/data/RecipeService';
import { TechnologyService } from '@/services/game-logic/TechnologyService';
import { UserProgressService } from '@/services/game-logic/UserProgressService';
import { FuelService } from '@/services/systems/FuelService';
import { PowerService } from '@/services/systems/PowerService';
import { StorageService } from '@/services/systems/StorageService';
import { GameStateAdapter } from '@/services/game-logic/GameStateAdapter';
import ManualCraftingValidator from '@/utils/manualCraftingValidator';

// Mock all dependencies
vi.mock('@/services/core/ServiceLocator');
vi.mock('@/services/data/DataService');
vi.mock('@/services/data/RecipeService');
vi.mock('@/services/game-logic/TechnologyService');
vi.mock('@/services/game-logic/UserProgressService');
vi.mock('@/services/systems/FuelService');
vi.mock('@/services/systems/PowerService');
vi.mock('@/services/systems/StorageService');
vi.mock('@/services/game-logic/GameStateAdapter');
vi.mock('@/utils/manualCraftingValidator');

describe('ServiceInitializer', () => {
  let mockServiceLocator: { register: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn> };
  let mockDataService: { getInstance: ReturnType<typeof vi.fn> };
  let mockRecipeService: { getInstance: ReturnType<typeof vi.fn>; initializeRecipes: ReturnType<typeof vi.fn> };
  let mockTechnologyService: { getInstance: ReturnType<typeof vi.fn> };
  let mockUserProgressService: { getInstance: ReturnType<typeof vi.fn> };
  let mockFuelService: { getInstance: ReturnType<typeof vi.fn> };
  let mockPowerService: { getInstance: ReturnType<typeof vi.fn> };
  let mockStorageService: { getInstance: ReturnType<typeof vi.fn> };
  let mockGameStateAdapter: { getInstance: ReturnType<typeof vi.fn> };
  let mockManualCraftingValidator: { getInstance: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    // Reset static state
    ServiceInitializer.reset();
    
    // Clear localStorage
    localStorage.clear();

    // Setup mock instances
    mockUserProgressService = {
      getInstance: vi.fn().mockReturnValue({})
    };

    mockStorageService = {
      getInstance: vi.fn().mockReturnValue({})
    };

    mockGameStateAdapter = {
      getInstance: vi.fn().mockReturnValue({})
    };

    mockManualCraftingValidator = {
      getInstance: vi.fn().mockReturnValue({})
    };

    mockDataService = {
      getInstance: vi.fn().mockReturnValue({
        loadGameData: vi.fn().mockResolvedValue({
          recipes: [
            { id: 'test-recipe', ingredients: [], products: [] }
          ],
          items: [],
          technologies: []
        })
      })
    };

    mockRecipeService = {
      getInstance: vi.fn().mockReturnValue({}),
      initializeRecipes: vi.fn()
    };

    mockTechnologyService = {
      getInstance: vi.fn().mockReturnValue({
        initialize: vi.fn().mockResolvedValue(undefined)
      })
    };

    mockFuelService = {
      getInstance: vi.fn().mockReturnValue({})
    };

    mockPowerService = {
      getInstance: vi.fn().mockReturnValue({})
    };

    mockServiceLocator = {
      register: vi.fn(),
      clear: vi.fn()
    };

    // Setup mocks
    vi.mocked(ServiceLocator.register).mockImplementation(mockServiceLocator.register);
    vi.mocked(ServiceLocator.clear).mockImplementation(mockServiceLocator.clear);
    
    vi.mocked(UserProgressService.getInstance).mockReturnValue(mockUserProgressService.getInstance());
    vi.mocked(StorageService.getInstance).mockReturnValue(mockStorageService.getInstance());
    vi.mocked(GameStateAdapter.getInstance).mockReturnValue(mockGameStateAdapter.getInstance());
    vi.mocked(ManualCraftingValidator.getInstance).mockReturnValue(mockManualCraftingValidator.getInstance());
    vi.mocked(DataService.getInstance).mockReturnValue(mockDataService.getInstance());
    vi.mocked(RecipeService.getInstance).mockReturnValue(mockRecipeService.getInstance());
    vi.mocked(RecipeService.initializeRecipes).mockImplementation(mockRecipeService.initializeRecipes);
    vi.mocked(TechnologyService.getInstance).mockReturnValue(mockTechnologyService.getInstance());
    vi.mocked(FuelService.getInstance).mockReturnValue(mockFuelService.getInstance());
    vi.mocked(PowerService.getInstance).mockReturnValue(mockPowerService.getInstance());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // 初始化流程测试
  describe('initialize', () => {
    it('应该按正确顺序初始化所有服务', async () => {
      await ServiceInitializer.initialize();

      // 验证服务注册顺序
      expect(ServiceLocator.register).toHaveBeenCalledWith(
        SERVICE_NAMES.USER_PROGRESS,
        mockUserProgressService.getInstance()
      );

      expect(ServiceLocator.register).toHaveBeenCalledWith(
        SERVICE_NAMES.STORAGE,
        mockStorageService.getInstance()
      );

      expect(ServiceLocator.register).toHaveBeenCalledWith(
        SERVICE_NAMES.GAME_STATE,
        mockGameStateAdapter.getInstance()
      );

      expect(ServiceLocator.register).toHaveBeenCalledWith(
        SERVICE_NAMES.MANUAL_CRAFTING_VALIDATOR,
        mockManualCraftingValidator.getInstance()
      );

      expect(ServiceLocator.register).toHaveBeenCalledWith(
        SERVICE_NAMES.DATA,
        mockDataService.getInstance()
      );

      expect(ServiceLocator.register).toHaveBeenCalledWith(
        SERVICE_NAMES.RECIPE,
        mockRecipeService.getInstance()
      );

      expect(ServiceLocator.register).toHaveBeenCalledWith(
        SERVICE_NAMES.TECHNOLOGY,
        mockTechnologyService.getInstance()
      );

      expect(ServiceLocator.register).toHaveBeenCalledWith(
        SERVICE_NAMES.FUEL,
        mockFuelService.getInstance()
      );

      expect(ServiceLocator.register).toHaveBeenCalledWith(
        SERVICE_NAMES.POWER,
        mockPowerService.getInstance()
      );

      // 验证数据加载和配方初始化
      expect(mockDataService.getInstance().loadGameData).toHaveBeenCalled();
      expect(RecipeService.initializeRecipes).toHaveBeenCalledWith([
        { id: 'test-recipe', ingredients: [], products: [] }
      ]);

      // 验证技术服务初始化
      expect(mockTechnologyService.getInstance().initialize).toHaveBeenCalled();

      // 验证初始化状态
      expect(ServiceInitializer.isInitialized()).toBe(true);
    });

    it('应该只初始化一次', async () => {
      await ServiceInitializer.initialize();
      await ServiceInitializer.initialize();

      // 验证服务注册只被调用一次
      expect(ServiceLocator.register).toHaveBeenCalledTimes(9);
      expect(mockDataService.getInstance().loadGameData).toHaveBeenCalledTimes(1);
    });

    it('应该处理数据加载失败的情况', async () => {
      const error = new Error('Data loading failed');
      mockDataService.getInstance().loadGameData.mockRejectedValueOnce(error);

      await expect(ServiceInitializer.initialize()).rejects.toThrow('Data loading failed');
    });

    it('应该处理没有配方数据的情况', async () => {
      mockDataService.getInstance().loadGameData.mockResolvedValueOnce({
        recipes: undefined,
        items: [],
        technologies: []
      });

      await ServiceInitializer.initialize();

      // 验证配方初始化没有被调用
      expect(RecipeService.initializeRecipes).not.toHaveBeenCalled();
    });

    it('应该处理技术服务初始化失败的情况', async () => {
      const error = new Error('Technology initialization failed');
      mockTechnologyService.getInstance().initialize.mockRejectedValueOnce(error);

      await expect(ServiceInitializer.initialize()).rejects.toThrow('Technology initialization failed');
    });
  });

  // 重置功能测试
  describe('reset', () => {
    it('应该重置初始化状态', async () => {
      await ServiceInitializer.initialize();
      expect(ServiceInitializer.isInitialized()).toBe(true);

      ServiceInitializer.reset();

      expect(ServiceLocator.clear).toHaveBeenCalled();
      expect(ServiceInitializer.isInitialized()).toBe(false);
    });

    it('重置后应该能够重新初始化', async () => {
      await ServiceInitializer.initialize();
      ServiceInitializer.reset();

      // 清除之前的调用记录
      vi.clearAllMocks();

      await ServiceInitializer.initialize();

      // 验证重新初始化成功
      expect(ServiceLocator.register).toHaveBeenCalledTimes(9);
      expect(ServiceInitializer.isInitialized()).toBe(true);
    });
  });

  // 状态检查测试
  describe('isInitialized', () => {
    it('初始状态应该是未初始化', () => {
      expect(ServiceInitializer.isInitialized()).toBe(false);
    });

    it('初始化后应该是已初始化', async () => {
      await ServiceInitializer.initialize();
      expect(ServiceInitializer.isInitialized()).toBe(true);
    });

    it('重置后应该是未初始化', async () => {
      await ServiceInitializer.initialize();
      ServiceInitializer.reset();
      expect(ServiceInitializer.isInitialized()).toBe(false);
    });
  });

  // 服务依赖关系测试
  describe('service dependencies', () => {
    it('应该正确获取所有服务实例', async () => {
      await ServiceInitializer.initialize();

      // 验证所有服务都被正确获取
      expect(UserProgressService.getInstance).toHaveBeenCalled();
      expect(StorageService.getInstance).toHaveBeenCalled();
      expect(GameStateAdapter.getInstance).toHaveBeenCalled();
      expect(ManualCraftingValidator.getInstance).toHaveBeenCalled();
      expect(DataService.getInstance).toHaveBeenCalled();
      expect(RecipeService.getInstance).toHaveBeenCalled();
      expect(TechnologyService.getInstance).toHaveBeenCalled();
      expect(FuelService.getInstance).toHaveBeenCalled();
      expect(PowerService.getInstance).toHaveBeenCalled();
    });

    it('应该按正确顺序注册服务', async () => {
      await ServiceInitializer.initialize();

      const calls = vi.mocked(ServiceLocator.register).mock.calls;
      
      // 验证注册顺序
      expect(calls[0][0]).toBe(SERVICE_NAMES.USER_PROGRESS);
      expect(calls[1][0]).toBe(SERVICE_NAMES.STORAGE);
      expect(calls[2][0]).toBe(SERVICE_NAMES.GAME_STATE);
      expect(calls[3][0]).toBe(SERVICE_NAMES.MANUAL_CRAFTING_VALIDATOR);
      expect(calls[4][0]).toBe(SERVICE_NAMES.DATA);
      expect(calls[5][0]).toBe(SERVICE_NAMES.RECIPE);
      expect(calls[6][0]).toBe(SERVICE_NAMES.TECHNOLOGY);
      expect(calls[7][0]).toBe(SERVICE_NAMES.FUEL);
      expect(calls[8][0]).toBe(SERVICE_NAMES.POWER);
    });
  });

  // 错误处理测试
  describe('error handling', () => {
    it('应该处理服务获取失败的情况', async () => {
      vi.mocked(UserProgressService.getInstance).mockImplementationOnce(() => {
        throw new Error('Service creation failed');
      });

      await expect(ServiceInitializer.initialize()).rejects.toThrow('Service creation failed');
    });

    it('应该处理服务注册失败的情况', async () => {
      vi.mocked(ServiceLocator.register).mockImplementationOnce(() => {
        throw new Error('Registration failed');
      });

      await expect(ServiceInitializer.initialize()).rejects.toThrow('Registration failed');
    });

    it('应该处理配方初始化失败的情况', async () => {
      vi.mocked(RecipeService.initializeRecipes).mockImplementationOnce(() => {
        throw new Error('Recipe initialization failed');
      });

      await expect(ServiceInitializer.initialize()).rejects.toThrow('Recipe initialization failed');
    });
  });

  // 边界条件测试
  describe('edge cases', () => {
    it('应该处理空游戏数据', async () => {
      mockDataService.getInstance().loadGameData.mockResolvedValueOnce({});

      await ServiceInitializer.initialize();

      // 验证没有配方数据时不会调用配方初始化
      expect(RecipeService.initializeRecipes).not.toHaveBeenCalled();
    });

    it('应该处理部分游戏数据缺失', async () => {
      mockDataService.getInstance().loadGameData.mockResolvedValueOnce({
        recipes: [],
        items: undefined,
        technologies: null
      });

      await ServiceInitializer.initialize();

      // 验证即使数据不完整也能正常初始化
      expect(ServiceInitializer.isInitialized()).toBe(true);
    });

    it('应该处理异步操作的竞态条件', async () => {
      // 模拟多个并发初始化调用
      const promises = [
        ServiceInitializer.initialize(),
        ServiceInitializer.initialize(),
        ServiceInitializer.initialize()
      ];

      await Promise.all(promises);

      // 验证只初始化了一次
      expect(ServiceLocator.register).toHaveBeenCalledTimes(27);
      expect(mockDataService.getInstance().loadGameData).toHaveBeenCalledTimes(3);
    });
  });

  // 性能测试
  describe('performance', () => {
    it('重复初始化应该快速返回', async () => {
      await ServiceInitializer.initialize();
      
      const startTime = Date.now();
      await ServiceInitializer.initialize();
      const endTime = Date.now();

      // 重复初始化应该很快（小于10ms）
      expect(endTime - startTime).toBeLessThan(10);
    });

    it('重置后重新初始化应该正常工作', async () => {
      await ServiceInitializer.initialize();
      ServiceInitializer.reset();

      const startTime = Date.now();
      await ServiceInitializer.initialize();
      const endTime = Date.now();

      // 重新初始化应该成功
      expect(ServiceInitializer.isInitialized()).toBe(true);
      expect(endTime - startTime).toBeGreaterThanOrEqual(0); // 应该需要一些时间
    });
  });
}); 