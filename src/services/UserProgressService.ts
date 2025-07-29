// Re-export from new location
export { UserProgressService } from './state/UserProgressService';

// 导出单例实例以保持向后兼容
import { ServiceFactory } from './base/ServiceFactory';
import { UserProgressService } from './state/UserProgressService';

// 确保服务被注册
ServiceFactory.register('UserProgressService', UserProgressService);

// 导出单例实例
export const userProgressService = ServiceFactory.create<UserProgressService>('UserProgressService');