// 用户进度管理服务

import { BaseService } from '../base/BaseService';
import { CacheManager } from '../base/CacheManager';
// import type { IUserProgress } from '../interfaces';

export interface UserAchievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: number;
  category: string;
}

export interface UserStats {
  totalPlayTime: number;
  itemsCrafted: Record<string, number>;
  buildingsBuilt: Record<string, number>;
  technologiesResearched: number;
  achievementsUnlocked: number;
}

export interface ProgressSnapshot {
  timestamp: number;
  unlockedItems: string[];
  unlockedTechs: string[];
  achievements: UserAchievement[];
  stats: UserStats;
}

export class UserProgressService extends BaseService {
  private unlockedItems: Set<string>;
  private unlockedTechs: Set<string>;
  private achievements: Map<string, UserAchievement>;
  private stats: UserStats;
  private progressCache = new CacheManager<string, boolean>();
  private readonly STORAGE_KEY = 'factorio_user_progress';
  private readonly STATS_KEY = 'factorio_user_stats';

  protected constructor() {
    super();
    this.unlockedItems = new Set();
    this.unlockedTechs = new Set();
    this.achievements = new Map();
    this.stats = this.getDefaultStats();
    this.initializeDependencies();
    this.loadProgress();
  }

  // ========== 物品解锁管理 ==========

  /**
   * 检查物品是否已解锁
   */
  isItemUnlocked(itemId: string): boolean {
    try {
      const cached = this.progressCache.get(`item_${itemId}`);
      if (cached !== undefined) {
        return cached;
      }

      const unlocked = this.unlockedItems.has(itemId);
      this.progressCache.set(`item_${itemId}`, unlocked);
      return unlocked;
    } catch (error) {
      this.handleError(error, `isItemUnlocked for ${itemId}`);
      return false;
    }
  }

  /**
   * 解锁单个物品
   */
  unlockItem(itemId: string): void {
    try {
      if (!this.unlockedItems.has(itemId)) {
        this.unlockedItems.add(itemId);
        this.progressCache.set(`item_${itemId}`, true);
        this.saveProgress();
        
        // 检查是否解锁了新的成就
        this.checkAchievements();
      }
    } catch (error) {
      this.handleError(error, `unlockItem for ${itemId}`);
    }
  }

  /**
   * 批量解锁物品
   */
  unlockItems(itemIds: string[]): void {
    try {
      let hasChanges = false;
      
      itemIds.forEach(id => {
        if (!this.unlockedItems.has(id)) {
          this.unlockedItems.add(id);
          this.progressCache.set(`item_${id}`, true);
          hasChanges = true;
        }
      });

      if (hasChanges) {
        this.saveProgress();
        this.checkAchievements();
      }
    } catch (error) {
      this.handleError(error, 'unlockItems');
    }
  }

  /**
   * 获取所有已解锁物品ID
   */
  getUnlockedItems(): string[] {
    return Array.from(this.unlockedItems);
  }

  // ========== 科技解锁管理 ==========

  /**
   * 检查科技是否已解锁
   */
  isTechUnlocked(techId: string): boolean {
    try {
      const cached = this.progressCache.get(`tech_${techId}`);
      if (cached !== undefined) {
        return cached;
      }

      const unlocked = this.unlockedTechs.has(techId);
      this.progressCache.set(`tech_${techId}`, unlocked);
      return unlocked;
    } catch (error) {
      this.handleError(error, `isTechUnlocked for ${techId}`);
      return false;
    }
  }

  /**
   * 解锁单个科技
   */
  unlockTech(techId: string): void {
    try {
      if (!this.unlockedTechs.has(techId)) {
        this.unlockedTechs.add(techId);
        this.progressCache.set(`tech_${techId}`, true);
        this.stats.technologiesResearched++;
        this.saveProgress();
        this.saveStats();
        
        // 检查是否解锁了新的成就
        this.checkAchievements();
      }
    } catch (error) {
      this.handleError(error, `unlockTech for ${techId}`);
    }
  }

