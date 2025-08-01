/**
 * 科技解锁服务
 * 管理科技、物品、配方和建筑的解锁状态
 */

import type { Technology } from '@/types/technology';
import type { TechTreeService } from '@/services/technology/TechTreeService';
import {
  TechEventEmitter,
  TechEventType,
  type TechUnlockedEvent,
} from '@/services/technology/events';
import { UserProgressService } from '@/services/game/UserProgressService';

export class TechUnlockService {
  // 解锁状态存储（仅配方和建筑，科技和物品使用 UserProgressService）
  private unlockedRecipes: Set<string> = new Set();
  private unlockedBuildings: Set<string> = new Set();

  private userProgressService: UserProgressService;
  private eventEmitter: TechEventEmitter;
  private treeService?: TechTreeService;

  constructor(
    userProgressService: UserProgressService,
    eventEmitter: TechEventEmitter,
    treeService?: TechTreeService
  ) {
    this.userProgressService = userProgressService;
    this.eventEmitter = eventEmitter;
    this.treeService = treeService;
  }

  /**
   * 初始化服务
   */
  async initialize(treeService?: TechTreeService): Promise<void> {
    if (treeService) {
      this.treeService = treeService;
    }

    // 从用户进度服务加载已解锁的内容
    await this.loadUnlockedContent();
  }

  /**
   * 从用户进度加载解锁状态
   */
  private async loadUnlockedContent(): Promise<void> {
    // 重建配方和建筑解锁内容（从科技推导）
    this.rebuildUnlockedContent();
  }

  /**
   * 根据已解锁的科技重建解锁内容
   */
  private rebuildUnlockedContent(): void {
    this.unlockedRecipes.clear();
    this.unlockedBuildings.clear();

    // 添加初始解锁的内容
    this.addInitialUnlocks();

    // 从每个已解锁的科技收集解锁内容
    const unlockedTechs = this.userProgressService.getUnlockedTechs();
    for (const techId of unlockedTechs) {
      const tech = this.treeService?.getTechnology(techId);
      if (tech) {
        this.collectUnlocksFromTech(tech);
      }
    }
  }

  /**
   * 添加游戏开始时就解锁的内容
   */
  private addInitialUnlocks(): void {
    // 初始物品（委托给 UserProgressService）
    const initialItems = [
      'iron-plate',
      'copper-plate',
      'iron-gear-wheel',
      'stone-furnace',
      'wooden-chest',
    ];
    this.userProgressService.unlockItems(initialItems);

    // 初始配方
    const initialRecipes = ['iron-plate', 'copper-plate', 'iron-gear-wheel', 'wooden-chest'];
    initialRecipes.forEach(recipe => this.unlockedRecipes.add(recipe));

    // 初始建筑
    const initialBuildings = ['stone-furnace', 'wooden-chest'];
    initialBuildings.forEach(building => this.unlockedBuildings.add(building));
  }

  /**
   * 从科技收集解锁内容
   */
  private collectUnlocksFromTech(tech: Technology): void {
    if (tech.unlocks.items) {
      // 物品解锁委托给 UserProgressService
      this.userProgressService.unlockItems(tech.unlocks.items);
    }

    if (tech.unlocks.recipes) {
      tech.unlocks.recipes.forEach(recipe => this.unlockedRecipes.add(recipe));
    }

    if (tech.unlocks.buildings) {
      tech.unlocks.buildings.forEach(building => this.unlockedBuildings.add(building));
    }
  }

  // ========== 查询方法 ==========

  /**
   * 检查科技是否已解锁（委托给 UserProgressService）
   */
  isTechUnlocked(techId: string): boolean {
    return this.userProgressService.isTechUnlocked(techId);
  }

  /**
   * 检查物品是否已解锁（委托给 UserProgressService）
   */
  isItemUnlocked(itemId: string): boolean {
    return this.userProgressService.isItemUnlocked(itemId);
  }

  /**
   * 检查配方是否已解锁
   */
  isRecipeUnlocked(recipeId: string): boolean {
    return this.unlockedRecipes.has(recipeId);
  }

  /**
   * 检查建筑是否已解锁
   */
  isBuildingUnlocked(buildingId: string): boolean {
    return this.unlockedBuildings.has(buildingId);
  }

  /**
   * 获取所有已解锁的科技ID（委托给 UserProgressService）
   */
  getUnlockedTechs(): Set<string> {
    return new Set(this.userProgressService.getUnlockedTechs());
  }

