/**
 * 重构后的 TechnologyService 示例
 * 作为协调器，调用各个子服务
 */

import type { Technology, TechTreeState, TechSearchFilter } from '../../../types/technology';
import { TechTreeService } from './TechTreeService';
import { TechUnlockService } from './TechUnlockService';
import { ResearchService } from './ResearchService';
import { ResearchQueueService } from './ResearchQueueService';
import { TechProgressTracker } from './TechProgressTracker';

export class TechnologyServiceRefactored {
  private static instance: TechnologyServiceRefactored;
  
  // 子服务
  private treeService: TechTreeService;
  private unlockService: TechUnlockService;
  private researchService: ResearchService;
  private queueService: ResearchQueueService;
  private progressTracker: TechProgressTracker;
  
  // 事件管理
  private eventEmitter: EventTarget = new EventTarget();

  private constructor() {
    // 初始化子服务
    this.treeService = new TechTreeService();
    this.unlockService = new TechUnlockService();
    this.researchService = new ResearchService();
    this.queueService = new ResearchQueueService();
    this.progressTracker = new TechProgressTracker();
    
    // 设置服务间通信
    this.setupServiceCommunication();
  }

  public static getInstance(): TechnologyServiceRefactored {
    if (!TechnologyServiceRefactored.instance) {
      TechnologyServiceRefactored.instance = new TechnologyServiceRefactored();
    }
    return TechnologyServiceRefactored.instance;
  }

  /**
   * 初始化所有子服务
   */
  async initialize(): Promise<void> {
    // 按顺序初始化各个服务
    await this.treeService.initialize();
    await this.unlockService.initialize(this.treeService);
    await this.researchService.initialize(this.treeService, this.unlockService);
    await this.queueService.initialize(this.treeService);
    await this.progressTracker.initialize();
  }

  // ========== 委托给 TechTreeService 的方法 ==========
  
  getTechnology(techId: string): Technology | undefined {
    return this.treeService.getTechnology(techId);
  }

  getAllTechnologies(): Technology[] {
    return this.treeService.getAllTechnologies();
  }

  searchTechnologies(filter: TechSearchFilter): Technology[] {
    // 增强搜索过滤器，添加状态获取函数
    const enhancedFilter = {
      ...filter,
      getStatus: (techId: string) => this.getTechStatus(techId)
    };
    return this.treeService.searchTechnologies(enhancedFilter);
  }

  getTechCategories() {
    return this.treeService.getTechCategories();
  }

  // ========== 委托给 TechUnlockService 的方法 ==========
  
  isTechUnlocked(techId: string): boolean {
    return this.unlockService.isTechUnlocked(techId);
  }

  isItemUnlocked(itemId: string): boolean {
    return this.unlockService.isItemUnlocked(itemId);
  }

  getUnlockedItems(): string[] {
    return this.unlockService.getUnlockedItems();
  }

  // ========== 委托给 ResearchService 的方法 ==========
  
  async startResearch(techId: string) {
    const result = await this.researchService.startResearch(techId);
    
    if (result.success) {
      // 从队列中移除
      this.queueService.removeFromQueue(techId);
      
      // 发送事件
      this.emitEvent('researchStarted', {
        techId,
        technology: this.getTechnology(techId)
      });
    }
    
    return result;
  }

  updateResearchProgress(deltaTime: number): void {
    const completed = this.researchService.updateResearchProgress(deltaTime);
    
    if (completed) {
      // 更新解锁状态
      this.unlockService.unlockTechnology(completed.techId);
      
      // 更新统计
      this.progressTracker.recordResearchComplete(completed.technology);
      
      // 自动开始下一个研究
      if (this.queueService.isAutoResearchEnabled()) {
        this.startNextResearch();
      }
    }
  }

  getCurrentResearch() {
    return this.researchService.getCurrentResearch();
  }

  // ========== 委托给 ResearchQueueService 的方法 ==========
  
  addToResearchQueue(techId: string, priority?: number) {
    return this.queueService.addToQueue(techId, priority);
  }

  getResearchQueue() {
    return this.queueService.getResearchQueue();
  }

  setAutoResearch(enabled: boolean) {
    this.queueService.setAutoResearch(enabled);
  }

  // ========== 委托给 TechProgressTracker 的方法 ==========
  
  getTechStatistics() {
    return this.progressTracker.getTechStatistics();
  }

  // ========== 综合方法 ==========
  
  /**
   * 获取科技状态（需要综合多个服务的信息）
   */
  getTechStatus(techId: string) {
    if (this.unlockService.isTechUnlocked(techId)) {
      return 'unlocked';
    }
    
    const currentResearch = this.researchService.getCurrentResearch();
    if (currentResearch?.techId === techId) {
      return 'researching';
    }
    
    if (this.isTechAvailable(techId)) {
      return 'available';
    }
    
    return 'locked';
  }

  /**
   * 检查科技是否可研究
   */
  isTechAvailable(techId: string): boolean {
    const tech = this.treeService.getTechnology(techId);
    if (!tech) return false;
    
    // 检查前置科技
    return tech.prerequisites.every(prereqId => 
      this.unlockService.isTechUnlocked(prereqId)
    );
  }

  /**
   * 获取完整的科技树状态
   */
  getTechTreeState(): TechTreeState {
    return {
      technologies: new Map(this.treeService.getAllTechnologies().map(t => [t.id, t])),
      unlockedTechs: this.unlockService.getUnlockedTechs(),
      unlockedItems: this.unlockService.getUnlockedItems(),
      unlockedRecipes: this.unlockService.getUnlockedRecipes(),
      unlockedBuildings: this.unlockService.getUnlockedBuildings(),
      currentResearch: this.researchService.getCurrentResearch(),
      researchQueue: this.queueService.getResearchQueue(),
      autoResearchEnabled: this.queueService.isAutoResearchEnabled(),
      ...this.progressTracker.getProgressData()
    };
  }

  /**
   * 开始下一个研究
   */
  private async startNextResearch(): Promise<boolean> {
    const next = this.queueService.getNextAvailable(
      techId => this.isTechAvailable(techId)
    );
    
    if (next) {
      const result = await this.startResearch(next.techId);
      return result.success;
    }
    
    return false;
  }

  /**
   * 设置服务间通信
   */
  private setupServiceCommunication(): void {
    // 研究服务完成事件
    this.researchService.onResearchComplete((data) => {
      this.unlockService.unlockTechnology(data.techId);
      this.progressTracker.recordResearchComplete(data.technology);
    });
    
    // 解锁服务事件
    this.unlockService.onTechUnlocked((data) => {
      this.queueService.updateQueueDependencies();
    });
  }

  /**
   * 事件管理
   */
  on(event: string, callback: (data: unknown) => void): void {
    this.eventEmitter.addEventListener(event, (e: Event) => {
      callback((e as CustomEvent).detail);
    });
  }

  private emitEvent(event: string, data: unknown): void {
    this.eventEmitter.dispatchEvent(new CustomEvent(event, { detail: data }));
  }
}