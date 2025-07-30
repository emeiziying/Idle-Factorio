import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { UserProgressService } from "../UserProgressService";

// 模拟日志记录器
vi.mock("../../utils/logger", () => ({
  warn: vi.fn(),
}));

// UserProgressService 测试套件 - 用户进度管理服务
describe("UserProgressService", () => {
  let service: UserProgressService;
  const STORAGE_KEY = "factorio_user_progress";

  beforeEach(() => {
    // 清除实例
    (
      UserProgressService as unknown as { instance: UserProgressService | null }
    ).instance = null;

    // 清空 localStorage
    localStorage.clear();

    // 获取新实例
    service = UserProgressService.getInstance();
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // 单例模式测试
  describe("getInstance", () => {
    // 测试：应该返回单例实例
    it("should return singleton instance", () => {
      const instance1 = UserProgressService.getInstance();
      const instance2 = UserProgressService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  // 物品解锁测试
  describe("item unlocking", () => {
    // 物品解锁状态检查
    describe("isItemUnlocked", () => {
      // 测试：锁定的物品应返回 false
      it("should return false for locked items", () => {
        expect(service.isItemUnlocked("iron-plate")).toBe(false);
      });

      // 测试：解锁的物品应返回 true
      it("should return true for unlocked items", () => {
        service.unlockItem("iron-plate");
        expect(service.isItemUnlocked("iron-plate")).toBe(true);
      });
    });

    // 解锁单个物品
    describe("unlockItem", () => {
      // 测试：应该解锁单个物品
      it("should unlock single item", () => {
        service.unlockItem("copper-plate");

        expect(service.isItemUnlocked("copper-plate")).toBe(true);
        expect(service.getUnlockedItems()).toContain("copper-plate");
      });

      // 测试：解锁后应保存进度
      it("should save progress after unlocking", () => {
        const saveSpy = vi.spyOn(
          service as unknown as { saveProgress: () => void },
          "saveProgress"
        );

        service.unlockItem("steel-plate");

        expect(saveSpy).toHaveBeenCalled();
      });

      // 测试：应该处理重复解锁
      it("should handle duplicate unlocks", () => {
        service.unlockItem("iron-gear-wheel");
        service.unlockItem("iron-gear-wheel");

        const unlockedItems = service.getUnlockedItems();
        expect(
          unlockedItems.filter((id) => id === "iron-gear-wheel")
        ).toHaveLength(1);
      });
    });

    // 批量解锁物品
    describe("unlockItems", () => {
      // 测试：应该解锁多个物品
      it("should unlock multiple items", () => {
        const items = ["iron-plate", "copper-plate", "steel-plate"];

        service.unlockItems(items);

        items.forEach((item) => {
          expect(service.isItemUnlocked(item)).toBe(true);
        });
      });

      // 测试：批量解锁后应只保存一次进度
      it("should save progress once after batch unlock", () => {
        const saveSpy = vi.spyOn(
          service as unknown as { saveProgress: () => void },
          "saveProgress"
        );

        service.unlockItems(["item1", "item2", "item3"]);

        expect(saveSpy).toHaveBeenCalledTimes(1);
      });
    });

    // 获取已解锁物品
    describe("getUnlockedItems", () => {
      // 测试：没有解锁物品时应返回空数组
      it("should return empty array when no items unlocked", () => {
        expect(service.getUnlockedItems()).toEqual([]);
      });

      // 测试：应返回所有已解锁的物品
      it("should return all unlocked items", () => {
        service.unlockItems(["item1", "item2", "item3"]);

        const unlocked = service.getUnlockedItems();
        expect(unlocked).toHaveLength(3);
        expect(unlocked).toContain("item1");
        expect(unlocked).toContain("item2");
        expect(unlocked).toContain("item3");
      });
    });
  });

  // 科技解锁测试
  describe("technology unlocking", () => {
    // 科技解锁状态检查
    describe("isTechUnlocked", () => {
      // 测试：锁定的科技应返回 false
      it("should return false for locked techs", () => {
        expect(service.isTechUnlocked("automation")).toBe(false);
      });

      // 测试：解锁的科技应返回 true
      it("should return true for unlocked techs", () => {
        service.unlockTech("automation");
        expect(service.isTechUnlocked("automation")).toBe(true);
      });
    });

    // 解锁单个科技
    describe("unlockTech", () => {
      // 测试：应该解锁单个科技
      it("should unlock single tech", () => {
        service.unlockTech("logistics");

        expect(service.isTechUnlocked("logistics")).toBe(true);
        expect(service.getUnlockedTechs()).toContain("logistics");
      });

      // 测试：解锁后应保存进度
      it("should save progress after unlocking", () => {
        const saveSpy = vi.spyOn(
          service as unknown as { saveProgress: () => void },
          "saveProgress"
        );

        service.unlockTech("steel-processing");

        expect(saveSpy).toHaveBeenCalled();
      });
    });

    // 批量解锁科技
    describe("unlockTechs", () => {
      // 测试：应该解锁多个科技
      it("should unlock multiple techs", () => {
        const techs = ["automation", "logistics", "steel-processing"];

        service.unlockTechs(techs);

        techs.forEach((tech) => {
          expect(service.isTechUnlocked(tech)).toBe(true);
        });
      });

      // 获取已解锁科技
      describe("getUnlockedTechs", () => {
        // 测试：没有解锁科技时应返回空数组
        it("should return empty array when no techs unlocked", () => {
          expect(service.getUnlockedTechs()).toEqual([]);
        });

        // 测试：应返回所有已解锁的科技
        it("should return all unlocked techs", () => {
          service.unlockTechs(["tech1", "tech2", "tech3"]);

          const unlocked = service.getUnlockedTechs();
          expect(unlocked).toHaveLength(3);
          expect(unlocked).toContain("tech1");
          expect(unlocked).toContain("tech2");
          expect(unlocked).toContain("tech3");
        });
      });
    });
    // 进度持久化测试
    describe("progress persistence", () => {
      // 测试：应保存进度到 localStorage
      it("should save progress to localStorage", () => {
        service.unlockItems(["iron-plate", "copper-plate"]);
        service.unlockTechs(["automation", "logistics"]);

        const saved = localStorage.getItem(STORAGE_KEY);
        expect(saved).toBeTruthy();

        const data = JSON.parse(saved!);
        expect(data.unlockedItems).toContain("iron-plate");
        expect(data.unlockedItems).toContain("copper-plate");
        expect(data.unlockedTechs).toContain("automation");
        expect(data.unlockedTechs).toContain("logistics");
        expect(data.lastUpdated).toBeDefined();
      });

      // 测试：初始化时应从 localStorage 加载进度
      it("should load progress from localStorage on initialization", () => {
        // Set up saved data
        // 设置保存的数据
        const savedData = {
          unlockedItems: ["saved-item-1", "saved-item-2"],
          unlockedTechs: ["saved-tech-1", "saved-tech-2"],
          lastUpdated: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));

        // Create new instance
        // 创建新实例
        (
          UserProgressService as unknown as {
            instance: UserProgressService | null;
          }
        ).instance = null;
        const newService = UserProgressService.getInstance();

        // Check loaded data
        // 检查加载的数据
        expect(newService.isItemUnlocked("saved-item-1")).toBe(true);
        expect(newService.isItemUnlocked("saved-item-2")).toBe(true);
        expect(newService.isTechUnlocked("saved-tech-1")).toBe(true);
        expect(newService.isTechUnlocked("saved-tech-2")).toBe(true);
      });

      // 测试：应处理损坏的 localStorage 数据
      it("should handle corrupted localStorage data", () => {
        localStorage.setItem(STORAGE_KEY, "invalid json");

        // Should not throw when creating instance
        // 创建实例时不应抛出错误
        (
          UserProgressService as unknown as {
            instance: UserProgressService | null;
          }
        ).instance = null;
        expect(() => UserProgressService.getInstance()).not.toThrow();

        const newService = UserProgressService.getInstance();
        expect(newService.getUnlockedItems()).toEqual([]);
        expect(newService.getUnlockedTechs()).toEqual([]);
      });

      // 测试：保存时应处理 localStorage 错误
      it("should handle localStorage errors when saving", () => {
        // Mock localStorage.setItem to throw
        // 模拟 localStorage.setItem 抛出错误
        const setItemSpy = vi
          .spyOn(Storage.prototype, "setItem")
          .mockImplementation(() => {
            throw new Error("Storage quota exceeded");
          });

        // Should not throw when saving
        // 保存时不应抛出错误
        expect(() => service.unlockItem("test-item")).not.toThrow();

        setItemSpy.mockRestore();
      });
    });

    // 重置进度测试
    describe("resetProgress", () => {
      // 测试：应清除所有已解锁的物品和科技
      it("should clear all unlocked items and techs", () => {
        service.unlockItems(["item1", "item2", "item3"]);
        service.unlockTechs(["tech1", "tech2", "tech3"]);

        service.resetProgress();

        expect(service.getUnlockedItems()).toEqual([]);
        expect(service.getUnlockedTechs()).toEqual([]);
      });

      // 测试：应保存清除后的状态到 localStorage
      it("should save cleared state to localStorage", () => {
        service.unlockItems(["item1", "item2"]);
        service.unlockTechs(["tech1", "tech2"]);

        service.resetProgress();

        const saved = localStorage.getItem(STORAGE_KEY);
        const data = JSON.parse(saved!);

        expect(data.unlockedItems).toEqual([]);
        expect(data.unlockedTechs).toEqual([]);
      });
    });

    // 边界情况测试
    describe("edge cases", () => {
      // 测试：应处理批量操作中的空数组
      it("should handle empty arrays in batch operations", () => {
        expect(() => service.unlockItems([])).not.toThrow();
        expect(() => service.unlockTechs([])).not.toThrow();
      });

      // 测试：应为物品和科技维护独立的命名空间
      it("should maintain separate namespaces for items and techs", () => {
        service.unlockItem("automation");
        service.unlockTech("automation");

        expect(service.isItemUnlocked("automation")).toBe(true);
        expect(service.isTechUnlocked("automation")).toBe(true);

        // They should be tracked separately
        // 它们应该被分别跟踪
        expect(service.getUnlockedItems()).toContain("automation");
        expect(service.getUnlockedTechs()).toContain("automation");
      });

      // 测试：应处理非常大的数据集
      it("should handle very large datasets", () => {
        const largeItemSet = Array.from(
          { length: 1000 },
          (_, i) => `item-${i}`
        );
        const largeTechSet = Array.from(
          { length: 1000 },
          (_, i) => `tech-${i}`
        );

        service.unlockItems(largeItemSet);
        service.unlockTechs(largeTechSet);

        expect(service.getUnlockedItems()).toHaveLength(1000);
        expect(service.getUnlockedTechs()).toHaveLength(1000);

        // Should still be able to save and load
        // 仍应能够保存和加载
        const saved = localStorage.getItem(STORAGE_KEY);
        expect(saved).toBeTruthy();
        expect(JSON.parse(saved!).unlockedItems).toHaveLength(1000);
      });
    });
  });
});
