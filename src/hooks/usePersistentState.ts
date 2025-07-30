import { useState, useEffect, useRef, useCallback } from 'react';
import { warn as logWarn } from '../utils/logger';

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
  // 使用ref保存defaultValue，避免依赖数组问题
  const defaultValueRef = useRef(defaultValue);
  defaultValueRef.current = defaultValue;

  // 从localStorage获取值的通用函数
  const getValueFromStorage = useCallback((): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValueRef.current;
    } catch (error) {
      logWarn(`Failed to parse localStorage key "${key}":`, error);
      return defaultValueRef.current;
    }
  }, [key]);

  const [state, setState] = useState<T>(getValueFromStorage);

  // 当key变化时，重新从localStorage读取值
  useEffect(() => {
    setState(getValueFromStorage());
  }, [key, getValueFromStorage]);

  // 当状态变化时，保存到localStorage
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      logWarn(`Failed to save to localStorage key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setState];
} 