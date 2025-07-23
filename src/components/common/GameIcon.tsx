import React from 'react';
import { Box, Avatar } from '@mui/material';
import { Image as ImageIcon } from '@mui/icons-material';

interface GameIconProps {
  itemId: string;
  size?: number;
  alt?: string;
}

const GameIcon: React.FC<GameIconProps> = ({ 
  itemId, 
  size = 24, 
  alt 
}) => {
  // 临时使用占位符，之后会实现精灵图提取
  const iconUrl = `/data/1.1/icons/${itemId}.png`;
  
  const [imageError, setImageError] = React.useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  if (imageError) {
    // 图标加载失败时显示占位符
    return (
      <Avatar
        sx={{
          width: size,
          height: size,
          bgcolor: 'grey.700',
          fontSize: size * 0.5
        }}
      >
        <ImageIcon sx={{ fontSize: size * 0.6 }} />
      </Avatar>
    );
  }

  return (
    <Box
      component="img"
      src={iconUrl}
      alt={alt || itemId}
      sx={{
        width: size,
        height: size,
        objectFit: 'contain',
        borderRadius: 1,
        bgcolor: 'background.paper'
      }}
      onError={handleImageError}
    />
  );
};

export default GameIcon;