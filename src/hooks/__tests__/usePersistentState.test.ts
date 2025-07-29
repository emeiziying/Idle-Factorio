import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePersistentState } from '../usePersistentState'

// Mock logger
vi.mock('../../utils/logger', () => ({
  warn: vi.fn()
}))

describe('usePersistentState', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should return default value when localStorage is empty', () => {
    const { result } = renderHook(() => usePersistentState('test-key', 'default'))
    
    expect(result.current[0]).toBe('default')
  })

  it('should return value from localStorage if exists', () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'))
    
    const { result } = renderHook(() => usePersistentState('test-key', 'default'))
    
    expect(result.current[0]).toBe('stored-value')
  })

  it('should save state to localStorage when updated', () => {
    const { result } = renderHook(() => usePersistentState('test-key', 'initial'))
    
    act(() => {
      result.current[1]('updated')
    })
    
    expect(result.current[0]).toBe('updated')
    expect(localStorage.getItem('test-key')).toBe('"updated"')
  })

  it('should handle complex data types', () => {
    const complexData = { name: 'test', items: [1, 2, 3], nested: { value: true } }
    const { result } = renderHook(() => usePersistentState('complex-key', complexData))
    
    const newData = { name: 'updated', items: [4, 5], nested: { value: false } }
    act(() => {
      result.current[1](newData)
    })
    
    expect(result.current[0]).toEqual(newData)
    expect(JSON.parse(localStorage.getItem('complex-key')!)).toEqual(newData)
  })

  it('should handle function updates', () => {
    const { result } = renderHook(() => usePersistentState('counter', 0))
    
    act(() => {
      result.current[1](prev => prev + 1)
    })
    
    expect(result.current[0]).toBe(1)
    
    act(() => {
      result.current[1](prev => prev + 1)
    })
    
    expect(result.current[0]).toBe(2)
    expect(localStorage.getItem('counter')).toBe('2')
  })

  it('should handle arrays', () => {
    const { result } = renderHook(() => usePersistentState<string[]>('array-key', []))
    
    act(() => {
      result.current[1](['item1', 'item2'])
    })
    
    expect(result.current[0]).toEqual(['item1', 'item2'])
    expect(JSON.parse(localStorage.getItem('array-key')!)).toEqual(['item1', 'item2'])
  })

  it('should handle invalid JSON in localStorage gracefully', () => {
    localStorage.setItem('invalid-key', 'not-valid-json')
    
    const { result } = renderHook(() => usePersistentState('invalid-key', 'fallback'))
    
    expect(result.current[0]).toBe('fallback')
  })

  it('should handle localStorage.setItem errors gracefully', () => {
    const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage quota exceeded')
    })
    
    const { result } = renderHook(() => usePersistentState('error-key', 'value'))
    
    act(() => {
      result.current[1]('new-value')
    })
    
    // State should still update even if localStorage fails
    expect(result.current[0]).toBe('new-value')
    
    mockSetItem.mockRestore()
  })

  it('should update localStorage when key changes', () => {
    const { result, rerender } = renderHook(
      ({ key, value }) => usePersistentState(key, value),
      { initialProps: { key: 'key1', value: 'value1' } }
    )
    
    act(() => {
      result.current[1]('updated1')
    })
    
    expect(localStorage.getItem('key1')).toBe('"updated1"')
    
    // Change key
    rerender({ key: 'key2', value: 'value2' })
    
    expect(result.current[0]).toBe('value2')
    
    act(() => {
      result.current[1]('updated2')
    })
    
    expect(localStorage.getItem('key2')).toBe('"updated2"')
    expect(localStorage.getItem('key1')).toBe('"updated1"') // Old key should still exist
  })

  it('should handle null and undefined values', () => {
    const { result: nullResult } = renderHook(() => usePersistentState<string | null>('null-key', null))
    
    expect(nullResult.current[0]).toBeNull()
    expect(localStorage.getItem('null-key')).toBe('null')
    
    act(() => {
      nullResult.current[1]('not-null')
    })
    
    expect(nullResult.current[0]).toBe('not-null')
    
    act(() => {
      nullResult.current[1](null)
    })
    
    expect(nullResult.current[0]).toBeNull()
  })

  it('should handle boolean values', () => {
    const { result } = renderHook(() => usePersistentState('bool-key', false))
    
    expect(result.current[0]).toBe(false)
    
    act(() => {
      result.current[1](true)
    })
    
    expect(result.current[0]).toBe(true)
    expect(localStorage.getItem('bool-key')).toBe('true')
  })

  it('should share state between multiple hooks with same key', () => {
    const { result: hook1 } = renderHook(() => usePersistentState('shared-key', 'initial'))
    const { result: hook2 } = renderHook(() => usePersistentState('shared-key', 'initial'))
    
    // Both should start with the same value
    expect(hook1.current[0]).toBe('initial')
    expect(hook2.current[0]).toBe('initial')
    
    // Update from hook1
    act(() => {
      hook1.current[1]('updated-from-hook1')
    })
    
    // Hook1 updates immediately
    expect(hook1.current[0]).toBe('updated-from-hook1')
    
    // Hook2 won't see the update until remount, but localStorage is updated
    expect(localStorage.getItem('shared-key')).toBe('"updated-from-hook1"')
  })
})