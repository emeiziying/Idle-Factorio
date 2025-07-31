import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { DataService } from '@/services';
import type { IconData } from '@/types/index';

// 导入图标精灵图
import iconSprite from '@/data/spa/icons.webp';

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
  displayText?: string; // 自定义显示文本（优先级最高）
}

const ICON_UNIT = 66; // 单个图标标准尺寸
const SPRITE_URL = iconSprite; // 使用导入的图标路径

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
  selectedBgColor = '#e39827',
  displayText
}) => {
  const [iconData, setIconData] = useState<IconData | null>(null);
  const [spriteSize, setSpriteSize] = useState<{ width: number; height: number } | null>(null);
  const [effectiveIconId, setEffectiveIconId] = useState<string | undefined>(itemId);
  const [dataLoaded, setDataLoaded] = useState(false);

  // 状态：从服务层获取的iconText
  const [recipeIconText, setRecipeIconText] = useState<string | undefined>(undefined);

  // 监听数据加载状态
  useEffect(() => {
    const dataService = DataService.getInstance();
    const checkData = () => {
      const loaded = dataService.isDataLoaded();
      setDataLoaded(loaded);
      return loaded;
    };
    
    // 立即检查
    if (checkData()) {
      return;
    }
    
    // 如果数据未加载，定期检查
    const interval = setInterval(() => {
      if (checkData()) {
        clearInterval(interval);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

  // 获取图标信息
  useEffect(() => {
    if (!itemId || !dataLoaded) return;
    
    const dataService = DataService.getInstance();
    const iconInfo = dataService.getIconInfo(itemId);
    
    setEffectiveIconId(iconInfo.iconId);
    setRecipeIconText(iconInfo.iconText);
  }, [itemId, dataLoaded]);

  // 加载iconData - 只在没有customImage时加载
  useEffect(() => {
    if (customImage || !effectiveIconId || !dataLoaded) return;
    const dataService = DataService.getInstance();
    setIconData(dataService.getIconData(effectiveIconId));
  }, [effectiveIconId, customImage, dataLoaded]);

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
    fontSize: `${Math.max(10, Math.floor(size * 0.4))}px`, // 根据图标大小计算字体大小
    fontWeight: 'bold',
    textShadow: '0px 1px 1px #000, 0px -1px 1px #000, 1px 0px 1px #000, -1px 0px 1px #000',
    lineHeight: 1,
    pointerEvents: 'none' as const
  };

  // 格式化数量显示
  const formatQuantity = (qty: number) => {
    return qty > 999 ? `${Math.floor(qty / 1000)}k` : qty;
  };

  // 获取要显示的文本：优先级 displayText > recipeIconText > quantity
  const getDisplayText = () => {
    if (displayText !== undefined) return displayText;
    if (recipeIconText !== undefined) return recipeIconText;
    if (quantity !== undefined) return formatQuantity(quantity);
    return undefined;
  };

  const textToDisplay = getDisplayText();

  // 如果数据未加载完成，显示占位符
  const isLoading = !customImage && (!iconData || !spriteSize) && itemId;
  
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
          } : iconData?.position && spriteSize ? {
            backgroundImage: `url(${SPRITE_URL})`,
            backgroundRepeat: 'no-repeat',
            ...getSpritePosition(iconData.position)
          } : isLoading ? {
            // 加载中状态 - 显示透明背景避免闪烁
            backgroundColor: 'transparent',
          } : {
            bgcolor: 'grey.300',
          })
        }}
      />
      {textToDisplay !== undefined && !isLoading && (
        <Box sx={quantityStyles}>
          {textToDisplay}
        </Box>
      )}
    </Box>
  );
};

export default FactorioIcon;

