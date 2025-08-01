// 游戏元数据切片
import type { SliceCreator, GameMetaSlice } from '../types';
import { gameStorageService } from '../../services/GameStorageService';

export const createGameMetaSlice: SliceCreator<GameMetaSlice> = (set, get) => ({
  // 初始状态
  lastSaveTime: Date.now(),
  totalItemsProduced: 0,
  saveKey: 'initial', // 存档触发键

  // 存档管理
  clearGameData: async () => {
    // 清除游戏存档
    await gameStorageService.clearGameData();
    
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
    gameStorageService.saveGame(state).catch(error => {
      console.error('[SaveGame] 保存失败:', error);
    });
  },

  // 加载存档方法
  loadGameData: async () => {
    try {
      const loadedState = await gameStorageService.loadGame();
      if (loadedState) {
        set(() => loadedState);
        console.log('[Load] 存档加载完成');
      }
    } catch (error) {
      console.error('[Load] 存档加载失败:', error);
    }
  },

  // 新增：强制存档方法，绕过防抖
  forceSaveGame: async () => {
    const state = get();
    try {
      await gameStorageService.forceSaveGame(state);
      console.log('[ForceSave] 强制存档完成');
    } catch (error) {
      console.error('[ForceSave] 强制存档失败:', error);
      throw error;
    }
  }
});