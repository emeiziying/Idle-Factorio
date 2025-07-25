// 科技系统服务

import type { 
  Technology, 
  TechResearchState, 
  TechTreeState, 
  ResearchQueueItem, 
  TechStatus,
  ResearchResult,
  QueueResult,
  TechUnlockEvent,
  ResearchStartEvent,
  ResearchCompleteEvent,
  TechSearchFilter,
  TechStatistics,
  TechCategory
} from '../types/technology';
import { ResearchPriority } from '../types/technology';
import type { InventoryOperations } from '../types/inventory';
import UserProgressService from './UserProgressService';
import DataService from './DataService';
import { RecipeService } from './RecipeService';
import useGameStore from '../store/gameStore';
import type { FacilityInstance } from '../types/facilities';

// 从data.json加载的科技数据接口
interface DataJsonTechnology {
  id: string;
  name: string;
  category: string;
  row: number;
  technology?: {
    prerequisites?: string[];
    unlockedRecipes?: string[];
  };
  stack?: number;
}

/**
 * 科技系统服务类
 * 负责科技数据管理、研究逻辑、队列管理等核心功能
 */
export class TechnologyService {
  private static instance: TechnologyService;
  private techTree: Map<string, Technology> = new Map();
  private techState: TechTreeState;
  private eventEmitter: EventTarget = new EventTarget();
  private userProgressService: UserProgressService;
  
  // 库存操作接口（依赖注入）
  private inventoryOps: InventoryOperations | null = null;
  private isInitialized = false;
  
  // 科技分类缓存
  private techCategories: TechCategory[] = [];

  private constructor() {
    this.userProgressService = UserProgressService.getInstance();
    this.techState = this.createInitialState();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): TechnologyService {
    if (!TechnologyService.instance) {
      TechnologyService.instance = new TechnologyService();
    }
    return TechnologyService.instance;
  }

  /**
   * 设置库存操作接口
   */
  public setInventoryOperations(inventoryOps: InventoryOperations): void {
    this.inventoryOps = inventoryOps;
  }

  /**
   * 创建初始状态
   */
  private createInitialState(): TechTreeState {
    return {
      unlockedTechs: new Set(), // 初始化为空，从data.json加载
      researchedTechs: new Set(), // 初始化为空，从data.json加载
      availableTechs: new Set(),
      currentResearch: undefined,
      researchQueue: [],
      maxQueueSize: 10,
      autoResearch: false,
      queueTotalTime: 0,
      unlockedItems: new Set(),
      unlockedRecipes: new Set(),
      unlockedBuildings: new Set(),
      totalResearchTime: 0,
      totalSciencePacksConsumed: {}
    };
  }

  /**
   * 从data.json转换科技数据
   */
  private convertDataJsonTechnology(dataTech: DataJsonTechnology): Technology {
    // 根据科技类型和前置条件计算研究成本
    const researchCost = this.calculateResearchCost(dataTech);
    const researchTime = this.calculateResearchTime(dataTech);
    
    // 使用RecipeService获取科技相关的配方
    // 方法1：通过科技ID匹配配方
    const techRecipesById = RecipeService.searchRecipes(dataTech.id);
    
    // 方法2：通过科技名称匹配配方
    const techRecipesByName = RecipeService.searchRecipes(dataTech.name);
    
    // 方法3：获取所有配方，然后过滤出与科技相关的
    const allRecipes = RecipeService.getAllRecipes();
    const techRelatedRecipes = allRecipes.filter(recipe => {
      // 检查配方是否与科技相关
      const recipeName = recipe.name.toLowerCase();
      const techName = dataTech.name.toLowerCase();
      const techId = dataTech.id.toLowerCase();
      
      return recipeName.includes(techName) || 
             recipeName.includes(techId) ||
             recipe.id.includes(techId) ||
             recipe.id.includes(techName);
    });
    
    // 合并所有找到的配方，去重
    const allTechRecipes = [...techRecipesById, ...techRecipesByName, ...techRelatedRecipes];
    const uniqueRecipes = allTechRecipes.filter((recipe, index, self) => 
      index === self.findIndex(r => r.id === recipe.id)
    );
    
    return {
      id: dataTech.id,
      name: dataTech.name,
      description: dataTech.name, // 使用name作为描述
      category: dataTech.category,
      row: dataTech.row,
      prerequisites: dataTech.technology?.prerequisites || [],
      researchCost,
      researchTime,
      unlocks: {
        recipes: uniqueRecipes.map(recipe => recipe.id)
      },
      position: { x: dataTech.row, y: 0 }, // 简化位置计算
      icon: dataTech.id
    };
  }

