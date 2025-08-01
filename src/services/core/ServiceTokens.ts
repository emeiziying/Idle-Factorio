/**
 * 服务令牌定义
 * 用于依赖注入的服务标识符
 */

export const SERVICE_TOKENS = {
  // 核心服务
  DATA_SERVICE: 'DataService',
  USER_PROGRESS_SERVICE: 'UserProgressService',
  STORAGE_SERVICE: 'StorageService',
  MANUAL_CRAFTING_VALIDATOR: 'ManualCraftingValidator',

  // 业务服务
  RECIPE_SERVICE: 'RecipeService',
  FUEL_SERVICE: 'FuelService',
  POWER_SERVICE: 'PowerService',

  // 科技系统服务
  TECHNOLOGY_SERVICE: 'TechnologyService',
  TECH_TREE_SERVICE: 'TechTreeService',
  TECH_UNLOCK_SERVICE: 'TechUnlockService',
  RESEARCH_SERVICE: 'ResearchService',
  RESEARCH_QUEUE_SERVICE: 'ResearchQueueService',
  TECH_PROGRESS_TRACKER: 'TechProgressTracker',

  // 游戏循环服务
  GAME_LOOP_SERVICE: 'GameLoopService',
  GAME_LOOP_TASK_FACTORY: 'GameLoopTaskFactory',

  // 事件系统
  TECH_EVENT_EMITTER: 'TechEventEmitter',
} as const;

export type ServiceToken = typeof SERVICE_TOKENS[keyof typeof SERVICE_TOKENS];