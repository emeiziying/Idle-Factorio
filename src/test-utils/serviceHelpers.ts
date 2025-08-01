/**
 * 测试辅助函数 - 用于在测试中创建服务实例
 */

import { DataService } from '@/services/core/DataService';
import { RecipeService } from '@/services/crafting/RecipeService';
import { StorageService } from '@/services/storage/StorageService';

/**
 * 创建 DataService 实例用于测试
 */
export function createDataServiceForTest(): DataService {
  return new DataService();
}

/**
 * 创建 RecipeService 实例用于测试
 */
export function createRecipeServiceForTest(): RecipeService {
  return new RecipeService();
}

/**
 * 创建 StorageService 实例用于测试
 */
export function createStorageServiceForTest(): StorageService {
  return new StorageService();
}

/**
 * 重置服务实例（对于单例服务）
 * 注意：这个函数主要用于测试清理
 */
export function resetServiceInstances(): void {
  // 对于非单例服务，这个函数不需要做任何事情
  // 因为每次调用 create 函数都会创建新实例
}