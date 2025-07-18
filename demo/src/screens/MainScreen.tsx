import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useGame} from '../context/GameContext';
import {categories, items} from '../data/gameData';
import ItemCard from '../components/ItemCard';
import CategoryTab from '../components/CategoryTab';
import CraftingQueueBubble from '../components/CraftingQueueBubble';

const MainScreen: React.FC = () => {
  const navigation = useNavigation();
  const {state, dispatch} = useGame();

  const handleCategoryChange = (categoryId: string) => {
    dispatch({type: 'SET_SELECTED_CATEGORY', category: categoryId});
  };

  const handleItemPress = (itemId: string) => {
    const item = items[itemId];
    if (item) {
      navigation.navigate('ItemDetail', {
        itemId,
        itemName: item.name,
      });
    }
  };

  const filteredItems = Object.keys(items).filter(itemId => {
    const item = items[itemId];
    return item.category === state.selectedCategory;
  });

  const renderItem = ({item: itemId}: {item: string}) => {
    const item = items[itemId];
    const amount = state.resources[itemId] || 0;
    
    return (
      <ItemCard
        item={item}
        amount={amount}
        onPress={() => handleItemPress(itemId)}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* 分类标签栏 */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map(category => (
            <CategoryTab
              key={category.id}
              category={category}
              isSelected={state.selectedCategory === category.id}
              onPress={() => handleCategoryChange(category.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* 物品网格 */}
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={item => item}
        numColumns={4}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* 制作队列浮动气泡 */}
      <CraftingQueueBubble />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  categoryContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  gridContainer: {
    padding: 12,
  },
});

export default MainScreen; 