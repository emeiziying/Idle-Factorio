import { useMemo } from 'react';
import useGameStore from '@/store/gameStore';
import type { InventoryItem } from '@/types/index';
import { DataService } from '@/services';

// 辅助函数：确保inventory是Map
const ensureInventoryMap = (inventory: unknown): Map<string, InventoryItem> => {
  if (inventory instanceof Map) {
    return inventory;
  }
  console.warn('Inventory is not a Map, creating new Map');
  return new Map();
};

/**
 * 响应式获取库存物品信息的Hook
 * @param itemId 物品ID
 * @returns InventoryItem 库存物品信息
 */
export const useInventoryItem = (itemId: string): InventoryItem => {
  // 使用useMemo缓存默认的InventoryItem，避免无限循环
  const defaultInventoryItem = useMemo(() => {
    const dataService = DataService.getInstance();
    const itemData = dataService.getItem(itemId);
    const stackSize = itemData?.stack || 100; // 默认堆叠大小

    return {
      itemId,
      currentAmount: 0,
      stackSize,
      baseStacks: 1,
      additionalStacks: 0,
      totalStacks: 1,
      maxCapacity: stackSize,
      productionRate: 0,
      consumptionRate: 0,
      status: 'normal' as const,
    };
  }, [itemId]);

  // 分别订阅inventory和deployedContainers，避免在selector中创建新对象
  const inventory = useGameStore((state) => state.inventory);
  const deployedContainers = useGameStore((state) => state.deployedContainers);

  // 使用useMemo计算最终的inventoryItem，避免每次渲染都创建新对象
  return useMemo(() => {
    const safeInventory = ensureInventoryMap(inventory);
    const existing = safeInventory.get(itemId);

    if (existing) {
      return existing;
    }

    // 新物品，计算默认容量（考虑已部署的容器）
    const containers = deployedContainers.filter((c) => c.targetItemId === itemId);
    const additionalStacks = containers.reduce((sum, c) => sum + c.additionalStacks, 0);
    const totalStacks = defaultInventoryItem.baseStacks + additionalStacks;

    return {
      ...defaultInventoryItem,
      additionalStacks,
      totalStacks,
      maxCapacity: totalStacks * defaultInventoryItem.stackSize,
    };
  }, [itemId, inventory, deployedContainers, defaultInventoryItem]);
};

export default useInventoryItem;
