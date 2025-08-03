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
import type { RecipeService } from '@/services/crafting/RecipeService';
import type { DataService } from '@/services/core/DataService';
import type { Recipe } from '@/types';

export class TechUnlockService {
  // 解锁状态存储（仅配方和建筑，科技和物品使用 UserProgressService）
  private unlockedRecipes: Set<string> = new Set();
  private unlockedBuildings: Set<string> = new Set();

  private userProgressService: UserProgressService;
  private eventEmitter: TechEventEmitter;
  private treeService?: TechTreeService;
  private recipeService?: RecipeService;
  private dataService?: DataService;

  constructor(
    userProgressService: UserProgressService,
    eventEmitter: TechEventEmitter,
    treeService?: TechTreeService,
    recipeService?: RecipeService,
    dataService?: DataService
  ) {
    this.userProgressService = userProgressService;
    this.eventEmitter = eventEmitter;
    this.treeService = treeService;
    this.recipeService = recipeService;
    this.dataService = dataService;
  }

  /**
   * 初始化服务
   */
  async initialize(treeService?: TechTreeService, recipeService?: RecipeService, dataService?: DataService): Promise<void> {
    if (treeService) {
      this.treeService = treeService;
    }
    
    if (recipeService) {
      this.recipeService = recipeService;
    }
    
    if (dataService) {
      this.dataService = dataService;
    }
    

    // 从用户进度服务加载已解锁的内容
    await this.loadUnlockedContent();
  }

  /**
   * 从用户进度加载解锁状态
   */
  private async loadUnlockedContent(): Promise<void> {
    // 重建配方和建筑解锁内容（从科技推导）
    await this.rebuildUnlockedContent();
  }

  /**
   * 根据已解锁的科技重建解锁内容
   */
  private async rebuildUnlockedContent(): Promise<void> {
    this.unlockedRecipes.clear();
    this.unlockedBuildings.clear();

    // 添加初始解锁的内容
    await this.addInitialUnlocks();

    // 从每个已解锁的科技收集解锁内容
    const unlockedTechs = this.userProgressService.getUnlockedTechs();
    for (const techId of unlockedTechs) {
      const tech = this.treeService ? this.treeService.getTechnology(techId) : undefined;
      if (tech) {
        this.collectUnlocksFromTech(tech);
      }
    }
  }

  /**
   * 添加游戏开始时就解锁的内容
   * 基于科技系统：找到所有不需要科技解锁的配方和物品
   */
  private async addInitialUnlocks(): Promise<void> {
    if (!this.recipeService || !this.dataService) {
      console.warn('RecipeService 或 DataService 未初始化');
      return;
    }

    try {
      // 1. 获取所有配方和游戏数据
      const allRecipes = this.recipeService.getAllRecipes();
      const gameData = await this.dataService.loadGameData();

      // 2. 收集所有科技解锁的配方
      const techUnlockedRecipes = this.getTechUnlockedRecipes(gameData);

      // 3. 找到不需要科技解锁的配方（初始可用配方）
      // 同时过滤掉科技研究配方（category为technology的配方）
      // 以及非Nauvis星球的配方
      const initialRecipes = allRecipes.filter(recipe => 
        !techUnlockedRecipes.has(recipe.id) && 
        recipe.category !== 'technology' &&
        this.isNauvisRecipe(recipe)
      );

      // 4. 从初始配方中提取物品和建筑
      const initialItems = this.extractItemsFromRecipes(initialRecipes);
      const initialBuildings = this.extractBuildingsFromRecipes(initialRecipes);

      // 5. 应用结果
      this.userProgressService.unlockItems(initialItems);
      initialRecipes.forEach(recipe => this.unlockedRecipes.add(recipe.id));
      initialBuildings.forEach(building => this.unlockedBuildings.add(building));

      console.log('Initial unlocks applied:', {
        items: initialItems.length,
        recipes: initialRecipes.length,
        buildings: initialBuildings.length
      });
    } catch (error) {
      console.error('Failed to calculate initial unlocks:', error);
    }
  }

  /**
   * 收集所有科技解锁的配方ID
   */
  private getTechUnlockedRecipes(gameData: { items?: Array<{ category?: string; unlockedRecipes?: string[] }> }): Set<string> {
    const techUnlockedRecipes = new Set<string>();

    // 检查游戏数据中的科技信息
    if (gameData.items && Array.isArray(gameData.items)) {
      for (const item of gameData.items) {
        // 查找category为technology的物品
        if (item.category === 'technology' && item.unlockedRecipes && Array.isArray(item.unlockedRecipes)) {
          for (const recipeId of item.unlockedRecipes) {
            techUnlockedRecipes.add(recipeId);
          }
        }
      }
    }

    return techUnlockedRecipes;
  }

  /**
   * 从配方中提取所有输出物品
   */
  private extractItemsFromRecipes(recipes: Recipe[]): string[] {
    const items: string[] = [];

    for (const recipe of recipes) {
      if (recipe.out) {
        for (const itemId of Object.keys(recipe.out)) {
          if (!items.includes(itemId)) {
            items.push(itemId);
          }
        }
      }
    }

    return items;
  }

  /**
   * 检查配方是否可以在Nauvis星球使用
   * 通过检查配方的生产者(producers)的locations字段来判断
   */
  private isNauvisRecipe(recipe: Recipe): boolean {
    // 如果配方没有生产者，默认认为可以在Nauvis使用
    if (!recipe.producers || recipe.producers.length === 0) {
      return true;
    }

    // 检查是否有任何生产者支持Nauvis
    for (const producerId of recipe.producers) {
      const producer = this.getItemById(producerId);
      if (producer && producer.machine && producer.machine.locations) {
        // 如果找到任何一个支持nauvis的生产者，配方就可以在nauvis使用
        if (producer.machine.locations.includes('nauvis')) {
          return true;
        }
      } else {
        // 如果生产者没有location限制，认为它在所有地方都可用
        return true;
      }
    }

    // 只有当所有生产者都明确不支持nauvis时，才返回false
    return false;
  }

  /**
   * 从游戏数据中获取物品
   */
  private getItemById(itemId: string): any {
    if (!this.dataService) {
      return null;
    }
    
    const gameData = this.dataService.getGameData();
    if (gameData && gameData.items) {
      return gameData.items.find((item: any) => item.id === itemId);
    }
    
    return null;
  }

  /**
   * 从配方中提取建筑物品
   */
  private extractBuildingsFromRecipes(recipes: Recipe[]): string[] {
    const buildings: string[] = [];
    
    // 建筑物品的识别模式
    const buildingIndicators = [
      'furnace', 'chest', 'assembling-machine', 'miner', 'drill', 
      'inserter', 'belt', 'underground', 'splitter', 'boiler', 'steam-engine'
    ];

    for (const recipe of recipes) {
      if (recipe.out) {
        for (const itemId of Object.keys(recipe.out)) {
          // 检查是否是建筑物品
          const isBuilding = buildingIndicators.some(indicator => 
            itemId.includes(indicator)
          );
          
          if (isBuilding && !buildings.includes(itemId)) {
            buildings.push(itemId);
          }
        }
      }
    }

    return buildings;
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

    const tech = this.treeService ? this.treeService.getTechnology(techId) : undefined;
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
    const totalTechs = this.treeService ? this.treeService.getAllTechnologies().length : 0;
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
  async resetUnlocks(): Promise<void> {
    // 重置 UserProgressService
    this.userProgressService.resetProgress();

    // 重置本地管理的配方和建筑
    this.unlockedRecipes.clear();
    this.unlockedBuildings.clear();

    // 添加初始解锁
    await this.addInitialUnlocks();
  }
}
