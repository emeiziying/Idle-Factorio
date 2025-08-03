// 游戏数据管理服务

import { getService } from '@/services/core/DIServiceInitializer';
import { SERVICE_TOKENS } from '@/services/core/ServiceTokens';
import { RecipeService } from '@/services/crafting/RecipeService';
import type { UserProgressService } from '@/services/game/UserProgressService';
import type { TechnologyService } from '@/services/technology/TechnologyService';
import type { Category, GameData, IconData, Item, Recipe } from '@/types/index';
import { error as logError } from '@/utils/logger';

// 异步导入游戏数据
import gameData from '@/data/spa/data.json';

interface I18nData {
  categories: Record<string, string>;
  items: Record<string, string>;
  recipes: Record<string, string>;
  locations: Record<string, string>;
  technologies?: Record<string, string>; // 可选，如果没有则回退到 recipes 字段
}

export class DataService {
  private gameData: GameData | null = null;
  private i18nData: I18nData | null = null;
  private i18nLoadingPromise: Promise<I18nData> | null = null;
  private gameDataLoadingPromise: Promise<GameData> | null = null;

  // 性能优化：添加缓存
  private itemsByRowCache = new Map<string, Map<number, Item[]>>();
  private itemUnlockedCache = new Map<string, boolean>();
  private cacheVersion = 0; // 用于缓存失效

  constructor() {
    // 不再在构造函数中获取其他服务，避免循环依赖
  }

  // 性能优化：清理缓存
  private clearCache(): void {
    this.itemsByRowCache.clear();
    this.itemUnlockedCache.clear();
    this.cacheVersion++;
  }

  // 清理解锁缓存（当科技状态改变时调用）
  public clearUnlockCache(): void {
    this.itemUnlockedCache.clear();
    this.cacheVersion++;
  }

  // 性能优化：带缓存的物品解锁检查
  private isItemUnlockedCached(itemId: string): boolean {
    const cacheKey = `${itemId}_v${this.cacheVersion}`;

    if (this.itemUnlockedCache.has(cacheKey)) {
      return this.itemUnlockedCache.get(cacheKey)!;
    }

    const result = this.isItemUnlockedInternal(itemId, new Set());
    this.itemUnlockedCache.set(cacheKey, result);

    return result;
  }

  // 加载游戏数据 - 改为异步import
  async loadGameData(): Promise<GameData> {
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
  }

  private async doLoadGameData(): Promise<GameData> {
    try {
      // 直接使用导入的数据，无需fetch
      this.gameData = gameData as unknown as GameData;

      // 性能优化：数据加载后清理缓存
      this.clearCache();

      // 配方初始化将在 ServiceInitializer 中进行
      // 这里只负责加载数据

      // Game data loaded successfully
      return this.gameData;
    } catch (error) {
      logError('Error loading game data:', error);
      throw error;
    }
  }

  // 加载国际化数据 - 改为动态import，防止重复加载
  async loadI18nData(locale: string = 'zh'): Promise<I18nData> {
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
  }

  private async doLoadI18nData(locale: string): Promise<I18nData> {
    try {
      // 使用动态import替代fetch
      const i18nModule = await import(`../../data/spa/i18n/${locale}.json`);
      this.i18nData = i18nModule.default as I18nData;
      // I18n data loaded successfully
      return this.i18nData;
    } catch (error) {
      logError('Error loading i18n data:', error);
      // 返回空数据作为fallback
      const fallbackData = {
        categories: {},
        items: {},
        recipes: {},
        locations: {},
      };
      this.i18nData = fallbackData;
      return fallbackData;
    }
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

    // 规范化输入（转为小写并去除空格）
    const normalizedId = technologyId.toLowerCase().replace(/\s+/g, '');

    // 优先从 technologies 字段查找
    if (this.i18nData.technologies) {
      // 先查找原始 ID
      if (this.i18nData.technologies[technologyId]) {
        return this.i18nData.technologies[technologyId];
      }
      // 再查找规范化后的 ID
      if (this.i18nData.technologies[normalizedId]) {
        return this.i18nData.technologies[normalizedId];
      }
    }

    // 从 items 字段查找（科技相关的汉化内容存储在这里）
    if (this.i18nData.items) {
      // 先查找原始 ID
      if (this.i18nData.items[technologyId]) {
        return this.i18nData.items[technologyId];
      }
      // 再查找规范化后的 ID
      if (this.i18nData.items[normalizedId]) {
        return this.i18nData.items[normalizedId];
      }
    }

    // 回退到 recipes 字段（目前科技名称可能在这里）
    if (this.i18nData.recipes) {
      // 先查找原始 ID
      if (this.i18nData.recipes[technologyId]) {
        return this.i18nData.recipes[technologyId];
      }
      // 再查找规范化后的 ID
      if (this.i18nData.recipes[normalizedId]) {
        return this.i18nData.recipes[normalizedId];
      }
    }

    return technologyId;
  }

