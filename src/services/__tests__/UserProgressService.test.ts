import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UserProgressService } from '@/services/game/UserProgressService';

// 模拟日志记录器
vi.mock('../../utils/logger', () => ({
  warn: vi.fn(),
}));

// UserProgressService 测试套件 - 用户进度管理服务（仅科技解锁）
describe('UserProgressService', () => {
  let service: UserProgressService;

  beforeEach(() => {
    // 清空 localStorage
    localStorage.clear();

    // 创建新实例
    service = new UserProgressService();
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // 实例创建测试
  describe('instance creation', () => {
    // 测试：应该能创建多个独立实例
    it('should create independent instances', () => {
      const instance1 = new UserProgressService();
      const instance2 = new UserProgressService();
      expect(instance1).not.toBe(instance2);
    });
  });

  // 科技解锁测试
  describe('technology unlocking', () => {
    // 科技解锁状态检查
    describe('isTechUnlocked', () => {
      // 测试：锁定的科技应返回 false
      it('should return false for locked techs', () => {
        expect(service.isTechUnlocked('automation')).toBe(false);
      });

      // 测试：解锁的科技应返回 true
      it('should return true for unlocked techs', () => {
        service.unlockTech('automation');
        expect(service.isTechUnlocked('automation')).toBe(true);
      });

      // 测试：未解锁的科技应返回 false
      it('should return false for non-unlocked techs after unlocking another', () => {
        service.unlockTech('automation');
        // 另一个科技应仍然返回 false
        expect(service.isTechUnlocked('logistics')).toBe(false);
        expect(service.getUnlockedTechs()).toEqual(['automation']);
      });

      // 测试：重复解锁应保持幂等
      it('should be idempotent when unlocking same tech multiple times', () => {
        service.unlockTech('automation');
        service.unlockTech('automation');
        service.unlockTech('automation');

        const unlockedTechs = service.getUnlockedTechs();
        expect(unlockedTechs).toEqual(['automation']);
        expect(unlockedTechs.filter(id => id === 'automation')).toHaveLength(1);
      });
    });

    // 单个科技解锁
    describe('unlockTech', () => {
      // 测试：解锁后科技状态应正确更新
      it('should update tech status after unlocking', () => {
        service.unlockTech('automation');

        expect(service.isTechUnlocked('automation')).toBe(true);
        const unlockedTechs = service.getUnlockedTechs();
        expect(unlockedTechs).toContain('automation');
        expect(unlockedTechs.every(id => typeof id === 'string')).toBe(true);
      });
    });

    // 批量科技解锁
    describe('unlockTechs', () => {
      // 测试：批量解锁多个科技
      it('should unlock multiple techs at once', () => {
        const techsToUnlock = ['automation', 'logistics', 'steel-processing'];
        service.unlockTechs(techsToUnlock);

        techsToUnlock.forEach(techId => {
          expect(service.isTechUnlocked(techId)).toBe(true);
        });
      });

      // 测试：空数组应正常处理
      it('should handle empty array gracefully', () => {
        const initialTechs = service.getUnlockedTechs();
        service.unlockTechs([]);

        expect(service.getUnlockedTechs()).toEqual(initialTechs);
      });

      // 测试：复杂批量解锁场景
      it('should handle complex batch unlock scenarios', () => {
        // 先解锁一些科技
        service.unlockTechs(['tech1', 'tech2']);

        // 再解锁更多科技（包括重复的）
        service.unlockTechs(['tech2', 'tech3', 'tech4']);

        const unlockedTechs = service.getUnlockedTechs();
        expect(unlockedTechs).toContain('tech1');
        expect(unlockedTechs).toContain('tech2');
        expect(unlockedTechs).toContain('tech3');
        expect(unlockedTechs).toContain('tech4');

        // 确认没有重复
        const uniqueTechs = [...new Set(unlockedTechs)];
        expect(unlockedTechs).toHaveLength(uniqueTechs.length);
      });
    });

    // 获取已解锁科技列表
    describe('getUnlockedTechs', () => {
      // 测试：初始状态下应返回空数组
      it('should return empty array initially', () => {
        expect(service.getUnlockedTechs()).toEqual([]);
      });

      // 测试：解锁后应返回正确的科技列表
      it('should return correct techs after unlocking', () => {
        service.unlockTechs(['automation', 'logistics']);

        const unlockedTechs = service.getUnlockedTechs();
        expect(unlockedTechs).toHaveLength(2);
        expect(unlockedTechs).toContain('automation');
        expect(unlockedTechs).toContain('logistics');
      });
    });
  });

  // 进度重置测试
  describe('progress reset', () => {
    // 测试：重置后科技应清空
    it('should clear unlocked techs after reset', () => {
      // 先解锁一些科技
      service.unlockTech('automation');
      
      // 验证初始状态
      expect(service.isTechUnlocked('automation')).toBe(true);

      // 重置
      service.resetProgress();

      // 验证清空结果
      expect(service.isTechUnlocked('automation')).toBe(false);
      expect(service.getUnlockedTechs()).toEqual([]);
    });
  });

  // 数据持久化测试
  describe('data persistence', () => {
    // 测试：数据持久化 - 应该保存和加载解锁的科技
    it('should persist and load unlocked techs', () => {
      // 解锁一些科技
      service.unlockTechs(['automation', 'logistics']);

      // 创建新实例（模拟重新加载）
      const newService = new UserProgressService();

      // 验证数据是否正确加载
      expect(newService.isTechUnlocked('automation')).toBe(true);
      expect(newService.isTechUnlocked('logistics')).toBe(true);
    });

    // 测试：应该获取正确的解锁科技列表
    it('should get correct unlocked techs list', () => {
      const unlockedTechs = service.getUnlockedTechs();
      expect(Array.isArray(unlockedTechs)).toBe(true);
    });

    // 测试：正确的存储键
    it('should use correct storage key', () => {
      service.unlockTechs(['test-tech']);
      
      const stored = localStorage.getItem('factorio_user_progress');
      expect(stored).toBeTruthy();
      
      const data = JSON.parse(stored!);
      expect(data.unlockedTechs).toBeDefined();
    });

    // 测试：在localStorage中存储数据
    it('should store data in localStorage', () => {
      service.unlockTech('tech1');
      
      const stored = localStorage.getItem('factorio_user_progress');
      expect(stored).toBeTruthy();
      
      const data = JSON.parse(stored!);
      expect(data.unlockedTechs).toContain('tech1');
      expect(data.lastUpdated).toBeDefined();
    });

    // 测试：损坏的localStorage数据应被安全处理
    it('should handle corrupted localStorage data safely', () => {
      // 模拟损坏的JSON数据
      localStorage.setItem('factorio_user_progress', 'corrupted data');
      
      // 应该能安全创建新实例
      const newService = new UserProgressService();
      expect(newService.getUnlockedTechs()).toEqual([]);
    });
  });
});