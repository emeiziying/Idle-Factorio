import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  msToSeconds,
  secondsToMs,
  calculateRate,
  formatNumber,
  safeGet,
  debounce,
  throttle,
  deepClone,
  arraysEqual,
  createSingleton
} from '../common'

// 通用工具函数测试套件
describe('common utilities', () => {
  // 毫秒转秒测试
  describe('msToSeconds', () => {
    // 测试：应该将毫秒转换为秒
    it('should convert milliseconds to seconds', () => {
      expect(msToSeconds(1000)).toBe(1)
      expect(msToSeconds(2500)).toBe(2.5)
      expect(msToSeconds(0)).toBe(0)
      expect(msToSeconds(-1000)).toBe(-1)
    })
  })

  // 秒转毫秒测试
  describe('secondsToMs', () => {
    // 测试：应该将秒转换为毫秒
    it('should convert seconds to milliseconds', () => {
      expect(secondsToMs(1)).toBe(1000)
      expect(secondsToMs(2.5)).toBe(2500)
      expect(secondsToMs(0)).toBe(0)
      expect(secondsToMs(-1)).toBe(-1000)
    })
  })

  // 计算速率测试
  describe('calculateRate', () => {
    // 测试：应该使用默认参数计算生产速率
    it('should calculate production rate with default parameters', () => {
      expect(calculateRate(10, 2)).toBe(5) // 10 items / 2 seconds = 5/s // 10 物品 / 2 秒 = 5/秒
    })

    // 测试：应该计算带机器速度的速率
    it('should calculate rate with machine speed', () => {
      expect(calculateRate(10, 2, 2)).toBe(10) // 10 items / 2 seconds * 2 speed = 10/s // 10 物品 / 2 秒 * 2 速度 = 10/秒
    })

    // 测试：应该计算带所有参数的速率
    it('should calculate rate with all parameters', () => {
      expect(calculateRate(10, 2, 2, 1.5, 2)).toBe(30) // 10/2 * 2 * 1.5 * 2 = 30/s
    })

    // 测试：应该处理零配方时间
    it('should handle zero recipe time', () => {
      expect(calculateRate(10, 0)).toBe(Infinity)
    })
  })

  // 格式化数字测试
  describe('formatNumber', () => {
    // 测试：应该使用默认 2 位小数格式化数字
    it('should format number with default 2 decimals', () => {
      expect(formatNumber(1.2345)).toBe('1.23')
      expect(formatNumber(1.5)).toBe('1.50')
      expect(formatNumber(1)).toBe('1.00')
    })

    // 测试：应该使用自定义小数位格式化数字
    it('should format number with custom decimals', () => {
      expect(formatNumber(1.2345, 3)).toBe('1.235')
      expect(formatNumber(1.2345, 0)).toBe('1')
      expect(formatNumber(1.2345, 1)).toBe('1.2')
    })

    // 测试：应该处理负数
    it('should handle negative numbers', () => {
      expect(formatNumber(-1.2345)).toBe('-1.23')
      expect(formatNumber(-1.2345, 3)).toBe('-1.235')
    })
  })

  // 安全获取对象属性测试
  describe('safeGet', () => {
    const testObj = {
      a: {
        b: {
          c: 'value'
        },
        d: null
      },
      e: 123
    }

    // 测试：应该获取嵌套值
    it('should get nested values', () => {
      expect(safeGet(testObj, 'a.b.c', 'default')).toBe('value')
      expect(safeGet(testObj, 'e', 0)).toBe(123)
    })

    // 测试：不存在的路径应返回默认值
    it('should return default value for non-existent paths', () => {
      expect(safeGet(testObj, 'a.b.x', 'default')).toBe('default')
      expect(safeGet(testObj, 'x.y.z', 'default')).toBe('default')
    })

    // 测试：应该处理路径中的 null 值
    it('should handle null values in path', () => {
      expect(safeGet(testObj, 'a.d.x', 'default')).toBe('default')
    })

    // 测试：应该处理空路径
    it('should handle empty path', () => {
      expect(safeGet(testObj, '', 'default')).toBe('default')
    })
  })

  // 防抖函数测试
  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    // 测试：应该防抖函数调用
    it('should debounce function calls', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    // 测试：应该传递参数给防抖函数
    it('should pass arguments to debounced function', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn('arg1', 'arg2')
      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
    })

    // 测试：后续调用应重置定时器
    it('should reset timer on subsequent calls', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn()
      vi.advanceTimersByTime(50)
      debouncedFn()
      vi.advanceTimersByTime(50)
      
      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(50)
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  // 节流函数测试
  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    // 测试：应该节流函数调用
    it('should throttle function calls', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn()
      throttledFn()
      throttledFn()

      expect(fn).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(100)
      throttledFn()
      expect(fn).toHaveBeenCalledTimes(2)
    })

    // 测试：应该传递参数给节流函数
    it('should pass arguments to throttled function', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn('arg1', 'arg2')
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
    })

    // 测试：节流期后应允许调用
    it('should allow calls after throttle period', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn()
      vi.advanceTimersByTime(50)
      throttledFn() // Should be ignored // 应该被忽略
      vi.advanceTimersByTime(50)
      throttledFn() // Should be allowed // 应该被允许
      
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  // 深拷贝测试
  describe('deepClone', () => {
    // 测试：应该克隆原始值
    it('should clone primitive values', () => {
      expect(deepClone(123)).toBe(123)
      expect(deepClone('string')).toBe('string')
      expect(deepClone(true)).toBe(true)
      expect(deepClone(null)).toBe(null)
    })

    // 测试：应该克隆日期
    it('should clone dates', () => {
      const date = new Date('2024-01-01')
      const cloned = deepClone(date)
      
      expect(cloned).toEqual(date)
      expect(cloned).not.toBe(date)
      expect(cloned.getTime()).toBe(date.getTime())
    })

    // 测试：应该克隆数组
    it('should clone arrays', () => {
      const arr = [1, 2, { a: 3 }]
      const cloned = deepClone(arr)
      
      expect(cloned).toEqual(arr)
      expect(cloned).not.toBe(arr)
      expect(cloned[2]).not.toBe(arr[2])
    })

    // 测试：应该克隆嵌套对象
    it('should clone nested objects', () => {
      const obj = {
        a: 1,
        b: {
          c: 2,
          d: {
            e: 3
          }
        },
        f: [1, 2, 3]
      }
      const cloned = deepClone(obj)
      
      expect(cloned).toEqual(obj)
      expect(cloned).not.toBe(obj)
      expect(cloned.b).not.toBe(obj.b)
      expect(cloned.b.d).not.toBe(obj.b.d)
      expect(cloned.f).not.toBe(obj.f)
    })
  })

  // 数组相等测试
  describe('arraysEqual', () => {
    // 测试：相等的数组应返回 true
    it('should return true for equal arrays', () => {
      expect(arraysEqual([1, 2, 3], [1, 2, 3])).toBe(true)
      expect(arraysEqual([], [])).toBe(true)
      expect(arraysEqual(['a', 'b'], ['a', 'b'])).toBe(true)
    })

    // 测试：不同的数组应返回 false
    it('should return false for different arrays', () => {
      expect(arraysEqual([1, 2, 3], [1, 2, 4])).toBe(false)
      expect(arraysEqual([1, 2], [1, 2, 3])).toBe(false)
      expect(arraysEqual([1, 2, 3], [1, 2])).toBe(false)
      expect(arraysEqual([], [1])).toBe(false)
    })

    // 测试：应该使用浅比较
    it('should use shallow comparison', () => {
      const obj = { a: 1 }
      expect(arraysEqual([obj], [obj])).toBe(true)
      expect(arraysEqual([{ a: 1 }], [{ a: 1 }])).toBe(false)
    })
  })

  // 创建单例测试
  describe('createSingleton', () => {
    // 测试：应该创建单例实例
    it('should create singleton instance', () => {
      class TestClass {
        value = Math.random()
      }

      const getInstance = createSingleton(TestClass)
      const instance1 = getInstance()
      const instance2 = getInstance()

      expect(instance1).toBe(instance2)
      expect(instance1.value).toBe(instance2.value)
    })

    // 测试：应该适用于不同的类
    it('should work with different classes', () => {
      class ClassA {
        type = 'A'
      }
      
      class ClassB {
        type = 'B'
      }

      const getA = createSingleton(ClassA)
      const getB = createSingleton(ClassB)

      expect(getA().type).toBe('A')
      expect(getB().type).toBe('B')
      expect(getA()).not.toBe(getB())
    })
  })
})