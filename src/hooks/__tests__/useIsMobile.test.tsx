import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material'
import { useIsMobile, useIsTablet, useDeviceType } from '../useIsMobile'
import React from 'react'

// Mock useMediaQuery
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material')
  return {
    ...actual,
    useMediaQuery: vi.fn()
  }
})

import { useMediaQuery } from '@mui/material'

describe('useIsMobile hooks', () => {
  const theme = createTheme()
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
  )

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useIsMobile', () => {
    it('should return true for mobile devices', () => {
      vi.mocked(useMediaQuery).mockReturnValue(true)
      
      const { result } = renderHook(() => useIsMobile(), { wrapper })
      
      expect(result.current).toBe(true)
      expect(useMediaQuery).toHaveBeenCalledWith(theme.breakpoints.down('sm'))
    })

    it('should return false for non-mobile devices', () => {
      vi.mocked(useMediaQuery).mockReturnValue(false)
      
      const { result } = renderHook(() => useIsMobile(), { wrapper })
      
      expect(result.current).toBe(false)
    })
  })

  describe('useIsTablet', () => {
    it('should return true for tablet devices', () => {
      vi.mocked(useMediaQuery).mockReturnValue(true)
      
      const { result } = renderHook(() => useIsTablet(), { wrapper })
      
      expect(result.current).toBe(true)
      expect(useMediaQuery).toHaveBeenCalledWith(theme.breakpoints.between('sm', 'md'))
    })

    it('should return false for non-tablet devices', () => {
      vi.mocked(useMediaQuery).mockReturnValue(false)
      
      const { result } = renderHook(() => useIsTablet(), { wrapper })
      
      expect(result.current).toBe(false)
    })
  })

  describe('useDeviceType', () => {
    it('should detect mobile device', () => {
      vi.mocked(useMediaQuery).mockImplementation((query) => {
        if (query === theme.breakpoints.down('sm')) return true
        if (query === theme.breakpoints.between('sm', 'md')) return false
        return false
      })
      
      const { result } = renderHook(() => useDeviceType(), { wrapper })
      
      expect(result.current).toEqual({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        deviceType: 'mobile'
      })
    })

    it('should detect tablet device', () => {
      vi.mocked(useMediaQuery).mockImplementation((query) => {
        if (query === theme.breakpoints.down('sm')) return false
        if (query === theme.breakpoints.between('sm', 'md')) return true
        return false
      })
      
      const { result } = renderHook(() => useDeviceType(), { wrapper })
      
      expect(result.current).toEqual({
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        deviceType: 'tablet'
      })
    })

    it('should detect desktop device', () => {
      vi.mocked(useMediaQuery).mockImplementation((query) => {
        if (query === theme.breakpoints.down('sm')) return false
        if (query === theme.breakpoints.between('sm', 'md')) return false
        return false
      })
      
      const { result } = renderHook(() => useDeviceType(), { wrapper })
      
      expect(result.current).toEqual({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        deviceType: 'desktop'
      })
    })
  })

  describe('responsive behavior', () => {
    it('should update when media query changes', () => {
      const mockMediaQuery = vi.mocked(useMediaQuery)
      mockMediaQuery.mockReturnValue(false)
      
      const { result, rerender } = renderHook(() => useIsMobile(), { wrapper })
      
      expect(result.current).toBe(false)
      
      // Simulate media query change
      mockMediaQuery.mockReturnValue(true)
      rerender()
      
      expect(result.current).toBe(true)
    })
  })
})