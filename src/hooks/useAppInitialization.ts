import { DIServiceInitializer } from '@/services/core/DIServiceInitializer';
import { useEffect, useState } from 'react';

interface UseAppInitializationResult {
  isAppReady: boolean;
  initError: string | null;
}

// 初始化游戏系统
export const useAppInitialization = (): UseAppInitializationResult => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      try {
        await DIServiceInitializer.initialize();
        if (!cancelled) {
          setIsAppReady(true);
          setInitError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setInitError(error instanceof Error ? error.message : String(error));
          setIsAppReady(false);
        }
      }
    };

    void initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    isAppReady,
    initError,
  };
};