  /**
   * 计算科技研究成本
   */
  private calculateResearchCost(dataTech: DataJsonTechnology): Record<string, number> {
    // 根据科技类型和前置条件确定研究成本
    const prereqCount = dataTech.technology?.prerequisites?.length || 0;
    const baseCost = 10;
    
    // 根据前置科技数量调整成本
    if (prereqCount === 0) {
      return { 'automation-science-pack': baseCost };
    } else if (prereqCount === 1) {
      return { 'automation-science-pack': baseCost * 2 };
    } else if (prereqCount === 2) {
      return { 'automation-science-pack': baseCost * 3 };
    } else {
      return { 'automation-science-pack': baseCost * 4 };
    }
  }

  /**
   * 计算科技研究时间
   */
  private calculateResearchTime(dataTech: DataJsonTechnology): number {
    // 根据科技类型和前置条件确定研究时间
    const prereqCount = dataTech.technology?.prerequisites?.length || 0;
    const baseTime = 15;
    
    // 根据前置科技数量调整时间
    if (prereqCount === 0) {
      return baseTime;
    } else if (prereqCount === 1) {
      return baseTime * 1.5;
    } else if (prereqCount === 2) {
      return baseTime * 2;
    } else {
      return baseTime * 2.5;
    }
  }

  /**
   * 从data.json加载科技数据
   */
  private async loadTechnologiesFromDataJson(): Promise<void> {
    try {
      // 使用DataService获取已加载的数据
      const dataService = DataService.getInstance();
      await dataService.loadGameData(); // 确保数据已加载
      
      const technologyItems = dataService.getTechnologies();
      
      // 转换并加载科技数据
      for (const dataTech of technologyItems) {
        const tech = this.convertDataJsonTechnology(dataTech as DataJsonTechnology);
        this.techTree.set(tech.id, tech);
      }
      
      console.log(`Loaded ${technologyItems.length} technologies from data.json`);
    } catch (error) {
      console.error('Failed to load technologies from data.json:', error);
      // 如果加载失败，抛出错误而不是回退到硬编码数据
      throw new Error('无法加载科技数据，请检查data.json文件');
    }
  }

  /**
   * 从data.json加载科技分类数据
   */
  private async loadTechCategoriesFromDataJson(): Promise<TechCategory[]> {
    try {
      // 使用DataService获取已加载的数据
      const dataService = DataService.getInstance();
      await dataService.loadGameData(); // 确保数据已加载
      
      const categories = dataService.getTechCategories();
      
      // 转换分类数据
      const techCategories: TechCategory[] = categories.map((cat: unknown, index: number) => {
        const categoryData = cat as { id: string; name: string; icon?: string };
        return {
          id: categoryData.id,
          name: categoryData.name,
          icon: categoryData.icon || '🔬',
          color: this.getCategoryColor(categoryData.id),
          description: this.getCategoryDescription(categoryData.id),
          order: index + 1
        };
      });
      
      return techCategories;
    } catch (error) {
      console.error('Failed to load categories from data.json:', error);
      // 如果加载失败，返回空数组
      return [];
    }
  }

  /**
   * 获取分类颜色
   */
  private getCategoryColor(categoryId: string): string {
    const colorMap: Record<string, string> = {
      'logistics': '#2196F3',
      'production': '#FF9800',
      'intermediate-products': '#4CAF50',
      'space': '#9C27B0',
      'combat': '#F44336',
      'fluids': '#00BCD4',
      'other': '#607D8B',
      'technology': '#795548'
    };
    return colorMap[categoryId] || '#607D8B';
  }

  /**
   * 获取分类描述
   */
  private getCategoryDescription(categoryId: string): string {
    const descriptionMap: Record<string, string> = {
      'logistics': '物品传输和存储技术',
      'production': '高级生产和制造技术',
      'intermediate-products': '基础自动化和生产技术',
      'space': '太空探索和高级技术',
      'combat': '武器防御和战斗技术',
      'fluids': '流体处理和管道技术',
      'other': '工具和辅助技术',
      'technology': '科技研究相关'
    };
    return descriptionMap[categoryId] || '其他技术';
  }

