// 游戏数据管理服务

import type { GameData, Item, Recipe, Category } from '../types/index';
import UserProgressService from './UserProgressService';
import { RecipeService } from './RecipeService';

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
      
      // 初始化配方服务
      if (data.recipes) {
        RecipeService.initializeRecipes(data.recipes);
        console.log('RecipeService initialized with game data');
      }
      
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

  // 获取所有配方（使用RecipeService）
  getAllRecipes(): Recipe[] {
    return RecipeService.getAllRecipes();
  }

  // 获取物品的制作配方（使用RecipeService）
  getRecipesForItem(itemId: string): Recipe[] {
    return RecipeService.getRecipesThatProduce(itemId);
  }

  // 获取使用该物品的配方（使用RecipeService）
  getRecipesUsingItem(itemId: string): Recipe[] {
    return RecipeService.getRecipesThatUse(itemId);
  }

  // 获取配方（使用RecipeService）
  getRecipe(recipeId: string): Recipe | undefined {
    return RecipeService.getRecipeById(recipeId);
  }

  // 获取手动采集配方（新增）
  getManualRecipes(itemId?: string): Recipe[] {
    return RecipeService.getManualRecipes(itemId);
  }

  // 获取自动化配方（新增）
  getAutomatedRecipes(itemId?: string): Recipe[] {
    return RecipeService.getAutomatedRecipes(itemId);
  }

  // 获取采矿配方（新增）
  getMiningRecipes(itemId?: string): Recipe[] {
    return RecipeService.getMiningRecipes(itemId);
  }

  // 获取回收配方（新增）
  getRecyclingRecipes(itemId?: string): Recipe[] {
    return RecipeService.getRecyclingRecipes(itemId);
  }

  // 获取最高效率配方（新增）
  getMostEfficientRecipe(itemId: string): Recipe | undefined {
    return RecipeService.getMostEfficientRecipe(itemId);
  }

  // 获取配方统计信息（新增）
  getRecipeStats(itemId: string) {
    return RecipeService.getRecipeStats(itemId);
  }

  // 获取配方效率（新增）
  getRecipeEfficiency(recipe: Recipe, itemId?: string): number {
    return RecipeService.getRecipeEfficiency(recipe, itemId);
  }

  // 搜索配方（新增）
  searchRecipes(query: string): Recipe[] {
    return RecipeService.searchRecipes(query);
  }

  // ========== 新增高级功能 ==========

  /**
   * 获取配方依赖链
   * @param recipe 配方
   * @param maxDepth 最大深度
   */
  getRecipeDependencyChain(recipe: Recipe, maxDepth: number = 5) {
    return RecipeService.getRecipeDependencyChain(recipe, maxDepth);
  }

  /**
   * 计算配方总成本
   * @param recipe 配方
   * @param includeRawMaterials 是否包含原材料成本
   */
  calculateRecipeCost(recipe: Recipe, includeRawMaterials: boolean = true) {
    return RecipeService.calculateRecipeCost(recipe, includeRawMaterials);
  }

  /**
   * 获取最优生产路径
   * @param targetItemId 目标物品ID
   * @param quantity 目标数量
   * @param unlockedItems 已解锁的物品列表
   */
  getOptimalProductionPath(
    targetItemId: string,
    quantity: number = 1,
    unlockedItems: string[] = []
  ) {
    return RecipeService.getOptimalProductionPath(targetItemId, quantity, unlockedItems);
  }

  /**
   * 获取配方推荐
   * @param itemId 物品ID
   * @param unlockedItems 已解锁的物品列表
   * @param preferences 用户偏好
   */
  getRecipeRecommendations(
    itemId: string,
    unlockedItems: string[] = [],
    preferences: 'efficiency' | 'speed' | 'cost' | 'manual' = 'efficiency'
  ): Recipe[] {
    return RecipeService.getRecipeRecommendations(itemId, unlockedItems, preferences);
  }

  /**
   * 获取增强的配方统计信息
   * @param itemId 物品ID
   * @param unlockedItems 已解锁的物品列表
   */
  getEnhancedRecipeStats(
    itemId: string,
    unlockedItems: string[] = []
  ) {
    return RecipeService.getEnhancedRecipeStats(itemId, unlockedItems);
  }

  /**
   * 获取配方复杂度评分
   * @param recipe 配方
   */
  getRecipeComplexityScore(recipe: Recipe): number {
    return RecipeService.getRecipeComplexityScore(recipe);
  }

  /**
   * 获取配方分类统计
   */
  getRecipeCategoryStats(): Map<string, number> {
    return RecipeService.getRecipeCategoryStats();
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
      usedInRecipes: this.getRecipesUsingItem(itemId),
      // 新增：配方统计信息
      recipeStats: this.getRecipeStats(itemId),
      // 新增：推荐配方
      recommendedRecipe: this.getMostEfficientRecipe(itemId)
    };
  }
}

export default DataService;