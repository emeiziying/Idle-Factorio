import React from 'react';
import { Box, styled } from '@mui/material';
import { dataService } from '../services/DataService';

interface GameIconProps {
  itemId: string;
  size?: number; // 图标显示尺寸，默认32px
  className?: string;
  onClick?: () => void;
}

const IconContainer = styled(Box)<{ 
  iconsize: number;
  iconposition: string; 
  backgroundcolor: string; 
}>(({ iconsize, iconposition, backgroundcolor }) => {
  // 计算缩放比例和精灵图尺寸
  const originalIconSize = 66; // 精灵图中每个图标的原始尺寸
  const originalSpriteSize = 1252; // 精灵图的原始尺寸
  const scaleFactor = iconsize / originalIconSize;
  const scaledSpriteSize = Math.round(originalSpriteSize * scaleFactor);
  
  // 缩放position
  const [x, y] = iconposition.split(' ').map(pos => {
    const value = parseInt(pos.replace('px', ''));
    return Math.round(value * scaleFactor) + 'px';
  });
  const scaledPosition = `${x} ${y}`;
  
  return {
    width: iconsize,
    height: iconsize,
    borderRadius: '4px',
    backgroundColor: backgroundcolor,
    backgroundImage: 'url(/data/1.1/icons.webp)',
    backgroundPosition: scaledPosition,
    backgroundSize: `${scaledSpriteSize}px ${scaledSpriteSize}px`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
    cursor: 'pointer',
    transition: 'all 0.1s ease',
    '&:hover': {
      transform: 'scale(1.1)',
    },
  };
});

const GameIcon: React.FC<GameIconProps> = ({
  itemId,
  size = 32,
  className,
  onClick,
}) => {
  const iconPosition = dataService.getItemIconPosition(itemId);
  const iconColor = dataService.getItemIconColor(itemId);

  return (
    <IconContainer
      iconsize={size}
      iconposition={iconPosition}
      backgroundcolor={iconColor}
      className={className}
      onClick={onClick}
    />
  );
};

export default GameIcon;