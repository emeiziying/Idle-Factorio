// 游戏数据管理服务

import type { GameData, Item, Recipe, Category } from '../../types/index';
import { ServiceLocator, SERVICE_NAMES } from '../utils/ServiceLocator';
import type { TechnologyService } from './TechnologyService';
import { error as logError } from '../../utils/logger';
import { BaseService } from '../base/BaseService';
import { CacheManager } from '../base/CacheManager';

// 异步导入游戏数据
import gameData from '../../data/spa/data.json';

interface I18nData {
  categories: Record<string, string>;
  items: Record<string, string>;
  recipes: Record<string, string>;
  locations: Record<string, string>;
  technologies?: Record<string, string>; // 可选，如果没有则回退到 recipes 字段
}

export class DataService extends BaseService {
  private gameData: GameData | null = null;
  private i18nData: I18nData | null = null;
  private i18nLoadingPromise: Promise<I18nData> | null = null;
  private gameDataLoadingPromise: Promise<GameData> | null = null;
  
  // 使用统一的缓存管理器
  private itemsByRowCache = new CacheManager<string, Map<number, Item[]>>();
  private itemUnlockedCache = new CacheManager<string, boolean>();

  protected constructor() {
    super();
    this.initializeDependencies();
  }
  
  // 清理解锁缓存（当科技状态改变时调用）
  public clearUnlockCache(): void {
    this.itemUnlockedCache.clear();
  }
  
  // 性能优化：带缓存的物品解锁检查
  private isItemUnlockedCached(itemId: string): boolean {
    const cached = this.itemUnlockedCache.get(itemId);
    if (cached !== undefined) {
      return cached;
    }
    
    const result = this.isItemUnlocked(itemId);
    this.itemUnlockedCache.set(itemId, result);
    
    return result;
  }

  // 加载游戏数据 - 改为异步import
  async loadGameData(): Promise<GameData> {
    return this.safeAsync(async () => {
      // 如果数据已加载，直接返回
      if (this.gameData) {
        return this.gameData;
      }

      // 如果正在加载中，返回同一个Promise
      if (this.gameDataLoadingPromise) {
        return this.gameDataLoadingPromise;
      }

      // 开始新的加载过程
      this.gameDataLoadingPromise = this.doLoadGameData();
      
      try {
        const result = await this.gameDataLoadingPromise;
        return result;
      } finally {
        // 加载完成后清除Promise缓存
        this.gameDataLoadingPromise = null;
      }
    }, 'loadGameData', {} as GameData);
  }

  private async doLoadGameData(): Promise<GameData> {
    try {
      // 直接使用导入的数据，无需fetch
      this.gameData = gameData as unknown as GameData;
      
      // 性能优化：数据加载后清理缓存
      this.itemsByRowCache.clear();
      this.itemUnlockedCache.clear();
      
      return this.gameData;
    } catch (error) {
      logError('Failed to load game data:', error);
      throw error;
    }
  }

  // 获取游戏数据
  getGameData(): GameData | null {
    return this.gameData;
  }

  // 异步加载本地化数据
  async loadI18nData(locale: string = 'zh'): Promise<I18nData> {
    return this.safeAsync(async () => {
      // 如果数据已加载，直接返回
      if (this.i18nData) {
        return this.i18nData;
      }

      // 如果正在加载中，返回同一个Promise
      if (this.i18nLoadingPromise) {
        return this.i18nLoadingPromise;
      }

      // 开始新的加载过程
      this.i18nLoadingPromise = this.doLoadI18nData(locale);
      
      try {
        const result = await this.i18nLoadingPromise;
        return result;
      } finally {
        // 加载完成后清除Promise缓存
        this.i18nLoadingPromise = null;
      }
    }, 'loadI18nData', {} as I18nData);
  }