  /**
   * 初始化科技服务
   */
  public async initialize(): Promise<void> {
    try {
      // 加载科技分类数据
      this.techCategories = await this.loadTechCategoriesFromDataJson();
      
      // 从data.json加载科技数据
      await this.loadTechnologiesFromDataJson();
      
      // 初始化解锁内容
      this.initializeUnlockedContent();
      
      // 计算可用科技
      this.calculateAvailableTechs();
      
      this.isInitialized = true;
      console.log('TechnologyService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize TechnologyService:', error);
      throw error;
    }
  }

  /**
   * 加载科技数据
   */
  private loadTechnologies(technologies: Technology[]): void {
    for (const tech of technologies) {
      this.techTree.set(tech.id, tech);
    }
  }

  /**
   * 初始化解锁内容
   */
  private initializeUnlockedContent(): void {
    for (const techId of this.techState.unlockedTechs) {
      const tech = this.techTree.get(techId);
      if (tech) {
        // 解锁物品
        tech.unlocks.items?.forEach(itemId => {
          this.techState.unlockedItems.add(itemId);
          this.userProgressService.unlockItem(itemId);
        });
        
        // 解锁配方
        tech.unlocks.recipes?.forEach(recipeId => {
          this.techState.unlockedRecipes.add(recipeId);
        });
        
        // 解锁建筑
        tech.unlocks.buildings?.forEach(buildingId => {
          this.techState.unlockedBuildings.add(buildingId);
        });
      }
    }
  }

  /**
   * 检查服务是否已初始化
   */
  public isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  // ========== 状态查询方法 ==========

  /**
   * 检查科技是否已解锁
   */
  public isTechUnlocked(techId: string): boolean {
    return this.techState.unlockedTechs.has(techId);
  }

  /**
   * 检查科技是否可研究
   */
  public isTechAvailable(techId: string): boolean {
    return this.techState.availableTechs.has(techId);
  }

  /**
   * 检查物品是否已解锁
   */
  public isItemUnlocked(itemId: string): boolean {
    return this.techState.unlockedItems.has(itemId);
  }

  /**
   * 检查配方是否已解锁
   */
  public isRecipeUnlocked(recipeId: string): boolean {
    return this.techState.unlockedRecipes.has(recipeId);
  }

  /**
   * 检查建筑是否已解锁
   */
  public isBuildingUnlocked(buildingId: string): boolean {
    return this.techState.unlockedBuildings.has(buildingId);
  }

  /**
   * 获取科技状态
   */
  public getTechStatus(techId: string): TechStatus {
    if (this.techState.unlockedTechs.has(techId)) {
      return 'unlocked';
    }
    
    if (this.techState.currentResearch?.techId === techId) {
      return 'researching';
    }
    
    if (this.techState.availableTechs.has(techId)) {
      return 'available';
    }
    
    return 'locked';
  }

  // ========== 数据获取方法 ==========

  /**
   * 获取科技对象
   */
  public getTechnology(techId: string): Technology | undefined {
    return this.techTree.get(techId);
  }

  /**
   * 获取所有科技
   */
  public getAllTechnologies(): Technology[] {
    return Array.from(this.techTree.values());
  }

  /**
   * 根据分类获取科技
   */
  public getTechnologiesByCategory(category: string): Technology[] {
    return this.getAllTechnologies().filter(tech => tech.category === category);
  }

  /**
   * 搜索科技
   */
  public searchTechnologies(filter: TechSearchFilter): Technology[] {
    let techs = this.getAllTechnologies();

    // 关键词搜索
    if (filter.query) {
      const query = filter.query.toLowerCase();
      techs = techs.filter(tech => 
        tech.name.toLowerCase().includes(query) ||
        tech.description?.toLowerCase().includes(query) ||
        tech.id.toLowerCase().includes(query)
      );
    }

    // 分类过滤
    if (filter.category) {
      techs = techs.filter(tech => tech.category === filter.category);
    }

    // 状态过滤
    if (filter.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      techs = techs.filter(tech => statuses.includes(this.getTechStatus(tech.id)));
    }

    // 显示选项过滤
    if (filter.showUnlocked === false) {
      techs = techs.filter(tech => !this.isTechUnlocked(tech.id));
    }

    if (filter.showUnavailable === false) {
      techs = techs.filter(tech => this.isTechAvailable(tech.id) || this.isTechUnlocked(tech.id));
    }

    return techs;
  }

