import React from 'react';
import { Box, Avatar } from '@mui/material';
import { 
  Science as ScienceIcon,
  Factory as FactoryIcon,
  Build as BuildIcon,
  LocalDrink as FluidIcon,
  Category as CategoryIcon,
  Terrain as TerrainIcon
} from '@mui/icons-material';
import { Item } from '../types';

interface GameIconProps {
  item: Item;
  size?: number;
}

const GameIcon: React.FC<GameIconProps> = ({ item, size = 32 }) => {
  // 根据物品类别返回不同的图标
  const getIcon = () => {
    switch (item.category) {
      case 'science-pack':
        return <ScienceIcon />;
      case 'production':
        return <FactoryIcon />;
      case 'intermediate-product':
        return <BuildIcon />;
      case 'fluid':
        return <FluidIcon />;
      case 'raw-resource':
        return <TerrainIcon />;
      default:
        return <CategoryIcon />;
    }
  };

  // 根据物品类别返回不同的背景色
  const getBackgroundColor = () => {
    switch (item.category) {
      case 'science-pack':
        return '#9c27b0';
      case 'production':
        return '#ff9800';
      case 'intermediate-product':
        return '#2196f3';
      case 'fluid':
        return '#00bcd4';
      case 'raw-resource':
        return '#4caf50';
      default:
        return '#757575';
    }
  };

  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        bgcolor: getBackgroundColor(),
        mx: 'auto',
        '& svg': {
          fontSize: size * 0.6,
        },
      }}
    >
      {getIcon()}
    </Avatar>
  );
};

export default GameIcon;