// 重构后的 gameStore - 复合 store 架构
/// <reference types="../vite-env" />

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { GameState } from '@/store/types';

// 导入所有切片
import { createInventorySlice } from '@/store/slices/inventoryStore';
import { createCraftingSlice } from '@/store/slices/craftingStore';
import { createRecipeSlice } from '@/store/slices/recipeStore';
import { createFacilitySlice } from '@/store/slices/facilityStore';
import { createTechnologySlice } from '@/store/slices/technologyStore';
import { createGameMetaSlice } from '@/store/slices/gameMetaStore';
import { createGameLoopSlice } from '@/store/slices/gameLoopStore';
import { createUIStateSlice } from '@/store/slices/uiStateStore';

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
    ...createUIStateSlice(set, get, api),
  }))
);

// 注意：存档加载（loadGameData）由 DIServiceInitializer.initializeApplication() 在 DI 容器
// 初始化完成后统一触发，避免 GameStorageService 在 DataService 就绪前被调用的竞态条件。
// 注意：自动存档定时器逻辑已移至GameLoopService管理
// 通过GameLoopTaskFactory.createAutoSaveTask()实现

export default useGameStore;

// 导出类型
export type { GameState } from './types';
