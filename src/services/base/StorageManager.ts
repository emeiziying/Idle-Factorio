/**
 * 统一的存储管理器
 * 处理所有localStorage操作，提供类型安全和错误处理
 */
export class StorageManager {
  private static instance: StorageManager;
  private prefix: string = 'factorio_';

  private constructor() {}

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  /**
   * 获取存储项
   */
  get<T>(key: string): T | null {
    try {
      const fullKey = this.prefix + key;
      const item = localStorage.getItem(fullKey);
      if (!item) return null;
      
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`[StorageManager] Failed to get ${key}:`, error);
      return null;
    }
  }

  /**
   * 设置存储项
   */
  set<T>(key: string, value: T): boolean {
    try {
      const fullKey = this.prefix + key;
      const serialized = JSON.stringify(value);
      localStorage.setItem(fullKey, serialized);
      return true;
    } catch (error) {
      console.error(`[StorageManager] Failed to set ${key}:`, error);
      return false;
    }
  }

  /**
   * 移除存储项
   */
  remove(key: string): void {
    try {
      const fullKey = this.prefix + key;
      localStorage.removeItem(fullKey);
    } catch (error) {
      console.error(`[StorageManager] Failed to remove ${key}:`, error);
    }
  }

  /**
   * 清除所有存储项
   */
  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('[StorageManager] Failed to clear storage:', error);
    }
  }

  /**
   * 获取压缩的存储项（用于大数据）
   */
  getCompressed<T>(key: string): T | null {
    try {
      const fullKey = this.prefix + key;
      const compressed = localStorage.getItem(fullKey);
      if (!compressed) return null;
      
      // 假设使用LZString压缩
      const decompressed = this.decompress(compressed);
      return JSON.parse(decompressed) as T;
    } catch (error) {
      console.error(`[StorageManager] Failed to get compressed ${key}:`, error);
      return null;
    }
  }

  /**
   * 设置压缩的存储项
   */
  setCompressed<T>(key: string, value: T): boolean {
    try {
      const fullKey = this.prefix + key;
      const serialized = JSON.stringify(value);
      const compressed = this.compress(serialized);
      localStorage.setItem(fullKey, compressed);
      return true;
    } catch (error) {
      console.error(`[StorageManager] Failed to set compressed ${key}:`, error);
      return false;
    }
  }

  /**
   * 批量操作
   */
  batchGet<T>(keys: string[]): Map<string, T> {
    const results = new Map<string, T>();
    keys.forEach(key => {
      const value = this.get<T>(key);
      if (value !== null) {
        results.set(key, value);
      }
    });
    return results;
  }

  /**
   * 批量设置
   */
  batchSet(items: Map<string, unknown>): boolean {
    let success = true;
    items.forEach((value, key) => {
      if (!this.set(key, value)) {
        success = false;
      }
    });
    return success;
  }

  /**
   * 获取存储使用情况
   */
  getStorageInfo(): {
    used: number;
    available: number;
    items: number;
  } {
    let used = 0;
    let items = 0;
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          const value = localStorage.getItem(key);
          if (value) {
            used += value.length;
            items++;
          }
        }
      });
    } catch (error) {
      console.error('[StorageManager] Failed to get storage info:', error);
    }
    
    return {
      used,
      available: 5 * 1024 * 1024 - used, // 假设5MB限制
      items
    };
  }

  private compress(data: string): string {
    // 简化实现，实际应使用LZString
    return btoa(data);
  }

  private decompress(data: string): string {
    // 简化实现，实际应使用LZString
    return atob(data);
  }
}