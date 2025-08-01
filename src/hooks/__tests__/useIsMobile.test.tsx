import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { useIsMobile, useIsTablet, useDeviceType } from '@/hooks/useIsMobile';
import React from 'react';

// Mock useMediaQuery
// 模拟 useMediaQuery hook
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: vi.fn(),
  };
});

import { useMediaQuery } from '@mui/material';

// 移动设备检测 hooks 测试套件
describe('useIsMobile hooks', () => {
  const theme = createTheme();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // useIsMobile hook 测试
  describe('useIsMobile', () => {
    // 测试：移动设备应该返回 true
    it('should return true for mobile devices', () => {
      vi.mocked(useMediaQuery).mockReturnValue(true);

      const { result } = renderHook(() => useIsMobile(), { wrapper });

      expect(result.current).toBe(true);
      expect(useMediaQuery).toHaveBeenCalledWith(theme.breakpoints.down('sm'));
    });

    // 测试：非移动设备应该返回 false
    it('should return false for non-mobile devices', () => {
      vi.mocked(useMediaQuery).mockReturnValue(false);

      const { result } = renderHook(() => useIsMobile(), { wrapper });

      expect(result.current).toBe(false);
    });
  });

  // useIsTablet hook 测试
  describe('useIsTablet', () => {
    // 测试：平板设备应该返回 true
    it('should return true for tablet devices', () => {
      vi.mocked(useMediaQuery).mockReturnValue(true);

      const { result } = renderHook(() => useIsTablet(), { wrapper });

      expect(result.current).toBe(true);
      expect(useMediaQuery).toHaveBeenCalledWith(theme.breakpoints.between('sm', 'md'));
    });

    // 测试：非平板设备应该返回 false
    it('should return false for non-tablet devices', () => {
      vi.mocked(useMediaQuery).mockReturnValue(false);

      const { result } = renderHook(() => useIsTablet(), { wrapper });

      expect(result.current).toBe(false);
    });
  });

  // useDeviceType hook 测试
  describe('useDeviceType', () => {
    // 测试：应该检测到移动设备
    it('should detect mobile device', () => {
      vi.mocked(useMediaQuery).mockImplementation(query => {
        if (query === theme.breakpoints.down('sm')) return true;
        if (query === theme.breakpoints.between('sm', 'md')) return false;
        return false;
      });

      const { result } = renderHook(() => useDeviceType(), { wrapper });

      expect(result.current).toEqual({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        deviceType: 'mobile',
      });
    });

    // 测试：应该检测到平板设备
    it('should detect tablet device', () => {
      vi.mocked(useMediaQuery).mockImplementation(query => {
        if (query === theme.breakpoints.down('sm')) return false;
        if (query === theme.breakpoints.between('sm', 'md')) return true;
        return false;
      });

      const { result } = renderHook(() => useDeviceType(), { wrapper });

      expect(result.current).toEqual({
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        deviceType: 'tablet',
      });
    });

    // 测试：应该检测到桌面设备
    it('should detect desktop device', () => {
      vi.mocked(useMediaQuery).mockImplementation(query => {
        if (query === theme.breakpoints.down('sm')) return false;
        if (query === theme.breakpoints.between('sm', 'md')) return false;
        return false;
      });

      const { result } = renderHook(() => useDeviceType(), { wrapper });

      expect(result.current).toEqual({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        deviceType: 'desktop',
      });
    });
  });

  // 响应式行为测试
  describe('responsive behavior', () => {
    // 测试：当媒体查询改变时应该更新
    it('should update when media query changes', () => {
      const mockMediaQuery = vi.mocked(useMediaQuery);
      mockMediaQuery.mockReturnValue(false);

      const { result, rerender } = renderHook(() => useIsMobile(), { wrapper });

      expect(result.current).toBe(false);

      // Simulate media query change
      // 模拟媒体查询变化
      mockMediaQuery.mockReturnValue(true);
      rerender();

      expect(result.current).toBe(true);
    });
  });
});
