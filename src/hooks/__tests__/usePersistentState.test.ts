import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePersistentState } from '../usePersistentState'

// 模拟日志记录器
vi.mock('../../utils/logger', () => ({
  warn: vi.fn()
}))

// usePersistentState hook 测试套件 - 用于测试持久化状态管理
describe('usePersistentState', () => {
  beforeEach(() => {
    // 清空 localStorage
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  // 测试：当 localStorage 为空时应返回默认值
  it('should return default value when localStorage is empty', () => {
    const { result } = renderHook(() => usePersistentState('test-key', 'default'))
    
    expect(result.current[0]).toBe('default')
  })

  // 测试：如果 localStorage 中存在值则应返回该值
  it('should return value from localStorage if exists', () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'))
    
    const { result } = renderHook(() => usePersistentState('test-key', 'default'))
    
    expect(result.current[0]).toBe('stored-value')
  })

  // 测试：更新时应将状态保存到 localStorage
  it('should save state to localStorage when updated', () => {
    const { result } = renderHook(() => usePersistentState('test-key', 'initial'))
    
    act(() => {
      result.current[1]('updated')
    })
    
    expect(result.current[0]).toBe('updated')
    expect(localStorage.getItem('test-key')).toBe('"updated"')
  })

  // 测试：应该能处理复杂数据类型
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

  // 测试：应该能处理函数式更新
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

  // 测试：应该能处理数组
  it('should handle arrays', () => {
    const { result } = renderHook(() => usePersistentState<string[]>('array-key', []))
    
    act(() => {
      result.current[1](['item1', 'item2'])
    })
    
    expect(result.current[0]).toEqual(['item1', 'item2'])
    expect(JSON.parse(localStorage.getItem('array-key')!)).toEqual(['item1', 'item2'])
  })

  // 测试：应该优雅地处理 localStorage 中的无效 JSON
  it('should handle invalid JSON in localStorage gracefully', () => {
    localStorage.setItem('invalid-key', 'not-valid-json')
    
    const { result } = renderHook(() => usePersistentState('invalid-key', 'fallback'))
    
    expect(result.current[0]).toBe('fallback')
  })

  // 测试：应该优雅地处理 localStorage.setItem 错误
  it('should handle localStorage.setItem errors gracefully', () => {
    const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage quota exceeded')
    })
    
    const { result } = renderHook(() => usePersistentState('error-key', 'value'))
    
    act(() => {
      result.current[1]('new-value')
    })
    
    // State should still update even if localStorage fails
    // 即使 localStorage 失败，状态仍应更新
    expect(result.current[0]).toBe('new-value')
    
    mockSetItem.mockRestore()
  })

  // 测试：当键改变时应更新 localStorage
  it('should update localStorage when key changes', () => {
    const { result, rerender } = renderHook(
      ({ key, value }) => usePersistentState(key, value),
      { initialProps: { key: 'key1', value: 'value1' } }
    )
    
    act(() => {
      result.current[1]('updated1')
    })
    
    expect(localStorage.getItem('key1')).toBe('"updated1"')
    
    // 改变键
    rerender({ key: 'key2', value: 'value2' })
    
    expect(result.current[0]).toBe('value2')
    
    act(() => {
      result.current[1]('updated2')
    })
    
    expect(localStorage.getItem('key2')).toBe('"updated2"')
    expect(localStorage.getItem('key1')).toBe('"updated1"') // 旧键应该仍然存在
  })

  // 测试：应该能处理 null 和 undefined 值
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

  // 测试：应该能处理布尔值
  it('should handle boolean values', () => {
    const { result } = renderHook(() => usePersistentState('bool-key', false))
    
    expect(result.current[0]).toBe(false)
    
    act(() => {
      result.current[1](true)
    })
    
    expect(result.current[0]).toBe(true)
    expect(localStorage.getItem('bool-key')).toBe('true')
  })

  // 测试：应该在具有相同键的多个 hook 之间共享状态
  it('should share state between multiple hooks with same key', () => {
    const { result: hook1 } = renderHook(() => usePersistentState('shared-key', 'initial'))
    const { result: hook2 } = renderHook(() => usePersistentState('shared-key', 'initial'))
    
    // 两者应该以相同的值开始
    expect(hook1.current[0]).toBe('initial')
    expect(hook2.current[0]).toBe('initial')
    
    // 从 hook1 更新
    act(() => {
      hook1.current[1]('updated-from-hook1')
    })
    
    // Hook1 立即更新
    expect(hook1.current[0]).toBe('updated-from-hook1')
    
    // Hook2 在重新挂载之前不会看到更新，但 localStorage 已更新
    expect(localStorage.getItem('shared-key')).toBe('"updated-from-hook1"')
  })
})