  /**
   * 获取已解锁的物品列表
   */
  public getUnlockedItems(): string[] {
    return Array.from(this.techState.unlockedItems);
  }

  /**
   * 获取已解锁的配方列表
   */
  public getUnlockedRecipes(): string[] {
    return Array.from(this.techState.unlockedRecipes);
  }

  /**
   * 获取已解锁的建筑列表
   */
  public getUnlockedBuildings(): string[] {
    return Array.from(this.techState.unlockedBuildings);
  }

  /**
   * 获取当前研究状态
   */
  public getCurrentResearch(): TechResearchState | undefined {
    return this.techState.currentResearch;
  }

  /**
   * 获取研究队列
   */
  public getResearchQueue(): ResearchQueueItem[] {
    return [...this.techState.researchQueue];
  }

  // ========== 研究管理方法 ==========

  /**
   * 开始研究科技
   */
  public async startResearch(techId: string): Promise<ResearchResult> {
    // 检查科技是否存在
    const tech = this.techTree.get(techId);
    if (!tech) {
      return {
        success: false,
        error: `科技 ${techId} 不存在`
      };
    }

    // 检查是否已有正在进行的研究
    if (this.techState.currentResearch) {
      return {
        success: false,
        error: '已有科技正在研究中'
      };
    }

    // 检查前置条件
    if (!this.isTechAvailable(techId)) {
      return {
        success: false,
        error: '前置科技尚未完成'
      };
    }

    // 检查是否已解锁
    if (this.isTechUnlocked(techId)) {
      return {
        success: false,
        error: '科技已经解锁'
      };
    }

    // 检查科技包资源
    const hasResources = this.checkSciencePackAvailability(techId);
    if (!hasResources) {
      return {
        success: false,
        error: '科技包不足'
      };
    }

    // 消耗科技包
    const consumeSuccess = this.consumeSciencePacks(techId);
    if (!consumeSuccess) {
      return {
        success: false,
        error: '消耗科技包失败'
      };
    }

    // 获取研究室数量和效率
    const labCount = this.getLabCount();
    const labEfficiency = this.getLabEfficiency();
    const effectiveResearchTime = this.calculateEffectiveResearchTime(tech, labCount, labEfficiency);

    // 创建研究状态
    this.techState.currentResearch = {
      techId,
      status: 'researching',
      progress: 0,
      timeStarted: Date.now(),
      timeRemaining: effectiveResearchTime,
      currentCost: { ...tech.researchCost }
    };

    // 从队列中移除（如果存在）
    this.removeFromResearchQueue(techId);

    // 发送研究开始事件
    this.emitEvent('researchStarted', {
      techId,
      technology: tech,
      sciencePacksConsumed: tech.researchCost,
      timestamp: Date.now()
    } as ResearchStartEvent);

    return {
      success: true,
      message: `开始研究 ${tech.name}`
    };
  }

  /**
   * 更新研究进度
   */
  public updateResearchProgress(deltaTime: number): void {
    if (!this.techState.currentResearch) return;

    const research = this.techState.currentResearch;
    const tech = this.techTree.get(research.techId);
    if (!tech) return;

    // 获取研究室数量和效率
    const labCount = this.getLabCount();
    const labEfficiency = this.getLabEfficiency();
    
    // 计算实际研究时间（考虑研究室数量和效率）
    const effectiveResearchTime = this.calculateEffectiveResearchTime(tech, labCount, labEfficiency);
    
    // 更新进度
    research.progress = Math.min(1, research.progress + deltaTime / effectiveResearchTime);
    research.timeRemaining = Math.max(0, research.timeRemaining! - deltaTime);

    // 检查是否完成
    if (research.progress >= 1) {
      this.completeResearch(research.techId);
    }
  }

