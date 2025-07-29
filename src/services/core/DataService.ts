// 游戏数据管理服务

import type { GameData, Item, Recipe, Category } from '../../types/index';
import { CacheManager } from '../base/CacheManager';
import { ServiceLocator, SERVICE_NAMES } from '../ServiceLocator';
import type { UserProgressService } from '../state/UserProgressService';
import { RecipeService } from './RecipeService';
import type { TechnologyService } from '../game/TechnologyService';

// 异步导入游戏数据
import gameData from '../../data/spa/data.json';

interface I18nData {
  categories: Record<string, string>;
  items: Record<string, string>;
  recipes: Record<string, string>;
  locations: Record<string, string>;
  technologies?: Record<string, string>;
}

export class DataService {
  private static instance: DataService;
  private gameData: GameData | null = null;
  private i18nData: I18nData | null = null;
  private i18nLoadingPromise: Promise<I18nData> | null = null;
  private gameDataLoadingPromise: Promise<GameData> | null = null;
  
  // 使用 CacheManager 替代原有的缓存实现
  private itemsByRowCache = new CacheManager<string, Map<number, Item[]>>({
    ttl: 10 * 60 * 1000, // 10分钟
    maxSize: 500
  });
  
  private itemUnlockedCache = new CacheManager<string, boolean>({
    ttl: 5 * 60 * 1000, // 5分钟
    maxSize: 1000
  });

  private constructor() {
    // 私有构造函数，确保单例
  }
  
  // 获取实例方法
  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  // 统一的错误处理方法
  protected handleError(error: unknown, context: string): void {
    console.error(`[DataService] Error in ${context}:`, error);
  }

