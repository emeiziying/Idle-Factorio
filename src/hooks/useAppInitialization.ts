import { DIServiceInitializer } from '@/services/core/DIServiceInitializer';
import { useAsyncEffect } from 'ahooks';
import { useEffect, useState } from 'react';

interface UseAppInitializationResult {
  isAppReady: boolean;
  initError: string | null;
}

// 初始化游戏系统
export const useAppInitialization = (): UseAppInitializationResult => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useAsyncEffect(async () => {
    try {
      await DIServiceInitializer.initialize();
      setIsAppReady(true);
      setInitError(null);
    } catch (error) {
      setInitError(error instanceof Error ? error.message : String(error));
      setIsAppReady(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      DIServiceInitializer.cleanup();
    };
  }, []);

  return {
    isAppReady,
    initError,
  };
};
