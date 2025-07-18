import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {getIconData} from '../data/iconData';

interface SimpleIconProps {
  iconId: string;
  size?: number;
}

const SimpleIcon: React.FC<SimpleIconProps> = ({iconId, size = 32}) => {
  const iconData = getIconData(iconId);

  if (!iconData) {
    // 如果找不到图标，显示一个占位符
    return (
      <View style={[styles.placeholder, {width: size, height: size}]}>
        <Text style={styles.placeholderText}>?</Text>
      </View>
    );
  }

  return (
    <View style={[styles.icon, {width: size, height: size}]}>
      <View style={[styles.colorBlock, {backgroundColor: iconData.color}]} />
    </View>
  );
};

const styles = StyleSheet.create({
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    overflow: 'hidden',
  },
  colorBlock: {
    width: '80%',
    height: '80%',
    borderRadius: 4,
  },
  placeholder: {
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  placeholderText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SimpleIcon; 