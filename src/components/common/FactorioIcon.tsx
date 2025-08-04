import { useDataService } from '@/hooks/useDIServices';
import { Box } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';

// 导入图标精灵图
import iconSprite from '@/data/spa/icons.webp';

interface FactorioIconProps {
  itemId?: string;
  size?: number;
  className?: string;
  alt?: string;
  quantity?: number;
  showBorder?: boolean;
  customImage?: string;
  shortage?: boolean;
  selected?: boolean;
  selectedBgColor?: string;
  displayText?: string;
}

const ICON_UNIT = 66;
const SPRITE_URL = iconSprite;

// 精灵图尺寸缓存 - 全局单例
let globalSpriteSize: { width: number; height: number } | null = null;
let spriteSizePromise: Promise<{ width: number; height: number }> | null = null;

const loadSpriteSize = (): Promise<{ width: number; height: number }> => {
  if (globalSpriteSize) {
    return Promise.resolve(globalSpriteSize);
  }

  if (!spriteSizePromise) {
    spriteSizePromise = new Promise(resolve => {
      const img = new Image();
      img.src = SPRITE_URL;
      img.onload = () => {
        globalSpriteSize = { width: img.naturalWidth, height: img.naturalHeight };
        resolve(globalSpriteSize);
      };
    });
  }

  return spriteSizePromise;
};

const FactorioIcon: React.FC<FactorioIconProps> = React.memo(
  ({
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
    displayText,
  }) => {
    const dataService = useDataService();

    // 本地状态来跟踪精灵图尺寸，强制重新渲染
    const [localSpriteSize, setLocalSpriteSize] = useState(globalSpriteSize);

    // 获取图标数据 - 一次性获取所有需要的数据
    const iconInfo = useMemo(() => {
      if (customImage || !itemId) {
        return { iconData: null, iconText: undefined, isLoading: false };
      }

      const info = dataService.getIconInfo(itemId);
      const iconData = info.iconId ? dataService.getIconData(info.iconId) : null;

      return {
        iconData,
        iconText: info.iconText,
        isLoading: !iconData && !!itemId,
      };
    }, [itemId, customImage, dataService]);

    // 格式化显示文本
    const textToDisplay = useMemo(() => {
      if (displayText !== undefined) return displayText;
      if (iconInfo.iconText !== undefined) return iconInfo.iconText;
      if (quantity !== undefined) {
        return quantity > 999 ? `${Math.floor(quantity / 1000)}k` : quantity;
      }
      return undefined;
    }, [displayText, iconInfo.iconText, quantity]);

    // 尺寸计算 - size是容器总尺寸
    const containerSize = size;
    const borderWidth = showBorder ? Math.max(1, Math.floor((size * 4) / 32)) : 0; // 按比例计算边框宽度
    const iconSize = showBorder ? size - borderWidth * 2 : size; // 图标实际大小

    const backgroundColor = shortage
      ? 'error.main'
      : selected
        ? selectedBgColor
        : customImage || iconInfo.iconData
          ? '#313131'
          : '#999';

    const containerStyles = useMemo(
      () => ({
        width: containerSize,
        height: containerSize,
        display: 'inline-block',
        flexShrink: 0,
        position: 'relative',
        ...(showBorder && {
          padding: `${borderWidth}px`,
          backgroundColor,
          borderTop: '1px solid #454545',
          borderLeft: '1px solid #212121',
          borderRight: '1px solid #212121',
          borderBottom: '1px solid #191919',
        }),
      }),
      [containerSize, showBorder, backgroundColor, borderWidth]
    );

    // 内容样式 - 使用实际图标大小
    const contentStyles = useMemo(() => {
      if (customImage) {
        return {
          width: iconSize,
          height: iconSize,
          backgroundImage: `url(${customImage})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'contain',
        };
      }

      if (iconInfo.iconData?.position && localSpriteSize) {
        // 解析精灵图位置
        const [xStr, yStr] = iconInfo.iconData.position.split(' ');
        const x = parseInt(xStr, 10);
        const y = parseInt(yStr, 10);

        return {
          width: iconSize,
          height: iconSize,
          backgroundImage: `url(${SPRITE_URL})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: `${(x * iconSize) / ICON_UNIT}px ${(y * iconSize) / ICON_UNIT}px`,
          backgroundSize: `${(localSpriteSize.width * iconSize) / ICON_UNIT}px ${(localSpriteSize.height * iconSize) / ICON_UNIT}px`,
        };
      }

      return {
        width: iconSize,
        height: iconSize,
        backgroundColor: iconInfo.isLoading ? 'transparent' : 'grey.300',
      };
    }, [customImage, iconInfo.iconData?.position, iconInfo.isLoading, iconSize, localSpriteSize]);

    // 文本样式 - 基于图标实际大小计算字体
    const textStyles = useMemo(
      () => ({
        position: 'absolute' as const,
        bottom: '0px',
        right: showBorder ? `${borderWidth}px` : '0px',
        color: '#fff',
        fontSize: `${Math.max(8, Math.floor(iconSize * 0.4))}px`,
        fontWeight: 'bold',
        textShadow: '0px 1px 1px #000, 0px -1px 1px #000, 1px 0px 1px #000, -1px 0px 1px #000',
        lineHeight: 1,
        pointerEvents: 'none' as const,
      }),
      [showBorder, iconSize, borderWidth]
    );

    // 初始化精灵图尺寸
    useEffect(() => {
      if (!customImage && !localSpriteSize) {
        loadSpriteSize().then(size => {
          setLocalSpriteSize(size);
        });
      }
    }, [customImage, localSpriteSize]);

    return (
      <Box className={className} sx={containerStyles} title={alt || itemId}>
        <Box sx={contentStyles} />
        {textToDisplay !== undefined && !iconInfo.isLoading && (
          <Box sx={textStyles}>{textToDisplay}</Box>
        )}
      </Box>
    );
  },
  (prevProps, nextProps) => {
    // 只比较影响渲染的关键属性
    return (
      prevProps.itemId === nextProps.itemId &&
      prevProps.size === nextProps.size &&
      prevProps.quantity === nextProps.quantity &&
      prevProps.showBorder === nextProps.showBorder &&
      prevProps.customImage === nextProps.customImage &&
      prevProps.shortage === nextProps.shortage &&
      prevProps.selected === nextProps.selected &&
      prevProps.selectedBgColor === nextProps.selectedBgColor &&
      prevProps.displayText === nextProps.displayText
    );
  }
);

FactorioIcon.displayName = 'FactorioIcon';

export default FactorioIcon;
