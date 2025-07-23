// 移动端检测Hook

import { useMediaQuery, useTheme } from '@mui/material';

export const useIsMobile = () => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('sm'));
};

export const useIsTablet = () => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.between('sm', 'md'));
};

export const useDeviceType = () => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  
  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
  };
};