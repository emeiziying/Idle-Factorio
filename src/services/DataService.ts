// 游戏数据管理服务

import type { GameData, Item, Recipe, Category } from '../types/index';
import UserProgressService from './UserProgressService';

interface I18nData {
  categories: Record<string, string>;
  items: Record<string, string>;
  recipes: Record<string, string>;
  locations: Record<string, string>;
}

class DataService {
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

  // 加载游戏数据
  async loadGameData(): Promise<GameData> {
    if (this.gameData) {
      return this.gameData;
    }

    try {
      const response = await fetch('/data/spa/data.json');
      if (!response.ok) {
        throw new Error(`Failed to load game data: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.gameData = data;
      console.log('Game data loaded successfully');
      return data;
    } catch (error) {
      console.error('Error loading game data:', error);
      throw error;
    }
  }

  // 加载国际化数据
  async loadI18nData(locale: string = 'zh'): Promise<I18nData> {
    if (this.i18nData) {
      return this.i18nData;
    }

    try {
      const response = await fetch(`/data/spa/i18n/${locale}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load i18n data: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.i18nData = data;
      console.log('I18n data loaded successfully');
      return data;
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

  // 获取所有配方
  getAllRecipes(): Recipe[] {
    if (!this.gameData) return [];
    return this.gameData.recipes || [];
  }

  // 获取物品的制作配方
  getRecipesForItem(itemId: string): Recipe[] {
    if (!this.gameData || !this.gameData.recipes) return [];
    
    return this.gameData.recipes.filter(recipe => 
      recipe.out && recipe.out[itemId] > 0
    );
  }

  // 获取使用该物品的配方
  getRecipesUsingItem(itemId: string): Recipe[] {
    if (!this.gameData || !this.gameData.recipes) return [];
    
    return this.gameData.recipes.filter(recipe => 
      recipe.in && recipe.in[itemId] > 0
    );
  }

  // 获取配方
  getRecipe(recipeId: string): Recipe | undefined {
    if (!this.gameData || !this.gameData.recipes) return undefined;
    return this.gameData.recipes.find(recipe => recipe.id === recipeId);
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
      recipes: this.getRecipesForItem(itemId),
      usedInRecipes: this.getRecipesUsingItem(itemId)
    };
  }
}

export default DataService;