  /**
   * 获取所有已解锁的物品ID（委托给 UserProgressService）
   */
  getUnlockedItems(): string[] {
    return this.userProgressService.getUnlockedItems();
  }

  /**
   * 获取所有已解锁的配方ID
   */
  getUnlockedRecipes(): string[] {
    return Array.from(this.unlockedRecipes);
  }

  /**
   * 获取所有已解锁的建筑ID
   */
  getUnlockedBuildings(): string[] {
    return Array.from(this.unlockedBuildings);
  }

  // ========== 解锁操作 ==========

  /**
   * 解锁科技及其所有内容
   */
  unlockTechnology(techId: string): void {
    if (this.userProgressService.isTechUnlocked(techId)) {
      return; // 已经解锁
    }

    const tech = this.treeService?.getTechnology(techId);
    if (!tech) {
      throw new Error(`Technology ${techId} not found`);
    }

    // 解锁科技（委托给 UserProgressService）
    this.userProgressService.unlockTech(techId);

    // 收集新解锁的内容
    const newItems: string[] = [];
    const newRecipes: string[] = [];
    const newBuildings: string[] = [];

    // 解锁物品（委托给 UserProgressService）
    if (tech.unlocks.items) {
      tech.unlocks.items.forEach((itemId: string) => {
        if (!this.userProgressService.isItemUnlocked(itemId)) {
          this.userProgressService.unlockItem(itemId);
          newItems.push(itemId);
        }
      });
    }

    // 解锁配方
    if (tech.unlocks.recipes) {
      tech.unlocks.recipes.forEach((recipeId: string) => {
        if (!this.unlockedRecipes.has(recipeId)) {
          this.unlockedRecipes.add(recipeId);
          newRecipes.push(recipeId);
        }
      });
    }

    // 解锁建筑
    if (tech.unlocks.buildings) {
      tech.unlocks.buildings.forEach((buildingId: string) => {
        if (!this.unlockedBuildings.has(buildingId)) {
          this.unlockedBuildings.add(buildingId);
          newBuildings.push(buildingId);
        }
      });
    }

    // 发送解锁事件
    this.eventEmitter.emit<TechUnlockedEvent>(TechEventType.TECH_UNLOCKED, {
      timestamp: Date.now(),
      techId,
      unlockedItems: newItems,
      unlockedRecipes: newRecipes,
      unlockedBuildings: newBuildings,
    });
  }

  /**
   * 获取科技解锁的内容信息
   */
  getUnlockedContentInfo(technology: Technology): {
    items: Array<{ id: string; name: string }>;
    recipes: Array<{ id: string; name: string }>;
    buildings: Array<{ id: string; name: string }>;
    total: number;
  } {
    // 这里简化处理，实际应该从 DataService 获取名称
    const items = (technology.unlocks.items || []).map(id => ({
      id,
      name: id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    }));

    const recipes = (technology.unlocks.recipes || []).map(id => ({
      id,
      name: id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    }));

    const buildings = (technology.unlocks.buildings || []).map(id => ({
      id,
      name: id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    }));

    return {
      items,
      recipes,
      buildings,
      total: items.length + recipes.length + buildings.length,
    };
  }

  /**
   * 获取解锁统计信息
   */
  getUnlockStatistics(): {
    totalTechs: number;
    unlockedTechs: number;
    unlockedItems: number;
    unlockedRecipes: number;
    unlockedBuildings: number;
    progress: number;
  } {
    const totalTechs = this.treeService?.getAllTechnologies().length || 0;
    const unlockedTechs = this.userProgressService.getUnlockedTechs().length;

    return {
      totalTechs,
      unlockedTechs,
      unlockedItems: this.userProgressService.getUnlockedItems().length,
      unlockedRecipes: this.unlockedRecipes.size,
      unlockedBuildings: this.unlockedBuildings.size,
      progress: totalTechs > 0 ? unlockedTechs / totalTechs : 0,
    };
  }

  /**
   * 重置所有解锁状态（用于新游戏）
   */
  resetUnlocks(): void {
    // 重置 UserProgressService
    this.userProgressService.resetProgress();

    // 重置本地管理的配方和建筑
    this.unlockedRecipes.clear();
    this.unlockedBuildings.clear();

    // 添加初始解锁
    this.addInitialUnlocks();
  }
}
