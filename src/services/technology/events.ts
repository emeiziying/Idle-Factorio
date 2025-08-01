/**
 * 科技系统事件定义
 * 用于服务间的解耦通信
 */

import type { Technology } from '../../types/technology';

// 事件类型枚举
export const TechEventType = {
  // 研究事件
  RESEARCH_STARTED: 'research.started',
  RESEARCH_PROGRESS: 'research.progress',
  RESEARCH_COMPLETED: 'research.completed',
  RESEARCH_CANCELLED: 'research.cancelled',
  
  // 解锁事件
  TECH_UNLOCKED: 'tech.unlocked',
  ITEM_UNLOCKED: 'item.unlocked',
  RECIPE_UNLOCKED: 'recipe.unlocked',
  BUILDING_UNLOCKED: 'building.unlocked',
  
  // 队列事件
  QUEUE_UPDATED: 'queue.updated',
  QUEUE_ITEM_ADDED: 'queue.item.added',
  QUEUE_ITEM_REMOVED: 'queue.item.removed',
  
  // 资源事件
  SCIENCE_PACKS_CONSUMED: 'resources.science_packs_consumed',
  SCIENCE_PACKS_INSUFFICIENT: 'resources.science_packs_insufficient',
} as const;

export type TechEventType = typeof TechEventType[keyof typeof TechEventType];

// 事件数据接口
export interface TechEventData {
  timestamp: number;
}

export interface ResearchStartedEvent extends TechEventData {
  techId: string;
  technology: Technology;
  estimatedTime: number;
}

export interface ResearchProgressEvent extends TechEventData {
  techId: string;
  progress: number; // 0-1
  timeRemaining: number;
}

export interface ResearchCompletedEvent extends TechEventData {
  techId: string;
  technology: Technology;
  totalTime: number;
}

export interface TechUnlockedEvent extends TechEventData {
  techId: string;
  unlockedItems: string[];
  unlockedRecipes: string[];
  unlockedBuildings: string[];
}

export interface QueueUpdatedEvent extends TechEventData {
  queue: Array<{ techId: string; priority: number }>;
  changes: {
    added?: string[];
    removed?: string[];
    reordered?: boolean;
  };
}

// 事件处理器类型
export type TechEventHandler<T = unknown> = (event: T) => void | Promise<void>;

// 事件发射器接口
export interface ITechEventEmitter {
  emit<T extends TechEventData>(type: TechEventType, data: T): void;
  on<T extends TechEventData>(type: TechEventType, handler: TechEventHandler<T>): void;
  off<T extends TechEventData>(type: TechEventType, handler: TechEventHandler<T>): void;
}

// 简单的事件发射器实现
export class TechEventEmitter implements ITechEventEmitter {
  private handlers = new Map<TechEventType, Set<TechEventHandler>>();

  emit<T extends TechEventData>(type: TechEventType, data: T): void {
    const typeHandlers = this.handlers.get(type);
    if (!typeHandlers) return;

    // 添加时间戳
    const eventData = { ...data, timestamp: data.timestamp || Date.now() };

    // 异步执行所有处理器
    typeHandlers.forEach(handler => {
      Promise.resolve().then(() => handler(eventData)).catch(error => {
        console.error(`Error in event handler for ${type}:`, error);
      });
    });
  }

  on<T extends TechEventData>(type: TechEventType, handler: TechEventHandler<T>): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler as TechEventHandler);
  }

  off<T extends TechEventData>(type: TechEventType, handler: TechEventHandler<T>): void {
    const typeHandlers = this.handlers.get(type);
    if (typeHandlers) {
      typeHandlers.delete(handler as TechEventHandler);
    }
  }

  // 清理所有处理器
  clear(): void {
    this.handlers.clear();
  }
}