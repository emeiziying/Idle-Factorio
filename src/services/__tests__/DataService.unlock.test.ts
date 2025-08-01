// DataService.unlock.test.ts - 专门测试物品解锁逻辑的修复
import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { DataService } from '@/services/core/DataService';
import { ServiceLocator, SERVICE_NAMES } from '@/services/core/ServiceLocator';
import type { TechnologyService } from '@/services/technology/TechnologyService';

// Mock ServiceLocator
vi.mock('@/services/core/ServiceLocator');
const mockServiceLocator = ServiceLocator as unknown as {
  has: MockedFunction<typeof ServiceLocator.has>;
  get: MockedFunction<typeof ServiceLocator.get>;
};

// Mock TechnologyService
const mockTechnologyService = {
  isItemUnlocked: vi.fn(),
  isRecipeUnlocked: vi.fn(),
  isServiceInitialized: vi.fn().mockReturnValue(true),
} as Partial<TechnologyService>;

describe('DataService isItemUnlockedInternal 逻辑修复测试', () => {
  let dataService: DataService;

  beforeEach(() => {
    vi.clearAllMocks();
    DataService.resetInstance();
    dataService = DataService.getInstance();
  });

  describe('TechnologyService 一致性修复', () => {
    it('应该在两个检查点使用相同的 techService 实例', async () => {
      // 设置 mock
      mockServiceLocator.has.mockReturnValue(true);
      mockServiceLocator.get.mockReturnValue(mockTechnologyService as TechnologyService);
      mockTechnologyService.isItemUnlocked = vi.fn().mockReturnValue(true);

      // 加载测试数据
      await dataService.loadGameData();

      // 测试一个存在的物品
      const result = dataService.isItemUnlocked('iron-ore');

      // 验证 TechnologyService 被正确调用
      expect(mockServiceLocator.has).toHaveBeenCalledWith(SERVICE_NAMES.TECHNOLOGY);
      expect(mockServiceLocator.get).toHaveBeenCalledWith(SERVICE_NAMES.TECHNOLOGY);
      expect(mockTechnologyService.isItemUnlocked).toHaveBeenCalledWith('iron-ore');
      expect(result).toBe(true);
    });

    it('应该正确处理 TechnologyService 不存在的情况', async () => {
      // 设置 TechnologyService 不存在
      mockServiceLocator.has.mockReturnValue(false);

      await dataService.loadGameData();

      // 测试原材料（无配方的物品）
      const result = dataService.isItemUnlocked('iron-ore');

      // 应该返回 true（原材料默认可用）
      expect(result).toBe(true);
      expect(mockTechnologyService.isItemUnlocked).not.toHaveBeenCalled();
    });

    it('应该正确处理 TechnologyService 存在但没有 isItemUnlocked 方法的情况', async () => {
      // 设置 TechnologyService 存在但没有 isItemUnlocked 方法
      mockServiceLocator.has.mockReturnValue(true);
      const limitedTechService = {
        isRecipeUnlocked: vi.fn().mockReturnValue(false),
        isServiceInitialized: vi.fn().mockReturnValue(true),
      } as Partial<TechnologyService>;
      mockServiceLocator.get.mockReturnValue(limitedTechService as TechnologyService);

      await dataService.loadGameData();

      // 测试应该回退到原材料逻辑
      const result = dataService.isItemUnlocked('iron-ore');

      expect(result).toBe(true); // 原材料应该可用
    });

    it('应该正确处理 TechnologyService 存在但未初始化的情况', async () => {
      // 设置 TechnologyService 存在但未初始化
      mockServiceLocator.has.mockReturnValue(true);
      const uninitializedTechService = {
        isItemUnlocked: vi.fn().mockReturnValue(false),
        isRecipeUnlocked: vi.fn().mockReturnValue(false),
        isServiceInitialized: vi.fn().mockReturnValue(false), // 未初始化
      } as Partial<TechnologyService>;
      mockServiceLocator.get.mockReturnValue(uninitializedTechService as TechnologyService);

      await dataService.loadGameData();

      // 测试应该回退到原材料逻辑，不调用未初始化的服务
      const result = dataService.isItemUnlocked('iron-ore');

      expect(result).toBe(true); // 原材料应该可用
      expect(uninitializedTechService.isItemUnlocked).not.toHaveBeenCalled();
    });
  });

  describe('原材料检查修复', () => {
    it('无配方物品应该检查科技要求', async () => {
      mockServiceLocator.has.mockReturnValue(true);
      mockServiceLocator.get.mockReturnValue(mockTechnologyService as TechnologyService);
      mockTechnologyService.isItemUnlocked = vi.fn().mockReturnValue(false);

      await dataService.loadGameData();

      const result = dataService.isItemUnlocked('iron-ore');

      // 应该调用科技服务检查
      expect(mockTechnologyService.isItemUnlocked).toHaveBeenCalledWith('iron-ore');
      expect(result).toBe(false);
    });

    it('在没有科技服务时，原材料应该默认可用', async () => {
      mockServiceLocator.has.mockReturnValue(false);

      await dataService.loadGameData();

      const result = dataService.isItemUnlocked('iron-ore');

      expect(result).toBe(true);
    });
  });

  describe('缓存机制测试', () => {
    it('应该正确缓存解锁状态', async () => {
      mockServiceLocator.has.mockReturnValue(true);
      mockServiceLocator.get.mockReturnValue(mockTechnologyService as TechnologyService);
      mockTechnologyService.isItemUnlocked = vi.fn().mockReturnValue(true);

      await dataService.loadGameData();

      // 第一次调用
      const result1 = dataService.isItemUnlocked('iron-ore');
      // 第二次调用
      const result2 = dataService.isItemUnlocked('iron-ore');

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      // 科技服务应该只被调用一次（第二次从缓存获取）
      expect(mockTechnologyService.isItemUnlocked).toHaveBeenCalledTimes(1);
    });

    it('清理缓存后应该重新检查', async () => {
      mockServiceLocator.has.mockReturnValue(true);
      mockServiceLocator.get.mockReturnValue(mockTechnologyService as TechnologyService);
      mockTechnologyService.isItemUnlocked = vi.fn().mockReturnValue(true);

      await dataService.loadGameData();

      // 第一次调用
      dataService.isItemUnlocked('iron-ore');

      // 清理缓存
      dataService.clearUnlockCache();

      // 第二次调用
      dataService.isItemUnlocked('iron-ore');

      // 应该调用两次
      expect(mockTechnologyService.isItemUnlocked).toHaveBeenCalledTimes(2);
    });
  });
});
