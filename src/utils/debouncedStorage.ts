// 防抖存储包装器 - 减少高频存档对性能的影响
import type { StateStorage } from 'zustand/middleware';
import { asyncStorage } from './asyncStorage';
import LZString from 'lz-string';

interface PendingSave {
  name: string;
  value: string;
  resolve: () => void;
  reject: (error: unknown) => void;
}

class DebouncedStorage implements StateStorage {
  private pendingSaves = new Map<string, PendingSave>();
  private saveTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly debounceMs: number;
  private readonly enableCompression: boolean = true; // 启用压缩

  constructor(debounceMs: number = 1000, enableCompression: boolean = true) {
    this.debounceMs = debounceMs;
    this.enableCompression = enableCompression;
    
    // 页面卸载时立即保存所有待保存的数据
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushAll();
      });
    }
  }

  getItem(name: string): string | null | Promise<string | null> {
    // 读取操作不需要防抖，直接调用异步存储
    return asyncStorage.getItem(name).then(value => {
      if (!value || !this.enableCompression) return value;
      
      // 尝试解压数据
      try {
        // 检查是否是压缩数据（以特定前缀开始）
        if (value.startsWith('ᯡ')) { // LZString压缩的UTF16数据特征
          const decompressed = LZString.decompressFromUTF16(value);
          if (decompressed) {
            console.log(`[Storage] 解压数据成功: ${name}`);
            // 调试：打印解压后的数据（仅前500字符避免过长）
            console.log(`[Storage] 解压后内容预览: ${decompressed.substring(0, 500)}${decompressed.length > 500 ? '...' : ''}`);
            return decompressed;
          }
        }
      } catch (error) {
        console.warn(`[Storage] 解压失败，返回原始数据: ${name}`, error);
      }
      
      return value;
    });
  }

  setItem(name: string, value: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // 取消之前的保存计划
      const existingTimeout = this.saveTimeouts.get(name);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // 如果有待保存的同名项，先拒绝它（静默处理）
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
            let dataToSave = pending.value;
            let sizeInfo = '';
            
            if (this.enableCompression) {
              const originalSize = pending.value.length;
              const compressed = LZString.compressToUTF16(pending.value);
              const compressedSize = compressed.length * 2; // UTF-16每字符2字节
              
              // 格式化大小显示，小于1KB时显示字节数
              const formatSize = (bytes: number) => {
                if (bytes < 1024) {
                  return `${bytes}B`;
                } else {
                  return `${(bytes / 1024).toFixed(1)}KB`;
                }
              };
              
              if (compressedSize < originalSize) {
                dataToSave = compressed;
                const reduction = Math.round((1 - compressedSize / originalSize) * 100);
                sizeInfo = ` (压缩: ${formatSize(originalSize)} → ${formatSize(compressedSize)}, -${reduction}%)`;
              } else {
                sizeInfo = ` (未压缩: ${formatSize(originalSize)})`;
              }
            } else {
              const formatSize = (bytes: number) => {
                if (bytes < 1024) {
                  return `${bytes}B`;
                } else {
                  return `${(bytes / 1024).toFixed(1)}KB`;
                }
              };
              sizeInfo = ` (${formatSize(pending.value.length)})`;
            }
            
            await asyncStorage.setItem(pending.name, dataToSave);
            console.log(`[Save] 存档成功: ${pending.name}${sizeInfo}`);
            // 调试：打印保存的原始数据（仅前500字符避免过长）
            console.log(`[Save] 原始数据预览: ${pending.value.substring(0, 500)}${pending.value.length > 500 ? '...' : ''}`);
            pending.resolve();
          } catch (error) {
            console.error(`[Save] 存档失败: ${pending.name}`, error);
            pending.reject(error);
          }
        }
      }, this.debounceMs);

      this.saveTimeouts.set(name, timeout);
    });
  }

  // 新增：强制存档方法，绕过防抖
  forceSetItem(name: string, value: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // 取消现有的防抖存档
      const existingTimeout = this.saveTimeouts.get(name);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        this.saveTimeouts.delete(name);
      }

      // 拒绝现有的待保存项
      const existingPending = this.pendingSaves.get(name);
      if (existingPending) {
        existingPending.reject(new Error('Superseded by force save'));
        this.pendingSaves.delete(name);
      }
      
      // 压缩数据
      let dataToSave = value;
      let sizeInfo = '';
      
      // 格式化大小显示，小于1KB时显示字节数
      const formatSize = (bytes: number) => {
        if (bytes < 1024) {
          return `${bytes}B`;
        } else {
          return `${(bytes / 1024).toFixed(1)}KB`;
        }
      };
      
      if (this.enableCompression) {
        const originalSize = value.length;
        const compressed = LZString.compressToUTF16(value);
        const compressedSize = compressed.length * 2;
        
        if (compressedSize < originalSize) {
          dataToSave = compressed;
          const reduction = Math.round((1 - compressedSize / originalSize) * 100);
          sizeInfo = ` (压缩: ${formatSize(originalSize)} → ${formatSize(compressedSize)}, -${reduction}%)`;
        } else {
          sizeInfo = ` (未压缩: ${formatSize(originalSize)})`;
        }
      } else {
        sizeInfo = ` (${formatSize(value.length)})`;
      }
      
      // 使用.then()链式调用替代async/await
      asyncStorage.setItem(name, dataToSave)
        .then(() => {
          console.log(`[Save] 强制存档成功: ${name}${sizeInfo}`);
          resolve();
        })
        .catch((error) => {
          console.error(`[Save] 强制存档失败: ${name}`, error);
          reject(error);
        });
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
          .then(() => {
            console.log(`[Save] 立即存档成功: ${pending.name}`);
            pending.resolve();
          })
          .catch((error) => {
            console.error(`[Save] 立即存档失败: ${pending.name}`, error);
            pending.reject(error);
          })
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
          console.log(`[Save] 手动存档成功: ${pending.name}`);
          pending.resolve();
        } catch (error) {
          console.error(`[Save] 手动存档失败: ${pending.name}`, error);
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
      // 捕获并静默处理"superseded"错误
      return storage.setItem(name, value).catch((error: unknown) => {
        if (error instanceof Error && error.message === 'Superseded by newer save') {
          // 这是正常的防抖行为，静默忽略
          return;
        }
        // 其他错误继续抛出
        throw error;
      });
    },
    removeItem: (name: string): void | Promise<void> => {
      return storage.removeItem(name);
    }
  };
};