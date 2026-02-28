// 科技系统类型定义

/**
 * 科技状态枚举
 */
export type TechStatus =
  | 'locked' // 🔒 锁定 - 前置科技未完成
  | 'available' // 🟡 可研究 - 前置科技已完成，可以开始研究
  | 'researching' // 🔵 研究中 - 正在进行研究
  | 'unlocked'; // 🟢 已解锁 - 研究完成，内容已解锁

/**
 * 研究队列项目状态
 */
export type QueueItemStatus =
  | 'ready' // 🟡 准备就绪 - 可以开始研究
  | 'blocked' // 🔒 前置阻塞 - 被前置科技阻塞
  | 'researching' // 🔵 正在研究 - 当前正在研究
  | 'insufficient'; // ⚠️ 资源不足 - 科技瓶不足

/**
 * 研究优先级常量
 */
export const ResearchPriority = {
  HIGH: 0, // ⚡ 高优先级
  NORMAL: 1, // 📦 普通优先级
  LOW: 2, // ⚙️ 低优先级
} as const;

export type ResearchPriority = (typeof ResearchPriority)[keyof typeof ResearchPriority];

/**
 * 科技定义接口
 * 定义单个科技的基本属性和要求
 */
export interface Technology {
  /** 科技唯一标识符 */
  id: string;

  /** 科技显示名称 */
  name: string;

  /** 科技描述（可选） */
  description?: string;

  /** 科技分类 */
  category: string;

  /** 科技树中的行位置（用于布局） */
  row?: number;

  // 依赖关系
  /** 前置科技ID数组 - 必须全部完成才能解锁此科技 */
  prerequisites: string[];

  /** 软依赖科技ID数组（可选） - 建议完成但非必需 */
  dependencies?: string[];

  // 研究成本
  /** 研究所需的科技包数量 */
  researchCost: Record<string, number>;

  /** 基础研究时间（秒） */
  researchTime: number;

  /** 研究单位数量（每个单位消耗对应的科技包和时间） */
  researchUnits?: number;

  // 解锁内容
  /** 研究完成后解锁的内容 */
  unlocks: {
    /** 解锁的物品ID数组 */
    items?: string[];
    /** 解锁的配方ID数组 */
    recipes?: string[];
    /** 解锁的建筑ID数组 */
    buildings?: string[];
    /** 解锁的功能特性数组 */
    features?: string[];
  };

  // 显示属性
  /** 科技图标ID（对应精灵图标） */
  icon?: string;

  /** 科技在科技树中的显示位置 */
  position: {
    x: number;
    y: number;
  };

  /** 是否为无限科技（可重复研究） */
  isInfinite?: boolean;

  /** 无限科技的递增成本公式参数 */
  infiniteParams?: {
    baseCost: Record<string, number>;
    costMultiplier: number;
    maxLevel?: number;
  };

  /** 研究触发器（用于触发式解锁科技） */
  researchTrigger?: {
    type: string;
    item?: string;
    entity?: string;
    count?: number;
  };
}

/**
 * 科技研究状态
 * 记录特定科技的研究进度和状态
 */
export interface TechResearchState {
  /** 科技ID */
  techId: string;

  /** 当前状态 */
  status: TechStatus;

  /** 研究进度 (0-1) */
  progress: number;

  /** 研究开始时间戳 */
  timeStarted?: number;

  /** 剩余研究时间（秒） */
  timeRemaining?: number;

  /** 当前已投入的科技包数量 */
  currentCost: Record<string, number>;

  /** 无限科技的当前等级 */
  currentLevel?: number;
}

/**
 * 研究队列项目
 * 研究队列中的单个项目信息
 */
export interface ResearchQueueItem {
  /** 科技ID */
  techId: string;

  /** 添加到队列的时间戳 */
  addedTime: number;

  /** 研究优先级 */
  priority: ResearchPriority;

  /** 预计开始研究的时间戳 */
  estimatedStartTime?: number;

  /** 预计研究时间 */
  estimatedTime?: number;

  /** 是否可以开始研究 */
  canStart: boolean;

  /** 被哪些前置科技阻塞（仅当canStart为false时） */
  blockedBy?: string[];

  /** 队列中的位置索引 */
  queuePosition: number;
}

/**
 * 科技树整体状态
 * 管理整个科技系统的状态
 */
