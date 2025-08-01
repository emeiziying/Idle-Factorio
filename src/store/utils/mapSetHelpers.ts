// Map/Set 序列化辅助工具函数
import type { InventoryItem } from '../../types/index';

// 确保Map对象正确初始化的辅助函数
export const ensureMap = <K, V>(map: unknown, typeName: string): Map<K, V> => {
  if (map instanceof Map) {
    return map;
  }

  if (Array.isArray(map)) {
    try {
      // 验证数组格式是否正确
      const isValidArray = map.every(entry => Array.isArray(entry) && entry.length === 2);

      if (isValidArray) {
        return new Map(map as [K, V][]);
      }
    } catch (error) {
      console.error(`Failed to convert ${typeName} array to Map:`, error);
    }
  }

  console.warn(`Invalid ${typeName} format, creating empty Map`);
  return new Map();
};

// 确保inventory始终是Map的辅助函数
export const ensureInventoryMap = (inventory: unknown): Map<string, InventoryItem> => {
  return ensureMap<string, InventoryItem>(inventory, 'inventory');
};

// 确保Set对象正确初始化的辅助函数
export const ensureSet = <T>(set: unknown, typeName: string): Set<T> => {
  if (set instanceof Set) {
    return set;
  }
  if (Array.isArray(set)) {
    try {
      return new Set(set as T[]);
    } catch (error) {
      console.error(`Failed to convert ${typeName} array to Set:`, error);
    }
  }
  console.warn(`Invalid ${typeName} format, creating empty Set`);
  return new Set();
};

// 确保unlockedTechs始终是Set的辅助函数
export const ensureUnlockedTechsSet = (unlockedTechs: unknown): Set<string> => {
  return ensureSet<string>(unlockedTechs, 'unlockedTechs');
};