  // 获取所有物品
  getAllItems(): Item[] {
    if (!this.gameData) return [];
    return this.gameData.items;
  }

  // 获取已解锁的物品
  getUnlockedItems(): Item[] {
    if (!this.gameData) return [];

    return this.gameData.items.filter((item: Item) => this.isItemUnlocked(item.id));
  }

  // 按分类获取物品（仅返回已解锁）
  getItemsByCategory(categoryId: string, includeUnlocked: boolean = true): Item[] {
    if (!this.gameData) return [];

    return this.gameData.items.filter(
      (item: Item) =>
        item.category === categoryId && (includeUnlocked || this.isItemUnlocked(item.id))
    );
  }

  // 获取分类下的所有物品（包括未解锁）
  getAllItemsByCategory(categoryId: string): Item[] {
    if (!this.gameData) return [];

    return this.gameData.items.filter((item: Item) => item.category === categoryId);
  }

  // 获取单个物品
  getItem(itemId: string): Item | undefined {
    if (!this.gameData) return undefined;
    return this.gameData.items.find((item: Item) => item.id === itemId);
  }

  // 获取配方（保留常用方法，其他通过RecipeService直接调用）
  getRecipe(recipeId: string): Recipe | undefined {
    try {
      const recipeService = getService<RecipeService>(SERVICE_TOKENS.RECIPE_SERVICE);
      return recipeService.getRecipeById(recipeId);
    } catch {
      // 如果 RecipeService 不可用，直接从游戏数据中查找
      if (this.gameData) {
        return this.gameData.recipes.find((recipe: Recipe) => recipe.id === recipeId);
      }
      return undefined;
    }
  }

  // 获取所有分类（按原始数据顺序）
  getAllCategories(): Category[] {
    if (!this.gameData) return [];

    // 直接返回原始数据中的分类顺序
    return this.gameData.categories || [];
  }

  // 获取有可用物品的分类（用于生产模块）
  getCategoriesWithAvailableItems(): Category[] {
    if (!this.gameData) return [];

    const allCategories = this.getAllCategories();
    return allCategories.filter(category => {
      // 跳过科技分类
      if (category.id === 'technology') {
        return false;
      }

      // 检查该分类是否有可用物品
      const itemsByRow = this.getItemsByRow(category.id);
      const hasItems =
        itemsByRow.size > 0 && Array.from(itemsByRow.values()).some(items => items.length > 0);

      return hasItems;
    });
  }

  // 获取分类
  getCategory(categoryId: string): Category | undefined {
    if (!this.gameData) return undefined;
    return this.gameData.categories.find((cat: Category) => cat.id === categoryId);
  }

  // 检查物品是否解锁 - 基于游戏逻辑判断
  isItemUnlocked(itemId: string): boolean {
    // 使用缓存机制
    return this.isItemUnlockedCached(itemId);
  }

  // 异步版本：等待服务初始化后检查物品是否解锁
  // 注意：在 DIServiceInitializer.initialize() 完成后，此方法与同步版本等效
  async isItemUnlockedAsync(itemId: string): Promise<boolean> {
    return this.isItemUnlocked(itemId);
  }

  // 内部递归检查方法，带循环检测
  private isItemUnlockedInternal(itemId: string, visiting: Set<string>): boolean {
    // 防止循环依赖
    if (visiting.has(itemId)) {
      return false;
    }
    visiting.add(itemId);

    try {
      const services = this.getRequiredServices();
      if (!services) {
        return false;
      }

      // 1. 优先检查 TechnologyService（决定性因素）
      if (services.isTechServiceReady) {
        return services.techService.isItemUnlocked(itemId);
      }

      // 2. 检查是否为原材料（无配方的物品）
      const recipes = services.recipeService.getRecipesThatProduce(itemId);
      if (recipes.length === 0) {
        return true; // 原材料始终可用
      }

      // 3. 获取有效配方（仅 Nauvis 星球）
      const validRecipes = this.filterValidRecipes(recipes);

      // 4. 检查各种解锁途径
      return this.checkUnlockPaths(validRecipes, services, visiting);
    } finally {
      visiting.delete(itemId);
    }
  }

  // 获取所需服务（初始化后所有服务都应该可用）
  private getRequiredServices() {
    try {
      const techService = getService<TechnologyService>(SERVICE_TOKENS.TECHNOLOGY_SERVICE);
      const recipeService = getService<RecipeService>(SERVICE_TOKENS.RECIPE_SERVICE);

      // 在 DIServiceInitializer 完成后，所有服务都应该已经初始化
      return {
        techService,
        recipeService,
        isTechServiceReady: true, // 初始化后应该始终为 true
      };
    } catch {
      // 如果服务获取失败，说明初始化有问题
      return null;
    }
  }

