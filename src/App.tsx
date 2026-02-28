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
  ThemeProvider,
} from '@mui/material';
import React from 'react';

import ClearGameButton from '@/components/common/ClearGameButton';
import ErrorScreen from '@/components/common/ErrorScreen';
import LoadingScreen from '@/components/common/LoadingScreen';
import FacilitiesModule from '@/components/facilities/FacilitiesModule';
import ProductionModule from '@/components/production/ProductionModule';
import TechnologyModule from '@/components/technology/TechnologyModule';
import { APP_STORAGE_KEYS } from '@/constants/storageKeys';
import { useAppInitialization } from '@/hooks/useAppInitialization';
import { useAutoSaveBeforeUnload } from '@/hooks/useAutoSaveBeforeUnload';
import theme from '@/theme';
import { useLocalStorageState } from 'ahooks';

const App: React.FC = () => {
  // 当前模块
  const [currentModule, setCurrentModule] = useLocalStorageState(APP_STORAGE_KEYS.CURRENT_MODULE, {
    defaultValue: 0,
  });
  // 初始化游戏系统
  const { isAppReady, initError } = useAppInitialization();
  // 自动保存游戏进度
  useAutoSaveBeforeUnload();

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
      <Box sx={theme.customStyles.appContainer}>
        <Box sx={theme.customStyles.pageContainer}>
          {currentModule === 0 && <ProductionModule />}
          {currentModule === 1 && <FacilitiesModule />}
          {currentModule === 2 && <TechnologyModule />}
        </Box>

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
