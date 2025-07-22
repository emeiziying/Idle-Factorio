// 用户进度服务 - 管理游戏解锁状态
export class UserProgressService {
  private static instance: UserProgressService;
  private unlockedItems: Set<string>;
  private unlockedRecipes: Set<string>;
  private unlockedTechnologies: Set<string>;
  private readonly STORAGE_KEY = 'factorio-user-progress';

  private constructor() {
    this.unlockedItems = new Set();
    this.unlockedRecipes = new Set();
    this.unlockedTechnologies = new Set();
    this.loadProgress();
    this.initializeDefaultUnlocks();
  }

  public static getInstance(): UserProgressService {
    if (!UserProgressService.instance) {
      UserProgressService.instance = new UserProgressService();
    }
    return UserProgressService.instance;
  }

  // 初始化默认解锁的物品
  private initializeDefaultUnlocks(): void {
    // 默认解锁的基础物品
    const defaultUnlockedItems = [
      'iron-ore',
      'copper-ore',
      'coal',
      'stone',
      'wood',
      'water',
      'steam',
      'iron-plate',
      'copper-plate',
      'steel-plate',
      'iron-gear-wheel',
      'electronic-circuit',
      'copper-cable',
      'pipe',
      'transport-belt',
      'automation-science-pack',
      'burner-mining-drill',
      'electric-mining-drill',
      'stone-furnace',
      'assembling-machine-1',
      'offshore-pump',
      'boiler',
      'steam-engine',
      'lab'
    ];

    // 默认解锁的基础配方
    const defaultUnlockedRecipes = [
      'iron-plate',
      'copper-plate',
      'steel-plate',
      'iron-gear-wheel',
      'electronic-circuit',
      'copper-cable',
      'pipe',
      'transport-belt',
      'automation-science-pack',
      'burner-mining-drill',
      'electric-mining-drill',
      'stone-furnace',
      'assembling-machine-1',
      'offshore-pump',
      'boiler',
      'steam-engine',
      'lab'
    ];

    // 如果是新用户，设置默认解锁
    if (this.unlockedItems.size === 0) {
      defaultUnlockedItems.forEach(item => this.unlockedItems.add(item));
      defaultUnlockedRecipes.forEach(recipe => this.unlockedRecipes.add(recipe));
      this.saveProgress();
    }
  }

  // 检查物品是否解锁
  public isItemUnlocked(itemId: string): boolean {
    return this.unlockedItems.has(itemId);
  }

  // 检查配方是否解锁
  public isRecipeUnlocked(recipeId: string): boolean {
    return this.unlockedRecipes.has(recipeId);
  }

  // 检查科技是否解锁
  public isTechnologyUnlocked(techId: string): boolean {
    return this.unlockedTechnologies.has(techId);
  }

  // 解锁物品
  public unlockItem(itemId: string): void {
    this.unlockedItems.add(itemId);
    this.saveProgress();
  }

  // 解锁配方
  public unlockRecipe(recipeId: string): void {
    this.unlockedRecipes.add(recipeId);
    this.saveProgress();
  }

  // 解锁科技
  public unlockTechnology(techId: string): void {
    this.unlockedTechnologies.add(techId);
    this.saveProgress();
  }

  // 批量解锁物品
  public unlockItems(itemIds: string[]): void {
    itemIds.forEach(id => this.unlockedItems.add(id));
    this.saveProgress();
  }

  // 批量解锁配方
  public unlockRecipes(recipeIds: string[]): void {
    recipeIds.forEach(id => this.unlockedRecipes.add(id));
    this.saveProgress();
  }

  // 获取所有解锁的物品ID
  public getUnlockedItems(): string[] {
    return Array.from(this.unlockedItems);
  }

  // 获取所有解锁的配方ID
  public getUnlockedRecipes(): string[] {
    return Array.from(this.unlockedRecipes);
  }

  // 获取所有解锁的科技ID
  public getUnlockedTechnologies(): string[] {
    return Array.from(this.unlockedTechnologies);
  }

  // 保存进度到localStorage
  private saveProgress(): void {
    const progress = {
      unlockedItems: Array.from(this.unlockedItems),
      unlockedRecipes: Array.from(this.unlockedRecipes),
      unlockedTechnologies: Array.from(this.unlockedTechnologies),
      version: 1
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
  }

  // 从localStorage加载进度
  private loadProgress(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const progress = JSON.parse(saved);
        this.unlockedItems = new Set(progress.unlockedItems || []);
        this.unlockedRecipes = new Set(progress.unlockedRecipes || []);
        this.unlockedTechnologies = new Set(progress.unlockedTechnologies || []);
      } catch (error) {
        console.error('Failed to load progress:', error);
      }
    }
  }

  // 重置进度
  public resetProgress(): void {
    this.unlockedItems.clear();
    this.unlockedRecipes.clear();
    this.unlockedTechnologies.clear();
    this.initializeDefaultUnlocks();
  }

  // 导出进度
  public exportProgress(): string {
    return JSON.stringify({
      unlockedItems: Array.from(this.unlockedItems),
      unlockedRecipes: Array.from(this.unlockedRecipes),
      unlockedTechnologies: Array.from(this.unlockedTechnologies),
      version: 1,
      timestamp: new Date().toISOString()
    });
  }

  // 导入进度
  public importProgress(data: string): boolean {
    try {
      const progress = JSON.parse(data);
      if (progress.version === 1) {
        this.unlockedItems = new Set(progress.unlockedItems || []);
        this.unlockedRecipes = new Set(progress.unlockedRecipes || []);
        this.unlockedTechnologies = new Set(progress.unlockedTechnologies || []);
        this.saveProgress();
        return true;
      }
    } catch (error) {
      console.error('Failed to import progress:', error);
    }
    return false;
  }
}