  /**
   * 批量解锁科技
   */
  unlockTechs(techIds: string[]): void {
    try {
      let hasChanges = false;
      
      techIds.forEach(id => {
        if (!this.unlockedTechs.has(id)) {
          this.unlockedTechs.add(id);
          this.progressCache.set(`tech_${id}`, true);
          this.stats.technologiesResearched++;
          hasChanges = true;
        }
      });

      if (hasChanges) {
        this.saveProgress();
        this.saveStats();
        this.checkAchievements();
      }
    } catch (error) {
      this.handleError(error, 'unlockTechs');
    }
  }

  /**
   * 获取所有已解锁科技ID
   */
  getUnlockedTechs(): string[] {
    return Array.from(this.unlockedTechs);
  }

  // ========== 成就管理 ==========

  /**
   * 解锁成就
   */
  unlockAchievement(achievementId: string, name: string, description: string, category: string = 'general'): void {
    try {
      if (!this.achievements.has(achievementId)) {
        const achievement: UserAchievement = {
          id: achievementId,
          name,
          description,
          unlockedAt: Date.now(),
          category
        };
        
        this.achievements.set(achievementId, achievement);
        this.stats.achievementsUnlocked++;
        this.saveProgress();
        this.saveStats();
      }
    } catch (error) {
      this.handleError(error, `unlockAchievement for ${achievementId}`);
    }
  }

  /**
   * 获取所有成就
   */
  getAchievements(): UserAchievement[] {
    return Array.from(this.achievements.values());
  }

  /**
   * 按类别获取成就
   */
  getAchievementsByCategory(category: string): UserAchievement[] {
    return this.getAchievements().filter(achievement => achievement.category === category);
  }

  // ========== 统计信息管理 ==========

  /**
   * 更新制作统计
   */
  updateCraftingStats(itemId: string, quantity: number): void {
    try {
      this.stats.itemsCrafted[itemId] = (this.stats.itemsCrafted[itemId] || 0) + quantity;
      this.saveStats();
    } catch (error) {
      this.handleError(error, `updateCraftingStats for ${itemId}`);
    }
  }

  /**
   * 更新建造统计
   */
  updateBuildingStats(buildingId: string, quantity: number): void {
    try {
      this.stats.buildingsBuilt[buildingId] = (this.stats.buildingsBuilt[buildingId] || 0) + quantity;
      this.saveStats();
    } catch (error) {
      this.handleError(error, `updateBuildingStats for ${buildingId}`);
    }
  }

  /**
   * 更新游戏时间
   */
  updatePlayTime(deltaTime: number): void {
    try {
      this.stats.totalPlayTime += deltaTime;
      this.saveStats();
    } catch (error) {
      this.handleError(error, 'updatePlayTime');
    }
  }

  /**
   * 获取用户统计信息
   */
  getStats(): UserStats {
    return { ...this.stats };
  }

  // ========== 进度管理 ==========

  /**
   * 获取完整的用户进度
   */
  getUserProgress() {
    return {
      level: this.calculateLevel(),
      experience: this.calculateExperience(),
      unlockedTechnologies: this.getUnlockedTechs(),
      completedAchievements: Array.from(this.achievements.keys()),
      settings: this.getProgressSettings()
    };
  }

  /**
   * 创建进度快照
   */
  createProgressSnapshot(): ProgressSnapshot {
    return {
      timestamp: Date.now(),
      unlockedItems: this.getUnlockedItems(),
      unlockedTechs: this.getUnlockedTechs(),
      achievements: this.getAchievements(),
      stats: this.getStats()
    };
  }

  /**
   * 从快照恢复进度
   */
  restoreFromSnapshot(snapshot: ProgressSnapshot): void {
    try {
      this.unlockedItems = new Set(snapshot.unlockedItems);
      this.unlockedTechs = new Set(snapshot.unlockedTechs);
      this.achievements = new Map(snapshot.achievements.map(a => [a.id, a]));
      this.stats = { ...snapshot.stats };
      
      this.progressCache.clear();
      this.saveProgress();
      this.saveStats();
    } catch (error) {
      this.handleError(error, 'restoreFromSnapshot');
    }
  }