  /**
   * 完成研究
   */
  public completeResearch(techId: string): void {
    const tech = this.techTree.get(techId);
    if (!tech) return;

    // 解锁科技
    this.techState.unlockedTechs.add(techId);
    this.techState.researchedTechs.add(techId);

    // 解锁内容
    tech.unlocks.items?.forEach(itemId => {
      this.techState.unlockedItems.add(itemId);
      this.userProgressService.unlockItem(itemId);
    });

    tech.unlocks.recipes?.forEach(recipeId => {
      this.techState.unlockedRecipes.add(recipeId);
    });

    tech.unlocks.buildings?.forEach(buildingId => {
      this.techState.unlockedBuildings.add(buildingId);
    });

    // 更新统计
    if (this.techState.currentResearch) {
      this.techState.totalResearchTime += tech.researchTime;
      
      // 更新科技包消耗统计
      Object.entries(tech.researchCost).forEach(([packId, amount]) => {
        this.techState.totalSciencePacksConsumed[packId] = 
          (this.techState.totalSciencePacksConsumed[packId] || 0) + amount;
      });
    }

    // 清除当前研究
    this.techState.currentResearch = undefined;

    // 重新计算可用科技
    this.calculateAvailableTechs();

    // 更新队列依赖状态
    this.updateQueueDependencies();

    // 发送解锁事件
    this.emitEvent('techUnlocked', {
      techId,
      technology: tech,
      unlockedItems: tech.unlocks.items || [],
      unlockedRecipes: tech.unlocks.recipes || [],
      unlockedBuildings: tech.unlocks.buildings || [],
      timestamp: Date.now()
    } as TechUnlockEvent);

    // 发送研究完成事件
    this.emitEvent('researchCompleted', {
      techId,
      technology: tech,
      researchDuration: tech.researchTime,
      timestamp: Date.now()
    } as ResearchCompleteEvent);

    // 自动开始下一个研究
    if (this.techState.autoResearch) {
      setTimeout(async () => {
        await this.startNextResearch();
      }, 100);
    }

    console.log(`Research completed: ${tech.name}`);
  }

  // ========== 队列管理方法 ==========

  /**
   * 添加到研究队列
   */
  public addToResearchQueue(techId: string, priority: ResearchPriority = ResearchPriority.NORMAL): QueueResult {
    // 检查队列是否已满
    if (this.techState.researchQueue.length >= this.techState.maxQueueSize) {
      return {
        success: false,
        error: '研究队列已满'
      };
    }

    // 检查是否已在队列中
    if (this.techState.researchQueue.some(item => item.techId === techId)) {
      return {
        success: false,
        error: '科技已在队列中'
      };
    }

    // 检查是否已解锁
    if (this.techState.unlockedTechs.has(techId)) {
      return {
        success: false,
        error: '科技已经解锁'
      };
    }

    // 检查科技是否存在
    const tech = this.techTree.get(techId);
    if (!tech) {
      return {
        success: false,
        error: '科技不存在'
      };
    }

    // 创建队列项目
    const queueItem: ResearchQueueItem = {
      techId,
      addedTime: Date.now(),
      priority,
      canStart: this.isTechAvailable(techId),
      blockedBy: this.getBlockingTechs(techId),
      queuePosition: this.techState.researchQueue.length
    };

    // 按优先级插入队列
    this.insertQueueItemByPriority(queueItem);

    // 重新计算队列时间和位置
    this.recalculateQueueTimes();

    return {
      success: true,
      queuePosition: this.getQueuePosition(techId)
    };
  }

  /**
   * 从队列移除
   */
  public removeFromResearchQueue(techId: string): boolean {
    const index = this.techState.researchQueue.findIndex(item => item.techId === techId);
    if (index === -1) return false;

    this.techState.researchQueue.splice(index, 1);
    this.recalculateQueueTimes();
    return true;
  }

  /**
   * 重新排序队列
   */
  public reorderResearchQueue(techId: string, newPosition: number): boolean {
    const oldIndex = this.techState.researchQueue.findIndex(item => item.techId === techId);
    if (oldIndex === -1) return false;

    const item = this.techState.researchQueue.splice(oldIndex, 1)[0];
    this.techState.researchQueue.splice(newPosition, 0, item);
    this.recalculateQueueTimes();
    return true;
  }

  /**
   * 清空研究队列
   */
  public clearResearchQueue(): void {
    this.techState.researchQueue = [];
    this.techState.queueTotalTime = 0;
  }

  /**
   * 设置自动研究
   */
  public setAutoResearch(enabled: boolean): void {
    this.techState.autoResearch = enabled;
  }

  /**
   * 自动开始下一个研究
   */
  public async startNextResearch(): Promise<boolean> {
    if (!this.techState.autoResearch) return false;
    if (this.techState.currentResearch) return false;
    if (this.techState.researchQueue.length === 0) return false;

    // 找到第一个可以开始的研究
    const availableItem = this.techState.researchQueue.find(item => item.canStart);
    if (!availableItem) return false;

    const result = await this.startResearch(availableItem.techId);
    return result.success;
  }

