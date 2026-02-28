/**
 * 研究服务
 * 管理当前研究进度、资源消耗和研究完成
 */

import type { Technology, TechResearchState, ResearchResult } from '@/types/technology';
import type { InventoryOperations } from '@/types/inventory';
import type { TechTreeService } from '@/services/technology/TechTreeService';
import type { TechUnlockService } from '@/services/technology/TechUnlockService';
import { getService } from '@/services/core/DIServiceInitializer';
import { SERVICE_TOKENS } from '@/services/core/ServiceTokens';
import type { FacilityInstance } from '@/types/facilities';
import { FacilityStatus } from '@/types/facilities';
import {
  TechEventEmitter,
  TechEventType,
  type ResearchStartedEvent,
  type ResearchProgressEvent,
  type ResearchCompletedEvent,
} from './events';
import useGameStore from '@/store/gameStore';
import type { ResearchCalculation } from '@/services/technology/types';

export class ResearchService {
  // 当前研究状态
  private currentResearch: TechResearchState | undefined;

  // 库存操作接口（由外部设置）
  private inventoryOps: InventoryOperations | null = null;
  private eventEmitter: TechEventEmitter;

  // 研究配置
  private readonly BASE_LAB_SPEED = 1.0;
  private readonly LAB_EFFICIENCY_MULTIPLIER = 0.5; // 每个额外研究室增加50%速度

