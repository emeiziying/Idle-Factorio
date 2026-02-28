import {
  Build as BuildIcon,
  Factory as FactoryIcon,
  Science as ScienceIcon,
} from '@mui/icons-material';
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  CssBaseline,
  LinearProgress,
  ThemeProvider,
} from '@mui/material';
import React, { Suspense, lazy } from 'react';

import ClearGameButton from '@/components/common/ClearGameButton';
import ErrorScreen from '@/components/common/ErrorScreen';
import LoadingScreen from '@/components/common/LoadingScreen';
import { APP_STORAGE_KEYS } from '@/constants/storageKeys';
import { useAppInitialization } from '@/hooks/useAppInitialization';
import theme from '@/theme';
import { useLocalStorageState } from 'ahooks';

const ProductionModule = lazy(() => import('@/components/production/ProductionModule'));
const FacilitiesModule = lazy(() => import('@/components/facilities/FacilitiesModule'));
const TechnologyModule = lazy(() => import('@/components/technology/TechnologyModule'));

const App: React.FC = () => {
  // 当前模块
  const [currentModule, setCurrentModule] = useLocalStorageState(APP_STORAGE_KEYS.CURRENT_MODULE, {
    defaultValue: 0,
  });
  // 初始化游戏系统
  const { isAppReady, initError } = useAppInitialization();

  // 切换模块
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentModule(newValue);
  };

  if (initError) {
    return (
      <ErrorScreen
        withTheme
        error={`初始化失败: ${initError}`}
        showRetry
        retryText="重新加载"
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!isAppReady) {
    return (
      <LoadingScreen
        withTheme
        message="正在初始化游戏系统..."
        subtitle="请稍候，首次加载可能需要几秒钟"
      />
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          width: '100vw',
        }}
      >
        <Suspense
          fallback={
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                paddingBottom: '56px',
                p: 2,
              }}
            >
              <LinearProgress />
            </Box>
          }
        >
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: '56px',
            }}
          >
            {currentModule === 0 && <ProductionModule />}
            {currentModule === 1 && <FacilitiesModule />}
            {currentModule === 2 && <TechnologyModule />}
          </Box>
        </Suspense>

        <BottomNavigation value={currentModule} onChange={handleTabChange} showLabels>
          <BottomNavigationAction label="生产" icon={<BuildIcon />} showLabel={true} />
          <BottomNavigationAction label="设施" icon={<FactoryIcon />} showLabel={true} />
          <BottomNavigationAction label="科技" icon={<ScienceIcon />} showLabel={true} />
        </BottomNavigation>

        {import.meta.env.DEV && <ClearGameButton />}
      </Box>
    </ThemeProvider>
  );
};

export default App;
