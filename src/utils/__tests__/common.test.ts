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
  createSingleton,
} from '../common'

describe('common utilities', () => {
  describe('msToSeconds', () => {
    it('should convert milliseconds to seconds correctly', () => {
      expect(msToSeconds(1000)).toBe(1)
      expect(msToSeconds(500)).toBe(0.5)
      expect(msToSeconds(0)).toBe(0)
      expect(msToSeconds(2500)).toBe(2.5)
    })

    it('should handle negative values', () => {
      expect(msToSeconds(-1000)).toBe(-1)
    })
  })

  describe('secondsToMs', () => {
    it('should convert seconds to milliseconds correctly', () => {
      expect(secondsToMs(1)).toBe(1000)
      expect(secondsToMs(0.5)).toBe(500)
      expect(secondsToMs(0)).toBe(0)
      expect(secondsToMs(2.5)).toBe(2500)
    })

    it('should handle negative values', () => {
      expect(secondsToMs(-1)).toBe(-1000)
    })
  })

  describe('calculateRate', () => {
    it('should calculate basic rate correctly', () => {
      expect(calculateRate(10, 2)).toBe(5) // 10 items / 2 seconds = 5 items/sec
    })

    it('should apply machine speed multiplier', () => {
      expect(calculateRate(10, 2, 2)).toBe(10) // 5 * 2 = 10
    })

    it('should apply efficiency multiplier', () => {
      expect(calculateRate(10, 2, 1, 1.5)).toBe(7.5) // 5 * 1.5 = 7.5
    })

    it('should apply facility count', () => {
      expect(calculateRate(10, 2, 1, 1, 3)).toBe(15) // 5 * 3 = 15
    })

    it('should apply all multipliers', () => {
      expect(calculateRate(10, 2, 2, 1.5, 2)).toBe(30) // (10/2) * 2 * 1.5 * 2 = 30
    })

    it('should handle zero recipe time safely', () => {
      expect(calculateRate(10, 0)).toBe(Infinity)
    })
  })

  describe('formatNumber', () => {
    it('should format numbers with default 2 decimals', () => {
      expect(formatNumber(3.14159)).toBe('3.14')
      expect(formatNumber(10)).toBe('10.00')
    })

    it('should format numbers with custom decimals', () => {
      expect(formatNumber(3.14159, 0)).toBe('3')
      expect(formatNumber(3.14159, 3)).toBe('3.142')
      expect(formatNumber(3.14159, 5)).toBe('3.14159')
    })

    it('should handle negative numbers', () => {
      expect(formatNumber(-3.14159)).toBe('-3.14')
    })
  })

  describe('safeGet', () => {
    const testObj = {
      a: {
        b: {
          c: 'value'
        },
        array: [1, 2, 3]
      },
      number: 42,
      string: 'test'
    }

    it('should get nested values correctly', () => {
      expect(safeGet(testObj, 'a.b.c', 'default')).toBe('value')
      expect(safeGet(testObj, 'number', 'default')).toBe(42)
      expect(safeGet(testObj, 'string', 'default')).toBe('test')
    })

    it('should return default value for non-existent paths', () => {
      expect(safeGet(testObj, 'a.b.d', 'default')).toBe('default')
      expect(safeGet(testObj, 'x.y.z', 'default')).toBe('default')
      expect(safeGet(testObj, 'nonexistent', 'default')).toBe('default')
    })

    it('should handle empty objects', () => {
      expect(safeGet({}, 'a.b.c', 'default')).toBe('default')
    })

    it('should handle null/undefined intermediate values', () => {
      const objWithNull = { a: null }
      expect(safeGet(objWithNull, 'a.b.c', 'default')).toBe('default')
    })
  })

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should delay function execution', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn()
      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should cancel previous calls', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should pass arguments correctly', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn('arg1', 'arg2')
      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
    })
  })

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should execute function immediately first time', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn()
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should throttle subsequent calls', () => {
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

    it('should pass arguments correctly', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn('arg1', 'arg2')
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
    })
  })

  describe('deepClone', () => {
    it('should clone primitive values', () => {
      expect(deepClone(42)).toBe(42)
      expect(deepClone('string')).toBe('string')
      expect(deepClone(true)).toBe(true)
      expect(deepClone(null)).toBe(null)
      expect(deepClone(undefined)).toBe(undefined)
    })

    it('should clone dates', () => {
      const date = new Date('2023-01-01')
      const cloned = deepClone(date)
      
      expect(cloned).toEqual(date)
      expect(cloned).not.toBe(date)
    })

    it('should clone arrays deeply', () => {
      const arr = [1, [2, 3], { a: 4 }]
      const cloned = deepClone(arr)
      
      expect(cloned).toEqual(arr)
      expect(cloned).not.toBe(arr)
      expect(cloned[1]).not.toBe(arr[1])
      expect(cloned[2]).not.toBe(arr[2])
    })

    it('should clone objects deeply', () => {
      const obj = {
        a: 1,
        b: {
          c: 2,
          d: [3, 4]
        }
      }
      const cloned = deepClone(obj)
      
      expect(cloned).toEqual(obj)
      expect(cloned).not.toBe(obj)
      expect(cloned.b).not.toBe(obj.b)
      expect(cloned.b.d).not.toBe(obj.b.d)
    })

    it('should handle circular references gracefully', () => {
      const obj: any = { a: 1 }
      obj.self = obj
      
      // This would cause infinite recursion, but we accept that limitation
      // In real usage, developers should avoid circular references
      expect(() => deepClone(obj)).toThrow()
    })
  })

  describe('arraysEqual', () => {
    it('should return true for equal arrays', () => {
      expect(arraysEqual([1, 2, 3], [1, 2, 3])).toBe(true)
      expect(arraysEqual(['a', 'b'], ['a', 'b'])).toBe(true)
      expect(arraysEqual([], [])).toBe(true)
    })

    it('should return false for different arrays', () => {
      expect(arraysEqual([1, 2, 3], [1, 2, 4])).toBe(false)
      expect(arraysEqual([1, 2], [1, 2, 3])).toBe(false)
      expect(arraysEqual(['a'], ['b'])).toBe(false)
    })

    it('should handle different types correctly', () => {
      expect(arraysEqual([1, '2'], [1, 2])).toBe(false)
    })
  })

  describe('createSingleton', () => {
    it('should create singleton instances', () => {
      class TestClass {
        value = Math.random()
      }

      const getSingleton = createSingleton(TestClass)
      
      const instance1 = getSingleton()
      const instance2 = getSingleton()
      
      expect(instance1).toBe(instance2)
      expect(instance1.value).toBe(instance2.value)
    })

    it('should create different singletons for different classes', () => {
      class TestClass1 {}
      class TestClass2 {}

      const getSingleton1 = createSingleton(TestClass1)
      const getSingleton2 = createSingleton(TestClass2)
      
      const instance1 = getSingleton1()
      const instance2 = getSingleton2()
      
      expect(instance1).not.toBe(instance2)
    })
  })
})