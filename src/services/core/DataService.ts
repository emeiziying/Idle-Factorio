// 游戏数据管理服务

import { getService } from '@/services/core/DIServiceInitializer';
import { SERVICE_TOKENS } from '@/services/core/ServiceTokens';
import { RecipeService } from '@/services/crafting/RecipeService';
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

  // 性能优化：添加缓存
  private itemsByRowCache = new Map<string, Map<number, Item[]>>();
  private cacheVersion = 0; // 用于缓存失效

  constructor() {}

  // 性能优化：清理缓存
  private clearCache(): void {
    this.itemsByRowCache.clear();
    this.cacheVersion++;
  }

  // 加载游戏数据
  async loadGameData(): Promise<GameData> {
    if (this.gameData) {
      return this.gameData;
    }

    try {
      this.gameData = gameData as unknown as GameData;

      // 加载国际化数据
      await this.loadI18nData();

      this.clearCache();
      return this.gameData;
    } catch (error) {
      logError('Error loading game data:', error);
      throw error;
    }
  }

  // 加载国际化数据
  async loadI18nData(locale: string = 'zh'): Promise<I18nData> {
    if (this.i18nData) {
      return this.i18nData;
    }

    try {
      const i18nModule = await import(`@/data/spa/i18n/${locale}.json`);
      this.i18nData = i18nModule.default as I18nData;
      return this.i18nData;
    } catch (error) {
      logError('Error loading i18n data:', error);
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

  // 通用本地化方法
  private getLocalizedName(id: string, field: keyof I18nData): string {
    if (!this.i18nData) return id;
    const data = this.i18nData[field] as Record<string, string>;
    return data?.[id] || id;
  }

  // 获取本地化的分类名称
  getLocalizedCategoryName(categoryId: string): string {
    return this.getLocalizedName(categoryId, 'categories');
  }

  // 获取本地化的物品名称
  getLocalizedItemName(itemId: string): string {
    return this.getLocalizedName(itemId, 'items');
  }

  // 获取本地化的配方名称
  getLocalizedRecipeName(recipeId: string): string {
    return this.getLocalizedName(recipeId, 'recipes');
  }

  // 获取本地化的位置名称
  getLocalizedLocationName(locationId: string): string {
    return this.getLocalizedName(locationId, 'locations');
  }

  // 获取本地化的科技名称
  getLocalizedTechnologyName(technologyId: string): string {
    if (!this.i18nData) return technologyId;

    // 按优先级查找：technologies > items > recipes
    const fields: (keyof I18nData)[] = ['technologies', 'items', 'recipes'];

    for (const field of fields) {
      const data = this.i18nData[field] as Record<string, string> | undefined;
      if (data?.[technologyId]) {
        return data[technologyId];
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

    const techService = getService<TechnologyService>(SERVICE_TOKENS.TECHNOLOGY_SERVICE);
    return this.gameData.items.filter((item: Item) => techService.isItemUnlocked(item.id));
  }

  // 按分类获取物品（仅返回已解锁）
  getItemsByCategory(categoryId: string, includeUnlocked: boolean = true): Item[] {
    if (!this.gameData) return [];

    const techService = getService<TechnologyService>(SERVICE_TOKENS.TECHNOLOGY_SERVICE);
    return this.gameData.items.filter(
      (item: Item) =>
        item.category === categoryId && (includeUnlocked || techService.isItemUnlocked(item.id))
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

  // 获取配方
  getRecipe(recipeId: string): Recipe | undefined {
    const recipeService = getService<RecipeService>(SERVICE_TOKENS.RECIPE_SERVICE);
    return recipeService.getRecipeById(recipeId);
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

  // 按行号获取分类内的物品子分组 - 性能优化版本
  getItemsByRow(categoryId: string): Map<number, Item[]> {
    if (!this.gameData) return new Map();

    // 性能优化：检查缓存
    const cacheKey = `${categoryId}_v${this.cacheVersion}`;
    if (this.itemsByRowCache.has(cacheKey)) {
      return this.itemsByRowCache.get(cacheKey)!;
    }

    // 获取已解锁的物品
    const techService = getService<TechnologyService>(SERVICE_TOKENS.TECHNOLOGY_SERVICE);
    const items = Object.values(this.gameData.items).filter(
      (item: Item) => item.category === categoryId && techService.isItemUnlocked(item.id)
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

  // 获取物品图标数据
  getIconData(itemId: string): IconData | null {
    if (!this.gameData) return null;

    const iconInfo = this.gameData.icons.find((icon: IconData) => icon.id === itemId);
    return iconInfo || null;
  }

  /**
   * 获取物品或配方的图标信息
   */
  getIconInfo(itemId: string): { iconId: string; iconText?: string } {
    const recipeService = getService<RecipeService>(SERVICE_TOKENS.RECIPE_SERVICE);
    const recipe = recipeService.getRecipeById(itemId);
    const item = this.getItem(itemId);

    // 优先级：配方 iconText > 物品 iconText
    if (recipe?.iconText) {
      return { iconId: recipe.icon || itemId, iconText: recipe.iconText };
    }
    if (item?.iconText) {
      return { iconId: item.icon || itemId, iconText: item.iconText };
    }

    return {
      iconId: recipe?.icon || item?.icon || itemId,
    };
  }

  // 获取所有图标数据
  getAllIcons(): IconData[] {
    if (!this.gameData) return [];
    return this.gameData.icons || [];
  }

  // 获取物品详情
  getItemDetails(itemId: string) {
    const item = this.getItem(itemId);
    if (!item) return null;

    const recipeService = getService<RecipeService>(SERVICE_TOKENS.RECIPE_SERVICE);
    return {
      item,
      recipes: recipeService.getRecipesThatProduce(itemId),
      usedInRecipes: recipeService.getRecipesThatUse(itemId),
      recipeStats: recipeService.getRecipeStats(itemId),
      recommendedRecipe: recipeService.getMostEfficientRecipe(itemId),
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

  // 获取物品名称
  getItemName(itemId: string): string {
    const item = this.getItem(itemId);
    return item?.name || itemId;
  }
}
