import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import DataService from '../../services/DataService';
import type { IconData } from '../../types/index';

interface FactorioIconProps {
  itemId: string;
  size?: number;
  className?: string;
  alt?: string;
}

const ICON_UNIT = 66; // 单个图标标准尺寸
const SPRITE_URL = '/data/spa/icons.webp';

const FactorioIcon: React.FC<FactorioIconProps> = ({ 
  itemId, 
  size = 32, 
  className,
  alt 
}) => {
  const [iconData, setIconData] = useState<IconData | null>(null);
  const [spriteSize, setSpriteSize] = useState<{ width: number; height: number } | null>(null);

  // 加载iconData
  useEffect(() => {
    const dataService = DataService.getInstance();
    setIconData(dataService.getIconData(itemId));
  }, [itemId]);

  // 动态获取精灵图尺寸
  useEffect(() => {
    if (spriteSize) return;
    const img = new window.Image();
    img.src = SPRITE_URL;
    img.onload = () => {
      setSpriteSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
  }, [spriteSize]);

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

  if (!iconData || !iconData.position) {
    return (
      <Box
        className={className}
        sx={{
          width: size,
          height: size,
          bgcolor: 'grey.300',
          borderRadius: 1,
          display: 'inline-block',
          flexShrink: 0
        }}
        title={alt || itemId}
      />
    );
  }

  return (
    <Box
      className={className}
      sx={{
        width: size,
        height: size,
        backgroundImage: `url(${SPRITE_URL})`,
        backgroundRepeat: 'no-repeat',
        borderRadius: 1,
        bgcolor: 'background.paper',
        display: 'inline-block',
        flexShrink: 0,
        ...getSpritePosition(iconData.position)
      }}
      title={alt || itemId}
    />
  );
};

export default FactorioIcon;

