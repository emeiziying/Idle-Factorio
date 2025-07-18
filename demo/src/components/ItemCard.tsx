import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Item} from '../types';

interface ItemCardProps {
  item: Item;
  amount: number;
  onPress: () => void;
}

const ItemCard: React.FC<ItemCardProps> = ({item, amount, onPress}) => {
  const getStatusBadge = () => {
    if (amount === 0) return {text: '缺料', color: '#EF4444'};
    if (amount > 50) return {text: '充足', color: '#10B981'};
    return {text: '正常', color: '#F59E0B'};
  };

  const status = getStatusBadge();

  // TODO: 使用真实图标替换emoji
  // 需要修复TypeScript配置后，可以使用GameIcon组件
  // import GameIcon from './GameIcon';
  // <GameIcon iconId={item.id} size={32} />

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>📦</Text>
        <View style={[styles.statusBadge, {backgroundColor: status.color}]}>
          <Text style={styles.statusText}>{status.text}</Text>
        </View>
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.amount}>{amount}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    margin: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    flex: 1,
    minHeight: 100,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  icon: {
    fontSize: 32,
  },
  statusBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 4,
  },
  amount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
  },
});

export default ItemCard; 