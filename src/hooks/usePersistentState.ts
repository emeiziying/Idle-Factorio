import { useState, useEffect } from 'react';

/**
 * 持久化状态Hook
 * @param key localStorage的key
 * @param defaultValue 默认值
 * @returns [state, setState] 状态和设置函数
 */
export function usePersistentState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // 从localStorage获取初始值
  const getInitialValue = (): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Failed to parse localStorage key "${key}":`, error);
      return defaultValue;
    }
  };

  const [state, setState] = useState<T>(getInitialValue);

  // 当状态变化时，保存到localStorage
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn(`Failed to save to localStorage key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setState];
} 