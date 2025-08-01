// 科技系统服务导出
export { TechnologyService } from './TechnologyService';

// 子服务导出
export { TechTreeService } from './TechTreeService';
export { TechUnlockService } from './TechUnlockService';
export { ResearchService } from './ResearchService';
export { ResearchQueueService } from './ResearchQueueService';
export { TechProgressTracker } from './TechProgressTracker';
export { TechDataLoader } from './TechDataLoader';

// 事件系统
export { 
  TechEventEmitter,
  TechEventType,
  type TechEventHandler,
  type TechEventData,
  type ResearchStartedEvent,
  type ResearchProgressEvent,
  type ResearchCompletedEvent,
  type TechUnlockedEvent,
  type QueueUpdatedEvent
} from './events';

// 内部类型
export type * from './types';