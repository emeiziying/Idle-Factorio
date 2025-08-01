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
import { createGameLoopSlice } from './slices/gameLoopStore';

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
    ...createGameLoopSlice(set, get, api),
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

// 注意：原来的自动存档定时器逻辑已移至GameLoopService管理
// 通过GameLoopTaskFactory.createAutoSaveTask()实现

export default useGameStore;

// 导出类型
export type { GameState } from './types';