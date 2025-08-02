// 核心服务导出
export { DIServiceInitializer, getService } from './DIServiceInitializer';
export { SERVICE_TOKENS } from './ServiceTokens';
export { container } from './DIContainer';
export { GameConfig } from './GameConfig';
export { DataService } from './DataService';

// 向后兼容（已弃用，建议使用 DI 系统）
export { ServiceLocator, SERVICE_NAMES } from './ServiceLocator';
