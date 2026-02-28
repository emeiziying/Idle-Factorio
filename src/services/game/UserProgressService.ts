// 用户进度管理服务
// 当前阶段仅作为科技解锁状态的内存容器，持久化由统一存档负责。

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

  // 使用快照状态替换当前进度
  replaceUnlockedTechs(techIds: Iterable<string>): void {
    this.unlockedTechs = new Set(techIds);
  }

  // 重置用户进度
  resetProgress(): void {
    this.unlockedTechs.clear();
  }
}

// 注意：移除单例导出以支持依赖注入