  constructor(eventEmitter: TechEventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  /**
   * 获取 TechTreeService 实例
   */
  private getTechTreeService(): TechTreeService {
    return getService<TechTreeService>(SERVICE_TOKENS.TECH_TREE_SERVICE);
  }

  /**
   * 获取 TechUnlockService 实例
   */
  private getTechUnlockService(): TechUnlockService {
    return getService<TechUnlockService>(SERVICE_TOKENS.TECH_UNLOCK_SERVICE);
  }

  /**
   * 设置库存操作接口
   */
  setInventoryOperations(inventoryOps: InventoryOperations): void {
    this.inventoryOps = inventoryOps;
  }

  /**
   * 获取当前研究状态
   */
  getCurrentResearch(): TechResearchState | undefined {
    return this.currentResearch ? { ...this.currentResearch } : undefined;
  }

  /**
   * 开始研究科技
   */
  async startResearch(techId: string): Promise<ResearchResult> {
    // 检查科技是否存在
    const tech = this.getTechTreeService().getTechnology(techId);
    if (!tech) {
      return {
        success: false,
        error: `科技 ${techId} 不存在`,
      };
    }

    // 检查是否已有正在进行的研究
    if (this.currentResearch) {
      return {
        success: false,
        error: '已有科技正在研究中',
      };
    }

    // 检查是否已解锁
    if (this.getTechUnlockService().isTechUnlocked(techId)) {
      return {
        success: false,
        error: '科技已经解锁',
      };
    }

    // 检查前置科技
    if (!this.canStartResearch(techId)) {
      return {
        success: false,
        error: '前置科技尚未完成',
      };
    }

    // 检查并消耗科技包
    const consumeResult = await this.tryConsumeSciencePacks(tech);
    if (!consumeResult.success) {
      return {
        success: false,
        error: consumeResult.error || '科技包不足',
      };
    }

    // 计算研究时间
    const calculation = this.calculateResearchTime(tech);

    // 创建研究状态
    this.currentResearch = {
      techId,
      status: 'researching',
      progress: 0,
      timeStarted: Date.now(),
      timeRemaining: calculation.effectiveTime,
      currentCost: { ...tech.researchCost },
    };

    // 发送研究开始事件
    this.eventEmitter.emit<ResearchStartedEvent>(TechEventType.RESEARCH_STARTED, {
      timestamp: Date.now(),
      techId,
      technology: tech,
      estimatedTime: calculation.effectiveTime,
    });

    return {
      success: true,
      message: `开始研究 ${tech.name}`,
    };
  }

  /**
   * 更新研究进度
   * @returns 如果研究完成，返回完成的研究信息
   */
  updateResearchProgress(deltaTime: number): ResearchCompletedEvent | null {
    if (!this.currentResearch) return null;

    const tech = this.getTechTreeService().getTechnology(this.currentResearch.techId);
    if (!tech) return null;

    // 重新计算研究时间（考虑研究室数量可能变化）
    const calculation = this.calculateResearchTime(tech);
    const totalTime = calculation.effectiveTime;

    // 计算新的进度
    const oldProgress = this.currentResearch.progress;
    const progressIncrement = deltaTime / totalTime;
    this.currentResearch.progress = Math.min(1, oldProgress + progressIncrement);
    this.currentResearch.timeRemaining = Math.max(
      0,
      totalTime * (1 - this.currentResearch.progress)
    );

    // 发送进度更新事件
    if (Math.floor(oldProgress * 100) !== Math.floor(this.currentResearch.progress * 100)) {
      this.eventEmitter.emit<ResearchProgressEvent>(TechEventType.RESEARCH_PROGRESS, {
        timestamp: Date.now(),
        techId: this.currentResearch.techId,
        progress: this.currentResearch.progress,
        timeRemaining: this.currentResearch.timeRemaining,
      });
    }

    // 检查是否完成
    if (this.currentResearch.progress >= 1) {
      const completedTechId = this.currentResearch.techId;
      const totalResearchTime = Date.now() - (this.currentResearch.timeStarted || Date.now());

      // 清除当前研究
      this.currentResearch = undefined;

      // 返回完成事件数据
      return {
        timestamp: Date.now(),
        techId: completedTechId,
        technology: tech,
        totalTime: totalResearchTime,
      };
    }

    return null;
  }

  /**
   * 取消当前研究
   */
  cancelResearch(): void {
    if (!this.currentResearch) return;

    const techId = this.currentResearch.techId;
    this.currentResearch = undefined;

    this.eventEmitter.emit(TechEventType.RESEARCH_CANCELLED, {
      timestamp: Date.now(),
      techId,
    });
  }

  /**
   * 检查是否可以开始研究
   */
  canStartResearch(techId: string): boolean {
    const tech = this.getTechTreeService().getTechnology(techId);
    if (!tech) return false;

    // 检查前置科技
    return tech.prerequisites.every((prereqId: string) =>
      this.getTechUnlockService().isTechUnlocked(prereqId)
    );
  }

  /**
   * 检查科技包是否充足
   */
  async checkSciencePackAvailability(techId: string): Promise<boolean> {
    const tech = this.getTechTreeService().getTechnology(techId);
    if (!tech || !this.inventoryOps) return false;

    for (const [packId, required] of Object.entries(tech.researchCost)) {
      const available = await this.inventoryOps.getItemAmount(packId);
      if (available < (required as number)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 尝试消耗科技包
   */
  private async tryConsumeSciencePacks(
    tech: Technology
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.inventoryOps) {
      return { success: false, error: '库存系统未初始化' };
    }

    // 检查所有科技包是否充足
    for (const [packId, required] of Object.entries(tech.researchCost)) {
      const available = await this.inventoryOps.getItemAmount(packId);
      if (available < required) {
        return {
          success: false,
          error: `${packId} 不足，需要 ${required}，当前 ${available}`,
        };
      }
    }

    // 消耗科技包
    const consumed = await this.inventoryOps.consumeItems(tech.researchCost);
    if (!consumed) {
      return { success: false, error: `消耗科技包失败` };
    }

    // 发送消耗事件
    this.eventEmitter.emit(TechEventType.SCIENCE_PACKS_CONSUMED, {
      timestamp: Date.now(),
      techId: tech.id,
      consumed: tech.researchCost,
    });

    return { success: true };
  }

  /**
   * 计算研究时间
   */
  private calculateResearchTime(tech: Technology): ResearchCalculation {
    const labStats = this.getLabStatistics();

    // 基础时间
    let effectiveTime = tech.researchTime;

    // 根据研究室数量和效率计算
    if (labStats.count > 0) {
      const speedMultiplier =
        this.BASE_LAB_SPEED +
        (labStats.count - 1) * this.LAB_EFFICIENCY_MULTIPLIER * labStats.avgEfficiency;
      effectiveTime = tech.researchTime / speedMultiplier;
    }

    return {
      effectiveTime,
      labCount: labStats.count,
      labEfficiency: labStats.avgEfficiency,
      speedMultiplier: labStats.count > 0 ? tech.researchTime / effectiveTime : 0,
    };
  }

  /**
   * 获取研究室统计
   */
  private getLabStatistics(): { count: number; avgEfficiency: number } {
    // 直接从游戏状态获取设施信息
    const gameState = useGameStore.getState();
    const facilities = gameState.facilities || [];
    const labs = facilities.filter(
      f => f.facilityId === 'lab' && f.status === FacilityStatus.RUNNING
    );

    if (labs.length === 0) {
      return { count: 0, avgEfficiency: 0 };
    }

    // 计算平均效率
    const totalEfficiency = labs.reduce((sum, lab) => {
      // 简化：假设效率基于实验室的效率属性
      const labEfficiency = lab.efficiency || 1;
      const moduleBonus = this.getModuleBonus(lab);
      return sum + labEfficiency * (1 + moduleBonus);
    }, 0);

    return {
      count: labs.length,
      avgEfficiency: totalEfficiency / labs.length,
    };
  }

  /**
   * 获取模块加成
   */
  private getModuleBonus(facility: FacilityInstance): number {
    // 简化实现，实际应该检查安装的模块
    // TODO: 实现模块检查逻辑
    // 暂时不使用facility参数
    void facility;
    return 0;
  }

  /**
   * 获取研究进度百分比
   */
  getResearchProgress(): number {
    return this.currentResearch ? this.currentResearch.progress : 0;
  }

  /**
   * 获取剩余研究时间（秒）
   */
  getTimeRemaining(): number {
    return this.currentResearch ? (this.currentResearch.timeRemaining ?? 0) : 0;
  }

  /**
   * 是否正在研究
   */
  isResearching(): boolean {
    return this.currentResearch !== undefined;
  }

  /**
   * 获取正在研究的科技ID
   */
  getCurrentResearchId(): string | undefined {
    return this.currentResearch ? this.currentResearch.techId : undefined;
  }
}
