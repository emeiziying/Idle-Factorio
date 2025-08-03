// UI状态管理切片
import type { SliceCreator } from '@/store/types';
import type { Item } from '@/types/index';
import { PRODUCTION_STORAGE_KEYS } from '@/constants/storageKeys';
import { getService } from '@/services/core/DIServiceInitializer';
import { SERVICE_TOKENS } from '@/services/core/ServiceTokens';
import type { DataService } from '@/services/core/DataService';

// UI状态切片接口
export interface UIStateSlice {
  // 生产模块UI状态
  production: {
    selectedCategory: string;
    selectedItem: Item | null;
    isItemJump: boolean; // 是否是物品跳转引起的分类切换
    showCraftingQueue: boolean; // 是否显示制作队列弹窗
  };

  // 基础UI状态操作
  setProductionSelectedCategory: (category: string) => void;
  setProductionSelectedItem: (item: Item | null) => void;
  setProductionSelection: (category: string, item: Item | null) => void;

  // 智能操作方法
  selectProductionCategory: (categoryId: string) => void;
  selectProductionItem: (item: Item) => void;
  resetItemJump: () => void;

  // 制作队列弹窗控制
  toggleCraftingQueue: () => void;
  setCraftingQueueVisible: (visible: boolean) => void;

  // 智能自动选择逻辑
  autoSelectFirstItemIfNeeded: (firstItem: Item | null) => void;

  // computed-like getters
  getFirstItemInCategory: () => Item | null;

  // 清空UI状态
  clearUIState: () => void;
}

// 从localStorage加载初始状态
const loadInitialState = () => {
  if (typeof window === 'undefined') {
    return { selectedCategory: '', selectedItem: null, isItemJump: false, showCraftingQueue: false };
  }

  try {
    const savedCategory = localStorage.getItem(PRODUCTION_STORAGE_KEYS.SELECTED_CATEGORY) || '';
    const savedItemStr = localStorage.getItem(PRODUCTION_STORAGE_KEYS.SELECTED_ITEM);
    const savedItem = savedItemStr ? JSON.parse(savedItemStr) : null;

    return {
      selectedCategory: savedCategory,
      selectedItem: savedItem,
      isItemJump: false, // 初始化时不是跳转状态
      showCraftingQueue: false, // 初始化时不显示队列
    };
  } catch (error) {
    console.warn('Failed to load UI state from localStorage:', error);
    return { selectedCategory: '', selectedItem: null, isItemJump: false, showCraftingQueue: false };
  }
};