  // 过滤有效配方（仅 Nauvis 星球）
  private filterValidRecipes(recipes: Recipe[]): Recipe[] {
    return recipes.filter(
      (recipe: Recipe) =>
        !recipe.locations || recipe.locations.length === 0 || recipe.locations.includes('nauvis')
    );
  }

  // 检查物品的各种解锁途径
  private checkUnlockPaths(
    recipes: Recipe[],
    services: { techService: TechnologyService; recipeService: RecipeService; isTechServiceReady: boolean },
    visiting: Set<string>
  ): boolean {
    // 1. 检查采矿配方（优先级最高）
    if (this.hasMiningRecipe(recipes)) {
      return true;
    }

    // 2. 检查手动制作配方
    if (this.hasManualCraftingRecipe(recipes, visiting)) {
      return true;
    }

    // 3. 检查科技解锁的配方
    if (this.hasTechUnlockedRecipe(recipes, services, visiting)) {
      return true;
    }

    return false;
  }

  // 检查是否有采矿配方
  private hasMiningRecipe(recipes: Recipe[]): boolean {
    return recipes.some(recipe => recipe.flags && recipe.flags.includes('mining'));
  }

  // 检查是否有可手动制作的配方
  private hasManualCraftingRecipe(recipes: Recipe[], visiting: Set<string>): boolean {
    return recipes.some(recipe => {
      // 跳过需要科技解锁的配方
      if (recipe.flags && recipe.flags.includes('locked')) {
        return false;
      }

      // 检查所有原材料是否可用
      if (!recipe.in) {
        return true;
      }

      return Object.keys(recipe.in).every(ingredientId =>
        this.isItemUnlockedInternal(ingredientId, visiting)
      );
    });
  }

  // 检查是否有科技解锁的配方
  private hasTechUnlockedRecipe(
    recipes: Recipe[],
    services: { techService: TechnologyService; recipeService: RecipeService; isTechServiceReady: boolean },
    visiting: Set<string>
  ): boolean {
    return recipes.some(recipe => {
      // 检查科技解锁的配方
      if (recipe.flags && recipe.flags.includes('locked')) {
        if (!services.isTechServiceReady || !services.techService.isRecipeUnlocked(recipe.id)) {
          return false;
        }
      }

      // 检查生产设备
      return this.hasAvailableProducer(recipe, visiting);
    });
  }

  // 检查是否有可用的生产设备
  private hasAvailableProducer(recipe: Recipe, visiting: Set<string>): boolean {
    // 无需设备或手动制作
    if (!recipe.producers || recipe.producers.length === 0) {
      return true;
    }

    // 检查是否有任何生产设备可用
    return recipe.producers.some(producerId =>
      this.isItemUnlockedInternal(producerId, visiting)
    );
  }

  // 解锁物品
  unlockItem(itemId: string): void {
    try {
      const userProgressService = getService<UserProgressService>(
        SERVICE_TOKENS.USER_PROGRESS_SERVICE
      );
      userProgressService.unlockItem(itemId);
    } catch {
      // UserProgressService 不可用
    }
  }

  // 按行号获取分类内的物品子分组 - 性能优化版本
  getItemsByRow(categoryId: string): Map<number, Item[]> {
    if (!this.gameData) return new Map();

    // 性能优化：检查缓存
    const cacheKey = `${categoryId}_v${this.cacheVersion}`;
    if (this.itemsByRowCache.has(cacheKey)) {
      return this.itemsByRowCache.get(cacheKey)!;
    }

    // 恢复解锁过滤，但使用缓存优化性能
    const items = Object.values(this.gameData.items).filter(
      (item: Item) => item.category === categoryId && this.isItemUnlockedCached(item.id)
    );

    const itemsByRow = new Map<number, Item[]>();

    items.forEach((item: Item) => {
      const row = item.row || 0;
      if (!itemsByRow.has(row)) {
        itemsByRow.set(row, []);
      }
      itemsByRow.get(row)!.push(item);
    });

    // 每行内按原始顺序排序
    itemsByRow.forEach(rowItems => {
      rowItems.sort((a, b) => {
        const aIndex = Object.keys(this.gameData!.items).indexOf(a.id);
        const bIndex = Object.keys(this.gameData!.items).indexOf(b.id);
        return aIndex - bIndex;
      });
    });

    // 缓存结果
    this.itemsByRowCache.set(cacheKey, itemsByRow);

    return itemsByRow;
  }

