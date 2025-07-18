import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useRoute} from '@react-navigation/native';
import {useGame} from '../context/GameContext';
import {items, recipes, storageDevices} from '../data/gameData';
import {Item, Recipe} from '../types';

const ItemDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const {itemId} = route.params;
  const {state, addToCraftingQueue, addStorageDevice, getInventoryLimit} = useGame();

  const item: Item = items[itemId];
  const recipe: Recipe = recipes[itemId];
  const amount = state.resources[itemId] || 0;
  const inventoryLimit = getInventoryLimit(itemId);

  const [selectedQuantity, setSelectedQuantity] = useState(1);

  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>物品不存在</Text>
      </View>
    );
  }

  const handleCraft = (quantity: number) => {
    if (inventoryLimit.isFull) {
      Alert.alert('库存已满', '无法继续制作，请增加存储设备或消耗库存');
      return;
    }
    addToCraftingQueue(itemId, quantity);
  };

  const handleAddStorage = (deviceType: string) => {
    const success = addStorageDevice(itemId, deviceType);
    if (!success) {
      Alert.alert('库存不足', '没有足够的存储设备');
    }
  };

  const renderRecipeSection = () => {
    if (!recipe) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>配方信息</Text>
        <View style={styles.recipeContainer}>
          {/* 输入材料 */}
          <View style={styles.recipeInputs}>
            <Text style={styles.recipeLabel}>输入:</Text>
            {Object.entries(recipe.in).map(([materialId, count]) => {
              const material = items[materialId];
              const materialAmount = state.resources[materialId] || 0;
              return (
                <View key={materialId} style={styles.recipeItem}>
                  <Text style={styles.recipeItemName}>{material?.name || materialId}</Text>
                  <Text style={styles.recipeItemCount}>
                    {materialAmount}/{count}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* 输出产品 */}
          <View style={styles.recipeOutputs}>
            <Text style={styles.recipeLabel}>输出:</Text>
            {Object.entries(recipe.out).map(([productId, count]) => {
              const product = items[productId];
              return (
                <View key={productId} style={styles.recipeItem}>
                  <Text style={styles.recipeItemName}>{product?.name || productId}</Text>
                  <Text style={styles.recipeItemCount}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <Text style={styles.recipeTime}>制作时间: {recipe.time}秒</Text>
      </View>
    );
  };

  const renderCraftingSection = () => {
    if (!recipe) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>手工制作</Text>
        <View style={styles.craftingButtons}>
          <TouchableOpacity
            style={styles.craftButton}
            onPress={() => handleCraft(1)}>
            <Text style={styles.craftButtonText}>制作1个</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.craftButton}
            onPress={() => handleCraft(5)}>
            <Text style={styles.craftButtonText}>制作5个</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.craftButton}
            onPress={() => handleCraft(selectedQuantity)}>
            <Text style={styles.craftButtonText}>最多制造</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStorageSection = () => {
    const availableDevices = Object.values(storageDevices).filter(
      device => (state.resources[device.id] || 0) > 0,
    );

    if (availableDevices.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>存储管理</Text>
        <Text style={styles.storageInfo}>
          当前库存: {amount} / {inventoryLimit.maxCapacity}
        </Text>
        <View style={styles.storageButtons}>
          {availableDevices.map(device => (
            <TouchableOpacity
              key={device.id}
              style={styles.storageButton}
              onPress={() => handleAddStorage(device.id)}>
              <Text style={styles.storageButtonText}>
                添加 {device.name} (+{device.capacity})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* 物品基本信息 */}
      <View style={styles.header}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemCategory}>分类: {item.category}</Text>
        <Text style={styles.itemAmount}>库存: {amount}</Text>
      </View>

      {/* 配方信息 */}
      {renderRecipeSection()}

      {/* 手工制作 */}
      {renderCraftingSection()}

      {/* 存储管理 */}
      {renderStorageSection()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  itemCategory: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 4,
  },
  itemAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#059669',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  recipeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recipeInputs: {
    flex: 1,
  },
  recipeOutputs: {
    flex: 1,
  },
  recipeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  recipeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  recipeItemName: {
    fontSize: 14,
    color: '#374151',
  },
  recipeItemCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  recipeTime: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  craftingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  craftButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  craftButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  storageInfo: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
  },
  storageButtons: {
    gap: 8,
  },
  storageButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  storageButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 50,
  },
});

export default ItemDetailScreen; 