  // ========== 依赖关系计算 ==========

  /**
   * 计算可用科技
   */
  private calculateAvailableTechs(): void {
    this.techState.availableTechs.clear();

    for (const [techId, tech] of this.techTree) {
      // 跳过已解锁的科技
      if (this.techState.unlockedTechs.has(techId)) continue;

      // 检查所有前置科技是否已解锁
      const prerequisitesMet = tech.prerequisites.every(prereqId =>
        this.techState.unlockedTechs.has(prereqId)
      );

      if (prerequisitesMet) {
        this.techState.availableTechs.add(techId);
      }
    }
  }

  /**
   * 获取科技前置条件
   */
  public getTechPrerequisites(techId: string): string[] {
    const tech = this.techTree.get(techId);
    return tech ? tech.prerequisites : [];
  }

  /**
   * 获取依赖此科技的后续科技
   */
  public getTechDependents(techId: string): string[] {
    const dependents: string[] = [];
    for (const [id, tech] of this.techTree) {
      if (tech.prerequisites.includes(techId)) {
        dependents.push(id);
      }
    }
    return dependents;
  }

  /**
   * 获取科技依赖链
   */
  public getTechDependencyChain(techId: string): string[] {
    const visited = new Set<string>();
    const chain: string[] = [];

    const dfs = (currentTechId: string) => {
      if (visited.has(currentTechId)) return;
      visited.add(currentTechId);

      const tech = this.techTree.get(currentTechId);
      if (!tech) return;

      // 先处理前置科技
      tech.prerequisites.forEach(prereqId => dfs(prereqId));

      // 再添加当前科技
      chain.push(currentTechId);
    };

    dfs(techId);
    return chain;
  }

  /**
   * 获取阻塞科技列表
   */
  private getBlockingTechs(techId: string): string[] {
    const tech = this.techTree.get(techId);
    if (!tech) return [];

    return tech.prerequisites.filter(prereqId => 
      !this.techState.unlockedTechs.has(prereqId)
    );
  }

  // ========== 辅助方法 ==========

  /**
   * 检查科技包可用性
   */
  private checkSciencePackAvailability(techId?: string): boolean {
    if (!techId) return true;
    
    const tech = this.techTree.get(techId);
    if (!tech) return false;
    
    // 如果没有科技包需求，直接返回true
    if (Object.keys(tech.researchCost).length === 0) {
      return true;
    }
    
    // 如果没有库存操作接口，则跳过检查
    if (!this.inventoryOps) {
      console.warn('No inventory operations available, skipping science pack check');
      return true;
    }
    
    try {
      // 使用依赖注入的库存操作接口检查科技包
      return this.inventoryOps.hasEnoughItems(tech.researchCost);
    } catch (error) {
      console.warn('Failed to check science pack availability:', error);
      return false;
    }
  }
  
  /**
   * 消耗科技包
   */
  private consumeSciencePacks(techId: string): boolean {
    const tech = this.techTree.get(techId);
    if (!tech) return false;
    
    // 如果没有科技包需求，直接返回true
    if (Object.keys(tech.researchCost).length === 0) {
      return true;
    }
    
    // 如果没有库存操作接口，则跳过消耗
    if (!this.inventoryOps) {
      console.warn('No inventory operations available, skipping science pack consumption');
      return true;
    }
    
    try {
      // 使用依赖注入的库存操作接口消耗科技包
      return this.inventoryOps.consumeItems(tech.researchCost);
    } catch (error) {
      console.warn('Failed to consume science packs:', error);
      return false;
    }
  }

  /**
   * 获取研究室数量
   */
  private getLabCount(): number {
    // 从gameStore获取研究室数量
    try {
      const gameStore = useGameStore.getState();
      const labFacilities = gameStore.facilities.filter(facility => 
        facility.facilityId === 'lab' || facility.facilityId === 'biolab'
      );
      
      return labFacilities.reduce((total: number, facility: FacilityInstance) => total + facility.count, 0);
    } catch (error) {
      console.warn('Failed to get lab count from gameStore:', error);
      return 1; // 默认1个研究室
    }
  }

