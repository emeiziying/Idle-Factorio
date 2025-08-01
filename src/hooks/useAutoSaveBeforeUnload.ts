import { useEffect } from 'react';
import useGameStore from '@/store/gameStore';

/**
 * 页面卸载前自动保存 Hook
 * 监听页面卸载事件，在用户关闭或刷新页面时自动保存游戏进度
 */
export const useAutoSaveBeforeUnload = (): void => {
  useEffect(() => {
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

    // 监听页面卸载事件
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 清理函数：移除事件监听器，防止内存泄漏
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []); // 空依赖数组，仅在组件挂载时执行一次
};
