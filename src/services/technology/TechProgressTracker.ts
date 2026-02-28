/**
 * 科技进度跟踪服务
 * 跟踪研究统计、进度和成就
 */

import type { Technology, TechStatistics } from '@/types/technology';
import type { TechTreeService } from '@/services/technology/TechTreeService';
import type { TechUnlockService } from '@/services/technology/TechUnlockService';

export class TechProgressTracker {
  // 统计数据
  private totalResearchTime = 0;
  private totalSciencePacksConsumed: Record<string, number> = {};
  private researchedTechs: Set<string> = new Set();
  private researchStartTimes: Map<string, number> = new Map();
  private researchCompletionTimes: Map<string, number> = new Map();

  // 服务依赖
  private treeService: TechTreeService | null = null;
  private unlockService: TechUnlockService | null = null;

  /**
   * 初始化服务
   */
  async initialize(
    treeService?: TechTreeService,
    unlockService?: TechUnlockService
  ): Promise<void> {
    if (treeService) this.treeService = treeService;
    if (unlockService) this.unlockService = unlockService;

    // 从已解锁的科技重建统计
    if (this.unlockService) {
      this.rebuildStatisticsFromUnlocked();
    }
  }

  /**
   * 从已解锁的科技重建统计
   */
  private rebuildStatisticsFromUnlocked(): void {
    const unlockedTechs = this.unlockService ? this.unlockService.getUnlockedTechs() : [];
    if (!unlockedTechs) return;

    unlockedTechs.forEach(techId => {
      this.researchedTechs.add(techId);

      // 估算研究时间和消耗
      const tech = this.treeService ? this.treeService.getTechnology(techId) : undefined;
      if (tech) {
        this.totalResearchTime += tech.researchTime;

        // 累加科技包消耗
        Object.entries(tech.researchCost).forEach(([packId, amount]) => {
          this.totalSciencePacksConsumed[packId] =
            (this.totalSciencePacksConsumed[packId] || 0) + (amount as number);
        });
      }
    });
  }

  /**
   * 记录研究开始
   */
  recordResearchStart(techId: string): void {
    this.researchStartTimes.set(techId, Date.now());
  }

  /**
   * 记录研究完成
   */
  recordResearchComplete(tech: Technology): void {
    const now = Date.now();

    // 记录完成的科技
    this.researchedTechs.add(tech.id);
    this.researchCompletionTimes.set(tech.id, now);

    // 计算实际研究时间
    const startTime = this.researchStartTimes.get(tech.id);
    if (startTime) {
      const actualTime = (now - startTime) / 1000; // 转换为秒
      this.totalResearchTime += actualTime;
      this.researchStartTimes.delete(tech.id);
    } else {
      // 如果没有开始时间记录，使用理论时间
      this.totalResearchTime += tech.researchTime;
    }

    // 记录科技包消耗
    this.recordSciencePackConsumption(tech.researchCost);
  }

  /**
   * 记录科技包消耗
   */
  recordSciencePackConsumption(packs: Record<string, number>): void {
    Object.entries(packs).forEach(([packId, amount]) => {
      this.totalSciencePacksConsumed[packId] =
        (this.totalSciencePacksConsumed[packId] || 0) + amount;
    });
  }

  /**
   * 获取科技统计信息
   */
  getTechStatistics(): TechStatistics {
    const totalTechs = this.treeService ? this.treeService.getAllTechnologies().length : 0;
    const unlockedCount = this.unlockService ? this.unlockService.getUnlockedTechs().size : 0;
    const researchedCount = this.researchedTechs.size;

    // 获取分类统计
    // const categoryProgress = this.getCategoryProgress(); // TODO: 使用分类进度

    // 计算平均研究时间
    const avgResearchTime = researchedCount > 0 ? this.totalResearchTime / researchedCount : 0;

    return {
      totalTechs: totalTechs,
      unlockedTechs: unlockedCount,
      researchProgress: totalTechs > 0 ? unlockedCount / totalTechs : 0,
      totalResearchTime: this.totalResearchTime,
      availableTechs: 0, // TODO: 实现可研究科技数量计算
      techsByCategory: {}, // TODO: 实现分类统计
      averageResearchTime: avgResearchTime,
    } as TechStatistics;
  }

