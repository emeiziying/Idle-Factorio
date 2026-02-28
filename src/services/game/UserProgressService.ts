// 用户进度管理服务

import { warn as logWarn } from '@/utils/logger';

export class UserProgressService {
  private unlockedTechs: Set<string>;
  private readonly STORAGE_KEY = 'factorio_user_progress';

  constructor() {
    this.unlockedTechs = new Set();
    this.loadProgress();
  }

  // ========== 科技解锁管理 ==========

  // 检查科技是否已解锁
  isTechUnlocked(techId: string): boolean {
    return this.unlockedTechs.has(techId);
  }

  // 解锁单个科技
  unlockTech(techId: string): void {
    this.unlockedTechs.add(techId);
    this.saveProgress();
  }

  // 批量解锁科技
  unlockTechs(techIds: string[]): void {
    techIds.forEach(id => this.unlockedTechs.add(id));
    this.saveProgress();
  }

  // 获取所有已解锁科技ID
  getUnlockedTechs(): string[] {
    return Array.from(this.unlockedTechs);
  }

  // 重置用户进度
  resetProgress(): void {
    this.unlockedTechs.clear();
    this.saveProgress();
  }

  // 从存储加载进度
  private loadProgress(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        this.unlockedTechs = new Set(data.unlockedTechs || []);
      }
    } catch (error) {
      logWarn('Failed to load user progress:', error);
    }
  }

  // 保存进度到存储
  private saveProgress(): void {
    try {
      const data = {
        unlockedTechs: Array.from(this.unlockedTechs),
        lastUpdated: Date.now(),
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      logWarn('Failed to save user progress:', error);
    }
  }
}

// 注意：移除单例导出以支持依赖注入