  // 安全的异步操作包装器
  protected async safeAsync<T>(
    operation: () => Promise<T>,
    context: string,
    fallback?: T
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error, context);
      if (fallback !== undefined) {
        return fallback;
      }
      throw error;
    }
  }
  
  // 清理缓存
  private clearCache(): void {
    this.itemsByRowCache.clear();
    this.itemUnlockedCache.clear();
  }
  
  // 清理解锁缓存（当科技状态改变时调用）
  public clearUnlockCache(): void {
    this.itemUnlockedCache.clear();
  }
  
  // 带缓存的物品解锁检查
  private isItemUnlockedCached(itemId: string): boolean {
    const cached = this.itemUnlockedCache.get(itemId);
    if (cached !== undefined) {
      return cached;
    }
    
    const result = this.isItemUnlocked(itemId);
    this.itemUnlockedCache.set(itemId, result);
    
    return result;
  }

  // 加载游戏数据
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
    }, 'loadGameData');
  }

  private async doLoadGameData(): Promise<GameData> {
    // 直接使用导入的数据，无需fetch
    this.gameData = gameData as unknown as GameData;
    
    // 性能优化：数据加载后清理缓存
    this.clearCache();
    
    // 配方初始化将在 ServiceInitializer 中进行
    
    return this.gameData;
  }

  // 加载国际化数据
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
    }, 'loadI18nData', {
      categories: {},
      items: {},
      recipes: {},
      locations: {}
    });
  }

  private async doLoadI18nData(locale: string): Promise<I18nData> {
    try {
      // 使用动态import替代fetch
      const i18nModule = await import(`../../data/spa/i18n/${locale}.json`);
      this.i18nData = i18nModule.default as I18nData;
      return this.i18nData;
    } catch (error) {
      this.handleError(error, 'doLoadI18nData');
      // 返回空数据作为fallback
      const fallbackData = {
        categories: {},
        items: {},
        recipes: {},
        locations: {}
      };
      this.i18nData = fallbackData;
      return fallbackData;
    }
  }

  // 检查数据是否已加载
  isDataLoaded(): boolean {
    return this.gameData !== null;
  }

  // 获取本地化的分类名称
  getLocalizedCategoryName(categoryId: string): string {
    if (!this.i18nData) {
      return categoryId;
    }
    return this.i18nData.categories[categoryId] || categoryId;
  }

  // 获取本地化的物品名称
  getLocalizedItemName(itemId: string): string {
    if (!this.i18nData) {
      return itemId;
    }
    return this.i18nData.items[itemId] || itemId;
  }

  // 获取本地化的配方名称
  getLocalizedRecipeName(recipeId: string): string {
    if (!this.i18nData) {
      return recipeId;
    }
    return this.i18nData.recipes[recipeId] || recipeId;
  }

  // 获取本地化的位置名称
  getLocalizedLocationName(locationId: string): string {
    if (!this.i18nData) {
      return locationId;
    }
    return this.i18nData.locations[locationId] || locationId;
  }

  // 获取本地化的科技名称
  getLocalizedTechnologyName(technologyId: string): string {
    if (!this.i18nData) {
      return technologyId;
    }
    // 优先使用 technologies 字段，如果没有则回退到 recipes
    const technologies = this.i18nData.technologies || this.i18nData.recipes;
    return technologies[technologyId] || technologyId;
  }

  // 获取游戏数据
  getGameData(): GameData {
    if (!this.gameData) {
      throw new Error('Game data not loaded. Call loadGameData() first.');
    }
    return this.gameData;
  }

  // 获取所有分类
  getCategories(): Category[] {
    if (!this.gameData) {
      throw new Error('Game data not loaded');
    }
    return this.gameData.categories;
  }

  // 根据ID获取分类
  getCategoryById(categoryId: string): Category | undefined {
    if (!this.gameData) {
      throw new Error('Game data not loaded');
    }
    return this.gameData.categories.find(c => c.id === categoryId);
  }

  // 根据分类获取物品 - 性能优化版本
  getItemsByCategoryAndRow(categoryId: string, row: number): Item[] {
    if (!this.gameData) {
      throw new Error('Game data not loaded');
    }
    
    // 检查缓存
    let categoryCache = this.itemsByRowCache.get(categoryId);
    if (categoryCache && categoryCache.has(row)) {
      return categoryCache.get(row)!;
    }
    
    // 过滤并排序
    const items = this.gameData.items
      .filter(item => {
        // 基础过滤条件
        if (item.category !== categoryId || item.row !== row) {
          return false;
        }
        
        // 检查物品是否已解锁（使用缓存）
        return this.isItemUnlockedCached(item.id);
      })
      .sort((a, b) => {
        const aIndex = this.gameData!.items.findIndex(item => item.id === a.id);
        const bIndex = this.gameData!.items.findIndex(item => item.id === b.id);
        return aIndex - bIndex;
      });
    
    // 更新缓存
    if (!categoryCache) {
      categoryCache = new Map<number, Item[]>();
    }
    categoryCache.set(row, items);
    this.itemsByRowCache.set(categoryId, categoryCache);
    
    return items;
  }

  // 获取分类的最大行数
  getCategoryMaxRow(categoryId: string): number {
    if (!this.gameData) {
      throw new Error('Game data not loaded');
    }
    
    const categoryItems = this.gameData.items.filter(item => 
      item.category === categoryId && this.isItemUnlockedCached(item.id)
    );
    
    if (categoryItems.length === 0) {
      return 0;
    }
    
    return Math.max(...categoryItems.map(item => item.row));
  }

  // 根据ID获取物品
  getItemById(itemId: string): Item | undefined {
    if (!this.gameData) {
      throw new Error('Game data not loaded');
    }
    return this.gameData.items.find(item => item.id === itemId);
  }

  // 检查物品是否已解锁 - 改为public以供外部使用
  public isItemUnlocked(itemId: string): boolean {
    return this.isItemUnlockedInternal(itemId, new Set());
  }



  // 获取所有配方
  getRecipes(): Recipe[] {
    if (!this.gameData) {
      throw new Error('Game data not loaded');
    }
    return this.gameData.recipes;
  }

  // 根据物品ID获取相关配方
  getRecipesByItemId(itemId: string): Recipe[] {
    if (!this.gameData) {
      throw new Error('Game data not loaded');
    }
    return this.gameData.recipes.filter(recipe => 
      recipe.out && Object.keys(recipe.out).includes(itemId)
    );
  }

  // 获取物品的配方
  getRecipesForItem(itemId: string): Recipe[] {
    try {
      // 直接使用静态方法
      return RecipeService.getRecipesThatProduce(itemId);
    } catch (error) {
      this.handleError(error, 'getRecipesForItem');
      return [];
    }
  }

  // 根据ID获取配方
  getRecipeById(recipeId: string): Recipe | undefined {
    if (!this.gameData) {
      throw new Error('Game data not loaded');
    }
    return this.gameData.recipes.find(recipe => recipe.id === recipeId);
  }

  // 获取产出指定物品的配方
  getRecipesProducingItem(itemId: string): Recipe[] {
    if (!this.gameData) {
      throw new Error('Game data not loaded');
    }
    return this.gameData.recipes.filter(recipe =>
      recipe.out && Object.keys(recipe.out).includes(itemId)
    );
  }

  // 获取消耗指定物品的配方
  getRecipesConsumingItem(itemId: string): Recipe[] {
    if (!this.gameData) {
      throw new Error('Game data not loaded');
    }
    return this.gameData.recipes.filter(recipe =>
      recipe.in && Object.keys(recipe.in).includes(itemId)
    );
  }

  // 获取用户的解锁进度
  getUserProgress() {
    try {
      const progressService = ServiceLocator.get<UserProgressService>(SERVICE_NAMES.USER_PROGRESS);
      return progressService.getProgress();
    } catch (error) {
      this.handleError(error, 'getUserProgress');
      return {
        unlockedRecipes: [],
        researchedTechnologies: [],
        savedBuildings: []
      };
    }
  }

  // 获取统计信息
  getStats() {
    return {
      itemsByRowCache: this.itemsByRowCache.getStats(),
      itemUnlockedCache: this.itemUnlockedCache.getStats()
    };
  }

  // 获取所有物品
  getAllItems(): Item[] {
    if (!this.gameData) return [];
    return this.gameData.items;
  }

  // 获取已解锁的物品
  getUnlockedItems(): Item[] {
    if (!this.gameData) return [];
    
    return this.gameData.items.filter(item => 
      this.isItemUnlocked(item.id)
    );
  }

  // 按分类获取物品（仅返回已解锁）
  getItemsByCategory(categoryId: string): Item[] {
    if (!this.gameData) return [];
    
    return this.gameData.items.filter(item => 
      item.category === categoryId && this.isItemUnlocked(item.id)
    );
  }

  // 获取分类下的所有物品（包括未解锁）
  getAllItemsByCategory(categoryId: string): Item[] {
    if (!this.gameData) return [];
    
    return this.gameData.items.filter(item => 
      item.category === categoryId
    );
  }

  // 获取单个物品
  getItem(itemId: string): Item | undefined {
    if (!this.gameData) return undefined;
    return this.gameData.items.find(item => item.id === itemId);
  }

  // 获取配方（保留常用方法，其他通过RecipeService直接调用）
  getRecipe(recipeId: string): Recipe | undefined {
    if (ServiceLocator.has(SERVICE_NAMES.RECIPE)) {
      return RecipeService.getRecipeById(recipeId);
    }
    return undefined;
  }

  // 获取所有分类（按原始数据顺序）
  getAllCategories(): Category[] {
    if (!this.gameData) return [];
    
    // 直接返回原始数据中的分类顺序
    return this.gameData.categories || [];
  }

  // 获取分类
  getCategory(categoryId: string): Category | undefined {
    if (!this.gameData) return undefined;
    return this.gameData.categories.find(cat => cat.id === categoryId);
  }

  // 解锁物品
  unlockItem(itemId: string): void {
    if (ServiceLocator.has(SERVICE_NAMES.USER_PROGRESS)) {
      const userProgressService = ServiceLocator.get<UserProgressService>(SERVICE_NAMES.USER_PROGRESS);
      userProgressService.unlockItem(itemId);
    }
  }

  // 按行号获取分类内的物品子分组 - 性能优化版本
  getItemsByRow(categoryId: string): Map<number, Item[]> {
    if (!this.gameData) return new Map();
    
    // 使用缓存的版本
    const cachedByRow = this.itemsByRowCache.get(categoryId);
    if (cachedByRow) {
      return cachedByRow;
    }
    
    // 恢复解锁过滤，但使用缓存优化性能
    const items = this.gameData.items.filter(item => 
      item.category === categoryId && this.isItemUnlockedCached(item.id)
    );
    
    const itemsByRow = new Map<number, Item[]>();
    
    items.forEach(item => {
      const row = item.row || 0;
      if (!itemsByRow.has(row)) {
        itemsByRow.set(row, []);
      }
      itemsByRow.get(row)!.push(item);
    });
    
    // 每行内按原始顺序排序
    itemsByRow.forEach(rowItems => {
      rowItems.sort((a, b) => {
        const aIndex = this.gameData!.items.findIndex(item => item.id === a.id);
        const bIndex = this.gameData!.items.findIndex(item => item.id === b.id);
        return aIndex - bIndex;
      });
    });
    
    // 缓存结果
    this.itemsByRowCache.set(categoryId, itemsByRow);
    
    return itemsByRow;
  }

  // 获取行的显示名称
  getRowDisplayName(categoryId: string, row: number): string {
    const rowNames: Record<string, Record<number, string>> = {
      'intermediate-products': {
        0: '原材料',
        1: '基础材料', 
        2: '组件',
        3: '科技包',
        4: '高级组件',
        5: '特殊材料',
        6: '生产模块',
        7: '军用装备',
        8: '高级材料',
        9: '核能材料',
        10: '太空材料',
        11: '科技包', // automation-science-pack在row 11
        12: '高级科技包',
        13: '特殊科技包',
        14: '终极材料',
        15: '扩展材料'
      },
      'production': {
        0: '工具',
        1: '电力生产',
        2: '资源开采',
        3: '冶炼',
        4: '制造',
        5: '模块和插件',
        6: '火箭部件'
      },
      'logistics': {
        0: '存储',
        1: '传送带',
        2: '机械臂',
        3: '基础设施',
        4: '铁路运输',
        5: '载具',
        6: '机器人物流',
        7: '电路网络',
        8: '建设'
      },
      'combat': {
        0: '武器',
        1: '弹药',
        2: '防御',
        3: '载具装备',
        4: '军用设施',
        5: '炮弹',
        6: '核武器'
      },
      'fluids': {
        0: '流体'
      }
    };
    
    return rowNames[categoryId]?.[row] || `第${row + 1}组`;
  }

  // 获取物品图标数据
  getIconData(itemId: string) {
    if (!this.gameData) return null;
    
    const iconInfo = this.gameData.icons.find(icon => icon.id === itemId);
    return iconInfo || null;
  }

  /**
   * 获取物品或配方的图标信息（包含iconText）
   * 优先级：配方 iconText > 物品 iconText > 无文本
   */
  getIconInfo(itemId: string): { iconId: string; iconText?: string } {
    // 优先从配方获取iconText和icon
    let recipe: Recipe | undefined;
    if (ServiceLocator.has(SERVICE_NAMES.RECIPE)) {
      recipe = RecipeService.getRecipeById(itemId);
    }
    
    if (recipe?.iconText) {
      return {
        iconId: recipe.icon || itemId,
        iconText: recipe.iconText
      };
    }
    
    // 如果配方没有iconText，尝试从物品数据获取
    const item = this.getItem(itemId);
    if (item?.iconText) {
      return {
        iconId: item.icon || itemId,
        iconText: item.iconText
      };
    }
    
    // 都没有iconText，使用默认logic
    return {
      iconId: recipe?.icon || item?.icon || itemId
    };
  }

  // 获取所有图标数据
  getAllIcons() {
    if (!this.gameData) return [];
    return this.gameData.icons;
  }

  // 获取物品详情（包含生产和使用信息）
  getItemDetails(itemId: string) {
    const item = this.getItem(itemId);
    if (!item) return null;

    const recipeService = ServiceLocator.has(SERVICE_NAMES.RECIPE) 
      ? ServiceLocator.get<RecipeService>(SERVICE_NAMES.RECIPE) 
      : null;

    return {
      item,
      recipes: recipeService ? RecipeService.getRecipesThatProduce(itemId) : [],
      usedInRecipes: recipeService ? RecipeService.getRecipesThatUse(itemId) : [],
      // 新增：配方统计信息
      recipeStats: recipeService ? RecipeService.getRecipeStats(itemId) : null,
      // 新增：推荐配方
      recommendedRecipe: recipeService ? RecipeService.getMostEfficientRecipe(itemId) : null
    };
  }

  // 获取所有科技数据（原始JSON格式）
  getRawGameData(): unknown {
    return this.gameData;
  }

  // 获取科技数据
  getTechnologies(): unknown[] {
    if (!this.gameData) return [];
    const rawData = this.gameData as unknown as Record<string, unknown>;
    const recipes = rawData.recipes as unknown[];
    return recipes.filter(recipe => {
      const recipeData = recipe as Record<string, unknown>;
      return recipeData.category === 'technology';
    });
  }

  // 获取科技分类数据
  getTechCategories(): unknown[] {
    if (!this.gameData) return [];
    const rawData = this.gameData as unknown as Record<string, unknown>;
    return (rawData.categories as unknown[]) || [];
  }

  // 添加缺失的方法
  getItemName(itemId: string): string {
    const item = this.getItem(itemId);
    return item?.name || itemId;
  }

  getI18nName(item: Item): string {
    return this.getLocalizedItemName(item.id);
  }

  getCategoryI18nName(categoryId: string): string {
    return this.getLocalizedCategoryName(categoryId);
  }

  // 内部递归检查方法，带循环检测
  private isItemUnlockedInternal(itemId: string, visiting: Set<string>): boolean {
    // 防止循环依赖
    if (visiting.has(itemId)) {
      return false;
    }
    visiting.add(itemId);

    try {
      // 1. 检查是否为科技直接解锁的物品（设备、工具等）
      if (ServiceLocator.has(SERVICE_NAMES.TECHNOLOGY)) {
        const techService = ServiceLocator.get<TechnologyService>(SERVICE_NAMES.TECHNOLOGY);
        if (techService.isItemUnlocked(itemId)) {
          return true;
        }
      }

      // 2. 检查是否为原材料（无配方的物品，可直接采集）
      const recipeService = ServiceLocator.has(SERVICE_NAMES.RECIPE) 
        ? ServiceLocator.get<RecipeService>(SERVICE_NAMES.RECIPE) 
        : null;
      const recipes = recipeService ? RecipeService.getRecipesThatProduce(itemId) : [];
      if (recipes.length === 0) {
        return true; // 原材料始终可用
      }

      // 全局过滤：只允许Nauvis星球的配方（暂时限制）
      const nauvisRecipes = recipes.filter((recipe: Recipe) => 
        !recipe.locations || 
        recipe.locations.length === 0 || 
        recipe.locations.includes('nauvis')
      );

      // 3. 优先检查mining配方（采矿配方始终可用）
      for (const recipe of nauvisRecipes) {
        if (recipe.flags && recipe.flags.includes('mining')) {
          return true; // Nauvis星球的采矿配方
        }
      }

      // 4. 检查是否有可以手动制作的基础配方（无locked标记且材料简单）
      for (const recipe of nauvisRecipes) {
        // 跳过有locked标记的配方（如科技包等需要科技解锁的配方）
        if (recipe.flags && recipe.flags.includes('locked')) {
          continue;
        }

        // 检查是否所有原材料都可用
        if (recipe.in) {
          const allIngredientsAvailable = Object.keys(recipe.in).every(ingredientId => 
            this.isItemUnlockedInternal(ingredientId, visiting)
          );

          if (allIngredientsAvailable) {
            return true; // 可以手动制作
          }
        }
      }

      // 5. 检查是否有任何配方被解锁且可用
      for (const recipe of nauvisRecipes) {
        // 检查配方是否通过科技解锁
        if (recipe.flags && recipe.flags.includes('locked')) {
          // 对于locked配方，需要检查科技是否已解锁
          if (ServiceLocator.has(SERVICE_NAMES.TECHNOLOGY)) {
            const techService = ServiceLocator.get<TechnologyService>(SERVICE_NAMES.TECHNOLOGY);
            // 检查是否有科技解锁了这个配方
            const isRecipeUnlocked = techService.isRecipeUnlocked(recipe.id);
            if (!isRecipeUnlocked) {
              continue; // 配方未通过科技解锁，跳过
            }
          } else {
            // 如果没有科技服务，locked配方默认不可用
            continue;
          }
        }
        
        // 检查配方的生产设备是否可用
        if (!recipe.producers || recipe.producers.length === 0) {
          return true; // 手动制作或无需设备
        }

        // 检查是否有任何生产设备被解锁
        for (const producerId of recipe.producers) {
          if (this.isItemUnlockedInternal(producerId, visiting)) {
            return true; // 至少有一个生产设备可用
          }
        }
      }

      return false;
    } finally {
      visiting.delete(itemId);
    }
  }
}

// 导出单例实例以保持向后兼容
export const dataService = DataService.getInstance();