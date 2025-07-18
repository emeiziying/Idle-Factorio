import React from 'react';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';
import {Category} from '../types';

interface CategoryTabProps {
  category: Category;
  isSelected: boolean;
  onPress: () => void;
}

const CategoryTab: React.FC<CategoryTabProps> = ({category, isSelected, onPress}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isSelected ? category.color : '#F1F5F9',
          borderColor: isSelected ? category.color : '#E2E8F0',
        },
      ]}
      onPress={onPress}>
      <Text style={styles.icon}>{category.icon}</Text>
      <Text
        style={[
          styles.name,
          {color: isSelected ? '#FFFFFF' : '#64748B'},
        ]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 80,
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CategoryTab; 