export interface TechTreeState {
  // 解锁状态
  /** 已解锁的科技集合 */
  unlockedTechs: Set<string>;

  /** 已研究完成的科技集合 */
  researchedTechs: Set<string>;

  /** 当前可研究的科技集合（缓存） */
  availableTechs: Set<string>;

  // 研究管理
  /** 当前正在研究的科技状态 */
  currentResearch?: TechResearchState;

  /** 研究队列（有序数组） */
  researchQueue: ResearchQueueItem[];

  /** 最大队列长度 */
  maxQueueSize: number;

  /** 是否启用自动研究 */
  autoResearch: boolean;

  /** 队列总预计时间（秒） */
  queueTotalTime: number;

  // 解锁内容缓存
  /** 已解锁的物品集合（缓存） */
  unlockedItems: Set<string>;

  /** 已解锁的配方集合（缓存） */
  unlockedRecipes: Set<string>;

  /** 已解锁的建筑集合（缓存） */
  unlockedBuildings: Set<string>;

  // 统计信息
  /** 总研究时间（秒） */
  totalResearchTime: number;

  /** 总消耗的科技包数量 */
  totalSciencePacksConsumed: Record<string, number>;
}

/**
 * 科技分类定义
 * 用于组织和分类科技
 */
export interface TechCategory {
  /** 分类ID */
  id: string;

  /** 分类显示名称 */
  name: string;

  /** 分类图标 */
  icon: string;

  /** 分类主题色 */
  color: string;

  /** 分类描述 */
  description: string;

  /** 排序权重 */
  order: number;

  /** 该分类包含的科技ID数组 */
  technologies: string[];
}

/**
 * 研究操作结果
 */
export interface ResearchResult {
  /** 操作是否成功 */
  success: boolean;

  /** 错误信息（失败时） */
  error?: string;

  /** 成功消息（成功时） */
  message?: string;

  /** 相关数据 */
  data?: unknown;
}

/**
 * 队列操作结果
 */
export interface QueueResult {
  /** 操作是否成功 */
  success: boolean;

  /** 错误信息（失败时） */
  error?: string;

  /** 队列中的位置（成功添加时） */
  queuePosition?: number;

  /** 相关数据 */
  data?: unknown;
}

/**
 * 科技解锁事件数据
 */
export interface TechUnlockEvent {
  /** 解锁的科技ID */
  techId: string;

  /** 科技对象 */
  technology: Technology;

  /** 解锁的物品列表 */
  unlockedItems: string[];

  /** 解锁的配方列表 */
  unlockedRecipes: string[];

  /** 解锁的建筑列表 */
  unlockedBuildings: string[];

  /** 解锁时间戳 */
  timestamp: number;
}

/**
 * 研究开始事件数据
 */
export interface ResearchStartEvent {
  /** 科技ID */
  techId: string;

  /** 科技对象 */
  technology: Technology;

  /** 消耗的科技包 */
  sciencePacksConsumed: Record<string, number>;

  /** 开始时间戳 */
  timestamp: number;
}

/**
 * 研究完成事件数据
 */
export interface ResearchCompleteEvent {
  /** 科技ID */
  techId: string;

  /** 科技对象 */
  technology: Technology;

  /** 研究耗时（秒） */
  researchDuration: number;

  /** 完成时间戳 */
  timestamp: number;
}

/**
 * 科技搜索过滤器
 */
export interface TechSearchFilter {
  /** 搜索关键词 */
  query?: string;

  /** 分类过滤 */
  category?: string;

  /** 状态过滤 */
  status?: TechStatus | TechStatus[];

  /** 是否显示已解锁科技 */
  showUnlocked?: boolean;

  /** 是否显示不可用科技 */
  showUnavailable?: boolean;
}

/**
 * 科技统计信息
 */
export interface TechStatistics {
  /** 总科技数量 */
  totalTechs: number;

  /** 已解锁科技数量 */
  unlockedTechs: number;

  /** 可研究科技数量 */
  availableTechs: number;

  /** 研究进度百分比 */
  researchProgress: number;

  /** 各分类的科技数量 */
  techsByCategory: Record<string, number>;

  /** 总研究时间 */
  totalResearchTime: number;

  /** 平均研究时间 */
  averageResearchTime: number;
}
