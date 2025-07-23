import React from 'react';
import { Box, Avatar } from '@mui/material';
import { Image as ImageIcon } from '@mui/icons-material';
import DataService from '../../services/DataService';

interface FactorioIconProps {
  itemId: string;
  size?: number;
  alt?: string;
  className?: string;
}

interface IconData {
  id: string;
  position: string;
  color: string;
}

const FactorioIcon: React.FC<FactorioIconProps> = ({ 
  itemId, 
  size = 32, 
  alt,
  className
}) => {
  const [iconData, setIconData] = React.useState<IconData | null>(null);
  const [imageError, setImageError] = React.useState(false);

  // 从精灵图中提取图标位置
  React.useEffect(() => {
    const loadIconData = () => {
      try {
        const dataService = DataService.getInstance();
        const icon = dataService.getIconData(itemId);
        if (icon) {
          console.log(`Loaded icon data for ${itemId}:`, icon);
          setIconData(icon);
        } else {
          console.warn(`Icon not found for ${itemId}`);
        }
      } catch (error) {
        console.warn(`Failed to load icon data for ${itemId}:`, error);
      }
    };

    loadIconData();
  }, [itemId]);

  const handleImageError = () => {
    console.warn(`Image error for ${itemId}`);
    setImageError(true);
  };

  // 计算精灵图中的位置和缩放
  const getSpritePosition = (position: string, targetSize: number) => {
    const [x, y] = position.split(' ').map(p => parseInt(p.replace('px', '')));
    const originalSize = 66; // Factorio原始图标尺寸
    const spriteSize = 1252; // 精灵图总尺寸
    const scale = targetSize / originalSize;
    

    
    return {
      backgroundPosition: `${x * scale}px ${y * scale}px`,
      backgroundSize: `${spriteSize * scale}px ${spriteSize * scale}px`
    };
  };

  if (imageError || !iconData) {
    // 图标加载失败时显示占位符
    return (
      <Avatar
        className={className}
        sx={{
          width: size,
          height: size,
          bgcolor: 'grey.700',
          fontSize: size * 0.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <ImageIcon sx={{ fontSize: size * 0.6 }} />
      </Avatar>
    );
  }

  return (
    <Box
      className={className}
      sx={{
        width: size,
        height: size,
        backgroundImage: 'url(/data/1.1/icons.webp)',
        ...getSpritePosition(iconData.position, size),
        backgroundRepeat: 'no-repeat',
        borderRadius: 1,
        bgcolor: 'background.paper',
        display: 'inline-block',
        flexShrink: 0
      }}
      onError={handleImageError}
      title={alt || itemId}
    />
  );
};

export default FactorioIcon;