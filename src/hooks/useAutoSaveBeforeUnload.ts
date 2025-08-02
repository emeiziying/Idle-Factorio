import { useEventListener } from 'ahooks';
import useGameStore from '@/store/gameStore';

/**
 * 页面卸载前自动保存 Hook
 * 监听页面卸载事件，在用户关闭或刷新页面时自动保存游戏进度
 */
export const useAutoSaveBeforeUnload = (): void => {
  /**
   * 处理页面卸载前的保存操作
   * 在用户关闭页面、刷新页面或导航到其他页面时触发
   */
  const handleBeforeUnload = async () => {
    const { forceSaveGame } = useGameStore.getState();
    try {
      // 强制保存游戏状态，确保用户进度不丢失
      forceSaveGame().catch(console.error);
    } catch (error) {
      console.error('页面卸载时存档失败:', error);
    }
  };

  // 使用 ahooks 的 useEventListener 自动管理事件监听器
  useEventListener('beforeunload', handleBeforeUnload, { target: () => window });
};
