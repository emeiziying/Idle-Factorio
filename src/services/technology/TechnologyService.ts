/**
 * 科技系统服务（重构版）
 * 作为外部接口和子服务协调器
 */

import type {
  Technology,
  TechResearchState,
  TechTreeState,
  ResearchQueueItem,
  TechStatus,
  ResearchResult,
  QueueResult,
  TechSearchFilter,
  TechStatistics,
  TechCategory,
} from '../../types/technology';
import { ResearchPriority } from '@/types/technology';
import type { InventoryOperations } from '@/types/inventory';

// 子服务
import { TechTreeService } from '@/services/technology/TechTreeService';
import { TechUnlockService } from '@/services/technology/TechUnlockService';
import { ResearchService } from '@/services/technology/ResearchService';
import { ResearchQueueService } from '@/services/technology/ResearchQueueService';
import { TechProgressTracker } from '@/services/technology/TechProgressTracker';

// 事件系统
import {
  TechEventEmitter,
  TechEventType,
  type ResearchCompletedEvent,
  type TechEventHandler,
} from './events';

import Logger from '@/utils/logger';

/**
 * 科技系统服务类
 * 负责协调各个子服务，提供统一的对外接口
 */
export class TechnologyService {
  private static instance: TechnologyService;

  // 子服务
  private treeService: TechTreeService;
  private unlockService: TechUnlockService;
  private researchService: ResearchService;
  private queueService: ResearchQueueService;
  private progressTracker: TechProgressTracker;

  // 事件系统
  private eventEmitter: TechEventEmitter;

  // 其他
  private logger: Logger;
  private isInitialized = false;

  private constructor() {
    // 创建事件发射器
    this.eventEmitter = new TechEventEmitter();

    // 创建子服务
    this.treeService = new TechTreeService();
    this.unlockService = new TechUnlockService(this.eventEmitter);
    this.researchService = new ResearchService(this.eventEmitter);
    this.queueService = new ResearchQueueService(this.eventEmitter);
    this.progressTracker = new TechProgressTracker();

    // 设置日志
    this.logger = new Logger();
    this.logger.configure({ prefix: '[Game] [Technology]' });

    // 设置服务间事件监听
    this.setupEventListeners();
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
    this.researchService.setInventoryOperations(inventoryOps);
  }

  /**
   * 初始化服务
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.info('Technology service already initialized');
      return;
    }

    try {
      this.logger.info('Initializing technology service...');

      // 按顺序初始化各个子服务
      await this.treeService.initialize();
      await this.unlockService.initialize(this.treeService);
      await this.researchService.initialize(this.treeService, this.unlockService);
      await this.queueService.initialize(this.treeService);
      await this.progressTracker.initialize(this.treeService, this.unlockService);

      this.isInitialized = true;
      this.logger.info('Technology service initialized successfully');

      // 输出初始统计
      const stats = this.getTechStatistics();
      this.logger.info(`Loaded ${stats.totalTechs} technologies`);
      this.logger.info(`Unlocked ${stats.unlockedTechs} technologies`);
    } catch (error) {
      this.logger.error('Failed to initialize technology service:', error);
      throw error;
    }
  }

  /**
   * 检查服务是否已初始化
   */
  public isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * 强制重新初始化
   */
  public async forceReinitialize(): Promise<void> {
    this.isInitialized = false;
    await this.initialize();
  }

  // ========== 委托给 TechTreeService 的方法 ==========

  public getTechnology(techId: string): Technology | undefined {
    return this.treeService.getTechnology(techId);
  }

  public getAllTechnologies(): Technology[] {
    return this.treeService.getAllTechnologies();
  }

  public getAllTechnologiesInOriginalOrder(): Technology[] {
    return this.treeService.getAllTechnologiesInOriginalOrder();
  }

  public getTechnologiesByCategory(category: string): Technology[] {
    return this.treeService.getTechnologiesByCategory(category);
  }

  public searchTechnologies(filter: TechSearchFilter): Technology[] {
    // 增强搜索过滤器，添加状态获取函数
    const enhancedFilter = {
      ...filter,
      status: filter.status,
    };
    return this.treeService.searchTechnologies(enhancedFilter);
  }

  public getTechCategories(): TechCategory[] {
    return this.treeService.getTechCategories();
  }

  public getTechCategory(categoryId: string): TechCategory | undefined {
    return this.treeService.getTechCategory(categoryId);
  }

  public getTechPrerequisites(techId: string): string[] {
    return this.treeService.getTechPrerequisites(techId);
  }

