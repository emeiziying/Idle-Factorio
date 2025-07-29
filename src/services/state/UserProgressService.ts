/**
 * 用户进度管理服务（重构版）
 * 使用装饰器和服务工厂模式
 */
import { ServiceFactory } from '../base/ServiceFactory';
import { StorageManager } from '../base/StorageManager';
import { ServiceLocator } from '../ServiceLocator';
import type { DataService } from '../DataService';
import { warn as logWarn } from '../../utils/logger';

interface UserProgress {
  unlockedItems: string[];
  unlockedTechs: string[];
  unlockedRecipes: string[];
  researchedTechnologies: string[];
  savedBuildings: any[];
  lastUpdated: number;
}

export class UserProgressService {
  private dataService!: DataService;
  private storageManager!: StorageManager;
  private unlockedItems: Set<string>;
  private unlockedTechs: Set<string>;
  private unlockedRecipes: Set<string>;
  private readonly STORAGE_KEY = 'user_progress';

  // 静态方法，保持向后兼容
  static getInstance(): UserProgressService {
    return ServiceFactory.create<UserProgressService>('UserProgressService');
  }

  constructor() {
    this.unlockedItems = new Set();
    this.unlockedTechs = new Set();
    this.unlockedRecipes = new Set();
    
    // 手动注入存储管理器
    this.storageManager = StorageManager.getInstance();
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    // 延迟注入 DataService 避免循环依赖
    if (ServiceLocator.has('DataService')) {
      this.dataService = ServiceLocator.get<DataService>('DataService');
    }
    await this.loadProgress();
  }

  // ========== 物品解锁管理 ==========

  /**
   * 检查物品是否已解锁
   */
  isItemUnlocked(itemId: string): boolean {
    return this.unlockedItems.has(itemId);
  }

  /**
   * 解锁单个物品
   */
  unlockItem(itemId: string): void {
    this.unlockedItems.add(itemId);
    this.saveProgress();
  }

  /**
   * 批量解锁物品
   */
  unlockItems(itemIds: string[]): void {
    itemIds.forEach(id => this.unlockedItems.add(id));
    this.saveProgress();
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
    return this.unlockedTechs.has(techId);
  }

  /**
   * 解锁单个科技
   */
  unlockTech(techId: string): void {
    this.unlockedTechs.add(techId);
    
    // 解锁科技关联的配方
    this.unlockTechRecipes(techId);
    
    this.saveProgress();
  }

  /**
   * 批量解锁科技
   */
  unlockTechs(techIds: string[]): void {
    techIds.forEach(id => {
      this.unlockedTechs.add(id);
      this.unlockTechRecipes(id);
    });
    this.saveProgress();
  }

  /**
   * 获取所有已解锁科技ID
   */
  getUnlockedTechs(): string[] {
    return Array.from(this.unlockedTechs);
  }

  // ========== 配方解锁管理 ==========

  /**
   * 检查配方是否已解锁
   */
  isRecipeUnlocked(recipeId: string): boolean {
    return this.unlockedRecipes.has(recipeId);
  }

  /**
   * 解锁单个配方
   */
  unlockRecipe(recipeId: string): void {
    this.unlockedRecipes.add(recipeId);
    this.saveProgress();
  }

  /**
   * 批量解锁配方
   */
  unlockRecipes(recipeIds: string[]): void {
    recipeIds.forEach(id => this.unlockedRecipes.add(id));
    this.saveProgress();
  }

  /**
   * 获取所有已解锁配方ID
   */
  getUnlockedRecipes(): string[] {
    return Array.from(this.unlockedRecipes);
  }

  /**
   * 解锁科技相关的配方
   */
  private unlockTechRecipes(_techId: string): void {
    // TODO: 实现科技解锁配方的逻辑
    // 这里需要从科技数据中获取相关配方
  }

  // ========== 进度管理 ==========

