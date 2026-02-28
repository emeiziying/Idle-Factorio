import App from '@/App.tsx';
import {
  bootstrapExperimentalRuntime,
  resetExperimentalRuntimeBootstrap,
} from '@/app/bootstrap/bootstrapExperimentalRuntime';
import { bootstrapLegacyApp, resetLegacyAppBootstrap } from '@/app/bootstrap/bootstrapLegacyApp';
import ErrorScreen from '@/components/common/ErrorScreen';
import LoadingScreen from '@/components/common/LoadingScreen';
import { DIServiceInitializer } from '@/services/core/DIServiceInitializer';
import '@/index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container #root was not found.');
}

const root = createRoot(container);

const renderLoading = (): void => {
  root.render(
    <LoadingScreen
      withTheme
      message="正在初始化游戏系统..."
      subtitle="请稍候，首次加载可能需要几秒钟"
    />
  );
};

const renderApp = (): void => {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
};

const renderError = (error: unknown): void => {
  const errorMessage = error instanceof Error ? error.message : String(error);

  root.render(
    <ErrorScreen
      withTheme
      error={`初始化失败: ${errorMessage}`}
      showRetry
      retryText="重新加载"
      onRetry={() => window.location.reload()}
    />
  );
};

const bootstrapAndRender = async (): Promise<void> => {
  renderLoading();

  try {
    await bootstrapLegacyApp();
    renderApp();
    if (import.meta.env.DEV) {
      void bootstrapExperimentalRuntime().catch(() => {
        // 错误已经同步到 runtime registry，这里避免未处理 Promise 噪音
      });
    }
  } catch (error) {
    renderError(error);
  }
};

void bootstrapAndRender();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    DIServiceInitializer.cleanup();
    resetExperimentalRuntimeBootstrap();
    resetLegacyAppBootstrap();
    root.unmount();
  });
}
