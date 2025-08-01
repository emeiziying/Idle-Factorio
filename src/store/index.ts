// 重构后的 gameStore - 复合 store 架构
/// <reference types="../vite-env" />

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { GameState } from './types';

// 导入所有切片
import { createInventorySlice } from './slices/inventoryStore';
import { createCraftingSlice } from './slices/craftingStore';
import { createRecipeSlice } from './slices/recipeStore';
import { createFacilitySlice } from './slices/facilityStore';
import { createTechnologySlice } from './slices/technologyStore';
import { createGameMetaSlice } from './slices/gameMetaStore';

// 页面卸载时立即保存
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    // 页面卸载时会自动触发persist保存
  });
}

// 创建复合 store
const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get, api) => ({
    // 合并所有切片
    ...createInventorySlice(set, get, api),
    ...createCraftingSlice(set, get, api),
    ...createRecipeSlice(set, get, api),
    ...createFacilitySlice(set, get, api),
    ...createTechnologySlice(set, get, api),
    ...createGameMetaSlice(set, get, api),
  }))
);

// 初始化加载存档
const initializeStore = async () => {
  try {
    await useGameStore.getState().loadGameData();
  } catch (error) {
    console.error('[Init] 存档初始化失败:', error);
  }
};

// 立即执行初始化
initializeStore();

// 全局变量存储定时器ID，防止热更新时创建多个定时器
let autoSaveIntervalId: ReturnType<typeof setInterval> | null = null;
let lastAutoSaveTime = Date.now();

// 清理自动存档定时器
const clearAutoSaveInterval = () => {
  if (autoSaveIntervalId) {
    clearInterval(autoSaveIntervalId);
    autoSaveIntervalId = null;
    console.log('[AutoSave] 清理自动存档定时器');
  }
};

// 创建自动存档定时器
const createAutoSaveInterval = () => {
  // 先清理旧的定时器，防止热更新时重复创建
  clearAutoSaveInterval();
  
  // 创建新的定时器
  autoSaveIntervalId = setInterval(async () => {
    const state = useGameStore.getState();
    const now = Date.now();
    
    // 只有当游戏时间有变化时才存档（说明游戏在运行）
    if (now - lastAutoSaveTime > 10000) {
      console.log('[AutoSave] 定期强制存档触发');
      try {
        await state.forceSaveGame(); // 使用强制存档确保可靠性
        lastAutoSaveTime = now;
      } catch (error) {
        console.error('[AutoSave] 自动存档失败:', error);
        // 强制存档失败，但会在下次定时器触发时重试
      }
    }
  }, 10000);
  
  console.log('[AutoSave] 创建自动存档定时器');
};

// 初始化自动存档定时器
createAutoSaveInterval();

// 在开发环境中，监听热更新事件（如果可用）
if (typeof import.meta !== 'undefined' && import.meta.env?.DEV && import.meta.hot) {
  import.meta.hot.dispose(() => {
    console.log('[AutoSave] 热更新时清理定时器');
    clearAutoSaveInterval();
  });
}

export default useGameStore;

// 导出类型
export type { GameState } from './types';