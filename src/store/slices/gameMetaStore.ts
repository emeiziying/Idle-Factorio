// 游戏元数据切片
import type { SliceCreator, GameMetaSlice } from '@/store/types';
import { getStoreGameStorage } from '@/store/storeRuntimeServices';
import { warn, error as logError } from '@/utils/logger';

export const createGameMetaSlice: SliceCreator<GameMetaSlice> = (set, get) => ({
  // 初始状态
  lastSaveTime: Date.now(),
  totalItemsProduced: 0,
  saveKey: 'initial', // 存档触发键

  // 存档管理
  clearGameData: async () => {
    // 清除游戏存档
    await getStoreGameStorage().clearGameData();

    // 重置状态
    set(() => ({
      inventory: new Map(),
      craftingQueue: [],
      craftingChains: [],
      facilities: [],
      deployedContainers: [],
      lastSaveTime: Date.now(),
      totalItemsProduced: 0,
      favoriteRecipes: new Set(),
      recentRecipes: [],
      // 重置科技系统状态
      technologies: new Map(),
      researchState: null,
      researchQueue: [],
      unlockedTechs: new Set(),
      autoResearch: true,
      techCategories: [],
      // 重置统计数据
      craftedItemCounts: new Map(),
      builtEntityCounts: new Map(),
      minedEntityCounts: new Map(),
    }));

    // 立即重载页面以确保完全重置
    window.location.reload();
  },

  saveGame: () => {
    // 使用GameStorageService保存游戏数据
    const state = get();
    getStoreGameStorage()
      .saveGame(state)
      .catch(error => {
        logError('[SaveGame] 保存失败:', error);
      });
  },

  // 加载存档方法
  loadGameData: async () => {
    try {
      const loadedState = await getStoreGameStorage().loadGame();
      if (loadedState) {
        set(() => loadedState);
      }
    } catch (error) {
      logError('[Load] 存档加载失败:', error);
    }
  },

  // 新增：强制存档方法，绕过防抖
  forceSaveGame: async () => {
    const state = get();
    try {
      await getStoreGameStorage().forceSaveGame(state);
    } catch (error) {
      warn('[ForceSave] 强制存档失败:', error);
      throw error;
    }
  },
});
