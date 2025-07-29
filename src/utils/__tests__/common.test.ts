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

describe('common utilities', () => {
  describe('msToSeconds', () => {
    it('should convert milliseconds to seconds', () => {
      expect(msToSeconds(1000)).toBe(1)
      expect(msToSeconds(2500)).toBe(2.5)
      expect(msToSeconds(0)).toBe(0)
      expect(msToSeconds(-1000)).toBe(-1)
    })
  })

  describe('secondsToMs', () => {
    it('should convert seconds to milliseconds', () => {
      expect(secondsToMs(1)).toBe(1000)
      expect(secondsToMs(2.5)).toBe(2500)
      expect(secondsToMs(0)).toBe(0)
      expect(secondsToMs(-1)).toBe(-1000)
    })
  })

  describe('calculateRate', () => {
    it('should calculate production rate with default parameters', () => {
      expect(calculateRate(10, 2)).toBe(5) // 10 items / 2 seconds = 5/s
    })

    it('should calculate rate with machine speed', () => {
      expect(calculateRate(10, 2, 2)).toBe(10) // 10 items / 2 seconds * 2 speed = 10/s
    })

    it('should calculate rate with all parameters', () => {
      expect(calculateRate(10, 2, 2, 1.5, 2)).toBe(30) // 10/2 * 2 * 1.5 * 2 = 30/s
    })

    it('should handle zero recipe time', () => {
      expect(calculateRate(10, 0)).toBe(Infinity)
    })
  })

  describe('formatNumber', () => {
    it('should format number with default 2 decimals', () => {
      expect(formatNumber(1.2345)).toBe('1.23')
      expect(formatNumber(1.5)).toBe('1.50')
      expect(formatNumber(1)).toBe('1.00')
    })

    it('should format number with custom decimals', () => {
      expect(formatNumber(1.2345, 3)).toBe('1.235')
      expect(formatNumber(1.2345, 0)).toBe('1')
      expect(formatNumber(1.2345, 1)).toBe('1.2')
    })

    it('should handle negative numbers', () => {
      expect(formatNumber(-1.2345)).toBe('-1.23')
      expect(formatNumber(-1.2345, 3)).toBe('-1.235')
    })
  })

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

    it('should get nested values', () => {
      expect(safeGet(testObj, 'a.b.c', 'default')).toBe('value')
      expect(safeGet(testObj, 'e', 0)).toBe(123)
    })

    it('should return default value for non-existent paths', () => {
      expect(safeGet(testObj, 'a.b.x', 'default')).toBe('default')
      expect(safeGet(testObj, 'x.y.z', 'default')).toBe('default')
    })

    it('should handle null values in path', () => {
      expect(safeGet(testObj, 'a.d.x', 'default')).toBe('default')
    })

    it('should handle empty path', () => {
      expect(safeGet(testObj, '', 'default')).toBe('default')
    })
  })

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

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

    it('should pass arguments to debounced function', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn('arg1', 'arg2')
      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
    })

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

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

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

    it('should pass arguments to throttled function', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn('arg1', 'arg2')
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('should allow calls after throttle period', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn()
      vi.advanceTimersByTime(50)
      throttledFn() // Should be ignored
      vi.advanceTimersByTime(50)
      throttledFn() // Should be allowed
      
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('deepClone', () => {
    it('should clone primitive values', () => {
      expect(deepClone(123)).toBe(123)
      expect(deepClone('string')).toBe('string')
      expect(deepClone(true)).toBe(true)
      expect(deepClone(null)).toBe(null)
    })

    it('should clone dates', () => {
      const date = new Date('2024-01-01')
      const cloned = deepClone(date)
      
      expect(cloned).toEqual(date)
      expect(cloned).not.toBe(date)
      expect(cloned.getTime()).toBe(date.getTime())
    })

    it('should clone arrays', () => {
      const arr = [1, 2, { a: 3 }]
      const cloned = deepClone(arr)
      
      expect(cloned).toEqual(arr)
      expect(cloned).not.toBe(arr)
      expect(cloned[2]).not.toBe(arr[2])
    })

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

  describe('arraysEqual', () => {
    it('should return true for equal arrays', () => {
      expect(arraysEqual([1, 2, 3], [1, 2, 3])).toBe(true)
      expect(arraysEqual([], [])).toBe(true)
      expect(arraysEqual(['a', 'b'], ['a', 'b'])).toBe(true)
    })

    it('should return false for different arrays', () => {
      expect(arraysEqual([1, 2, 3], [1, 2, 4])).toBe(false)
      expect(arraysEqual([1, 2], [1, 2, 3])).toBe(false)
      expect(arraysEqual([1, 2, 3], [1, 2])).toBe(false)
      expect(arraysEqual([], [1])).toBe(false)
    })

    it('should use shallow comparison', () => {
      const obj = { a: 1 }
      expect(arraysEqual([obj], [obj])).toBe(true)
      expect(arraysEqual([{ a: 1 }], [{ a: 1 }])).toBe(false)
    })
  })

  describe('createSingleton', () => {
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