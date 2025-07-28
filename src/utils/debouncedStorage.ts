// 防抖存储包装器 - 减少高频存档对性能的影响
import { StateStorage } from 'zustand/middleware';
import { asyncStorage } from './asyncStorage';

interface PendingSave {
  name: string;
  value: string;
  resolve: () => void;
  reject: (error: unknown) => void;
}

class DebouncedStorage implements StateStorage {
  private pendingSaves = new Map<string, PendingSave>();
  private saveTimeouts = new Map<string, NodeJS.Timeout>();
  private readonly debounceMs: number;

  constructor(debounceMs: number = 1000) {
    this.debounceMs = debounceMs;
    
    // 页面卸载时立即保存所有待保存的数据
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushAll();
      });
    }
  }

  getItem(name: string): string | null | Promise<string | null> {
    // 读取操作不需要防抖，直接调用异步存储
    return asyncStorage.getItem(name);
  }

  setItem(name: string, value: string): void | Promise<void> {
    return new Promise((resolve, reject) => {
      // 取消之前的保存计划
      const existingTimeout = this.saveTimeouts.get(name);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // 如果有待保存的同名项，先拒绝它
      const existingPending = this.pendingSaves.get(name);
      if (existingPending) {
        existingPending.reject(new Error('Superseded by newer save'));
      }

      // 设置新的待保存项
      this.pendingSaves.set(name, { name, value, resolve, reject });

      // 设置防抖计时器
      const timeout = setTimeout(async () => {
        const pending = this.pendingSaves.get(name);
        if (pending) {
          this.pendingSaves.delete(name);
          this.saveTimeouts.delete(name);
          
          try {
            await asyncStorage.setItem(pending.name, pending.value);
            pending.resolve();
          } catch (error) {
            pending.reject(error);
          }
        }
      }, this.debounceMs);

      this.saveTimeouts.set(name, timeout);
    });
  }

  removeItem(name: string): void | Promise<void> {
    // 清理待保存的数据
    const existingTimeout = this.saveTimeouts.get(name);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.saveTimeouts.delete(name);
    }
    
    const existingPending = this.pendingSaves.get(name);
    if (existingPending) {
      existingPending.reject(new Error('Item removed'));
      this.pendingSaves.delete(name);
    }

    // 删除操作立即执行
    return asyncStorage.removeItem(name);
  }

  // 立即保存所有待保存的数据
  private async flushAll(): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const [name, pending] of this.pendingSaves) {
      const timeout = this.saveTimeouts.get(name);
      if (timeout) {
        clearTimeout(timeout);
        this.saveTimeouts.delete(name);
      }
      
      promises.push(
        asyncStorage.setItem(pending.name, pending.value)
          .then(() => pending.resolve())
          .catch((error) => pending.reject(error))
      );
    }
    
    this.pendingSaves.clear();
    
    try {
      await Promise.all(promises);
    } catch (error) {
      console.error('Error flushing pending saves:', error);
    }
  }

  // 手动触发立即保存
  async flush(name?: string): Promise<void> {
    if (name) {
      const pending = this.pendingSaves.get(name);
      const timeout = this.saveTimeouts.get(name);
      
      if (pending && timeout) {
        clearTimeout(timeout);
        this.saveTimeouts.delete(name);
        this.pendingSaves.delete(name);
        
        try {
          await asyncStorage.setItem(pending.name, pending.value);
          pending.resolve();
        } catch (error) {
          pending.reject(error);
        }
      }
    } else {
      await this.flushAll();
    }
  }
}

// 导出配置好的防抖存储实例
export const debouncedStorage = new DebouncedStorage(2000); // 2秒防抖

// 创建Zustand兼容的存储
export const createDebouncedStorage = (debounceMs: number = 2000) => {
  const storage = new DebouncedStorage(debounceMs);
  
  return {
    getItem: (name: string): string | null | Promise<string | null> => {
      return storage.getItem(name);
    },
    setItem: (name: string, value: string): void | Promise<void> => {
      return storage.setItem(name, value);
    },
    removeItem: (name: string): void | Promise<void> => {
      return storage.removeItem(name);
    }
  };
};