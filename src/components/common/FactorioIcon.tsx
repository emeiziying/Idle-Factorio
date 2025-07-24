import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import DataService from '../../services/DataService';
import type { IconData } from '../../types/index';

interface FactorioIconProps {
  itemId: string;
  size?: number;
  className?: string;
  alt?: string;
  quantity?: number;
  showBorder?: boolean;
}

const ICON_UNIT = 66; // 单个图标标准尺寸
const SPRITE_URL = '/data/spa/icons.webp';

const FactorioIcon: React.FC<FactorioIconProps> = ({ 
  itemId, 
  size = 32, 
  className,
  alt,
  quantity,
  showBorder = true
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

  const containerSize = showBorder ? size + 10 : size; // 图标尺寸 + 4px padding on each side (if border shown)

  if (!iconData || !iconData.position) {
    return (
      <Box
        className={className}
        sx={{
          width: containerSize,
          height: containerSize,
          ...(showBorder && {
            padding: '4px',
            backgroundColor: '#999',
            borderTop: '1px solid #454545',
            borderLeft: '1px solid #212121',
            borderRight: '1px solid #212121',
            borderBottom: '1px solid #191919',
          }),
          display: 'inline-block',
          flexShrink: 0,
          position: 'relative'
        }}
        title={alt || itemId}
      >
        <Box
          sx={{
            width: size,
            height: size,
            bgcolor: 'grey.300',
          }}
        />
        {quantity && quantity > 0 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: showBorder ? '-3px' : '0px',
              right: showBorder ? '2px' : '0px',
              color: '#fff',
              fontSize: 'larger',
              fontWeight: 'bold',
              textShadow: '0px 1px 1px #000, 0px -1px 1px #000, 1px 0px 1px #000, -1px 0px 1px #000',
              lineHeight: 1,
              pointerEvents: 'none'
            }}
          >
            {quantity > 999 ? `${Math.floor(quantity / 1000)}k` : quantity}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box
      className={className}
      sx={{
        width: containerSize,
        height: containerSize,
        ...(showBorder && {
          padding: '4px',
          backgroundColor: '#313131',
          borderTop: '1px solid #454545',
          borderLeft: '1px solid #212121',
          borderRight: '1px solid #212121',
          borderBottom: '1px solid #191919',
        }),
        display: 'inline-block',
        flexShrink: 0,
        position: 'relative'
      }}
      title={alt || itemId}
    >
      <Box
        sx={{
          width: size,
          height: size,
          backgroundImage: `url(${SPRITE_URL})`,
          backgroundRepeat: 'no-repeat',
          ...getSpritePosition(iconData.position)
        }}
      />
      {quantity && quantity > 0 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: showBorder ? '-3px' : '0px',
            right: showBorder ? '2px' : '0px',
            color: '#fff',
            fontSize: 'larger',
            fontWeight: 'bold',
            textShadow: '0px 1px 1px #000, 0px -1px 1px #000, 1px 0px 1px #000, -1px 0px 1px #000',
            lineHeight: 1,
            pointerEvents: 'none'
          }}
        >
          {quantity > 999 ? `${Math.floor(quantity / 1000)}k` : quantity}
        </Box>
      )}
    </Box>
  );
};

export default FactorioIcon;

