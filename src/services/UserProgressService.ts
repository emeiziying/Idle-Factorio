// 用户进度管理服务

class UserProgressService {
  private static instance: UserProgressService;
  private unlockedItems: Set<string>;
  private unlockedTechs: Set<string>;
  private readonly STORAGE_KEY = 'factorio_user_progress';

  private constructor() {
    this.unlockedItems = new Set();
    this.unlockedTechs = new Set();
    this.loadProgress();
    this.initializeDefaultUnlocks();
  }

  static getInstance(): UserProgressService {
    if (!UserProgressService.instance) {
      UserProgressService.instance = new UserProgressService();
    }
    return UserProgressService.instance;
  }

  // 检查物品是否已解锁
  isItemUnlocked(itemId: string): boolean {
    return this.unlockedItems.has(itemId);
  }

  // 解锁单个物品
  unlockItem(itemId: string): void {
    this.unlockedItems.add(itemId);
    this.saveProgress();
  }

  // 批量解锁物品
  unlockItems(itemIds: string[]): void {
    itemIds.forEach(id => this.unlockedItems.add(id));
    this.saveProgress();
  }

  // 获取所有已解锁物品ID
  getUnlockedItems(): string[] {
    return Array.from(this.unlockedItems);
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
    this.unlockedItems.clear();
    this.unlockedTechs.clear();
    this.initializeDefaultUnlocks();
    this.saveProgress();
  }

  // 从存储加载进度
  private loadProgress(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        this.unlockedItems = new Set(data.unlockedItems || []);
        this.unlockedTechs = new Set(data.unlockedTechs || []);
      }
    } catch (error) {
      console.warn('Failed to load user progress:', error);
    }
  }

  // 保存进度到存储
  private saveProgress(): void {
    try {
      const data = {
        unlockedItems: Array.from(this.unlockedItems),
        unlockedTechs: Array.from(this.unlockedTechs),
        lastUpdated: Date.now()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save user progress:', error);
    }
  }

  // 初始化默认解锁物品
  private initializeDefaultUnlocks(): void {
    const defaultUnlocks = [
      // 基础资源
      'coal', 'iron-ore', 'copper-ore', 'stone', 'wood', 'water',
      // 基础材料
      'iron-plate', 'copper-plate', 'steel-plate', 'stone-brick',
      // 基础组件
      'iron-gear-wheel', 'copper-cable', 'electronic-circuit',
      // 基础工具和武器
      'iron-axe', 'iron-pickaxe', 'pistol', 'firearm-magazine',
      // 基础建筑材料
      'pipe', 'pipe-to-ground', 'transport-belt', 'underground-belt',
      // 基础设施
      'burner-mining-drill', 'stone-furnace', 'boiler', 'steam-engine',
      // 基础容器
      'wooden-chest', 'iron-chest'
    ];

    defaultUnlocks.forEach(itemId => {
      this.unlockedItems.add(itemId);
    });
  }
}

export default UserProgressService;