  /**
   * 获取分类进度
   * @internal
   */
  getCategoryProgress(): Record<string, { unlocked: number; total: number; progress: number }> {
    const progress: Record<string, { unlocked: number; total: number; progress: number }> = {};

    if (!this.treeService || !this.unlockService) return progress;

    const categories = this.treeService.getTechCategories();
    const unlockedTechs = this.unlockService.getUnlockedTechs();

    categories.forEach(category => {
      const categoryTechs = category.technologies;
      const unlockedInCategory = categoryTechs.filter((techId: string) =>
        unlockedTechs.has(techId)
      ).length;

      progress[category.id] = {
        unlocked: unlockedInCategory,
        total: categoryTechs.length,
        progress: categoryTechs.length > 0 ? unlockedInCategory / categoryTechs.length : 0,
      };
    });

    return progress;
  }

  /**
   * 获取研究速度（科技/小时）
   */
  getResearchSpeed(): number {
    if (this.researchCompletionTimes.size === 0) return 0;

    // 获取最近一小时的研究
    const oneHourAgo = Date.now() - 3600000;
    let recentCount = 0;

    this.researchCompletionTimes.forEach(time => {
      if (time >= oneHourAgo) {
        recentCount++;
      }
    });

    return recentCount;
  }

  /**
   * 获取最常消耗的科技包
   */
  getMostConsumedPacks(limit = 5): Array<{ packId: string; count: number }> {
    return Object.entries(this.totalSciencePacksConsumed)
      .map(([packId, count]) => ({ packId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * 获取进度数据（用于合并到状态）
   */
  getProgressData(): {
    totalResearchTime: number;
    totalSciencePacksConsumed: Record<string, number>;
    researchedTechs: Set<string>;
  } {
    return {
      totalResearchTime: this.totalResearchTime,
      totalSciencePacksConsumed: { ...this.totalSciencePacksConsumed },
      researchedTechs: new Set(this.researchedTechs),
    };
  }

  /**
   * 重置统计（用于新游戏）
   */
  resetStatistics(): void {
    this.totalResearchTime = 0;
    this.totalSciencePacksConsumed = {};
    this.researchedTechs.clear();
    this.researchStartTimes.clear();
    this.researchCompletionTimes.clear();
  }

  /**
   * 导出统计数据（用于保存）
   */
  exportStatistics(): {
    totalResearchTime: number;
    totalSciencePacksConsumed: Record<string, number>;
    researchedTechs: string[];
    researchCompletionTimes: Array<[string, number]>;
  } {
    return {
      totalResearchTime: this.totalResearchTime,
      totalSciencePacksConsumed: this.totalSciencePacksConsumed,
      researchedTechs: Array.from(this.researchedTechs),
      researchCompletionTimes: Array.from(this.researchCompletionTimes.entries()),
    };
  }

  /**
   * 导入统计数据（用于加载）
   */
  importStatistics(data: {
    totalResearchTime?: number;
    totalSciencePacksConsumed?: Record<string, number>;
    researchedTechs?: string[];
    researchCompletionTimes?: Array<[string, number]>;
  }): void {
    if (data.totalResearchTime !== undefined) {
      this.totalResearchTime = data.totalResearchTime;
    }

    if (data.totalSciencePacksConsumed) {
      this.totalSciencePacksConsumed = { ...data.totalSciencePacksConsumed };
    }

    if (data.researchedTechs) {
      this.researchedTechs = new Set(data.researchedTechs);
    }

    if (data.researchCompletionTimes) {
      this.researchCompletionTimes = new Map(data.researchCompletionTimes);
    }
  }
}