  public getTechDependents(techId: string): string[] {
    return this.treeService.getTechDependents(techId);
  }

  public getTechDependencyChain(techId: string): string[] {
    return this.treeService.getTechDependencyChain(techId);
  }

  // ========== 委托给 TechUnlockService 的方法 ==========

  public isTechUnlocked(techId: string): boolean {
    return this.unlockService.isTechUnlocked(techId);
  }

  public isItemUnlocked(itemId: string): boolean {
    return this.unlockService.isItemUnlocked(itemId);
  }

  public isRecipeUnlocked(recipeId: string): boolean {
    return this.unlockService.isRecipeUnlocked(recipeId);
  }

  public isBuildingUnlocked(buildingId: string): boolean {
    return this.unlockService.isBuildingUnlocked(buildingId);
  }

  public getUnlockedItems(): string[] {
    return this.unlockService.getUnlockedItems();
  }

  public getUnlockedRecipes(): string[] {
    return this.unlockService.getUnlockedRecipes();
  }

  public getUnlockedBuildings(): string[] {
    return this.unlockService.getUnlockedBuildings();
  }

  // ========== 委托给 ResearchService 的方法 ==========

  public getCurrentResearch(): TechResearchState | undefined {
    return this.researchService.getCurrentResearch();
  }

  public async startResearch(techId: string): Promise<ResearchResult> {
    const result = await this.researchService.startResearch(techId);

    if (result.success) {
      // 从队列中移除
      this.queueService.removeFromQueue(techId);

      // 记录开始时间
      this.progressTracker.recordResearchStart(techId);
    }

    return result;
  }

  public updateResearchProgress(deltaTime: number): void {
    const completedEvent = this.researchService.updateResearchProgress(deltaTime);

    if (completedEvent) {
      this.handleResearchCompleted(completedEvent);
    }
  }

  // ========== 委托给 ResearchQueueService 的方法 ==========

  public getResearchQueue(): ResearchQueueItem[] {
    return this.queueService.getResearchQueue();
  }

  public addToResearchQueue(techId: string, priority?: ResearchPriority): QueueResult {
    return this.queueService.addToQueue(techId, priority);
  }

  public removeFromResearchQueue(techId: string): boolean {
    return this.queueService.removeFromQueue(techId);
  }

  public reorderResearchQueue(techId: string, newPosition: number): boolean {
    return this.queueService.reorderQueue(techId, newPosition);
  }

  public clearResearchQueue(): void {
    this.queueService.clearQueue();
  }

  public setAutoResearch(enabled: boolean): void {
    this.queueService.setAutoResearch(enabled);
  }

  public async startNextResearch(): Promise<boolean> {
    const next = this.queueService.getNextAvailable(techId => this.isTechAvailable(techId));

    if (next) {
      const result = await this.startResearch(next.techId);
      return result.success;
    }

    return false;
  }

  // ========== 委托给 TechProgressTracker 的方法 ==========

  public getTechStatistics(): TechStatistics {
    return this.progressTracker.getTechStatistics();
  }

  // ========== 综合方法 ==========