  /**
   * 获取用户进度（兼容性方法）
   */
  getProgress(): {
    unlockedRecipes: string[];
    researchedTechnologies: string[];
    savedBuildings: any[];
  } {
    return {
      unlockedRecipes: this.getUnlockedRecipes(),
      researchedTechnologies: this.getUnlockedTechs(),
      savedBuildings: [] // 暂时返回空数组
    };
  }

  /**
   * 获取完整的用户进度
   */
  getFullProgress(): UserProgress {
    return {
      unlockedItems: this.getUnlockedItems(),
      unlockedTechs: this.getUnlockedTechs(),
      unlockedRecipes: this.getUnlockedRecipes(),
      researchedTechnologies: this.getUnlockedTechs(),
      savedBuildings: [],
      lastUpdated: Date.now()
    };
  }

  /**
   * 重置用户进度
   */
  resetProgress(): void {
    this.unlockedItems.clear();
    this.unlockedTechs.clear();
    this.unlockedRecipes.clear();
    this.saveProgress();
  }

  /**
   * 导入进度
   */
  importProgress(progress: Partial<UserProgress>): void {
    if (progress.unlockedItems) {
      this.unlockedItems = new Set(progress.unlockedItems);
    }
    if (progress.unlockedTechs) {
      this.unlockedTechs = new Set(progress.unlockedTechs);
    }
    if (progress.unlockedRecipes) {
      this.unlockedRecipes = new Set(progress.unlockedRecipes);
    }
    this.saveProgress();
  }

  // ========== 存储管理 ==========

  /**
   * 从存储加载进度
   */
  private async loadProgress(): Promise<void> {
    try {
      const saved = this.storageManager.get<UserProgress>(this.STORAGE_KEY);
      if (saved) {
        this.unlockedItems = new Set(saved.unlockedItems || []);
        this.unlockedTechs = new Set(saved.unlockedTechs || []);
        this.unlockedRecipes = new Set(saved.unlockedRecipes || []);
      }
    } catch (error) {
      logWarn('Failed to load user progress:', error);
    }
  }

  /**
   * 保存进度到存储
   */
  private saveProgress(): void {
    try {
      const progress = this.getFullProgress();
      this.storageManager.set(this.STORAGE_KEY, progress);
    } catch (error) {
      logWarn('Failed to save user progress:', error);
    }
  }

  /**
   * 获取进度统计
   */
  getProgressStats(): {
    totalItems: number;
    unlockedItems: number;
    totalTechs: number;
    unlockedTechs: number;
    totalRecipes: number;
    unlockedRecipes: number;
    completionRate: number;
  } {
    // 从 DataService 获取总数
    const totalItems = this.dataService?.getAllItems().length || 0;
    const totalRecipes = this.dataService?.getRecipes().length || 0;
    const totalTechs = 100; // TODO: 从科技服务获取
    
    const unlockedItems = this.unlockedItems.size;
    const unlockedTechs = this.unlockedTechs.size;
    const unlockedRecipes = this.unlockedRecipes.size;
    
    const total = totalItems + totalTechs + totalRecipes;
    const unlocked = unlockedItems + unlockedTechs + unlockedRecipes;
    const completionRate = total > 0 ? (unlocked / total) * 100 : 0;
    
    return {
      totalItems,
      unlockedItems,
      totalTechs,
      unlockedTechs,
      totalRecipes,
      unlockedRecipes,
      completionRate: Math.round(completionRate * 100) / 100
    };
  }

  /**
   * 检查是否为新玩家
   */
  isNewPlayer(): boolean {
    return this.unlockedItems.size === 0 && 
           this.unlockedTechs.size === 0 && 
           this.unlockedRecipes.size === 0;
  }

  /**
   * 初始化新玩家
   */
  initializeNewPlayer(): void {
    // 解锁基础物品
    const basicItems = [
      'wood',
      'stone',
      'iron-ore',
      'copper-ore',
      'coal'
    ];
    this.unlockItems(basicItems);
    
    // 解锁基础配方
    const basicRecipes = [
      'wooden-chest',
      'stone-furnace',
      'burner-mining-drill'
    ];
    this.unlockRecipes(basicRecipes);
    
    this.saveProgress();
  }
}