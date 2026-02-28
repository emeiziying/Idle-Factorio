export class UserProgressService {
  private unlockedTechs: Set<string>;

  constructor() {
    this.unlockedTechs = new Set();
  }

  // ========== 科技解锁管理 ==========

  // 检查科技是否已解锁
  isTechUnlocked(techId: string): boolean {
    return this.unlockedTechs.has(techId);
  }

  // 解锁单个科技
  unlockTech(techId: string): void {
    this.unlockedTechs.add(techId);
  }

  // 批量解锁科技
  unlockTechs(techIds: string[]): void {
    techIds.forEach(id => this.unlockedTechs.add(id));
  }

  // 获取所有已解锁科技ID
  getUnlockedTechs(): string[] {
    return Array.from(this.unlockedTechs);
  }

  // 重置用户进度
  resetProgress(): void {
    this.unlockedTechs.clear();
  }

  // 使用主存档作为单一持久化来源，由外部在初始化阶段显式恢复。
  hydrate(unlockedTechs: Iterable<string>): void {
    this.unlockedTechs = new Set(unlockedTechs);
  }
}

// 注意：移除单例导出以支持依赖注入