  /**
   * 重置用户进度
   */
  resetProgress(): void {
    try {
      this.unlockedItems.clear();
      this.unlockedTechs.clear();
      this.achievements.clear();
      this.stats = this.getDefaultStats();
      this.progressCache.clear();
      
      this.saveProgress();
      this.saveStats();
    } catch (error) {
      this.handleError(error, 'resetProgress');
    }
  }

  /**
   * 导出进度数据
   */
  exportProgress(): string {
    try {
      const snapshot = this.createProgressSnapshot();
      return JSON.stringify(snapshot, null, 2);
    } catch (error) {
      this.handleError(error, 'exportProgress');
      return '{}';
    }
  }

  /**
   * 导入进度数据
   */
  importProgress(data: string): boolean {
    try {
      const snapshot = JSON.parse(data) as ProgressSnapshot;
      this.restoreFromSnapshot(snapshot);
      return true;
    } catch (error) {
      this.handleError(error, 'importProgress');
      return false;
    }
  }

  // ========== 私有方法 ==========

  /**
   * 从存储加载进度
   */
  private loadProgress(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        this.unlockedItems = new Set(data.unlockedItems || []);
        this.unlockedTechs = new Set(data.unlockedTechs || []);
        
        if (data.achievements) {
          this.achievements = new Map(data.achievements.map((a: UserAchievement) => [a.id, a]));
        }
      }

      // 加载统计信息
      const statsData = localStorage.getItem(this.STATS_KEY);
      if (statsData) {
        this.stats = { ...this.getDefaultStats(), ...JSON.parse(statsData) };
      }
    } catch (error) {
      this.handleError(error, 'loadProgress');
    }
  }

  /**
   * 保存进度到存储
   */
  private saveProgress(): void {
    try {
      const data = {
        unlockedItems: Array.from(this.unlockedItems),
        unlockedTechs: Array.from(this.unlockedTechs),
        achievements: Array.from(this.achievements.values()),
        lastUpdated: Date.now()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      this.handleError(error, 'saveProgress');
    }
  }

  /**
   * 保存统计信息
   */
  private saveStats(): void {
    try {
      localStorage.setItem(this.STATS_KEY, JSON.stringify(this.stats));
    } catch (error) {
      this.handleError(error, 'saveStats');
    }
  }

  /**
   * 获取默认统计信息
   */
  private getDefaultStats(): UserStats {
    return {
      totalPlayTime: 0,
      itemsCrafted: {},
      buildingsBuilt: {},
      technologiesResearched: 0,
      achievementsUnlocked: 0
    };
  }

  /**
   * 检查成就解锁条件
   */
  private checkAchievements(): void {
    try {
      // 技术研究成就
      if (this.stats.technologiesResearched >= 10 && !this.achievements.has('tech_researcher')) {
        this.unlockAchievement('tech_researcher', 'Tech Researcher', 'Research 10 technologies', 'research');
      }

      // 制作成就
      const totalCrafted = Object.values(this.stats.itemsCrafted).reduce((sum, count) => sum + count, 0);
      if (totalCrafted >= 1000 && !this.achievements.has('mass_producer')) {
        this.unlockAchievement('mass_producer', 'Mass Producer', 'Craft 1000 items', 'crafting');
      }

      // 建造成就
      const totalBuilt = Object.values(this.stats.buildingsBuilt).reduce((sum, count) => sum + count, 0);
      if (totalBuilt >= 100 && !this.achievements.has('architect')) {
        this.unlockAchievement('architect', 'Architect', 'Build 100 structures', 'building');
      }
    } catch (error) {
      this.handleError(error, 'checkAchievements');
    }
  }

  /**
   * 计算用户等级
   */
  private calculateLevel(): number {
    const techCount = this.unlockedTechs.size;
    return Math.floor(techCount / 5) + 1;
  }

  /**
   * 计算经验值
   */
  private calculateExperience(): number {
    return this.unlockedTechs.size * 100 + this.achievements.size * 50;
  }

  /**
   * 获取进度设置
   */
  private getProgressSettings(): Record<string, unknown> {
    return {
      autoSave: true,
      showAchievements: true,
      trackStats: true
    };
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.progressCache.clear();
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      progress: this.progressCache.getStats()
    };
  }
}

// 导出单例实例以保持向后兼容
export const userProgressService = UserProgressService.getInstance();