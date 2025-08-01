import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StorageService } from '../StorageService';
import { ServiceLocator } from '../ServiceLocator';
import type { DataService } from '../DataService';
import type { Item, Recipe } from '../../types';

// 模拟存储设备的特定配置
vi.mock('../../data/storageConfigData', () => ({
  STORAGE_SPECIFIC_CONFIGS: {
    'wooden-chest': {
      category: 'solid',
      additionalStacks: 10,
      description: 'Basic wooden storage',
      dimensions: { width: 4, height: 4 },
      requiredTechnology: 'wood-processing',
    },
    'iron-chest': {
      category: 'solid',
      additionalStacks: 20,
      description: 'Improved iron storage',
      dimensions: { width: 6, height: 4 },
      requiredTechnology: 'metal-processing',
    },
    'storage-tank': {
      category: 'liquid',
      fluidCapacity: 25000,
      description: 'Basic liquid storage',
      dimensions: { width: 3, height: 3 },
      requiredTechnology: 'fluid-handling',
    },
    'fluid-tank': {
      category: 'liquid',
      fluidCapacity: 50000,
      description: 'Advanced liquid storage',
      dimensions: { width: 4, height: 4 },
      requiredTechnology: 'advanced-fluid-handling',
    },
  },
}));

// StorageService 测试套件 - 存储管理服务
describe('StorageService', () => {
  let storageService: StorageService;
  let mockDataService: {
    getItem: ReturnType<typeof vi.fn>;
    getRecipe: ReturnType<typeof vi.fn>;
    getLocalizedItemName: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // 清除已存在的实例
    (StorageService as unknown as { instance: StorageService | null }).instance = null;

    // 创建模拟的 DataService
    mockDataService = {
      getItem: vi.fn(),
      getRecipe: vi.fn(),
      getLocalizedItemName: vi.fn(),
    };

    // 设置 ServiceLocator 模拟
    vi.spyOn(ServiceLocator, 'has').mockReturnValue(true);
    vi.spyOn(ServiceLocator, 'get').mockReturnValue(mockDataService as unknown as DataService);

    storageService = StorageService.getInstance();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 单例模式测试
  describe('getInstance', () => {
    // 测试：应该返回单例实例
    it('should return singleton instance', () => {
      const instance1 = StorageService.getInstance();
      const instance2 = StorageService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  // 获取存储配置测试
  describe('getStorageConfig', () => {
    // 测试：应该返回有效存储类型的完整存储配置
    it('should return complete storage config for valid storage type', () => {
      const mockItem = { id: 'wooden-chest', name: 'Wooden Chest' };
      const mockRecipe = {
        id: 'wooden-chest',
        name: 'Wooden Chest',
        category: 'crafting',
        time: 0.5,
        in: { wood: 4 },
        out: { 'wooden-chest': 1 },
      };

      vi.mocked(mockDataService.getItem).mockReturnValue(mockItem as Item);
      vi.mocked(mockDataService.getRecipe).mockReturnValue(mockRecipe as Recipe);
      vi.mocked(mockDataService.getLocalizedItemName).mockReturnValue('木制箱子');

      const config = storageService.getStorageConfig('wooden-chest');

      expect(config).toEqual({
        itemId: 'wooden-chest',
        name: '木制箱子',
        category: 'solid',
        additionalStacks: 10,
        fluidCapacity: undefined,
        recipe: { wood: 4 },
        craftingTime: 0.5,
        description: 'Basic wooden storage',
        dimensions: { width: 4, height: 4 },
        requiredTechnology: 'wood-processing',
      });
    });

    // 测试：未知存储类型应返回 undefined
    it('should return undefined for unknown storage type', () => {
      const config = storageService.getStorageConfig('unknown-storage');
      expect(config).toBeUndefined();
    });

    // 测试：DataService 不可用时应返回 undefined
    it('should return undefined when DataService is not available', () => {
      vi.mocked(ServiceLocator.has).mockReturnValue(false);

      const config = storageService.getStorageConfig('wooden-chest');
      expect(config).toBeUndefined();
    });

    // 测试：物品或配方未找到时应返回 undefined
    it('should return undefined when item or recipe not found', () => {
      vi.mocked(mockDataService.getItem).mockReturnValue(undefined);

      const config = storageService.getStorageConfig('wooden-chest');
      expect(config).toBeUndefined();
    });

    // 测试：应该处理液体存储配置
    it('should handle liquid storage config', () => {
      const mockItem = { id: 'storage-tank', name: 'Storage Tank' };
      const mockRecipe = {
        id: 'storage-tank',
        name: 'Storage Tank',
        category: 'crafting',
        time: 3,
        in: { 'iron-plate': 20, 'steel-plate': 5 },
        out: { 'storage-tank': 1 },
      };

      vi.mocked(mockDataService.getItem).mockReturnValue(mockItem as Item);
      vi.mocked(mockDataService.getRecipe).mockReturnValue(mockRecipe as Recipe);
      vi.mocked(mockDataService.getLocalizedItemName).mockReturnValue('储液罐');

      const config = storageService.getStorageConfig('storage-tank');

      expect(config).toEqual({
        itemId: 'storage-tank',
        name: '储液罐',
        category: 'liquid',
        additionalStacks: undefined,
        fluidCapacity: 25000,
        recipe: { 'iron-plate': 20, 'steel-plate': 5 },
        craftingTime: 3,
        description: 'Basic liquid storage',
        dimensions: { width: 3, height: 3 },
        requiredTechnology: 'fluid-handling',
      });
    });
  });

  // 获取可用存储类型测试
  describe('getAvailableStorageTypes', () => {
    // 测试：应该返回所有存储类型
    it('should return all storage types', () => {
      const types = storageService.getAvailableStorageTypes();

      expect(types).toEqual(['wooden-chest', 'iron-chest', 'storage-tank', 'fluid-tank']);
    });
  });

  // 获取固体存储类型测试
  describe('getSolidStorageTypes', () => {
    // 测试：应该只返回固体存储类型
    it('should return only solid storage types', () => {
      const types = storageService.getSolidStorageTypes();

      expect(types).toEqual(['wooden-chest', 'iron-chest']);
    });
  });

  // 获取液体存储类型测试
  describe('getLiquidStorageTypes', () => {
    // 测试：应该只返回液体存储类型
    it('should return only liquid storage types', () => {
      const types = storageService.getLiquidStorageTypes();

      expect(types).toEqual(['storage-tank', 'fluid-tank']);
    });
  });

  // 判断是否为存储设备测试
  describe('isStorageDevice', () => {
    // 测试：有效的存储设备应返回 true
    it('should return true for valid storage devices', () => {
      expect(storageService.isStorageDevice('wooden-chest')).toBe(true);
      expect(storageService.isStorageDevice('iron-chest')).toBe(true);
      expect(storageService.isStorageDevice('storage-tank')).toBe(true);
    });

    // 测试：非存储物品应返回 false
    it('should return false for non-storage items', () => {
      expect(storageService.isStorageDevice('iron-plate')).toBe(false);
      expect(storageService.isStorageDevice('unknown-item')).toBe(false);
    });
  });

  // 获取存储特定配置测试
  describe('getStorageSpecificConfig', () => {
    // 测试：应该返回存储类型的特定配置
    it('should return specific config for storage type', () => {
      const config = storageService.getStorageSpecificConfig('wooden-chest');

      expect(config).toEqual({
        category: 'solid',
        additionalStacks: 10,
        description: 'Basic wooden storage',
        dimensions: { width: 4, height: 4 },
        requiredTechnology: 'wood-processing',
      });
    });

    // 测试：未知存储类型应返回 undefined
    it('should return undefined for unknown storage type', () => {
      const config = storageService.getStorageSpecificConfig('unknown');
      expect(config).toBeUndefined();
    });
  });

  // 向后兼容方法测试
  describe('backward compatibility methods', () => {
    // 测试：getChestConfig 应该调用 getStorageConfig
    it('getChestConfig should call getStorageConfig', () => {
      const spy = vi.spyOn(storageService, 'getStorageConfig');

      storageService.getChestConfig('wooden-chest');

      expect(spy).toHaveBeenCalledWith('wooden-chest');
    });

    // 测试：getAvailableChestTypes 应该调用 getSolidStorageTypes
    it('getAvailableChestTypes should call getSolidStorageTypes', () => {
      const spy = vi.spyOn(storageService, 'getSolidStorageTypes');

      const types = storageService.getAvailableChestTypes();

      expect(spy).toHaveBeenCalled();
      expect(types).toEqual(['wooden-chest', 'iron-chest']);
    });
  });
});