  // 异步版本：等待服务初始化后获取物品列表
  // 注意：在 DIServiceInitializer.initialize() 完成后，此方法与同步版本等效
  async getItemsByRowAsync(categoryId: string): Promise<Map<number, Item[]>> {
    // 清理缓存以确保使用最新的解锁状态
    this.clearCache();
    
    return this.getItemsByRow(categoryId);
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
        15: '扩展材料',
      },
      production: {
        0: '工具',
        1: '电力生产',
        2: '资源开采',
        3: '冶炼',
        4: '制造',
        5: '模块和插件',
        6: '火箭部件',
      },
      logistics: {
        0: '存储',
        1: '传送带',
        2: '机械臂',
        3: '基础设施',
        4: '铁路运输',
        5: '载具',
        6: '机器人物流',
        7: '电路网络',
        8: '建设',
      },
      combat: {
        0: '武器',
        1: '弹药',
        2: '防御',
        3: '载具装备',
        4: '军用设施',
        5: '炮弹',
        6: '核武器',
      },
      fluids: {
        0: '流体',
      },
    };

    const categoryRows = rowNames[categoryId];
    return categoryRows ? categoryRows[row] || `第${row + 1}组` : `第${row + 1}组`;
  }

  // 获取物品图标数据
  getIconData(itemId: string): IconData | null {
    if (!this.gameData) return null;

    const iconInfo = this.gameData.icons.find((icon: IconData) => icon.id === itemId);
    return iconInfo || null;
  }

  /**
   * 获取物品或配方的图标信息（包含iconText）
   * 优先级：配方 iconText > 物品 iconText > 无文本
   */
  getIconInfo(itemId: string): { iconId: string; iconText?: string } {
    // 优先从配方获取iconText和icon
    let recipe: Recipe | undefined;
    try {
      const recipeService = getService<RecipeService>(SERVICE_TOKENS.RECIPE_SERVICE);
      recipe = recipeService.getRecipeById(itemId);
    } catch {
      // RecipeService 不可用
    }

    if (recipe && recipe.iconText) {
      return {
        iconId: recipe.icon || itemId,
        iconText: recipe.iconText,
      };
    }

    // 如果配方没有iconText，尝试从物品数据获取
    const item = this.getItem(itemId);
    if (item && item.iconText) {
      return {
        iconId: item.icon || itemId,
        iconText: item.iconText,
      };
    }

    // 都没有iconText，使用默认logic
    return {
      iconId: (recipe && recipe.icon) || (item && item.icon) || itemId,
    };
  }

  // 获取所有图标数据
  getAllIcons(): IconData[] {
    if (!this.gameData) return [];
    return this.gameData.icons || [];
  }

  // 获取物品详情（包含生产和使用信息）
  getItemDetails(itemId: string): {
    item: Item;
    recipes: Recipe[];
    usedInRecipes: Recipe[];
    recipeStats: {
      totalRecipes: number;
      manualRecipes: number;
      automatedRecipes: number;
      miningRecipes: number;
      recyclingRecipes: number;
      mostEfficientRecipe?: Recipe;
    } | null;
    recommendedRecipe?: Recipe;
  } | null {
    const item = this.getItem(itemId);
    if (!item) return null;

    let recipeService: RecipeService | null = null;
    try {
      recipeService = getService<RecipeService>(SERVICE_TOKENS.RECIPE_SERVICE);
    } catch {
      // RecipeService 不可用
    }

    return {
      item,
      recipes: recipeService ? recipeService.getRecipesThatProduce(itemId) : [],
      usedInRecipes: recipeService ? recipeService.getRecipesThatUse(itemId) : [],
      // 新增：配方统计信息
      recipeStats: recipeService ? recipeService.getRecipeStats(itemId) : null,
      // 新增：推荐配方
      recommendedRecipe: recipeService ? recipeService.getMostEfficientRecipe(itemId) : undefined,
    };
  }

  // 获取所有科技数据（原始JSON格式）
  getRawGameData(): GameData | null {
    return this.gameData;
  }

  // 获取科技数据
  getTechnologies(): Recipe[] {
    if (!this.gameData) return [];
    return this.gameData.recipes.filter((recipe: Recipe) => recipe.category === 'technology');
  }

  // 获取科技分类数据
  getTechCategories(): Category[] {
    if (!this.gameData) return [];
    return this.gameData.categories || [];
  }

  // 添加缺失的方法
  getItemName(itemId: string): string {
    const item = this.getItem(itemId);
    return item ? item.name : itemId;
  }

  getI18nName(item: Item): string {
    return this.getLocalizedItemName(item.id);
  }

  getCategoryI18nName(categoryId: string): string {
    return this.getLocalizedCategoryName(categoryId);
  }
}