  /**
   * 获取研究室效率
   */
  private getLabEfficiency(): number {
    // 研究室效率基于：
    // 1. 基础效率（1.0）
    // 2. 研究速度科技加成
    // 3. 模块效果（如果有）
    
    let efficiency = 1.0;
    
    // 研究速度科技加成
    const researchSpeedTechs = ['research-speed-1', 'research-speed-2', 'research-speed-3'];
    for (const techId of researchSpeedTechs) {
      if (this.techState.unlockedTechs.has(techId)) {
        // 每个研究速度科技提供50%加成
        efficiency += 0.5;
      }
    }
    
    return efficiency;
  }

  /**
   * 计算有效研究时间
   */
  private calculateEffectiveResearchTime(tech: Technology, labCount: number, labEfficiency: number): number {
    // 基础研究时间
    const baseTime = tech.researchTime;
    
    // 研究室数量影响：更多研究室 = 更快研究
    const labMultiplier = Math.max(0.1, 1 / labCount);
    
    // 研究室效率影响
    const efficiencyMultiplier = 1 / labEfficiency;
    
    // 最终研究时间
    const effectiveTime = baseTime * labMultiplier * efficiencyMultiplier;
    
    return Math.max(effectiveTime, 0.1); // 最小0.1秒
  }

  /**
   * 按优先级插入队列项目
   */
  private insertQueueItemByPriority(item: ResearchQueueItem): void {
    let insertIndex = this.techState.researchQueue.length;
    
    // 找到合适的插入位置
    for (let i = 0; i < this.techState.researchQueue.length; i++) {
      if (this.techState.researchQueue[i].priority > item.priority) {
        insertIndex = i;
        break;
      }
    }
    
    this.techState.researchQueue.splice(insertIndex, 0, item);
  }

  /**
   * 重新计算队列时间和位置
   */
  private recalculateQueueTimes(): void {
    let totalTime = 0;
    
    this.techState.researchQueue.forEach((item, index) => {
      item.queuePosition = index;
      
      const tech = this.techTree.get(item.techId);
      if (tech) {
        item.estimatedStartTime = Date.now() + totalTime * 1000;
        totalTime += tech.researchTime;
      }
    });
    
    this.techState.queueTotalTime = totalTime;
  }

  /**
   * 更新队列依赖状态
   */
  private updateQueueDependencies(): void {
    this.techState.researchQueue.forEach(item => {
      item.canStart = this.isTechAvailable(item.techId);
      item.blockedBy = this.getBlockingTechs(item.techId);
    });
  }

  /**
   * 获取队列位置
   */
  private getQueuePosition(techId: string): number {
    const index = this.techState.researchQueue.findIndex(item => item.techId === techId);
    return index;
  }

  // ========== 统计和状态方法 ==========

  /**
   * 获取科技统计信息
   */
  public getTechStatistics(): TechStatistics {
    const allTechs = this.getAllTechnologies();
    const unlockedCount = this.techState.unlockedTechs.size;
    const availableCount = this.techState.availableTechs.size;
    
    // 按分类统计
    const techsByCategory: Record<string, number> = {};
    allTechs.forEach(tech => {
      techsByCategory[tech.category] = (techsByCategory[tech.category] || 0) + 1;
    });

    return {
      totalTechs: allTechs.length,
      unlockedTechs: unlockedCount,
      availableTechs: availableCount,
      researchProgress: allTechs.length > 0 ? (unlockedCount / allTechs.length) * 100 : 0,
      techsByCategory,
      totalResearchTime: this.techState.totalResearchTime,
      averageResearchTime: unlockedCount > 0 ? this.techState.totalResearchTime / unlockedCount : 0
    };
  }

  /**
   * 获取科技树状态
   */
  public getTechTreeState(): TechTreeState {
    return { ...this.techState };
  }

  /**
   * 获取科技分类列表
   */
  public getTechCategories(): TechCategory[] {
    return this.techCategories;
  }

  /**
   * 根据分类ID获取科技分类
   */
  public getTechCategory(categoryId: string): TechCategory | undefined {
    return this.techCategories.find(cat => cat.id === categoryId);
  }

  // ========== 事件系统 ==========

  /**
   * 监听事件
   */
  public on(event: string, callback: (data: unknown) => void): void {
    this.eventEmitter.addEventListener(event, (e: Event) => {
      const customEvent = e as CustomEvent;
      callback(customEvent.detail);
    });
  }

  /**
   * 发送事件
   */
  private emitEvent(event: string, data: unknown): void {
    this.eventEmitter.dispatchEvent(new CustomEvent(event, { detail: data }));
  }
}

// 导出单例实例
export default TechnologyService.getInstance();