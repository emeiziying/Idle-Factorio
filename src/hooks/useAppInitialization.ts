import { useState, useEffect } from 'react';
import { ServiceInitializer } from '@/services/core/ServiceInitializer';

interface UseAppInitializationResult {
  isAppReady: boolean;
  initError: string | null;
}

export const useAppInitialization = (): UseAppInitializationResult => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeApp = async () => {
      try {
        await ServiceInitializer.initialize();
        if (mounted) {
          setIsAppReady(true);
          setInitError(null);
        }
      } catch (error) {
        if (mounted) {
          setInitError(error instanceof Error ? error.message : String(error));
          setIsAppReady(false);
        }
      }
    };

    initializeApp();

    return () => {
      mounted = false;
      ServiceInitializer.cleanup();
    };
  }, []);

  return {
    isAppReady,
    initError,
  };
};
