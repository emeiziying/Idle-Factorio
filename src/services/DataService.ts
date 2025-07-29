// Re-export from new location
export { DataService } from './core/DataService';

// 导出单例实例以保持向后兼容
import { DataService } from './core/DataService';
export const dataService = DataService.getInstance();