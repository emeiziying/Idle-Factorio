/**
 * 研究队列服务
 * 管理科技研究队列、优先级和自动研究
 */

import type { ResearchQueueItem, QueueResult } from '@/types/technology';
import { ResearchPriority } from '@/types/technology';
import type { TechTreeService } from '@/services/technology/TechTreeService';
import { 
  TechEventEmitter, 
  TechEventType, 
  type QueueUpdatedEvent 
} from './events';

export class ResearchQueueService {
  // 研究队列
  private researchQueue: ResearchQueueItem[] = [];
  
  // 配置
  private autoResearchEnabled = false;
  private maxQueueSize = 10;
  
  // 服务依赖
  private treeService: TechTreeService | null = null;
  private eventEmitter: TechEventEmitter;

  constructor(eventEmitter: TechEventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  /**
   * 初始化服务
   */
  async initialize(treeService: TechTreeService): Promise<void> {
    this.treeService = treeService;
  }

  /**
   * 获取研究队列
   */
  getResearchQueue(): ResearchQueueItem[] {
    return [...this.researchQueue];
  }

  /**
   * 添加科技到研究队列
   */
  addToQueue(
    techId: string, 
    priority: ResearchPriority = ResearchPriority.NORMAL
  ): QueueResult {
    // 检查科技是否存在
    const tech = this.treeService?.getTechnology(techId);
    if (!tech) {
      return {
        success: false,
        error: `科技 ${techId} 不存在`,
      };
    }

    // 检查是否已在队列中
    if (this.researchQueue.some(item => item.techId === techId)) {
      return {
        success: false,
        error: '科技已在研究队列中',
      };
    }

    // 检查队列大小
    if (this.researchQueue.length >= this.maxQueueSize) {
      return {
        success: false,
        error: `研究队列已满（最大 ${this.maxQueueSize} 项）`,
      };
    }

    // 创建队列项
    const queueItem: ResearchQueueItem = {
      techId,
      priority,
      addedTime: Date.now(),
      canStart: false, // 将在更新依赖时计算
      queuePosition: 0, // 将在插入队列时更新
    };

    // 根据优先级插入队列
    this.insertQueueItemByPriority(queueItem);

    // 更新队列依赖和时间
    this.updateQueueDependencies();

    // 发送队列更新事件
    this.emitQueueUpdatedEvent(['added'], [techId]);

    return {
      success: true,
      queuePosition: this.getQueuePosition(techId)
    };
  }

  /**
   * 从队列中移除科技
   */
  removeFromQueue(techId: string): boolean {
    const index = this.researchQueue.findIndex(item => item.techId === techId);
    if (index === -1) return false;

    this.researchQueue.splice(index, 1);
    
    // 更新队列
    this.updateQueueDependencies();
    
    // 发送事件
    this.emitQueueUpdatedEvent(['removed'], [techId]);
    
    return true;
  }

  /**
   * 重新排序队列中的科技
   */
  reorderQueue(techId: string, newPosition: number): boolean {
    if (newPosition < 0 || newPosition >= this.researchQueue.length) {
      return false;
    }

    const oldIndex = this.researchQueue.findIndex(item => item.techId === techId);
    if (oldIndex === -1) return false;

    // 移动项目
    const [item] = this.researchQueue.splice(oldIndex, 1);
    this.researchQueue.splice(newPosition, 0, item);

    // 更新队列
    this.updateQueueDependencies();
    
    // 发送事件
    this.emitQueueUpdatedEvent(['reordered']);
    
    return true;
  }

  /**
   * 清空研究队列
   */
  clearQueue(): void {
    const clearedIds = this.researchQueue.map(item => item.techId);
    this.researchQueue = [];
    
    if (clearedIds.length > 0) {
      this.emitQueueUpdatedEvent(['removed'], clearedIds);
    }
  }

  /**
   * 设置自动研究
   */
  setAutoResearch(enabled: boolean): void {
    this.autoResearchEnabled = enabled;
  }

  /**
   * 是否启用自动研究
   */
  isAutoResearchEnabled(): boolean {
    return this.autoResearchEnabled;
  }

  /**
   * 获取下一个可用的研究项
   */
  getNextAvailable(
    isAvailable: (techId: string) => boolean
  ): ResearchQueueItem | undefined {
    return this.researchQueue.find(item => 
      item.canStart && isAvailable(item.techId)
    );
  }

  /**
   * 获取科技在队列中的位置
   */
  getQueuePosition(techId: string): number {
    const index = this.researchQueue.findIndex(item => item.techId === techId);
    return index === -1 ? -1 : index + 1;
  }

  /**
   * 根据优先级插入队列项
   */
  private insertQueueItemByPriority(item: ResearchQueueItem): void {
    // 找到合适的插入位置
    let insertIndex = this.researchQueue.length;
    
    for (let i = 0; i < this.researchQueue.length; i++) {
      // 优先级数值越小，优先级越高
      if (item.priority < this.researchQueue[i].priority) {
        insertIndex = i;
        break;
      }
      // 相同优先级，按添加时间排序
      if (item.priority === this.researchQueue[i].priority && 
          item.addedTime < this.researchQueue[i].addedTime) {
        insertIndex = i;
        break;
      }
    }
    
    this.researchQueue.splice(insertIndex, 0, item);
  }

  /**
   * 更新队列依赖关系
   */
  updateQueueDependencies(): void {
    // 收集队列中所有科技的ID
    const queueTechIds = new Set(this.researchQueue.map(item => item.techId));
    
    // 更新每个项目的 canStart 状态
    this.researchQueue.forEach(item => {
      const tech = this.treeService?.getTechnology(item.techId);
      if (!tech) {
        item.canStart = false;
        return;
      }
      
      // 检查前置科技是否都不在队列中
      item.canStart = !tech.prerequisites.some((prereqId: string) => 
        queueTechIds.has(prereqId)
      );
    });

    // 重新计算预计时间
    this.recalculateQueueTimes();
  }

  /**
   * 重新计算队列时间
   */
  private recalculateQueueTimes(): void {
    let cumulativeTime = 0;
    
    this.researchQueue.forEach(item => {
      const tech = this.treeService?.getTechnology(item.techId);
      if (tech) {
        item.estimatedTime = tech.researchTime;
        item.estimatedStartTime = cumulativeTime;
        
        // 如果可以开始，累加时间
        if (item.canStart) {
          cumulativeTime += tech.researchTime;
        }
      }
    });
  }

  /**
   * 发送队列更新事件
   */
  private emitQueueUpdatedEvent(
    changeTypes: Array<'added' | 'removed' | 'reordered'>,
    affectedTechIds?: string[]
  ): void {
    const event: QueueUpdatedEvent = {
      timestamp: Date.now(),
      queue: this.researchQueue.map(item => ({
        techId: item.techId,
        priority: item.priority,
      })),
      changes: {
        added: changeTypes.includes('added') ? affectedTechIds : undefined,
        removed: changeTypes.includes('removed') ? affectedTechIds : undefined,
        reordered: changeTypes.includes('reordered'),
      },
    };
    
    this.eventEmitter.emit<QueueUpdatedEvent>(TechEventType.QUEUE_UPDATED, event);
  }

  /**
   * 获取队列统计
   */
  getQueueStatistics(): {
    totalItems: number;
    readyItems: number;
    blockedItems: number;
    totalEstimatedTime: number;
    priorityCounts: Record<number, number>;
  } {
    const stats = {
      totalItems: this.researchQueue.length,
      readyItems: 0,
      blockedItems: 0,
      totalEstimatedTime: 0,
      priorityCounts: {
        [ResearchPriority.HIGH]: 0,
        [ResearchPriority.NORMAL]: 0,
        [ResearchPriority.LOW]: 0,
      },
    };

    this.researchQueue.forEach(item => {
      if (item.canStart) {
        stats.readyItems++;
      } else {
        stats.blockedItems++;
      }
      
      if (item.estimatedTime) {
        stats.totalEstimatedTime += item.estimatedTime;
      }
      
      stats.priorityCounts[item.priority]++;
    });

    return stats;
  }

  /**
   * 设置最大队列大小
   */
  setMaxQueueSize(size: number): void {
    if (size > 0 && size <= 50) {
      this.maxQueueSize = size;
    }
  }

  /**
   * 获取推荐的下一个研究
   */
  getRecommendedNext(
    isUnlocked: (techId: string) => boolean,
    isAvailable: (techId: string) => boolean
  ): string[] {
    if (!this.treeService) return [];
    
    const recommendations: string[] = [];
    const allTechs = this.treeService.getAllTechnologies();
    
    // 查找可用但未解锁且不在队列中的科技
    for (const tech of allTechs) {
      if (!isUnlocked(tech.id) && 
          isAvailable(tech.id) && 
          !this.researchQueue.some(item => item.techId === tech.id)) {
        recommendations.push(tech.id);
      }
      
      if (recommendations.length >= 5) break;
    }
    
    return recommendations;
  }
}