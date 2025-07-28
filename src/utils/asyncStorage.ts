// 异步存储适配器 - 使用IndexedDB替代localStorage
import { StateStorage } from 'zustand/middleware';

const DB_NAME = 'FactorioGameDB';
const DB_VERSION = 1;
const STORE_NAME = 'gameData';

class AsyncStorage implements StateStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.init();
  }

  private async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 创建对象存储
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  private async ensureInit(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  async getItem(name: string): Promise<string | null> {
    try {
      await this.ensureInit();
      
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(name);

        request.onsuccess = () => {
          resolve(request.result || null);
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('AsyncStorage getItem error:', error);
      // 降级到localStorage
      return localStorage.getItem(name);
    }
  }

  async setItem(name: string, value: string): Promise<void> {
    try {
      await this.ensureInit();
      
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(value, name);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('AsyncStorage setItem error:', error);
      // 降级到localStorage
      localStorage.setItem(name, value);
    }
  }

  async removeItem(name: string): Promise<void> {
    try {
      await this.ensureInit();
      
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(name);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('AsyncStorage removeItem error:', error);
      // 降级到localStorage
      localStorage.removeItem(name);
    }
  }
}

// 导出单例实例
export const asyncStorage = new AsyncStorage();

// 创建Zustand兼容的存储
export const createAsyncStorage = () => ({
  getItem: (name: string): string | null | Promise<string | null> => {
    return asyncStorage.getItem(name);
  },
  setItem: (name: string, value: string): void | Promise<void> => {
    return asyncStorage.setItem(name, value);
  },
  removeItem: (name: string): void | Promise<void> => {
    return asyncStorage.removeItem(name);
  }
});