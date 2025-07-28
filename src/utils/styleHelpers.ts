/**
 * 样式相关的工具函数
 * 提供常用的样式模式
 */

import type { SxProps, Theme } from '@mui/material';

/**
 * 获取可点击元素的样式
 * @param isClickable 是否可点击
 * @param hoverOpacity 悬停时的透明度
 * @returns MUI sx 样式对象
 */
export const getClickableStyles = (
  isClickable: boolean,
  hoverOpacity: number = 0.8
): SxProps<Theme> => ({
  cursor: isClickable ? 'pointer' : 'default',
  transition: 'opacity 0.2s',
  '&:hover': isClickable ? { 
    opacity: hoverOpacity 
  } : {},
  '&:active': isClickable ? {
    opacity: hoverOpacity - 0.1
  } : {},
});

/**
 * 获取禁用状态的样式
 * @param isDisabled 是否禁用
 * @returns MUI sx 样式对象
 */
export const getDisabledStyles = (isDisabled: boolean): SxProps<Theme> => ({
  opacity: isDisabled ? 0.5 : 1,
  pointerEvents: isDisabled ? 'none' : 'auto',
  filter: isDisabled ? 'grayscale(50%)' : 'none',
});

/**
 * 获取加载状态的样式
 * @param isLoading 是否加载中
 * @returns MUI sx 样式对象
 */
export const getLoadingStyles = (isLoading: boolean): SxProps<Theme> => ({
  position: 'relative',
  '&::after': isLoading ? {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } : {},
});

/**
 * 获取选中状态的样式
 * @param isSelected 是否选中
 * @param selectedColor 选中时的颜色
 * @returns MUI sx 样式对象
 */
export const getSelectedStyles = (
  isSelected: boolean,
  selectedColor: string = 'primary.main'
): SxProps<Theme> => ({
  borderColor: isSelected ? selectedColor : 'transparent',
  borderWidth: 2,
  borderStyle: 'solid',
  backgroundColor: isSelected ? 'action.selected' : 'transparent',
});

/**
 * 获取响应式的网格样式
 * @param itemsPerRow 每行显示的项目数（桌面端）
 * @param mobileItemsPerRow 每行显示的项目数（移动端）
 * @returns MUI sx 样式对象
 */
export const getResponsiveGridStyles = (
  itemsPerRow: number = 4,
  mobileItemsPerRow: number = 2
): SxProps<Theme> => ({
  display: 'grid',
  gridTemplateColumns: {
    xs: `repeat(${mobileItemsPerRow}, 1fr)`,
    sm: `repeat(${Math.ceil(itemsPerRow / 2)}, 1fr)`,
    md: `repeat(${itemsPerRow}, 1fr)`,
  },
  gap: 2,
});

/**
 * 获取截断文本的样式
 * @param lines 最大行数
 * @returns MUI sx 样式对象
 */
export const getTruncateStyles = (lines: number = 1): SxProps<Theme> => ({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: lines,
  WebkitBoxOrient: 'vertical',
  wordBreak: 'break-word',
});

/**
 * 获取渐变背景样式
 * @param startColor 起始颜色
 * @param endColor 结束颜色
 * @param angle 渐变角度
 * @returns MUI sx 样式对象
 */
export const getGradientStyles = (
  startColor: string,
  endColor: string,
  angle: number = 135
): SxProps<Theme> => ({
  background: `linear-gradient(${angle}deg, ${startColor}, ${endColor})`,
});

/**
 * 获取卡片样式
 * @param isHoverable 是否有悬停效果
 * @param elevation 阴影等级
 * @returns MUI sx 样式对象
 */
export const getCardStyles = (
  isHoverable: boolean = false,
  elevation: number = 1
): SxProps<Theme> => ({
  boxShadow: elevation,
  borderRadius: 1,
  transition: 'all 0.3s ease',
  ...(isHoverable ? {
    '&:hover': {
      boxShadow: elevation + 2,
      transform: 'translateY(-2px)',
    }
  } : {}),
});

/**
 * 获取居中样式
 * @param horizontal 水平居中
 * @param vertical 垂直居中
 * @returns MUI sx 样式对象
 */
export const getCenterStyles = (
  horizontal: boolean = true,
  vertical: boolean = true
): SxProps<Theme> => ({
  display: 'flex',
  ...(horizontal ? { justifyContent: 'center' } : {}),
  ...(vertical ? { alignItems: 'center' } : {}),
});

/**
 * 合并多个样式对象
 * @param styles 样式对象数组
 * @returns 合并后的样式对象
 */
export const mergeStyles = (...styles: (SxProps<Theme> | undefined)[]): SxProps<Theme> => {
  const filteredStyles = styles.filter(Boolean) as SxProps<Theme>[];
  return filteredStyles.reduce((acc, style) => ({
    ...acc,
    ...style
  }), {} as SxProps<Theme>);
};