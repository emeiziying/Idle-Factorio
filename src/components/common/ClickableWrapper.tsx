/**
 * 可点击包装组件
 * 为任意内容添加统一的点击效果
 */

import React from 'react';
import { Box } from '@mui/material';
import type { BoxProps } from '@mui/material';
import { getClickableStyles, mergeStyles } from '../../utils/styleHelpers';

interface ClickableWrapperProps extends BoxProps {
  /**
   * 点击事件处理函数
   */
  onClick?: () => void;
  /**
   * 是否禁用点击
   */
  disabled?: boolean;
  /**
   * 悬停时的透明度
   */
  hoverOpacity?: number;
  /**
   * 子元素
   */
  children: React.ReactNode;
}

export const ClickableWrapper: React.FC<ClickableWrapperProps> = ({
  onClick,
  disabled = false,
  hoverOpacity = 0.8,
  children,
  sx,
  ...otherProps
}) => {
  const isClickable = !disabled && !!onClick;

  const handleClick = () => {
    if (isClickable) {
      onClick();
    }
  };

  return (
    <Box
      onClick={handleClick}
      sx={mergeStyles(
        getClickableStyles(isClickable, hoverOpacity),
        {
          opacity: disabled ? 0.5 : 1,
          userSelect: 'none',
        },
        sx
      )}
      {...otherProps}
    >
      {children}
    </Box>
  );
};

export default ClickableWrapper;
