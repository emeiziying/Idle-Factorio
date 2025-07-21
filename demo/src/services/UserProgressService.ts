class UserProgressService {
  private static instance: UserProgressService;
  private unlockedItems: Set<string>;
  private readonly STORAGE_KEY = 'factorio_unlocked_items';

  private constructor() {
    this.unlockedItems = new Set();
    this.loadProgress();
  }

  static getInstance(): UserProgressService {
    if (!UserProgressService.instance) {
      UserProgressService.instance = new UserProgressService();
    }
    return UserProgressService.instance;
  }

  private loadProgress() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const items = JSON.parse(saved);
        this.unlockedItems = new Set(items);
      } else {
        // 初始解锁的物品
        this.initializeDefaultUnlockedItems();
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
      this.initializeDefaultUnlockedItems();
    }
  }

  private saveProgress() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(this.unlockedItems)));
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }

  private initializeDefaultUnlockedItems() {
    // 默认解锁的基础物品
    const defaultUnlocked = [
      // 基础资源
      'wood', 'coal', 'stone', 'iron-ore', 'copper-ore',
      // 基础材料
      'iron-plate', 'copper-plate', 'stone-brick',
      // 基础工具
      'wooden-chest', 'stone-furnace', 'burner-mining-drill',
      // 基础物流
      'transport-belt', 'burner-inserter',
      // 基础生产
      'assembling-machine-1',
      // 基础科技
      'automation-science-pack', 'lab'
    ];
    
    this.unlockedItems = new Set(defaultUnlocked);
    this.saveProgress();
  }

  isItemUnlocked(itemId: string): boolean {
    return this.unlockedItems.has(itemId);
  }

  unlockItem(itemId: string) {
    this.unlockedItems.add(itemId);
    this.saveProgress();
  }

  unlockItems(itemIds: string[]) {
    itemIds.forEach(id => this.unlockedItems.add(id));
    this.saveProgress();
  }

  getUnlockedItems(): string[] {
    return Array.from(this.unlockedItems);
  }

  resetProgress() {
    this.initializeDefaultUnlockedItems();
  }
}

export default UserProgressService;