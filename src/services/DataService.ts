// 游戏数据管理服务

import type { GameData, Item, Recipe, Category } from '../types/index';
import { UserProgressService } from './UserProgressService';
import { RecipeService } from './RecipeService';

// 异步导入游戏数据
import gameData from '../data/spa/data.json';

interface I18nData {
  categories: Record<string, string>;
  items: Record<string, string>;
  recipes: Record<string, string>;
  locations: Record<string, string>;
  technologies?: Record<string, string>; // 可选，如果没有则回退到 recipes 字段
}

export class DataService {
  private static instance: DataService;
  private gameData: GameData | null = null;
  private i18nData: I18nData | null = null;
  private userProgressService: UserProgressService;

  private constructor() {
    this.userProgressService = UserProgressService.getInstance();
  }

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  // 加载游戏数据 - 改为异步import
  async loadGameData(): Promise<GameData> {
    if (this.gameData) {
      return this.gameData;
    }

    try {
      // 直接使用导入的数据，无需fetch
      this.gameData = gameData as unknown as GameData;
      
      // 初始化配方服务
      if (this.gameData.recipes) {
        RecipeService.initializeRecipes(this.gameData.recipes);
        console.log('RecipeService initialized with game data');
      }
      
      console.log('Game data loaded successfully');
      return this.gameData;
    } catch (error) {
      console.error('Error loading game data:', error);
      throw error;
    }
  }

  // 加载国际化数据 - 改为动态import
  async loadI18nData(locale: string = 'zh'): Promise<I18nData> {
    if (this.i18nData) {
      return this.i18nData;
    }

    try {
      // 使用动态import替代fetch
      const i18nModule = await import(`../data/spa/i18n/${locale}.json`);
      this.i18nData = i18nModule.default as I18nData;
      console.log('I18n data loaded successfully');
      return this.i18nData;
    } catch (error) {
      console.error('Error loading i18n data:', error);
      // 返回空数据作为fallback
      return {
        categories: {},
        items: {},
        recipes: {},
        locations: {}
      };
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
    const normalizedId = technologyId.toLowerCase().replace(/\s+/g, '-');
    
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
    
    return this.gameData.items.filter(item => 
      this.userProgressService.isItemUnlocked(item.id)
    );
  }

  // 按分类获取物品（仅返回已解锁）
  getItemsByCategory(categoryId: string): Item[] {
    if (!this.gameData) return [];
    
    return this.gameData.items.filter(item => 
      item.category === categoryId && this.userProgressService.isItemUnlocked(item.id)
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
    return RecipeService.getRecipeById(recipeId);
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

  // 检查物品是否解锁
  isItemUnlocked(itemId: string): boolean {
    return this.userProgressService.isItemUnlocked(itemId);
  }

  // 解锁物品
  unlockItem(itemId: string): void {
    this.userProgressService.unlockItem(itemId);
  }

  // 按行号获取分类内的物品子分组
  getItemsByRow(categoryId: string): Map<number, Item[]> {
    if (!this.gameData) return new Map();
    
    const items = Object.values(this.gameData.items).filter(item => 
      item.category === categoryId && this.userProgressService.isItemUnlocked(item.id)
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
        const aIndex = Object.keys(this.gameData!.items).indexOf(a.id);
        const bIndex = Object.keys(this.gameData!.items).indexOf(b.id);
        return aIndex - bIndex;
      });
    });
    
    return itemsByRow;
  }

  // 获取行的显示名称
  getRowDisplayName(categoryId: string, row: number): string {
    const rowNames: Record<string, Record<number, string>> = {
      'intermediate-products': {
        0: '原材料',
        1: '基础材料', 
        2: '组件',
        3: '科技包'
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
    const recipe = RecipeService.getRecipeById(itemId);
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

    return {
      item,
      recipes: RecipeService.getRecipesThatProduce(itemId),
      usedInRecipes: RecipeService.getRecipesThatUse(itemId),
      // 新增：配方统计信息
      recipeStats: RecipeService.getRecipeStats(itemId),
      // 新增：推荐配方
      recommendedRecipe: RecipeService.getMostEfficientRecipe(itemId)
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
}

// 导出单例实例以保持向后兼容
export const dataService = DataService.getInstance();