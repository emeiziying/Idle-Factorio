import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import DataService from '../../services/DataService';
import type { IconData } from '../../types/index';

interface FactorioIconProps {
  itemId?: string; // 当使用customImage时可选
  size?: number;
  className?: string;
  alt?: string;
  quantity?: number;
  showBorder?: boolean;
  customImage?: string; // 自定义图片URL
  shortage?: boolean; // 是否数量不足
  selected?: boolean; // 是否选中状态
  selectedBgColor?: string; // 选中时的背景色
}

const ICON_UNIT = 66; // 单个图标标准尺寸
const SPRITE_URL = '/data/spa/icons.webp';

const FactorioIcon: React.FC<FactorioIconProps> = ({ 
  itemId, 
  size = 32, 
  className,
  alt,
  quantity,
  showBorder = true,
  customImage,
  shortage,
  selected = false,
  selectedBgColor = '#e39827'
}) => {
  const [iconData, setIconData] = useState<IconData | null>(null);
  const [spriteSize, setSpriteSize] = useState<{ width: number; height: number } | null>(null);

  // 加载iconData - 只在没有customImage时加载
  useEffect(() => {
    if (customImage || !itemId) return;
    const dataService = DataService.getInstance();
    setIconData(dataService.getIconData(itemId));
  }, [itemId, customImage]);

  // 动态获取精灵图尺寸 - 只在没有customImage时加载
  useEffect(() => {
    if (customImage || spriteSize) return;
    const img = new window.Image();
    img.src = SPRITE_URL;
    img.onload = () => {
      setSpriteSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
  }, [spriteSize, customImage]);

  // 解析position字段
  const getSpritePosition = (position: string) => {
    if (!spriteSize) return {};
    // 例：-66px -132px
    const [xStr, yStr] = position.split(' ');
    const x = parseInt(xStr, 10);
    const y = parseInt(yStr, 10);
    // 目标显示尺寸
    const displaySize = size;
    return {
      backgroundPosition: `${x * displaySize / ICON_UNIT}px ${y * displaySize / ICON_UNIT}px`,
      backgroundSize: `${spriteSize.width * displaySize / ICON_UNIT}px ${spriteSize.height * displaySize / ICON_UNIT}px`,
      width: displaySize,
      height: displaySize
    };
  };

  const containerSize = showBorder ? size + 8 : size; // 图标尺寸 + 4px padding on each side (if border shown)

  // 计算背景色
  const getBackgroundColor = () => {
    if (shortage) return 'error.main';
    if (selected) return selectedBgColor;
    return (customImage || (iconData?.position) ? '#313131' : '#999');
  };

  // 公共容器样式
  const containerStyles = {
    width: containerSize,
    height: containerSize,
    ...(showBorder && {
      padding: '3px',
      backgroundColor: getBackgroundColor(),
      borderTop: '1px solid #454545',
      borderLeft: '1px solid #212121',
      borderRight: '1px solid #212121',
      borderBottom: '1px solid #191919',
    }),
    display: 'inline-block',
    flexShrink: 0,
    position: 'relative'
  };

  // 公共数量显示样式
  const quantityStyles = {
    position: 'absolute' as const,
    bottom:  '0px',
    right: showBorder ? '2px' : '0px',
    color: '#fff',
    fontSize: 'larger',
    fontWeight: 'bold',
    textShadow: '0px 1px 1px #000, 0px -1px 1px #000, 1px 0px 1px #000, -1px 0px 1px #000',
    lineHeight: 1,
    pointerEvents: 'none' as const
  };

  // 格式化数量显示
  const formatQuantity = (qty: number) => {
    return qty > 999 ? `${Math.floor(qty / 1000)}k` : qty;
  };

  return (
    <Box
      className={className}
      sx={containerStyles}
      title={alt || itemId}
    >
      <Box
        sx={{
          width: size,
          height: size,
          ...(customImage ? {
            backgroundImage: `url(${customImage})`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: 'contain',
          } : iconData?.position ? {
            backgroundImage: `url(${SPRITE_URL})`,
            backgroundRepeat: 'no-repeat',
            ...getSpritePosition(iconData.position)
          } : {
            bgcolor: 'grey.300',
          })
        }}
      />
      {quantity && quantity > 0 && (
        <Box sx={quantityStyles}>
          {formatQuantity(quantity)}
        </Box>
      )}
    </Box>
  );
};

export default FactorioIcon;

