/**
 * 科技服务内部共享类型定义
 * 这些类型仅在科技服务内部使用
 */

// 从data.json加载的科技配方接口
export interface TechRecipe {
  id: string;
  name: string;
  category: string;
  row: number;
  producers?: string[];
  in: { [itemId: string]: number };
  out: { [itemId: string]: number };
  flags?: string[];
  researchTrigger?: {
    type: string;
    item?: string;
    count?: number;
  };
  time?: number;
  count?: number;
}

// 从data.json加载的科技物品接口
export interface TechItem {
  id: string;
  name: string;
  category: string;
  row: number;
  technology?: {
    prerequisites?: string[];
    unlockedRecipes?: string[];
  };
}

// 服务间共享的配置接口
export interface TechServiceConfig {
  autoResearchEnabled?: boolean;
  maxQueueSize?: number;
}

// 研究进度计算结果
export interface ResearchCalculation {
  effectiveTime: number;
  labCount: number;
  labEfficiency: number;
  speedMultiplier: number;
}

// 解锁内容统计
export interface UnlockStatistics {
  itemsCount: number;
  recipesCount: number;
  buildingsCount: number;
  totalCount: number;
}