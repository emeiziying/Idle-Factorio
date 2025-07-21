import { Category, Item, Recipe, Technology, GameData } from '../types';
import { UserProgressService } from './UserProgressService';

export class DataService {
  private static instance: DataService;
  private gameData: GameData | null = null;
  private readonly DATA_PATH = '/data/1.1/';
  private userProgress: UserProgressService;

  private constructor() {
    this.userProgress = UserProgressService.getInstance();
  }

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  // 加载游戏数据
  public async loadGameData(): Promise<GameData> {
    if (this.gameData) {
      return this.gameData;
    }

    try {
      // 加载数据索引
      const indexResponse = await fetch(`${this.DATA_PATH}data.json`);
      const index = await indexResponse.json();

      // 加载各个数据文件
      const [categoriesRes, itemsRes, recipesRes, technologiesRes] = await Promise.all([
        fetch(`${this.DATA_PATH}${index.files.categories}`),
        fetch(`${this.DATA_PATH}${index.files.items}`),
        fetch(`${this.DATA_PATH}${index.files.recipes}`),
        fetch(`${this.DATA_PATH}${index.files.technologies}`)
      ]);

      const [categories, items, recipes, technologies] = await Promise.all([
        categoriesRes.json(),
        itemsRes.json(),
        recipesRes.json(),
        technologiesRes.json()
      ]);

      this.gameData = {
        categories,
        items,
        recipes,
        technologies,
        hash: index.hash
      };

      return this.gameData;
    } catch (error) {
      console.error('Failed to load game data:', error);
      throw error;
    }
  }

  // 获取所有分类
  public async getCategories(): Promise<Category[]> {
    const data = await this.loadGameData();
    return data.categories.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  // 获取所有物品（根据解锁状态过滤）
  public async getItems(includeUnlocked: boolean = true): Promise<Item[]> {
    const data = await this.loadGameData();
    if (includeUnlocked) {
      return data.items.filter(item => this.userProgress.isItemUnlocked(item.id));
    }
    return data.items;
  }

  // 按分类获取物品
  public async getItemsByCategory(categoryId: string, includeUnlocked: boolean = true): Promise<Item[]> {
    const items = await this.getItems(includeUnlocked);
    return items.filter(item => item.category === categoryId);
  }

  // 获取单个物品
  public async getItem(itemId: string): Promise<Item | undefined> {
    const data = await this.loadGameData();
    return data.items.find(item => item.id === itemId);
  }

  // 获取所有配方（根据解锁状态过滤）
  public async getRecipes(includeUnlocked: boolean = true): Promise<Recipe[]> {
    const data = await this.loadGameData();
    if (includeUnlocked) {
      return data.recipes.filter(recipe => this.userProgress.isRecipeUnlocked(recipe.id));
    }
    return data.recipes;
  }

  // 获取物品的配方
  public async getRecipesForItem(itemId: string, includeUnlocked: boolean = true): Promise<Recipe[]> {
    const recipes = await this.getRecipes(includeUnlocked);
    return recipes.filter(recipe => recipe.out[itemId] !== undefined);
  }

  // 获取使用某物品的配方
  public async getRecipesUsingItem(itemId: string, includeUnlocked: boolean = true): Promise<Recipe[]> {
    const recipes = await this.getRecipes(includeUnlocked);
    return recipes.filter(recipe => recipe.in[itemId] !== undefined);
  }

  // 获取单个配方
  public async getRecipe(recipeId: string): Promise<Recipe | undefined> {
    const data = await this.loadGameData();
    return data.recipes.find(recipe => recipe.id === recipeId);
  }

  // 获取所有科技
  public async getTechnologies(): Promise<Technology[]> {
    const data = await this.loadGameData();
    return data.technologies;
  }

  // 获取单个科技
  public async getTechnology(techId: string): Promise<Technology | undefined> {
    const data = await this.loadGameData();
    return data.technologies.find(tech => tech.id === techId);
  }

  // 获取可研究的科技（前置科技已解锁）
  public async getAvailableTechnologies(): Promise<Technology[]> {
    const technologies = await this.getTechnologies();
    return technologies.filter(tech => {
      // 检查是否已经研究
      if (this.userProgress.isTechnologyUnlocked(tech.id)) {
        return false;
      }
      // 检查前置科技是否都已解锁
      return tech.prerequisites.every(prereq => 
        this.userProgress.isTechnologyUnlocked(prereq)
      );
    });
  }

  // 搜索物品
  public async searchItems(query: string, includeUnlocked: boolean = true): Promise<Item[]> {
    const items = await this.getItems(includeUnlocked);
    const lowerQuery = query.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(lowerQuery) ||
      item.id.toLowerCase().includes(lowerQuery)
    );
  }

  // 刷新数据缓存
  public async refreshData(): Promise<void> {
    this.gameData = null;
    await this.loadGameData();
  }

  // 检查数据版本
  public async checkDataVersion(): Promise<string> {
    const data = await this.loadGameData();
    return data.hash || 'unknown';
  }
}