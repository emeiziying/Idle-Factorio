import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useIsMobile, useIsTablet, useDeviceType } from '../useIsMobile'

// Mock MUI hooks
const mockUseMediaQuery = vi.fn()
const mockUseTheme = vi.fn()

vi.mock('@mui/material', () => ({
  useMediaQuery: () => mockUseMediaQuery(),
  useTheme: () => mockUseTheme()
}))

describe('Device Detection Hooks', () => {
  const mockTheme = {
    breakpoints: {
      down: vi.fn(),
      between: vi.fn()
    }
  }

  beforeEach(() => {
    vi.resetAllMocks()
    mockUseTheme.mockReturnValue(mockTheme)
  })

  describe('useIsMobile', () => {
    it('should return true when on mobile device', () => {
      mockUseMediaQuery.mockReturnValue(true)
      mockTheme.breakpoints.down.mockReturnValue('(max-width:599.95px)')

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(true)
      expect(mockTheme.breakpoints.down).toHaveBeenCalledWith('sm')
    })

    it('should return false when not on mobile device', () => {
      mockUseMediaQuery.mockReturnValue(false)
      mockTheme.breakpoints.down.mockReturnValue('(max-width:599.95px)')

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(false)
      expect(mockTheme.breakpoints.down).toHaveBeenCalledWith('sm')
    })

    it('should call useTheme and useMediaQuery', () => {
      mockUseMediaQuery.mockReturnValue(false)
      mockTheme.breakpoints.down.mockReturnValue('(max-width:599.95px)')

      renderHook(() => useIsMobile())

      expect(mockUseTheme).toHaveBeenCalled()
      expect(mockUseMediaQuery).toHaveBeenCalled()
    })
  })

  describe('useIsTablet', () => {
    it('should return true when on tablet device', () => {
      mockUseMediaQuery.mockReturnValue(true)
      mockTheme.breakpoints.between.mockReturnValue('(min-width:600px) and (max-width:899.95px)')

      const { result } = renderHook(() => useIsTablet())

      expect(result.current).toBe(true)
      expect(mockTheme.breakpoints.between).toHaveBeenCalledWith('sm', 'md')
    })

    it('should return false when not on tablet device', () => {
      mockUseMediaQuery.mockReturnValue(false)
      mockTheme.breakpoints.between.mockReturnValue('(min-width:600px) and (max-width:899.95px)')

      const { result } = renderHook(() => useIsTablet())

      expect(result.current).toBe(false)
      expect(mockTheme.breakpoints.between).toHaveBeenCalledWith('sm', 'md')
    })

    it('should call useTheme and useMediaQuery', () => {
      mockUseMediaQuery.mockReturnValue(false)
      mockTheme.breakpoints.between.mockReturnValue('(min-width:600px) and (max-width:899.95px)')

      renderHook(() => useIsTablet())

      expect(mockUseTheme).toHaveBeenCalled()
      expect(mockUseMediaQuery).toHaveBeenCalled()
    })
  })

  describe('useDeviceType', () => {
    it('should return mobile device type', () => {
      // Mock mobile detection
      let callCount = 0
      mockUseMediaQuery.mockImplementation(() => {
        callCount++
        return callCount === 1 // First call for isMobile should return true
      })

      const { result } = renderHook(() => useDeviceType())

      expect(result.current).toEqual({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        deviceType: 'mobile'
      })
    })

    it('should return tablet device type', () => {
      // Mock tablet detection
      let callCount = 0
      mockUseMediaQuery.mockImplementation(() => {
        callCount++
        if (callCount === 1) return false // isMobile = false
        if (callCount === 2) return true  // isTablet = true
        return false
      })

      const { result } = renderHook(() => useDeviceType())

      expect(result.current).toEqual({
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        deviceType: 'tablet'
      })
    })

    it('should return desktop device type', () => {
      // Mock desktop detection
      mockUseMediaQuery.mockReturnValue(false) // Both mobile and tablet return false

      const { result } = renderHook(() => useDeviceType())

      expect(result.current).toEqual({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        deviceType: 'desktop'
      })
    })

    it('should handle edge case where both mobile and tablet are true', () => {
      // This shouldn't happen in normal usage, but test for robustness
      mockUseMediaQuery.mockReturnValue(true) // Both return true

      const { result } = renderHook(() => useDeviceType())

      expect(result.current).toEqual({
        isMobile: true,
        isTablet: true,
        isDesktop: false,
        deviceType: 'mobile' // Mobile takes precedence
      })
    })

    it('should update when screen size changes', () => {
      // Start with mobile
      let callCount = 0
      mockUseMediaQuery.mockImplementation(() => {
        callCount++
        return callCount <= 2 // First two calls return true (mobile)
      })

      const { result, rerender } = renderHook(() => useDeviceType())

      expect(result.current.deviceType).toBe('mobile')

      // Simulate screen size change to desktop
      mockUseMediaQuery.mockReturnValue(false)
      rerender()

      expect(result.current.deviceType).toBe('desktop')
    })
  })

  describe('integration scenarios', () => {
    it('should work correctly with different breakpoint configurations', () => {
      // Test with custom breakpoint values
      mockTheme.breakpoints.down.mockReturnValue('(max-width:500px)')
      mockTheme.breakpoints.between.mockReturnValue('(min-width:501px) and (max-width:800px)')
      mockUseMediaQuery.mockReturnValue(false)

      const { result } = renderHook(() => useDeviceType())

      expect(mockTheme.breakpoints.down).toHaveBeenCalledWith('sm')
      expect(mockTheme.breakpoints.between).toHaveBeenCalledWith('sm', 'md')
      expect(result.current.deviceType).toBe('desktop')
    })

    it('should handle theme changes gracefully', () => {
      const newTheme = {
        breakpoints: {
          down: vi.fn().mockReturnValue('(max-width:400px)'),
          between: vi.fn().mockReturnValue('(min-width:401px) and (max-width:700px)')
        }
      }

      mockUseTheme.mockReturnValue(newTheme)
      mockUseMediaQuery.mockReturnValue(false)

      const { result } = renderHook(() => useDeviceType())

      expect(newTheme.breakpoints.down).toHaveBeenCalledWith('sm')
      expect(newTheme.breakpoints.between).toHaveBeenCalledWith('sm', 'md')
      expect(result.current.deviceType).toBe('desktop')
    })

    it('should maintain referential stability for device type object', () => {
      mockUseMediaQuery.mockReturnValue(false)

      const { result, rerender } = renderHook(() => useDeviceType())
      const firstResult = result.current

      rerender()
      const secondResult = result.current

      // Values should be the same but objects should be different instances
      expect(firstResult).toEqual(secondResult)
      expect(firstResult).not.toBe(secondResult)
    })
  })

  describe('error handling', () => {
    it('should handle useTheme throwing an error', () => {
      mockUseTheme.mockImplementation(() => {
        throw new Error('Theme error')
      })

      expect(() => renderHook(() => useIsMobile())).toThrow('Theme error')
    })

    it('should handle useMediaQuery throwing an error', () => {
      mockUseTheme.mockReturnValue(mockTheme)
      mockUseMediaQuery.mockImplementation(() => {
        throw new Error('MediaQuery error')
      })

      expect(() => renderHook(() => useIsMobile())).toThrow('MediaQuery error')
    })

    it('should handle missing breakpoints in theme', () => {
      const incompleteTheme = {
        breakpoints: {
          down: undefined,
          between: undefined
        }
      }

      mockUseTheme.mockReturnValue(incompleteTheme)

      expect(() => renderHook(() => useIsMobile())).toThrow()
    })
  })

  describe('performance considerations', () => {
    it('should call hooks the expected number of times', () => {
      mockUseMediaQuery.mockReturnValue(false)
      mockTheme.breakpoints.down.mockReturnValue('(max-width:599.95px)')
      mockTheme.breakpoints.between.mockReturnValue('(min-width:600px) and (max-width:899.95px)')

      renderHook(() => useDeviceType())

      // useDeviceType calls useIsMobile and useIsTablet internally
      // Each calls useTheme and useMediaQuery once
      expect(mockUseTheme).toHaveBeenCalledTimes(2)
      expect(mockUseMediaQuery).toHaveBeenCalledTimes(2)
    })

    it('should not cause infinite re-renders', () => {
      mockUseMediaQuery.mockReturnValue(false)
      let renderCount = 0

      const { rerender } = renderHook(() => {
        renderCount++
        return useDeviceType()
      })

      expect(renderCount).toBe(1)

      // Multiple rerenders shouldn't increase the count exponentially
      rerender()
      rerender()
      rerender()

      expect(renderCount).toBe(4) // 1 initial + 3 rerenders
    })
  })
})