export const createUIStateSlice: SliceCreator<UIStateSlice> = (set, get) => ({
  // 初始状态（从localStorage加载）
  production: loadInitialState(),

  // 设置生产模块选中的分类
  setProductionSelectedCategory: (category: string) => {
    set((state) => ({
      production: {
        ...state.production,
        selectedCategory: category,
      },
    }));
    // 同步到localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(PRODUCTION_STORAGE_KEYS.SELECTED_CATEGORY, category);
    }
  },

  // 设置生产模块选中的物品
  setProductionSelectedItem: (item: Item | null) => {
    set((state) => ({
      production: {
        ...state.production,
        selectedItem: item,
      },
    }));
    // 同步到localStorage
    if (typeof window !== 'undefined') {
      try {
        if (item) {
          localStorage.setItem(PRODUCTION_STORAGE_KEYS.SELECTED_ITEM, JSON.stringify(item));
        } else {
          localStorage.removeItem(PRODUCTION_STORAGE_KEYS.SELECTED_ITEM);
        }
      } catch (error) {
        console.warn('Failed to save selected item to localStorage:', error);
      }
    }
  },

  // 同时设置分类和物品（用于跨模块跳转）
  setProductionSelection: (category: string, item: Item | null) => {
    set((state) => ({
      production: {
        ...state.production,
        selectedCategory: category,
        selectedItem: item,
      },
    }));
    // 同步到localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(PRODUCTION_STORAGE_KEYS.SELECTED_CATEGORY, category);
        if (item) {
          localStorage.setItem(PRODUCTION_STORAGE_KEYS.SELECTED_ITEM, JSON.stringify(item));
        } else {
          localStorage.removeItem(PRODUCTION_STORAGE_KEYS.SELECTED_ITEM);
        }
      } catch (error) {
        console.warn('Failed to save production selection to localStorage:', error);
      }
    }
  },

  // 智能操作方法
  selectProductionCategory: (categoryId: string) => {
    set((state) => ({
      production: {
        ...state.production,
        selectedCategory: categoryId,
        selectedItem: null, // 切换分类时清空物品
        isItemJump: false, // 标记为手动切换
      },
    }));
    // 同步到localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(PRODUCTION_STORAGE_KEYS.SELECTED_CATEGORY, categoryId);
      localStorage.removeItem(PRODUCTION_STORAGE_KEYS.SELECTED_ITEM);
    }
  },

  selectProductionItem: (item: Item) => {
    const currentState = get();
    const currentCategory = currentState.production.selectedCategory;
    const willSwitchCategory = Boolean(item.category && item.category !== currentCategory);

    set((state) => ({
      production: {
        ...state.production,
        selectedItem: item,
        selectedCategory: item.category || state.production.selectedCategory,
        isItemJump: willSwitchCategory, // 标记是否是跨分类跳转
      },
    }));
    // 同步到localStorage
    if (typeof window !== 'undefined') {
      try {
        if (item.category && willSwitchCategory) {
          localStorage.setItem(PRODUCTION_STORAGE_KEYS.SELECTED_CATEGORY, item.category);
        }
        localStorage.setItem(PRODUCTION_STORAGE_KEYS.SELECTED_ITEM, JSON.stringify(item));
      } catch (error) {
        console.warn('Failed to save item selection to localStorage:', error);
      }
    }
  },

  resetItemJump: () => {
    set((state) => ({
      production: {
        ...state.production,
        isItemJump: false,
      },
    }));
  },

  // 制作队列弹窗控制
  toggleCraftingQueue: () => {
    set((state) => ({
      production: {
        ...state.production,
        showCraftingQueue: !state.production.showCraftingQueue,
      },
    }));
  },

  setCraftingQueueVisible: (visible: boolean) => {
    set((state) => ({
      production: {
        ...state.production,
        showCraftingQueue: visible,
      },
    }));
  },

  // 智能自动选择第一个物品（仅在合适的时候）
  autoSelectFirstItemIfNeeded: (firstItem: Item | null) => {
    const state = get();
    const { selectedItem, isItemJump } = state.production;
    
    // 只有在不是物品跳转且有第一个物品时才自动选择
    if (!firstItem || isItemJump) {
      return;
    }
    
    // 如果当前选中的物品已经在正确的分类中，保持不变
    if (selectedItem && selectedItem.category === firstItem.category) {
      return;
    }
    
    // 自动选择第一个物品
    set((state) => ({
      production: {
        ...state.production,
        selectedItem: firstItem,
      },
    }));
    
    // 同步到localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(PRODUCTION_STORAGE_KEYS.SELECTED_ITEM, JSON.stringify(firstItem));
      } catch (error) {
        console.warn('Failed to save auto-selected item to localStorage:', error);
      }
    }
  },

  // computed-like getter: 获取当前分类的第一个物品
  getFirstItemInCategory: () => {
    const state = get();
    const { selectedCategory } = state.production;
    
    if (!selectedCategory) {
      return null;
    }

    // 数据已在全局初始化时加载完成
    const dataService = getService<DataService>(SERVICE_TOKENS.DATA_SERVICE);
    const itemsByRow = dataService.getItemsByRow(selectedCategory);
      const sortedRows = Array.from(itemsByRow.keys()).sort((a, b) => a - b);

      for (const row of sortedRows) {
        const items = itemsByRow.get(row) || [];
        if (items.length > 0) {
          return items[0];
        }
      }
      return null;
  },

  // 清空UI状态
  clearUIState: () => {
    set({
      production: {
        selectedCategory: '',
        selectedItem: null,
        isItemJump: false,
        showCraftingQueue: false,
      },
    });
    // 清空localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PRODUCTION_STORAGE_KEYS.SELECTED_CATEGORY);
      localStorage.removeItem(PRODUCTION_STORAGE_KEYS.SELECTED_ITEM);
    }
  },
});