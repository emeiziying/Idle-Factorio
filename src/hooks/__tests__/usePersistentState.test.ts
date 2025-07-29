import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePersistentState } from '../usePersistentState'
import * as logger from '../../utils/logger'

// Mock logger
vi.mock('../../utils/logger', () => ({
  warn: vi.fn(),
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

describe('usePersistentState', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.localStorage = mockLocalStorage as any
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should use default value when localStorage is empty', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => 
        usePersistentState('test-key', 'default-value')
      )
      
      expect(result.current[0]).toBe('default-value')
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key')
    })

    it('should use stored value when localStorage has data', () => {
      mockLocalStorage.getItem.mockReturnValue('"stored-value"')
      
      const { result } = renderHook(() => 
        usePersistentState('test-key', 'default-value')
      )
      
      expect(result.current[0]).toBe('stored-value')
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key')
    })

    it('should handle complex objects', () => {
      const storedObject = { name: 'test', count: 42 }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedObject))
      
      const { result } = renderHook(() => 
        usePersistentState('test-key', { name: '', count: 0 })
      )
      
      expect(result.current[0]).toEqual(storedObject)
    })

    it('should handle arrays', () => {
      const storedArray = [1, 2, 3, 'test']
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedArray))
      
      const { result } = renderHook(() => 
        usePersistentState('test-key', [])
      )
      
      expect(result.current[0]).toEqual(storedArray)
    })

    it('should use default value when JSON parsing fails', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json{')
      
      const { result } = renderHook(() => 
        usePersistentState('test-key', 'default-value')
      )
      
      expect(result.current[0]).toBe('default-value')
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to parse localStorage key "test-key":',
        expect.any(Error)
      )
    })

    it('should handle localStorage.getItem throwing an error', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage not available')
      })
      
      const { result } = renderHook(() => 
        usePersistentState('test-key', 'default-value')
      )
      
      expect(result.current[0]).toBe('default-value')
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to parse localStorage key "test-key":',
        expect.any(Error)
      )
    })
  })

  describe('state updates', () => {
    it('should update state and save to localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => 
        usePersistentState('test-key', 'initial-value')
      )
      
      act(() => {
        result.current[1]('new-value')
      })
      
      expect(result.current[0]).toBe('new-value')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'test-key',
        '"new-value"'
      )
    })

    it('should handle functional updates', () => {
      mockLocalStorage.getItem.mockReturnValue('42')
      
      const { result } = renderHook(() => 
        usePersistentState('test-key', 0)
      )
      
      act(() => {
        result.current[1](prev => prev + 10)
      })
      
      expect(result.current[0]).toBe(52)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'test-key',
        '52'
      )
    })

    it('should save complex objects to localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => 
        usePersistentState('test-key', { count: 0 })
      )
      
      const newValue = { count: 10, name: 'test' }
      
      act(() => {
        result.current[1](newValue)
      })
      
      expect(result.current[0]).toEqual(newValue)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(newValue)
      )
    })

    it('should handle localStorage.setItem throwing an error', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage quota exceeded')
      })
      
      const { result } = renderHook(() => 
        usePersistentState('test-key', 'initial-value')
      )
      
      act(() => {
        result.current[1]('new-value')
      })
      
      // State should still update even if saving fails
      expect(result.current[0]).toBe('new-value')
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to save to localStorage key "test-key":',
        expect.any(Error)
      )
    })
  })

  describe('multiple instances', () => {
    it('should maintain separate state for different keys', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const { result: result1 } = renderHook(() => 
        usePersistentState('key1', 'default1')
      )
      const { result: result2 } = renderHook(() => 
        usePersistentState('key2', 'default2')
      )
      
      expect(result1.current[0]).toBe('default1')
      expect(result2.current[0]).toBe('default2')
      
      act(() => {
        result1.current[1]('value1')
      })
      
      expect(result1.current[0]).toBe('value1')
      expect(result2.current[0]).toBe('default2')
    })

    it('should sync state for same key across different hook instances', () => {
      mockLocalStorage.getItem.mockReturnValue('"shared-value"')
      
      const { result: result1 } = renderHook(() => 
        usePersistentState('shared-key', 'default')
      )
      const { result: result2 } = renderHook(() => 
        usePersistentState('shared-key', 'default')
      )
      
      expect(result1.current[0]).toBe('shared-value')
      expect(result2.current[0]).toBe('shared-value')
    })
  })

  describe('type safety', () => {
    it('should maintain type safety with primitives', () => {
      mockLocalStorage.getItem.mockReturnValue('42')
      
      const { result } = renderHook(() => 
        usePersistentState('test-key', 0)
      )
      
      expect(typeof result.current[0]).toBe('number')
      expect(result.current[0]).toBe(42)
    })

    it('should maintain type safety with boolean values', () => {
      mockLocalStorage.getItem.mockReturnValue('true')
      
      const { result } = renderHook(() => 
        usePersistentState('test-key', false)
      )
      
      expect(typeof result.current[0]).toBe('boolean')
      expect(result.current[0]).toBe(true)
    })

    it('should maintain type safety with custom types', () => {
      interface TestObject {
        id: number
        name: string
        active: boolean
      }
      
      const testObject: TestObject = { id: 1, name: 'test', active: true }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testObject))
      
      const { result } = renderHook(() => 
        usePersistentState<TestObject>('test-key', { id: 0, name: '', active: false })
      )
      
      expect(result.current[0]).toEqual(testObject)
      
      act(() => {
        result.current[1]({ id: 2, name: 'updated', active: false })
      })
      
      expect(result.current[0]).toEqual({ id: 2, name: 'updated', active: false })
    })
  })

  describe('edge cases', () => {
    it('should handle null values', () => {
      mockLocalStorage.getItem.mockReturnValue('null')
      
      const { result } = renderHook(() => 
        usePersistentState('test-key', 'default')
      )
      
      expect(result.current[0]).toBe(null)
    })

    it('should handle undefined default value', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => 
        usePersistentState('test-key', undefined)
      )
      
      expect(result.current[0]).toBe(undefined)
    })

    it('should handle empty string key', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => 
        usePersistentState('', 'default')
      )
      
      expect(result.current[0]).toBe('default')
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('')
    })
  })
})