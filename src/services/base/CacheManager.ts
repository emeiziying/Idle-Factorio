/**
 * 通用缓存管理器
 * 提供可复用的缓存机制，支持TTL、LRU等特性
 */
export interface CacheOptions {
  ttl?: number; // 生存时间（毫秒）
  maxSize?: number; // 最大缓存条目数
  enableLRU?: boolean; // 是否启用LRU淘汰
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
}

export class CacheManager<K, V> {
  private cache = new Map<K, CacheEntry<V>>();
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl ?? 5 * 60 * 1000, // 默认5分钟
      maxSize: options.maxSize ?? 1000,
      enableLRU: options.enableLRU ?? true
    };
  }

  /**
   * 获取缓存值
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }

    // 检查TTL
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return undefined;
    }

    // 更新访问计数和时间戳
    entry.accessCount++;
    entry.timestamp = Date.now();
    
    return entry.value;
  }

  /**
   * 设置缓存值
   */
  set(key: K, value: V): void {
    // 检查缓存大小限制
    if (this.cache.size >= this.options.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 1
    });
  }

  /**
   * 检查键是否存在且未过期
   */
  has(key: K): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }

  /**
   * 删除缓存项
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    totalHits: number;
    totalMisses: number;
  } {
    const totalHits = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.accessCount, 0);
    
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      hitRate: totalHits / (totalHits + 1), // 避免除零
      totalHits,
      totalMisses: 1 // 简化统计
    };
  }

  /**
   * 清理过期项
   */
  cleanup(): number {
    let cleanedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    return cleanedCount;
  }

  /**
   * 检查条目是否过期
   */
  private isExpired(entry: CacheEntry<V>): boolean {
    return Date.now() - entry.timestamp > this.options.ttl;
  }

  /**
   * LRU淘汰策略
   */
  private evictLRU(): void {
    if (!this.options.enableLRU) {
      return;
    }

    let oldestKey: K | undefined;
    let oldestTime = Date.now();
    let lowestAccessCount = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < lowestAccessCount || 
          (entry.accessCount === lowestAccessCount && entry.timestamp < oldestTime)) {
        oldestKey = key;
        oldestTime = entry.timestamp;
        lowestAccessCount = entry.accessCount;
      }
    }

    if (oldestKey !== undefined) {
      this.cache.delete(oldestKey);
    }
  }
} 