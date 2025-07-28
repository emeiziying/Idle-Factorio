/**
 * 通用工具函数
 * 包含项目中重复使用的逻辑
 */

/**
 * 将毫秒转换为秒
 */
export const msToSeconds = (ms: number): number => {
  return ms / 1000;
};

/**
 * 将秒转换为毫秒
 */
export const secondsToMs = (seconds: number): number => {
  return seconds * 1000;
};

/**
 * 计算生产/消耗速率
 * @param amount 物品数量
 * @param recipeTime 配方时间（秒）
 * @param machineSpeed 机器速度倍率
 * @param efficiency 效率倍率
 * @param count 设施数量
 */
export const calculateRate = (
  amount: number,
  recipeTime: number,
  machineSpeed: number = 1,
  efficiency: number = 1,
  count: number = 1
): number => {
  return (amount / recipeTime) * machineSpeed * efficiency * count;
};

/**
 * 格式化数字，保留指定小数位
 */
export const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toFixed(decimals);
};

/**
 * 安全地获取对象属性值
 */
export const safeGet = <T>(
  obj: any,
  path: string,
  defaultValue: T
): T => {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return defaultValue;
    }
  }
  
  return result as T;
};

/**
 * 防抖函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

/**
 * 节流函数
 */
export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * 深度克隆对象
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as any;
  }
  
  const clonedObj = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  
  return clonedObj;
};

/**
 * 判断两个数组是否相等
 */
export const arraysEqual = <T>(a: T[], b: T[]): boolean => {
  if (a.length !== b.length) return false;
  
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  
  return true;
};

/**
 * 创建单例类的辅助函数
 */
export function createSingleton<T>(
  ClassConstructor: new () => T
): () => T {
  let instance: T | null = null;
  
  return () => {
    if (!instance) {
      instance = new ClassConstructor();
    }
    return instance;
  };
}