  /**
   * 获取科技状态
   */
  public getTechStatus(techId: string): TechStatus {
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
  public isTechAvailable(techId: string): boolean {
    const tech = this.treeService.getTechnology(techId);
    if (!tech) return false;

    // 检查是否已解锁
    if (this.unlockService.isTechUnlocked(techId)) return false;

    // 检查前置科技
    return tech.prerequisites.every((prereqId: string) =>
      this.unlockService.isTechUnlocked(prereqId)
    );
  }

  /**
   * 获取完整的科技树状态
   */
  public getTechTreeState(): TechTreeState {
    const progressData = this.progressTracker.getProgressData();
    const queueStats = this.queueService.getQueueStatistics();

    // 计算可用科技
    const availableTechs = new Set<string>();
    this.treeService.getAllTechnologies().forEach(tech => {
      if (this.isTechAvailable(tech.id)) {
        availableTechs.add(tech.id);
      }
    });

    return {
      unlockedTechs: this.unlockService.getUnlockedTechs(),
      researchedTechs: progressData.researchedTechs,
      availableTechs,
      unlockedItems: new Set(this.unlockService.getUnlockedItems()),
      unlockedRecipes: new Set(this.unlockService.getUnlockedRecipes()),
      unlockedBuildings: new Set(this.unlockService.getUnlockedBuildings()),
      currentResearch: this.researchService.getCurrentResearch(),
      researchQueue: this.queueService.getResearchQueue(),
      autoResearch: this.queueService.isAutoResearchEnabled(),
      maxQueueSize: 10, // TODO: 从配置获取
      queueTotalTime: queueStats.totalEstimatedTime,
      totalResearchTime: progressData.totalResearchTime,
      totalSciencePacksConsumed: progressData.totalSciencePacksConsumed,
    } as TechTreeState;
  }

  /**
   * 完成研究
   */
  public completeResearch(techId: string): void {
    const tech = this.treeService.getTechnology(techId);
    if (!tech) return;

    // 解锁科技
    this.unlockService.unlockTechnology(techId);

    // 记录完成
    this.progressTracker.recordResearchComplete(tech);

    // 重新计算可用科技
    this.calculateAvailableTechs();

    // 日志
    this.logger.info(`Research completed: ${tech.name}`);

    // 如果启用了自动研究，开始下一个
    if (this.queueService.isAutoResearchEnabled()) {
      this.startNextResearch();
    }
  }

  /**
   * 计算可用科技（更新状态）
   */
  private calculateAvailableTechs(): void {
    // 这个方法主要是为了兼容性，实际的可用科技是动态计算的
    const availableCount = this.treeService
      .getAllTechnologies()
      .filter(tech => this.isTechAvailable(tech.id)).length;

    this.logger.info(`Available technologies: ${availableCount}`);
  }

  // ========== 事件处理 ==========

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听研究完成事件
    this.eventEmitter.on(TechEventType.RESEARCH_COMPLETED, this.handleResearchCompleted.bind(this));

    // 监听科技解锁事件
    this.eventEmitter.on(TechEventType.TECH_UNLOCKED, () => {
      this.queueService.updateQueueDependencies();
    });
  }

  /**
   * 处理研究完成
   */
  private handleResearchCompleted(event: ResearchCompletedEvent): void {
    this.completeResearch(event.techId);

    // 发送外部事件
    this.eventEmitter.emit(TechEventType.RESEARCH_COMPLETED, event);
  }

  /**
   * 事件订阅（向后兼容）
   */
  public on(event: string, callback: TechEventHandler): void {
    // 映射旧事件名到新事件类型
    const eventMap: Record<string, TechEventType> = {
      techUnlocked: TechEventType.TECH_UNLOCKED,
      researchStarted: TechEventType.RESEARCH_STARTED,
      researchCompleted: TechEventType.RESEARCH_COMPLETED,
      queueUpdated: TechEventType.QUEUE_UPDATED,
    };

    const eventType = eventMap[event] || (event as TechEventType);
    this.eventEmitter.on(eventType, callback);
  }

  // ========== 静态辅助方法（向后兼容）==========

  public static getUnlockedContentInfo(technology: Technology) {
    const service = TechnologyService.getInstance();
    return service.unlockService.getUnlockedContentInfo(technology);
  }

  public static getPrerequisiteNames(prerequisites: string[]): string[] {
    const service = TechnologyService.getInstance();
    return prerequisites.map(id => {
      const tech = service.getTechnology(id);
      return tech?.name || id;
    });
  }

  public static getResearchTriggerInfo(techId: string) {
    const service = TechnologyService.getInstance();
    const tech = service.getTechnology(techId);

    if (!tech?.researchTrigger) {
      return { hasResearchTrigger: false };
    }

    return {
      hasResearchTrigger: true,
      triggerType: tech.researchTrigger.type,
      triggerItem: tech.researchTrigger.item,
      triggerCount: tech.researchTrigger.count || 1,
    };
  }

  /**
   * 按状态排序技术
   */
  public static getTechnologiesSortedByStatus(
    technologies: Technology[],
    techStates: Map<string, { status: TechStatus; progress?: number }>
  ): Technology[] {
    return technologies.sort((a, b) => {
      const stateA = techStates.get(a.id)?.status || 'locked';
      const stateB = techStates.get(b.id)?.status || 'locked';

      // 状态优先级：available > researching > unlocked > locked
      const priority = { available: 3, researching: 2, unlocked: 1, locked: 0 };
      const priorityDiff = (priority[stateB] || 0) - (priority[stateA] || 0);

      if (priorityDiff !== 0) return priorityDiff;

      // 同状态按名称排序
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * 获取显示用的技术列表
   */
  public static getDisplayTechnologies(
    technologies: Technology[],
    techStates: Map<string, { status: TechStatus; progress?: number }>
  ): Technology[] {
    return technologies.filter(tech => {
      const state = techStates.get(tech.id)?.status || 'locked';
      // 显示可研究、研究中和已解锁的技术
      return ['available', 'researching', 'unlocked'].includes(state);
    });
  }
}