  private async doLoadI18nData(locale: string): Promise<I18nData> {
    try {
      const response = await fetch(`/src/data/spa/${locale}.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch i18n data: ${response.status}`);
      }
      
      this.i18nData = await response.json();
      return this.i18nData!;
    } catch (error) {
      logError(`Failed to load i18n data for locale ${locale}:`, error);
      throw error;
    }
  }

  // 获取物品数据
  getItems(): Item[] {
    return this.gameData?.items || [];
  }

  // 获取配方数据
  getRecipes(): Recipe[] {
    return this.gameData?.recipes || [];
  }

  // 获取分类数据
  getCategories(): Category[] {
    return this.gameData?.categories || [];
  }

  // 通过ID获取物品
  getItemById(id: string): Item | undefined {
    return this.getItems().find(item => item.id === id);
  }

  // 通过ID获取配方
  getRecipeById(id: string): Recipe | undefined {
    return this.getRecipes().find(recipe => recipe.id === id);
  }

  // 通过ID获取分类
  getCategoryById(id: string): Category | undefined {
    return this.getCategories().find(category => category.id === id);
  }

  // 物品本地化名称
  getItemName(itemId: string): string {
    return this.i18nData?.items[itemId] || itemId;
  }

  // 配方本地化名称
  getRecipeName(recipeId: string): string {
    return this.i18nData?.recipes[recipeId] || recipeId;
  }

  // 分类本地化名称
  getCategoryName(categoryId: string): string {
    return this.i18nData?.categories[categoryId] || categoryId;
  }

  // 科技本地化名称
  getTechnologyName(technologyId: string): string {
    return this.i18nData?.technologies?.[technologyId] || 
           this.i18nData?.recipes?.[technologyId] || 
           technologyId;
  }

  // 位置本地化名称
  getLocationName(locationId: string): string {
    return this.i18nData?.locations[locationId] || locationId;
  }

  // 通过分类获取物品，支持缓存
  getItemsByCategory(categoryId: string): Item[] {
    const cacheKey = `category_${categoryId}`;
    const cached = this.itemsByRowCache.get(cacheKey);
    if (cached) {
      return Array.from(cached.values()).flat();
    }

    const items = this.getItems().filter(item => item.category === categoryId);
    const itemMap = new Map<number, Item[]>();
    itemMap.set(0, items);
    this.itemsByRowCache.set(cacheKey, itemMap);
    
    return items;
  }

  // 通过行获取物品（用于UI显示），支持缓存
  getItemsByRow(categoryId: string, row: number): Item[] {
    const cacheKey = `${categoryId}_row_${row}`;
    const cached = this.itemsByRowCache.get(cacheKey);
    if (cached) {
      const rowItems = cached.get(row);
      if (rowItems) {
        return rowItems;
      }
    }

    // 计算该行的物品
    const categoryItems = this.getItemsByCategory(categoryId);
    const itemsPerRow = 8; // 每行显示的物品数量
    const startIndex = row * itemsPerRow;
    const endIndex = startIndex + itemsPerRow;
    const rowItems = categoryItems.slice(startIndex, endIndex);

    // 更新缓存
    let categoryCache = this.itemsByRowCache.get(cacheKey);
    if (!categoryCache) {
      categoryCache = new Map<number, Item[]>();
      this.itemsByRowCache.set(cacheKey, categoryCache);
    }
    categoryCache.set(row, rowItems);

    return rowItems;
  }

  // 检查物品是否已解锁
  isItemUnlocked(itemId: string): boolean {
    try {
      // 获取科技服务
      if (!ServiceLocator.has(SERVICE_NAMES.TECHNOLOGY)) {
        return true; // 如果科技服务未初始化，默认解锁
      }
      
      const technologyService = ServiceLocator.get<TechnologyService>(SERVICE_NAMES.TECHNOLOGY);
      return technologyService.isItemUnlocked(itemId);
    } catch (error) {
      this.handleError(error, 'isItemUnlocked');
      return true; // 默认解锁
    }
  }

  // 检查配方是否已解锁
  isRecipeUnlocked(recipeId: string): boolean {
    try {
      // 获取科技服务
      if (!ServiceLocator.has(SERVICE_NAMES.TECHNOLOGY)) {
        return true; // 如果科技服务未初始化，默认解锁
      }
      
      const technologyService = ServiceLocator.get<TechnologyService>(SERVICE_NAMES.TECHNOLOGY);
      return technologyService.isRecipeUnlocked(recipeId);
    } catch (error) {
      this.handleError(error, 'isRecipeUnlocked');
      return true; // 默认解锁
    }
  }

  // 获取已解锁的物品，支持缓存
  getUnlockedItems(): Item[] {
    const cacheKey = 'unlocked_items';
    const cached = this.itemsByRowCache.get(cacheKey);
    if (cached) {
      return Array.from(cached.values()).flat();
    }

    const unlockedItems = this.getItems().filter(item => this.isItemUnlockedCached(item.id));
    const itemMap = new Map<number, Item[]>();
    itemMap.set(0, unlockedItems);
    this.itemsByRowCache.set(cacheKey, itemMap);
    
    return unlockedItems;
  }

  // 获取已解锁的配方
  getUnlockedRecipes(): Recipe[] {
    return this.getRecipes().filter(recipe => this.isRecipeUnlocked(recipe.id));
  }

  // 搜索物品
  searchItems(query: string): Item[] {
    const lowerQuery = query.toLowerCase();
    return this.getItems().filter(item => {
      const itemName = this.getItemName(item.id).toLowerCase();
      return itemName.includes(lowerQuery) || item.id.toLowerCase().includes(lowerQuery);
    });
  }

  // 搜索配方
  searchRecipes(query: string): Recipe[] {
    const lowerQuery = query.toLowerCase();
    return this.getRecipes().filter(recipe => {
      const recipeName = this.getRecipeName(recipe.id).toLowerCase();
      return recipeName.includes(lowerQuery) || recipe.id.toLowerCase().includes(lowerQuery);
    });
  }

  // 获取物品的生产配方
  getProductionRecipes(itemId: string): Recipe[] {
    return this.getRecipes().filter(recipe => 
      recipe.out && Object.keys(recipe.out).includes(itemId)
    );
  }

  // 获取物品的消费配方
  getConsumptionRecipes(itemId: string): Recipe[] {
    return this.getRecipes().filter(recipe => 
      recipe.in && Object.keys(recipe.in).includes(itemId)
    );
  }

  // 获取分类的总行数
  getCategoryRowCount(categoryId: string): number {
    const items = this.getItemsByCategory(categoryId);
    const itemsPerRow = 8;
    return Math.ceil(items.length / itemsPerRow);
  }

  // 验证游戏数据完整性
  validateGameData(): boolean {
    try {
      if (!this.gameData) {
        return false;
      }

      // 检查必要的数据结构
      return !!(this.gameData.items && 
                this.gameData.recipes && 
                this.gameData.categories &&
                Array.isArray(this.gameData.items) &&
                Array.isArray(this.gameData.recipes) &&
                Array.isArray(this.gameData.categories));
    } catch (error) {
      this.handleError(error, 'validateGameData');
      return false;
    }
  }

  // 获取缓存统计信息
  getCacheStats() {
    return {
      itemsByRow: this.itemsByRowCache.getStats(),
      itemUnlocked: this.itemUnlockedCache.getStats()
    };
  }

  // 清理缓存
  clearCache(): void {
    this.itemsByRowCache.clear();
    this.itemUnlockedCache.clear();
  }
}