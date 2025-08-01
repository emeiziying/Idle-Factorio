// 库存管理切片
import type { SliceCreator, InventorySlice } from '@/store/types';
import { ensureInventoryMap } from '@/store/utils/mapSetHelpers';
import { getStorageConfig } from '@/data/storageConfigs';
import { DataService } from '@/services/core/DataService';
import type { DeployedContainer } from '@/types/index';

export const createInventorySlice: SliceCreator<InventorySlice> = (set, get) => ({
  // 初始状态
  inventory: (() => {
    try {
      return new Map();
    } catch (error) {
      console.error('Failed to initialize inventory Map:', error);
      return new Map();
    }
  })(),
  deployedContainers: [],

  // 库存管理
  updateInventory: (itemId: string, amount: number) => {
    // 在更新库存前修复状态
    get()._repairInventoryState();

    set(state => {
      const safeInventory = ensureInventoryMap(state.inventory);
      const newInventory = new Map(safeInventory);
      const currentItem = newInventory.get(itemId) || get().getInventoryItem(itemId);

      const newAmount = Math.max(0, currentItem.currentAmount + amount);

      if (newAmount === 0) {
        // 如果数量为零，从库存中移除物品
        newInventory.delete(itemId);
      } else {
        const updatedItem = {
          ...currentItem,
          currentAmount: Math.min(newAmount, currentItem.maxCapacity),
        };
        newInventory.set(itemId, updatedItem);
      }

      return {
        inventory: newInventory,
        totalItemsProduced: state.totalItemsProduced + (amount > 0 ? amount : 0),
      };
    });
  },

  // 批量更新库存
  batchUpdateInventory: (updates: Array<{ itemId: string; amount: number }>) => {
    // 在更新库存前修复状态
    get()._repairInventoryState();

    set(state => {
      const safeInventory = ensureInventoryMap(state.inventory);
      const newInventory = new Map(safeInventory);
      let totalItemsAdded = 0;

      // 批量处理所有更新
      updates.forEach(({ itemId, amount }) => {
        const currentItem = newInventory.get(itemId) || get().getInventoryItem(itemId);
        const newAmount = Math.max(0, currentItem.currentAmount + amount);

        if (newAmount === 0) {
          // 如果数量为零，从库存中移除物品
          newInventory.delete(itemId);
        } else {
          const updatedItem = {
            ...currentItem,
            currentAmount: Math.min(newAmount, currentItem.maxCapacity),
          };
          newInventory.set(itemId, updatedItem);
        }

        if (amount > 0) {
          totalItemsAdded += amount;
        }
      });

      return {
        inventory: newInventory,
        totalItemsProduced: state.totalItemsProduced + totalItemsAdded,
      };
    });
  },

  // 修复inventory状态的内部函数
  _repairInventoryState: () => {
    const inventory = get().inventory;
    if (!(inventory instanceof Map)) {
      const safeInventory = ensureInventoryMap(inventory);
      set(() => ({ inventory: safeInventory }));
      console.log('Repaired inventory state');
    }
  },

  getInventoryItem: (itemId: string) => {
    const inventory = get().inventory;

    // 使用辅助函数确保inventory是Map
    const safeInventory = ensureInventoryMap(inventory);

    // 从安全的inventory中获取项目
    const existing = safeInventory.get(itemId);
    if (existing) {
      return existing;
    }

    // 新物品，计算默认容量
    const dataService = DataService.getInstance();
    const item = dataService.getItem(itemId);
    const stackSize = item?.stack || 100; // 默认堆叠大小

    // 获取已部署的容器
    const containers = get().deployedContainers.filter(c => c.targetItemId === itemId);
    const additionalStacks = containers.reduce((sum, c) => sum + c.additionalStacks, 0);

    const baseStacks = 1; // 默认1个堆叠
    const totalStacks = baseStacks + additionalStacks;

    return {
      itemId,
      currentAmount: 0,
      stackSize,
      baseStacks,
      additionalStacks,
      totalStacks,
      maxCapacity: totalStacks * stackSize,
      productionRate: 0,
      consumptionRate: 0,
      status: 'normal' as const,
    };
  },

  recalculateItemCapacity: (itemId: string) => {
    // 在重新计算容量前修复状态
    get()._repairInventoryState();

    set(state => {
      const safeInventory = ensureInventoryMap(state.inventory);
      const newInventory = new Map(safeInventory);
      const currentItem = newInventory.get(itemId);

      if (currentItem) {
        // 获取最新的容器信息
        const containers = state.deployedContainers.filter(c => c.targetItemId === itemId);
        const additionalStacks = containers.reduce((sum, c) => sum + c.additionalStacks, 0);
        const totalStacks = currentItem.baseStacks + additionalStacks;

        const updatedItem = {
          ...currentItem,
          additionalStacks,
          totalStacks,
          maxCapacity: totalStacks * currentItem.stackSize,
        };

        newInventory.set(itemId, updatedItem);
      }

      return { inventory: newInventory };
    });
  },

  // 存储容器相关方法
  deployChestForStorage: (chestType: string, targetItemId: string) => {
    const config = getStorageConfig(chestType);
    if (!config) {
      return {
        success: false,
        reason: 'invalid_chest_type',
        message: `无效的箱子类型: ${chestType}`,
      };
    }

    const chestItem = get().getInventoryItem(config.itemId);

    // 检查是否有现成的箱子
    if (chestItem.currentAmount <= 0) {
      return {
        success: false,
        reason: 'insufficient_chest',
        message: `没有可用的${config.name}，请先制造`,
      };
    }

    // 消耗1个箱子
    get().updateInventory(config.itemId, -1);

    // 创建部署记录
    const deployment: DeployedContainer = {
      id: `deployed_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      chestType,
      chestItemId: config.itemId,
      targetItemId,
      additionalStacks: config.additionalStacks || 0,
      deployedAt: Date.now(),
    };

    set(state => ({
      deployedContainers: [...state.deployedContainers, deployment],
    }));

    // 重新计算目标物品的容量
    get().recalculateItemCapacity(targetItemId);

    return {
      success: true,
      message: `为 ${targetItemId} 成功部署了${config.name}`,
    };
  },

  craftChest: (chestType: string, quantity: number = 1) => {
    const config = getStorageConfig(chestType);
    if (!config) {
      return {
        success: false,
        reason: 'invalid_chest_type',
        message: `无效的箱子类型: ${chestType}`,
      };
    }

    // 检查原材料是否足够
    const hasEnoughMaterials = Object.entries(config.recipe).every(([itemId, required]) => {
      const available = get().getInventoryItem(itemId).currentAmount;
      return available >= required * quantity;
    });

    if (!hasEnoughMaterials) {
      return {
        success: false,
        reason: 'insufficient_materials',
        message: '原材料不足',
      };
    }

    // 消耗原材料
    Object.entries(config.recipe).forEach(([itemId, required]) => {
      get().updateInventory(itemId, -required * quantity);
    });

    // 添加到制作队列
    for (let i = 0; i < quantity; i++) {
      get().addCraftingTask({
        recipeId: `craft_${config.itemId}`,
        itemId: config.itemId,
        quantity: 1,
        progress: 0,
        startTime: 0, // 任务开始时再设定
        craftingTime: config.craftingTime * 1000,
        status: 'pending',
      });
    }

    return {
      success: true,
      message: `开始制造${quantity}个${config.name}`,
    };
  },

  canCraftChest: (chestType: string, quantity: number = 1) => {
    const config = getStorageConfig(chestType);
    if (!config) return false;

    return Object.entries(config.recipe).every(([itemId, required]) => {
      const available = get().getInventoryItem(itemId).currentAmount;
      return available >= required * quantity;
    });
  },

  getDeployedContainersForItem: (itemId: string) => {
    return get().deployedContainers.filter(c => c.targetItemId === itemId);
  },

  removeDeployedContainer: (containerId: string) => {
    const container = get().deployedContainers.find(c => c.id === containerId);
    if (!container) return;

    // 移除容器
    set(state => ({
      deployedContainers: state.deployedContainers.filter(c => c.id !== containerId),
    }));

    // 重新计算目标物品的容量
    get().recalculateItemCapacity(container.targetItemId);
  },
});
