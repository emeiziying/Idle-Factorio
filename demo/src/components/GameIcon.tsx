import React from 'react';
import {View, Image, StyleSheet, ViewStyle} from 'react-native';
import {getIconData, parsePosition, ICON_SIZE} from '../data/iconData';

interface GameIconProps {
  iconId: string;
  size?: number;
  style?: ViewStyle;
}

const GameIcon: React.FC<GameIconProps> = ({iconId, size = 32, style}) => {
  const iconData = getIconData(iconId);

  if (!iconData) {
    // 如果找不到图标，显示一个占位符
    return (
      <View style={[styles.placeholder, {width: size, height: size}, style]}>
        <View style={styles.placeholderInner} />
      </View>
    );
  }

  const position = parsePosition(iconData.position);

  return (
    <View style={[styles.icon, {width: size, height: size}, style]}>
      <Image
        source={require('../../assets/icons.webp')}
        style={[
          styles.sprite,
          {
            width: ICON_SIZE,
            height: ICON_SIZE,
            transform: [
              {translateX: -position.x},
              {translateY: -position.y},
            ],
          },
        ]}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  icon: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sprite: {
    // 精灵图样式
  },
  placeholder: {
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderInner: {
    width: '60%',
    height: '60%',
    backgroundColor: '#999',
    borderRadius: 4,
  },
});

export default GameIcon; 